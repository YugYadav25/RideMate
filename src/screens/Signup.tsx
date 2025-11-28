import { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, Phone, LogOut, Car } from 'lucide-react';
import { useApp } from '../context/AppContext';

import Button from '../components/Button';
import Input from '../components/Input';
import { authApi } from '../services/auth';

export default function Signup() {
  const { navigateTo, setAuthToken, setRole, setUserId, setUserName, setUserEmail, setUserPhone, setEmergencyContacts } = useApp();
  const [step, setStep] = useState(1); // Step 1 or 2
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'driver' | 'rider'>('rider');
  const [gender, setGender] = useState('');
  const [emergencyName1, setEmergencyName1] = useState('');
  const [emergency1, setEmergency1] = useState('');
  const [emergencyName2, setEmergencyName2] = useState('');
  const [emergency2, setEmergency2] = useState('');
  const [emergencyName3, setEmergencyName3] = useState('');
  const [emergency3, setEmergency3] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate Step 1 fields
  const validateStep1 = () => {
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  // Handle Next button (Step 1 to Step 2)
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      setError(null);
    }
  };

  // Handle Back button (Step 2 to Step 1)
  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Step 2 Validation
    if (!name || !phone) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic phone validation (at least 10 digits)
    const phoneRegex = /^[\d+\s-()]{10,}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: selectedRole,
        emergencyName1: emergencyName1.trim() || '',
        emergencyPhone1: emergency1.trim() || '',
        emergencyName2: emergencyName2.trim() || '',
        emergencyPhone2: emergency2.trim() || '',
        emergencyName3: emergencyName3.trim() || '',
        emergencyPhone3: emergency3.trim() || '',
      });

      // Store auth data
      setAuthToken(response.token);
      setRole(response.user.role);
      setUserId(response.user.id);
      setUserName(response.user.name);
      setUserEmail(response.user.email);
      setUserPhone(response.user.phone);

      // Load emergency contacts from user data
      const emergencyContacts = [];
      if (response.user.emergencyName1 && response.user.emergencyPhone1) {
        emergencyContacts.push({
          name: response.user.emergencyName1,
          phone: response.user.emergencyPhone1,
        });
      }
      if (response.user.emergencyName2 && response.user.emergencyPhone2) {
        emergencyContacts.push({
          name: response.user.emergencyName2,
          phone: response.user.emergencyPhone2,
        });
      }
      if (response.user.emergencyName3 && response.user.emergencyPhone3) {
        emergencyContacts.push({
          name: response.user.emergencyName3,
          phone: response.user.emergencyPhone3,
        });
      }
      setEmergencyContacts(emergencyContacts);

      // Navigate to dashboard
      navigateTo('dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';

      if (errorMessage.includes('already exists')) {
        setError('An account with this email already exists. Please login instead.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gray-100 rounded-full -translate-y-1/2 -translate-x-1/3 opacity-20"></div>
      </div>

      <button
        onClick={() => navigateTo('landing')}
        className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
      >
        <ArrowLeft size={24} className="text-black" />
      </button>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Join RideMate</h1>
          <p className="text-gray-600 font-medium">
            {step === 1 ? 'Step 1 of 2 - Account Credentials' : 'Step 2 of 2 - Your Information'}
          </p>
        </div>

        <form onSubmit={step === 1 ? handleNext : handleSignup} className="space-y-5">
          {error && (
            <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-700 font-semibold text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Email and Password */}
          {step === 1 && (
            <>
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                icon={<Mail size={20} />}
                required
                disabled={loading}
              />
              <Input
                label="Password"
                type="password"
                placeholder="•••••••• (min 6 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                icon={<Lock size={20} />}
                required
                disabled={loading}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                icon={<Lock size={20} />}
                required
                disabled={loading}
              />

              <Button type="submit" fullWidth size="lg" className="mt-6" disabled={loading}>
                Next
              </Button>
            </>
          )}

          {/* Step 2: Personal Information */}
          {step === 2 && (
            <>
              <Input
                label="Full Name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                icon={<User size={20} />}
                required
                disabled={loading}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow digits, spaces, +, -, and parentheses
                  if (/^[\d+\s-()]*$/.test(value)) {
                    setPhone(value);
                    setError(null);
                  }
                }}
                icon={<Phone size={20} />}
                required
                disabled={loading}
              />

              <div>
                <label className="block text-sm font-semibold mb-2.5 text-black">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg smooth-transition focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
                  disabled={loading}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div className="pt-2 pb-1">
                <label className="block text-sm font-semibold mb-3 text-black">I'm a</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('rider');
                      setError(null);
                    }}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${selectedRole === 'rider'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:border-black'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <LogOut size={18} /> Rider
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('driver');
                      setError(null);
                    }}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${selectedRole === 'driver'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:border-black'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Car size={18} /> Driver
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 shadow-sm">
                <label className="block text-xl text-center font-semibold text-black">
                  Emergency Contact Numbers
                </label>
                <br />
                <Input
                  label="Emergency Contact 1 - Name"
                  placeholder="Contact name"
                  value={emergencyName1}
                  onChange={(e) => {
                    setEmergencyName1(e.target.value);
                    setError(null);
                  }}
                  icon={<User size={20} />}
                  disabled={loading}
                />
                <Input
                  label="Emergency Contact 1 - Phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={emergency1}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\d+\s-()]*$/.test(value)) {
                      setEmergency1(value);
                      setError(null);
                    }
                  }}
                  icon={<Phone size={20} />}
                  disabled={loading}
                />
                <Input
                  label="Emergency Contact 2 - Name"
                  placeholder="Contact name"
                  value={emergencyName2}
                  onChange={(e) => {
                    setEmergencyName2(e.target.value);
                    setError(null);
                  }}
                  icon={<User size={20} />}
                  disabled={loading}
                />
                <Input
                  label="Emergency Contact 2 - Phone"
                  type="tel"
                  placeholder="+91 9876543211"
                  value={emergency2}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\d+\s-()]*$/.test(value)) {
                      setEmergency2(value);
                      setError(null);
                    }
                  }}
                  icon={<Phone size={20} />}
                  disabled={loading}
                />
                <Input
                  label="Emergency Contact 3 - Name"
                  placeholder="Contact name"
                  value={emergencyName3}
                  onChange={(e) => {
                    setEmergencyName3(e.target.value);
                    setError(null);
                  }}
                  icon={<User size={20} />}
                  disabled={loading}
                />
                <Input
                  label="Emergency Contact 3 - Phone"
                  type="tel"
                  placeholder="+91 9876543212"
                  value={emergency3}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\d+\s-()]*$/.test(value)) {
                      setEmergency3(value);
                      setError(null);
                    }
                  }}
                  icon={<Phone size={20} />}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  fullWidth
                  size="lg"
                  className="mt-6 bg-black text-white hover:bg-gray-300"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" fullWidth size="lg" className="mt-6" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="font-semibold text-black hover:opacity-70 transition-opacity"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
