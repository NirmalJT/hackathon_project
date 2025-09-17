import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ChatInterface() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const messages = useQuery(api.chat.getChatMessages, { sessionId }) || [];
  const sendMessage = useMutation(api.chat.sendMessage);
  const updateLocation = useMutation(api.safety.updateUserLocation);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get user's location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding (free and no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      
      // Extract city and country from the response
      const address = data.address || {};
      const city = address.city || address.town || address.village || address.municipality || "Unknown City";
      const country = address.country || "Unknown Country";
      
      return { city, country };
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      // Fallback to a generic location
      return { city: "Unknown City", country: "Unknown Country" };
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setIsLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get real city and country using reverse geocoding
          const { city, country } = await reverseGeocode(latitude, longitude);
          
          const locationData = {
            latitude,
            longitude,
            city,
            country,
          };
          
          setLocation(locationData);
          await updateLocation(locationData);
          toast.success(`Location updated: ${city}, ${country}`);
        } catch (error) {
          console.error("Failed to update location:", error);
          toast.error("Failed to update location");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to get your location. ";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        
        toast.error(errorMessage + " Some features may be limited.");
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage({
        sessionId,
        content: message.trim(),
        location: location || undefined,
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case "emergency": return "🚨";
      case "safety_alert": return "⚠️";
      case "directions": return "🗺️";
      case "translation": return "🌐";
      default: return "💬";
    }
  };

  const getSafetyLevelColor = (safetyLevel?: string) => {
    switch (safetyLevel) {
      case "danger": return "text-red-600 bg-red-50";
      case "caution": return "text-yellow-600 bg-yellow-50";
      case "safe": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Location Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Location:</span>
            {isLoadingLocation ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Getting location...</span>
              </div>
            ) : location ? (
              <span className="text-sm text-gray-900">
                📍 {location.city}, {location.country}
              </span>
            ) : (
              <span className="text-sm text-gray-500">Location not available</span>
            )}
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
          >
            {isLoadingLocation ? "Updating..." : "Update Location"}
          </button>
        </div>
        {location && (
          <div className="mt-1 text-xs text-gray-500">
            Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🛡️</div>
            <p className="text-lg font-medium mb-2">Welcome to SafeGuide AI!</p>
            <p className="text-sm">
              I'm here to help you stay safe while traveling. Ask me about:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Safety information for your current location</li>
              <li>• Emergency services and contacts</li>
              <li>• Safe directions and routes</li>
              <li>• Translation assistance</li>
              <li>• Local safety alerts and warnings</li>
            </ul>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.isAI ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.isAI
                    ? "bg-white border shadow-sm"
                    : "bg-blue-600 text-white"
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.isAI && (
                    <span className="text-lg">
                      {getMessageTypeIcon(msg.messageType)}
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    
                    {/* Safety Level Indicator */}
                    {msg.metadata?.safetyLevel && (
                      <div className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getSafetyLevelColor(msg.metadata.safetyLevel)}`}>
                        Safety Level: {msg.metadata.safetyLevel.toUpperCase()}
                      </div>
                    )}
                    
                    {/* Nearby Services */}
                    {msg.metadata?.nearbyServices && msg.metadata.nearbyServices.length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border">
                        <p className="text-xs font-medium text-blue-800 mb-1">
                          Nearby Emergency Services:
                        </p>
                        {msg.metadata.nearbyServices.map((service, index) => (
                          <div key={index} className="text-xs text-blue-700">
                            📞 {service.name} ({service.type}): {service.phone}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg._creationTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about safety, get directions, or request emergency help..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>

      {/* Quick Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setMessage("What's the safety situation in my current location?")}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          🛡️ Safety Check
        </button>
        <button
          onClick={() => setMessage("Show me nearby emergency services")}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          🚨 Emergency Services
        </button>
        <button
          onClick={() => setMessage("I need help - this is an emergency")}
          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors"
        >
          🆘 Emergency Help
        </button>
        <button
          onClick={() => setMessage("Give me safe directions to the nearest hospital")}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          🗺️ Safe Directions
        </button>
      </div>
    </div>
  );
}
