import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get safety information for a location
export const getSafetyInfo = internalQuery({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    city: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    // Get safety zones for the area
    const safetyZones = await ctx.db
      .query("safetyZones")
      .withIndex("by_location", (q) => 
        q.eq("country", args.country).eq("city", args.city)
      )
      .collect();

    // Get nearby emergency services
    const emergencyServices = await ctx.db
      .query("emergencyServices")
      .withIndex("by_location", (q) => 
        q.eq("country", args.country).eq("city", args.city)
      )
      .collect();

    // Calculate distances and find relevant safety zones
    let currentSafetyLevel = "safe";
    let warnings: string[] = [];
    let recommendations: string[] = [];

    for (const zone of safetyZones) {
      const distance = calculateDistance(
        args.latitude,
        args.longitude,
        zone.coordinates.center.latitude,
        zone.coordinates.center.longitude
      );

      if (distance <= zone.coordinates.radius) {
        if (zone.safetyLevel === "danger") {
          currentSafetyLevel = "danger";
        } else if (zone.safetyLevel === "caution" && currentSafetyLevel !== "danger") {
          currentSafetyLevel = "caution";
        }
        warnings.push(...zone.warnings);
        recommendations.push(...zone.recommendations);
      }
    }

    // Calculate distances to emergency services
    const nearbyServices = emergencyServices
      .map(service => ({
        ...service,
        distance: calculateDistance(
          args.latitude,
          args.longitude,
          service.location.latitude,
          service.location.longitude
        )
      }))
      .filter(service => service.distance <= 10000) // Within 10km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
      .map(service => ({
        type: service.type,
        name: service.name,
        distance: Math.round(service.distance),
        phone: service.contact.emergency_phone || service.contact.phone,
        address: service.address,
      }));

    // Build context string
    let context = `Location: ${args.city}, ${args.country}\n`;
    context += `Safety Level: ${currentSafetyLevel}\n`;
    
    if (warnings.length > 0) {
      context += `Warnings: ${warnings.join(", ")}\n`;
    }
    
    if (recommendations.length > 0) {
      context += `Recommendations: ${recommendations.join(", ")}\n`;
    }

    if (nearbyServices.length > 0) {
      context += `Nearby Emergency Services:\n`;
      nearbyServices.forEach(service => {
        context += `- ${service.name} (${service.type}): ${service.phone}, ${Math.round(service.distance/1000)}km away\n`;
      });
    }

    return {
      safetyLevel: currentSafetyLevel,
      warnings,
      recommendations,
      nearbyServices,
      context,
    };
  },
});

// Get active safety alerts for a location
export const getSafetyAlerts = query({
  args: {
    city: v.string(),
    country: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const language = args.language || "en";

    const alerts = await ctx.db
      .query("safetyAlerts")
      .withIndex("by_location", (q) => 
        q.eq("location.country", args.country).eq("location.city", args.city)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("validFrom"), now),
          q.gte(q.field("validUntil"), now)
        )
      )
      .collect();

    return alerts.map(alert => ({
      ...alert,
      description: alert.languages[language as keyof typeof alert.languages] || alert.languages.en,
    }));
  },
});

// Get emergency services by type
export const getEmergencyServices = query({
  args: {
    city: v.string(),
    country: v.string(),
    type: v.optional(v.union(
      v.literal("police"),
      v.literal("hospital"),
      v.literal("embassy"),
      v.literal("fire"),
      v.literal("tourist_police")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db
      .query("emergencyServices")
      .withIndex("by_location", (q) => 
        q.eq("country", args.country).eq("city", args.city)
      );

    if (args.type) {
      const services = await query.collect();
      return services.filter(service => service.type === args.type);
    }

    return await query.collect();
  },
});

// Update user location
export const updateUserLocation = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    city: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const locationData = {
      latitude: args.latitude,
      longitude: args.longitude,
      city: args.city,
      country: args.country,
      timestamp: Date.now(),
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        currentLocation: locationData,
      });
    } else {
      // Create new profile if it doesn't exist
      await ctx.db.insert("userProfiles", {
        userId,
        digitalIdHash: "", // Will be set when blockchain ID is verified
        preferredLanguage: "en",
        currentLocation: locationData,
        emergencyContacts: [],
      });
    }

    return null;
  },
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
