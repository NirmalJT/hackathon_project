import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ChatInterface } from "./components/ChatInterface";
import { ProfileSetup } from "./components/ProfileSetup";
import { SafetyDashboard } from "./components/SafetyDashboard";
import { useState } from "react";
import { toast } from "sonner";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "safety" | "profile">("chat");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🛡️</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SafeGuide AI
            </h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1">
        <Content activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
}

function Content({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: "chat" | "safety" | "profile";
  setActiveTab: (tab: "chat" | "safety" | "profile") => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userProfile = useQuery(api.profile.getUserProfile);
  const seedData = useMutation(api.seedData.seedSafetyData);

  const handleSeedData = async () => {
    try {
      await seedData({});
      toast.success("Sample safety data loaded successfully!");
    } catch (error) {
      console.error("Failed to seed data:", error);
      toast.error("Failed to load sample data");
    }
  };

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your AI Travel Safety Companion
            </h2>
            <p className="text-gray-600">
              Get real-time safety guidance, emergency assistance, and location-based alerts in your preferred language.
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome back, {loggedInUser?.name || loggedInUser?.email?.split('@')[0] || "Traveler"}!
                </h2>
                <p className="text-gray-600 mt-1">
                  Your AI-powered safety companion is ready to help you travel safely.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSeedData}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  🌱 Load Sample Data
                </button>
{userProfile?.digitalIdHash ? (
                  <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ID Verified
                  </div>
                ) : userProfile !== undefined ? (
                  <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    ID Pending
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === "chat"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                💬 AI Chat Assistant
              </button>
              <button
                onClick={() => setActiveTab("safety")}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === "safety"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🚨 Safety Dashboard
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === "profile"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                👤 Profile & ID
              </button>
            </div>

            <div className="p-6">
              {activeTab === "chat" && <ChatInterface />}
              {activeTab === "safety" && <SafetyDashboard />}
              {activeTab === "profile" && <ProfileSetup />}
            </div>
          </div>
        </div>
      </Authenticated>
    </div>
  );
}
