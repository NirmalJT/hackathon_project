import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ProfileSetup() {
  const userProfile = useQuery(api.profile.getUserProfile);
  const updateProfile = useMutation(api.profile.updateProfile);
  const verifyDigitalId = useMutation(api.profile.verifyDigitalId);

  const [formData, setFormData] = useState({
    preferredLanguage: "en",
    emergencyContacts: [{ name: "", phone: "", relationship: "" }],
    travelDocuments: {
      passportNumber: "",
      nationality: "",
      embassy: {
        name: "",
        phone: "",
        address: "",
      },
    },
  });

  const [digitalIdData, setDigitalIdData] = useState({
    digitalIdHash: "",
    signature: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        preferredLanguage: userProfile.preferredLanguage || "en",
        emergencyContacts: userProfile.emergencyContacts.length > 0 
          ? userProfile.emergencyContacts 
          : [{ name: "", phone: "", relationship: "" }],
        travelDocuments: {
          passportNumber: userProfile.travelDocuments?.passportNumber || "",
          nationality: userProfile.travelDocuments?.nationality || "",
          embassy: userProfile.travelDocuments?.embassy || { name: "", phone: "", address: "" },
        },
      });
    }
  }, [userProfile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyContactChange = (index: number, field: string, value: string) => {
    const newContacts = [...formData.emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData(prev => ({ ...prev, emergencyContacts: newContacts }));
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: "", phone: "", relationship: "" }]
    }));
  };

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProfile({
        preferredLanguage: formData.preferredLanguage,
        emergencyContacts: formData.emergencyContacts.filter(contact => 
          contact.name && contact.phone
        ),
        travelDocuments: formData.travelDocuments.passportNumber 
          ? formData.travelDocuments 
          : undefined,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDigitalIdVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!digitalIdData.digitalIdHash || !digitalIdData.signature) {
      toast.error("Please provide both Digital ID hash and signature");
      return;
    }

    setIsVerifying(true);

    try {
      await verifyDigitalId({
        digitalIdHash: digitalIdData.digitalIdHash,
        signature: digitalIdData.signature,
      });
      toast.success("Digital ID verified successfully!");
      setDigitalIdData({ digitalIdHash: "", signature: "" });
    } catch (error) {
      console.error("Failed to verify digital ID:", error);
      toast.error("Failed to verify digital ID");
    } finally {
      setIsVerifying(false);
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
    { code: "ar", name: "العربية" },
    { code: "pt", name: "Português" },
    { code: "ru", name: "Русский" },
    { code: "it", name: "Italiano" },
  ];

  return (
    <div className="space-y-8">
      {/* Digital ID Verification */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔐</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Blockchain Digital ID
            </h3>
            <p className="text-sm text-gray-600">
              Verify your identity with blockchain-based digital ID for enhanced security
            </p>
          </div>
        </div>

        {userProfile?.digitalIdHash ? (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            <span>✅</span>
            <span className="font-medium">Digital ID Verified</span>
            <span className="text-xs opacity-75">
              Hash: {userProfile.digitalIdHash.substring(0, 16)}...
            </span>
          </div>
        ) : (
          <form onSubmit={handleDigitalIdVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Digital ID Hash
              </label>
              <input
                type="text"
                value={digitalIdData.digitalIdHash}
                onChange={(e) => setDigitalIdData(prev => ({ ...prev, digitalIdHash: e.target.value }))}
                placeholder="Enter your blockchain digital ID hash"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Digital Signature
              </label>
              <input
                type="text"
                value={digitalIdData.signature}
                onChange={(e) => setDigitalIdData(prev => ({ ...prev, signature: e.target.value }))}
                placeholder="Enter your digital signature"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isVerifying ? "Verifying..." : "Verify Digital ID"}
            </button>
          </form>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Language
          </label>
          <select
            value={formData.preferredLanguage}
            onChange={(e) => handleInputChange("preferredLanguage", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Emergency Contacts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Emergency Contacts
            </label>
            <button
              type="button"
              onClick={addEmergencyContact}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Contact
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.emergencyContacts.map((contact, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => handleEmergencyContactChange(index, "name", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(e) => handleEmergencyContactChange(index, "phone", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  value={contact.relationship}
                  onChange={(e) => handleEmergencyContactChange(index, "relationship", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeEmergencyContact(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Travel Documents */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Travel Documents (Optional)
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Passport Number"
                value={formData.travelDocuments.passportNumber}
                onChange={(e) => handleInputChange("travelDocuments", {
                  ...formData.travelDocuments,
                  passportNumber: e.target.value
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Nationality"
                value={formData.travelDocuments.nationality}
                onChange={(e) => handleInputChange("travelDocuments", {
                  ...formData.travelDocuments,
                  nationality: e.target.value
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Embassy Information</p>
              <input
                type="text"
                placeholder="Embassy Name"
                value={formData.travelDocuments.embassy.name}
                onChange={(e) => handleInputChange("travelDocuments", {
                  ...formData.travelDocuments,
                  embassy: { ...formData.travelDocuments.embassy, name: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="tel"
                  placeholder="Embassy Phone"
                  value={formData.travelDocuments.embassy.phone}
                  onChange={(e) => handleInputChange("travelDocuments", {
                    ...formData.travelDocuments,
                    embassy: { ...formData.travelDocuments.embassy, phone: e.target.value }
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Embassy Address"
                  value={formData.travelDocuments.embassy.address}
                  onChange={(e) => handleInputChange("travelDocuments", {
                    ...formData.travelDocuments,
                    embassy: { ...formData.travelDocuments.embassy, address: e.target.value }
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isSubmitting ? "Updating Profile..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
