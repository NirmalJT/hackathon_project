import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user profile
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Create or update user profile
export const updateProfile = mutation({
  args: {
    digitalIdHash: v.optional(v.string()),
    preferredLanguage: v.string(),
    emergencyContacts: v.array(v.object({
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    })),
    travelDocuments: v.optional(v.object({
      passportNumber: v.string(),
      nationality: v.string(),
      embassy: v.optional(v.object({
        name: v.string(),
        phone: v.string(),
        address: v.string(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const profileData = {
      userId,
      digitalIdHash: args.digitalIdHash || "",
      preferredLanguage: args.preferredLanguage,
      emergencyContacts: args.emergencyContacts,
      travelDocuments: args.travelDocuments,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
      return existingProfile._id;
    } else {
      return await ctx.db.insert("userProfiles", profileData);
    }
  },
});

// Verify blockchain digital ID
export const verifyDigitalId = mutation({
  args: {
    digitalIdHash: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // In a real implementation, this would verify the blockchain signature
    // For now, we'll simulate verification
    const isValid = args.digitalIdHash.length > 10 && args.signature.length > 10;

    if (!isValid) {
      throw new Error("Invalid digital ID or signature");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        digitalIdHash: args.digitalIdHash,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        digitalIdHash: args.digitalIdHash,
        preferredLanguage: "en",
        emergencyContacts: [],
      });
    }

    return { verified: true, digitalIdHash: args.digitalIdHash };
  },
});
