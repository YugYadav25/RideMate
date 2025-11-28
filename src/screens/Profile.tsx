import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Heart, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Button from '../components/Button';
import Layout from '../components/Layout';

export default function Profile() {
  const { navigateTo, userName, userRole, updateProfile, user, fetchUserProfile } = useApp();
  const { isVoiceCommandMode, toggleVoiceCommandMode } = useAccessibility();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyName1: '',
    emergencyPhone1: '',
    emergencyName2: '',
    emergencyPhone2: '',
    emergencyName3: '',
    emergencyPhone3: '',
    profilePhoto: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setInitialLoading(true);
        await fetchUserProfile();
      } catch (error) {
        console.error('Failed to load profile:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        emergencyName1: user.emergencyName1 || '',
        emergencyPhone1: user.emergencyPhone1 || '',
        emergencyName2: user.emergencyName2 || '',
        emergencyPhone2: user.emergencyPhone2 || '',
        emergencyName3: user.emergencyName3 || '',
        emergencyPhone3: user.emergencyPhone3 || '',
        profilePhoto: user.profilePhoto || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Layout fullWidth>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="mb-8 flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>

        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4 group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  {formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300 uppercase">
                      {userName?.charAt(0)}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="w-full max-w-md mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo URL</label>
                  <input
                    type="text"
                    name="profilePhoto"
                    value={formData.profilePhoto}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              ) : null}

              <h1 className="text-2xl font-bold text-black">{userName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-500 capitalize">{userRole}</p>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <div className="flex items-center text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span className="ml-1 font-medium text-black">{user?.rating?.toFixed(1) || '5.0'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Voice Command Mode</h3>
                <p className="text-sm text-gray-500">Use whole App using Voice Commands</p>
              </div>
              <button
                onClick={toggleVoiceCommandMode}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isVoiceCommandMode ? 'bg-black' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isVoiceCommandMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="text-red-500" size={20} />
                  <h2 className="text-lg font-semibold">Emergency Contacts</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact 1 Name</label>
                    <input
                      type="text"
                      name="emergencyName1"
                      value={formData.emergencyName1}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact 1 Phone</label>
                    <input
                      type="tel"
                      name="emergencyPhone1"
                      value={formData.emergencyPhone1}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact 2 Name</label>
                    <input
                      type="text"
                      name="emergencyName2"
                      value={formData.emergencyName2}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact 2 Phone</label>
                    <input
                      type="tel"
                      name="emergencyPhone2"
                      value={formData.emergencyPhone2}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact 3 Name</label>
                    <input
                      type="text"
                      name="emergencyName3"
                      value={formData.emergencyName3}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact 3 Phone</label>
                    <input
                      type="tel"
                      name="emergencyPhone3"
                      value={formData.emergencyPhone3}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-black transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                {isEditing ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
