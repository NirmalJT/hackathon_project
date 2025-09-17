import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with blockchain digital ID integration
  userProfiles: defineTable({
    userId: v.id("users"),
    digitalIdHash: v.string(), // Blockchain-based digital ID hash
    preferredLanguage: v.string(),
    currentLocation: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      city: v.string(),
      country: v.string(),
      timestamp: v.number(),
    })),
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
  }).index("by_user", ["userId"]),

  // Chat messages with AI responses
  chatMessages: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    content: v.string(),
    isAI: v.boolean(),
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
      emergencyType: v.optional(v.string()),
      nearbyServices: v.optional(v.array(v.object({
        type: v.string(),
        name: v.string(),
        distance: v.number(),
        phone: v.string(),
        address: v.string(),
      }))),
    })),
  }).index("by_user_session", ["userId", "sessionId"])
    .index("by_user", ["userId"]),

  // Safety zones and geo-fencing data
  safetyZones: defineTable({
    name: v.string(),
    city: v.string(),
    country: v.string(),
    coordinates: v.object({
      center: v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
      radius: v.number(), // in meters
    }),
    safetyLevel: v.union(v.literal("safe"), v.literal("caution"), v.literal("danger")),
    description: v.string(),
    warnings: v.array(v.string()),
    recommendations: v.array(v.string()),
    lastUpdated: v.number(),
    source: v.string(), // government, police, embassy, etc.
  }).index("by_location", ["country", "city"])
    .index("by_safety_level", ["safetyLevel"]),

  // Emergency services directory
  emergencyServices: defineTable({
    type: v.union(v.literal("police"), v.literal("hospital"), v.literal("embassy"), v.literal("fire"), v.literal("tourist_police")),
    name: v.string(),
    city: v.string(),
    country: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    contact: v.object({
      phone: v.string(),
      emergency_phone: v.optional(v.string()),
      email: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
    address: v.string(),
    languages: v.array(v.string()),
    available24h: v.boolean(),
    verified: v.boolean(),
    lastVerified: v.number(),
  }).index("by_location", ["country", "city"])
    .index("by_type", ["type"]),

  // Real-time safety alerts
  safetyAlerts: defineTable({
    title: v.string(),
    description: v.string(),
    alertType: v.union(
      v.literal("weather"),
      v.literal("crime"),
      v.literal("political"),
      v.literal("health"),
      v.literal("transport"),
      v.literal("natural_disaster")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    location: v.object({
      city: v.string(),
      country: v.string(),
      coordinates: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
        radius: v.number(),
      })),
    }),
    validFrom: v.number(),
    validUntil: v.number(),
    source: v.string(),
    languages: v.object({
      en: v.string(),
      es: v.optional(v.string()),
      fr: v.optional(v.string()),
      de: v.optional(v.string()),
      zh: v.optional(v.string()),
      ja: v.optional(v.string()),
      ar: v.optional(v.string()),
    }),
    actionRequired: v.array(v.string()),
    isActive: v.boolean(),
  }).index("by_location", ["location.country", "location.city"])
    .index("by_severity", ["severity"])
    .index("by_active", ["isActive"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
