import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function SafetyDashboard() {
  const [location, setLocation] = useState<{
    city: string;
    country: string;
  } | null>(null);

  const userProfile = useQuery(api.profile.getUserProfile);
  const seedData = useMutation(api.seedData.seedSafetyData);
  const safetyAlerts = useQuery(
    api.safety.getSafetyAlerts,
    location ? { 
      city: location.city, 
      country: location.country,
      language: userProfile?.preferredLanguage || "en"
    } : "skip"
  );
  const emergencyServices = useQuery(
    api.safety.getEmergencyServices,
    location ? { city: location.city, country: location.country } : "skip"
  );

  // Set location from user profile
  useEffect(() => {
    if (userProfile?.currentLocation) {
      setLocation({
        city: userProfile.currentLocation.city,
        country: userProfile.currentLocation.country,
      });
    }
  }, [userProfile]);

  const handleSeedData = async () => {
    try {
      await seedData({});
      toast.success("Sample safety data loaded successfully!");
    } catch (error) {
      console.error("Failed to seed data:", error);
      toast.error("Failed to load sample data");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "weather": return "🌧️";
      case "crime": return "🚨";
      case "political": return "⚖️";
      case "health": return "🏥";
      case "transport": return "🚇";
      case "natural_disaster": return "🌪️";
      default: return "⚠️";
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case "police": return "👮";
      case "hospital": return "🏥";
      case "embassy": return "🏛️";
      case "fire": return "🚒";
      case "tourist_police": return "🛡️";
      default: return "📞";
    }
  };

  // Get emergency numbers based on country
  const getEmergencyNumbers = (country: string) => {
    const emergencyNumbers: Record<string, { police: string; fire: string; medical: string; general?: string }> = {
      "United States": { police: "911", fire: "911", medical: "911", general: "911" },
      "Canada": { police: "911", fire: "911", medical: "911", general: "911" },
      "United Kingdom": { police: "999", fire: "999", medical: "999", general: "999" },
      "Australia": { police: "000", fire: "000", medical: "000", general: "000" },
      "New Zealand": { police: "111", fire: "111", medical: "111", general: "111" },
      "Germany": { police: "110", fire: "112", medical: "112" },
      "France": { police: "17", fire: "18", medical: "15", general: "112" },
      "Italy": { police: "113", fire: "115", medical: "118", general: "112" },
      "Spain": { police: "091", fire: "080", medical: "061", general: "112" },
      "Netherlands": { police: "112", fire: "112", medical: "112", general: "112" },
      "Belgium": { police: "112", fire: "112", medical: "112", general: "112" },
      "Switzerland": { police: "117", fire: "118", medical: "144", general: "112" },
      "Austria": { police: "133", fire: "122", medical: "144", general: "112" },
      "Sweden": { police: "112", fire: "112", medical: "112", general: "112" },
      "Norway": { police: "112", fire: "110", medical: "113", general: "112" },
      "Denmark": { police: "112", fire: "112", medical: "112", general: "112" },
      "Finland": { police: "112", fire: "112", medical: "112", general: "112" },
      "Japan": { police: "110", fire: "119", medical: "119" },
      "South Korea": { police: "112", fire: "119", medical: "119" },
      "China": { police: "110", fire: "119", medical: "120" },
      "India": { police: "100", fire: "101", medical: "102", general: "112" },
      "Thailand": { police: "191", fire: "199", medical: "1669", general: "1155" },
      "Singapore": { police: "999", fire: "995", medical: "995" },
      "Malaysia": { police: "999", fire: "994", medical: "999" },
      "Philippines": { police: "117", fire: "116", medical: "911", general: "911" },
      "Indonesia": { police: "110", fire: "113", medical: "118" },
      "Vietnam": { police: "113", fire: "114", medical: "115" },
      "Brazil": { police: "190", fire: "193", medical: "192" },
      "Mexico": { police: "911", fire: "911", medical: "911", general: "911" },
      "Argentina": { police: "911", fire: "911", medical: "911", general: "911" },
      "Chile": { police: "133", fire: "132", medical: "131" },
      "South Africa": { police: "10111", fire: "10177", medical: "10177" },
      "Egypt": { police: "122", fire: "180", medical: "123" },
      "Turkey": { police: "155", fire: "110", medical: "112", general: "112" },
      "Russia": { police: "102", fire: "101", medical: "103", general: "112" },
      "Israel": { police: "100", fire: "102", medical: "101" },
      "UAE": { police: "999", fire: "997", medical: "998" },
      "Saudi Arabia": { police: "999", fire: "998", medical: "997" },
    };

    return emergencyNumbers[country] || { police: "112", fire: "112", medical: "112", general: "112" };
  };

  const shareEmergencyLocation = async () => {
    if (navigator.geolocation && location) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const emergencyNumbers = getEmergencyNumbers(location.country);
        const primaryNumber = emergencyNumbers.general || emergencyNumbers.police;
        
        const message = `🆘 EMERGENCY! I need help immediately.
        
Location: ${location.city}, ${location.country}
Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
Google Maps: https://maps.google.com/?q=${latitude},${longitude}

Emergency Numbers for ${location.country}:
🚨 Police: ${emergencyNumbers.police}
🚒 Fire: ${emergencyNumbers.fire}
🏥 Medical: ${emergencyNumbers.medical}
${emergencyNumbers.general ? `📞 General Emergency: ${emergencyNumbers.general}` : ''}

Please call ${primaryNumber} for immediate assistance.`;

        if (navigator.share) {
          try {
            await navigator.share({ text: message });
          } catch (error) {
            navigator.clipboard.writeText(message);
            toast.success("Emergency information copied to clipboard");
          }
        } else {
          navigator.clipboard.writeText(message);
          toast.success("Emergency information copied to clipboard");
        }
      });
    }
  };

  if (!location) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Location Required
        </h3>
        <p className="text-gray-600 mb-4">
          Please update your location in the chat interface to view safety information.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800 mb-3">
            <strong>How to enable location:</strong>
          </p>
          <ol className="text-sm text-blue-700 text-left space-y-1">
            <li>1. Go to the "AI Chat Assistant" tab</li>
            <li>2. Click "Update Location" button</li>
            <li>3. Allow location access when prompted</li>
            <li>4. Return here to view safety information</li>
          </ol>
        </div>
      </div>
    );
  }

  const emergencyNumbers = getEmergencyNumbers(location.country);

  return (
    <div className="space-y-6">
      {/* Location Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Current Location
              </h3>
              <p className="text-gray-600">
                {location.city}, {location.country}
              </p>
              {userProfile?.currentLocation && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(userProfile.currentLocation.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSeedData}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            🌱 Load Sample Data
          </button>
        </div>
      </div>

      {/* Emergency Numbers for Current Location */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
          <span>🆘</span>
          Emergency Numbers for {location.country}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <span>👮</span>
              <span className="font-medium text-sm">Police</span>
            </div>
            <a
              href={`tel:${emergencyNumbers.police}`}
              className="text-lg font-bold text-red-600 hover:text-red-800"
            >
              {emergencyNumbers.police}
            </a>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <span>🚒</span>
              <span className="font-medium text-sm">Fire</span>
            </div>
            <a
              href={`tel:${emergencyNumbers.fire}`}
              className="text-lg font-bold text-red-600 hover:text-red-800"
            >
              {emergencyNumbers.fire}
            </a>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <span>🏥</span>
              <span className="font-medium text-sm">Medical</span>
            </div>
            <a
              href={`tel:${emergencyNumbers.medical}`}
              className="text-lg font-bold text-red-600 hover:text-red-800"
            >
              {emergencyNumbers.medical}
            </a>
          </div>
          
          {emergencyNumbers.general && (
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <span>📞</span>
                <span className="font-medium text-sm">General</span>
              </div>
              <a
                href={`tel:${emergencyNumbers.general}`}
                className="text-lg font-bold text-red-600 hover:text-red-800"
              >
                {emergencyNumbers.general}
              </a>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <a
            href={`tel:${emergencyNumbers.general || emergencyNumbers.police}`}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <span>📞</span>
            <span className="font-medium">Call Emergency ({emergencyNumbers.general || emergencyNumbers.police})</span>
          </a>
          <button
            onClick={shareEmergencyLocation}
            className="flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <span>📍</span>
            <span className="font-medium">Share Emergency Location</span>
          </button>
        </div>
      </div>

      {/* Safety Alerts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚠️</span>
          Active Safety Alerts
        </h3>
        
        {safetyAlerts === undefined ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : safetyAlerts.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <p className="text-green-800 font-medium">No active alerts</p>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your current location has no active safety alerts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {safetyAlerts.map((alert) => (
              <div
                key={alert._id}
                className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    {getAlertTypeIcon(alert.alertType)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <span className="px-2 py-1 text-xs font-medium bg-white/50 rounded-full">
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{alert.description}</p>
                    
                    {alert.actionRequired.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                        <ul className="text-xs space-y-1">
                          {alert.actionRequired.map((action, index) => (
                            <li key={index} className="flex items-center gap-1">
                              <span>•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <p className="text-xs opacity-75 mt-2">
                      Valid until: {new Date(alert.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Services */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🚨</span>
          Emergency Services
        </h3>
        
        {emergencyServices === undefined ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : emergencyServices.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600">
              No emergency services data available for your current location.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Try loading sample data or use the emergency numbers above for immediate assistance.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {emergencyServices.map((service) => (
              <div
                key={service._id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    {getServiceTypeIcon(service.type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {service.name}
                      </h4>
                      {service.available24h && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          24/7
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {service.address}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">📞</span>
                        <a
                          href={`tel:${service.contact.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {service.contact.phone}
                        </a>
                      </div>
                      
                      {service.contact.emergency_phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-red-600">🚨</span>
                          <a
                            href={`tel:${service.contact.emergency_phone}`}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            {service.contact.emergency_phone} (Emergency)
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {service.languages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Languages: {service.languages.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
