import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// Get chat messages for a user session
export const getChatMessages = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user_session", (q) => 
        q.eq("userId", userId).eq("sessionId", args.sessionId)
      )
      .order("asc")
      .collect();
  },
});

// Send a message and get AI response
export const sendMessage = mutation({
  args: {
    sessionId: v.string(),
    content: v.string(),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      city: v.string(),
      country: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profile for language preference
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const language = profile?.preferredLanguage || "en";

    // Store user message
    await ctx.db.insert("chatMessages", {
      userId,
      sessionId: args.sessionId,
      content: args.content,
      isAI: false,
      language,
      location: args.location,
      messageType: "general",
    });

    // Schedule AI response generation
    await ctx.scheduler.runAfter(0, internal.chat.generateAIResponse, {
      userId,
      sessionId: args.sessionId,
      userMessage: args.content,
      location: args.location,
      language,
    });

    return null;
  },
});

// Generate AI response (internal action)
export const generateAIResponse = internalAction({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    userMessage: v.string(),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      city: v.string(),
      country: v.string(),
    })),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    // Get recent chat history for context
    const recentMessages = await ctx.runQuery(internal.chat.getRecentMessages, {
      userId: args.userId,
      sessionId: args.sessionId,
    });

    // Get safety information for current location
    let locationContext = "";
    let safetyLevel = "safe";
    let nearbyServices: any[] = [];

    if (args.location) {
      const safetyInfo = await ctx.runQuery(internal.safety.getSafetyInfo, {
        latitude: args.location.latitude,
        longitude: args.location.longitude,
        city: args.location.city,
        country: args.location.country,
      });

      locationContext = safetyInfo.context;
      safetyLevel = safetyInfo.safetyLevel;
      nearbyServices = safetyInfo.nearbyServices;
    }

    // Get user profile for personalization
    const profile = await ctx.runQuery(internal.chat.getUserProfile, {
      userId: args.userId,
    });

    // Build context for AI
    const systemPrompt = `You are SafeGuide AI, a multilingual tourist safety assistant with access to real-time location data and emergency services. 

User Profile:
- Language: ${args.language}
- Location: ${args.location ? `${args.location.city}, ${args.location.country}` : "Unknown"}
- Safety Level: ${safetyLevel}
- Digital ID Verified: ${profile?.digitalIdHash ? "Yes" : "No"}

${locationContext}

Guidelines:
1. Always respond in ${args.language === "en" ? "English" : `the user's preferred language (${args.language})`}
2. Prioritize safety and provide actionable advice
3. If the user is in a dangerous area, provide immediate safety recommendations
4. For emergencies, provide specific contact information and directions
5. Be concise but comprehensive
6. Include relevant nearby emergency services when appropriate
7. If asked about directions, provide safe routes and warn about unsafe areas

Recent conversation context:
${recentMessages.map((m: any) => `${m.isAI ? "AI" : "User"}: ${m.content}`).join("\n")}

Current user message: ${args.userMessage}`;

    try {
      // Use the bundled OpenAI API
      const openai = await import("openai");
      const client = new openai.default({
        baseURL: process.env.CONVEX_OPENAI_BASE_URL,
        apiKey: process.env.CONVEX_OPENAI_API_KEY,
      });

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: args.userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request right now. Please try again.";

      // Determine message type based on content
      let messageType: "general" | "safety_alert" | "emergency" | "directions" | "translation" = "general";
      const lowerContent = args.userMessage.toLowerCase();
      
      if (lowerContent.includes("emergency") || lowerContent.includes("help") || lowerContent.includes("danger")) {
        messageType = "emergency";
      } else if (lowerContent.includes("direction") || lowerContent.includes("how to get")) {
        messageType = "directions";
      } else if (lowerContent.includes("translate") || lowerContent.includes("say in")) {
        messageType = "translation";
      } else if (safetyLevel !== "safe") {
        messageType = "safety_alert";
      }

      // Store AI response
      await ctx.runMutation(internal.chat.storeAIResponse, {
        userId: args.userId,
        sessionId: args.sessionId,
        content: aiResponse,
        language: args.language,
        location: args.location,
        messageType,
        metadata: {
          safetyLevel: safetyLevel as any,
          nearbyServices: nearbyServices.slice(0, 3), // Limit to top 3 services
        },
      });

    } catch (error) {
      console.error("AI response generation failed:", error);
      
      // Fallback response
      const fallbackResponse = args.language === "es" 
        ? "Lo siento, no puedo procesar tu solicitud en este momento. Por favor, intenta de nuevo."
        : args.language === "fr"
        ? "Désolé, je ne peux pas traiter votre demande pour le moment. Veuillez réessayer."
        : "I'm sorry, I couldn't process your request right now. Please try again.";

      await ctx.runMutation(internal.chat.storeAIResponse, {
        userId: args.userId,
        sessionId: args.sessionId,
        content: fallbackResponse,
        language: args.language,
        location: args.location,
        messageType: "general",
      });
    }

    return null;
  },
});

// Internal queries and mutations
export const getRecentMessages = internalQuery({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user_session", (q) => 
        q.eq("userId", args.userId).eq("sessionId", args.sessionId)
      )
      .order("desc")
      .take(10);
  },
});

export const getUserProfile = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const storeAIResponse = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    content: v.string(),
    language: v.string(),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      city: v.string(),
      country: v.string(),
    })),
    messageType: v.union(
      v.literal("general"),
      v.literal("safety_alert"),
      v.literal("emergency"),
      v.literal("directions"),
      v.literal("translation")
    ),
    metadata: v.optional(v.object({
      safetyLevel: v.optional(v.union(v.literal("safe"), v.literal("caution"), v.literal("danger"))),
      nearbyServices: v.optional(v.array(v.object({
        type: v.string(),
        name: v.string(),
        distance: v.number(),
        phone: v.string(),
        address: v.string(),
      }))),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      userId: args.userId,
      sessionId: args.sessionId,
      content: args.content,
      isAI: true,
      language: args.language,
      location: args.location,
      messageType: args.messageType,
      metadata: args.metadata,
    });
  },
});
