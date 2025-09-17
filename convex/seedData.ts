import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed initial safety data
export const seedSafetyData = mutation({
  args: {},
  handler: async (ctx) => {
    // Sample safety zones
    const safetyZones = [
      {
        name: "Tourist District",
        city: "Bangkok",
        country: "Thailand",
        coordinates: {
          center: { latitude: 13.7563, longitude: 100.5018 },
          radius: 2000,
        },
        safetyLevel: "safe" as const,
        description: "Well-patrolled tourist area with good infrastructure",
        warnings: [],
        recommendations: ["Stay in groups after dark", "Keep valuables secure"],
        lastUpdated: Date.now(),
        source: "Tourist Police",
      },
      {
        name: "Khao San Road Area",
        city: "Bangkok",
        country: "Thailand",
        coordinates: {
          center: { latitude: 13.7590, longitude: 100.4983 },
          radius: 500,
        },
        safetyLevel: "caution" as const,
        description: "Busy backpacker area with occasional petty crime",
        warnings: ["Pickpocketing common", "Drink spiking incidents reported"],
        recommendations: ["Watch your belongings", "Don't accept drinks from strangers", "Use official taxis"],
        lastUpdated: Date.now(),
        source: "Embassy Advisory",
      },
    ];

    // Sample emergency services
    const emergencyServices = [
      {
        type: "police" as const,
        name: "Tourist Police Bangkok",
        city: "Bangkok",
        country: "Thailand",
        location: { latitude: 13.7563, longitude: 100.5018 },
        contact: {
          phone: "+66-2-308-0333",
          emergency_phone: "1155",
          email: "info@touristpolice.go.th",
        },
        address: "4 Ratchadamnoen Nok Ave, Phra Nakhon, Bangkok 10200",
        languages: ["en", "th", "zh", "ja"],
        available24h: true,
        verified: true,
        lastVerified: Date.now(),
      },
      {
        type: "hospital" as const,
        name: "Bumrungrad International Hospital",
        city: "Bangkok",
        country: "Thailand",
        location: { latitude: 13.7307, longitude: 100.5418 },
        contact: {
          phone: "+66-2-667-1000",
          emergency_phone: "+66-2-667-2999",
          email: "info@bumrungrad.com",
        },
        address: "33 Sukhumvit 3, Wattana, Bangkok 10110",
        languages: ["en", "th", "ar", "ja", "zh"],
        available24h: true,
        verified: true,
        lastVerified: Date.now(),
      },
      {
        type: "embassy" as const,
        name: "US Embassy Bangkok",
        city: "Bangkok",
        country: "Thailand",
        location: { latitude: 13.7307, longitude: 100.5418 },
        contact: {
          phone: "+66-2-205-4000",
          emergency_phone: "+66-2-205-4049",
          email: "acsbkk@state.gov",
        },
        address: "95 Wireless Road, Lumpini, Pathumwan, Bangkok 10330",
        languages: ["en"],
        available24h: false,
        verified: true,
        lastVerified: Date.now(),
      },
    ];

    // Sample safety alerts
    const safetyAlerts = [
      {
        title: "Heavy Rainfall Warning",
        description: "Monsoon season bringing heavy rains and potential flooding",
        alertType: "weather" as const,
        severity: "medium" as const,
        location: {
          city: "Bangkok",
          country: "Thailand",
          coordinates: {
            latitude: 13.7563,
            longitude: 100.5018,
            radius: 50000,
          },
        },
        validFrom: Date.now(),
        validUntil: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        source: "Thai Meteorological Department",
        languages: {
          en: "Heavy rainfall expected. Avoid low-lying areas and use covered walkways.",
          th: "คาดว่าจะมีฝนตกหนัก หลีกเลี่ยงพื้นที่ลุ่มและใช้ทางเดินที่มีหลังคา",
        },
        actionRequired: ["Carry umbrella", "Avoid flood-prone areas", "Use BTS/MRT when possible"],
        isActive: true,
      },
    ];

    // Insert data
    for (const zone of safetyZones) {
      await ctx.db.insert("safetyZones", zone);
    }

    for (const service of emergencyServices) {
      await ctx.db.insert("emergencyServices", service);
    }

    for (const alert of safetyAlerts) {
      await ctx.db.insert("safetyAlerts", alert);
    }

    return { message: "Safety data seeded successfully" };
  },
});
