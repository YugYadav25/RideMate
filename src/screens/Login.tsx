import { useState } from 'react';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import { authApi } from '../services/auth';

export default function Login() {
  const { navigateTo, setAuthToken, setRole, setUserId, setUserName, setUserEmail, setUserPhone, setEmergencyContacts } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });

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
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';

      // Check if user doesn't exist - redirect to create account
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401')) {
        // User might not exist or wrong password
        // For now, we'll show error and let them try again or go to signup
        setError('Invalid email or password. If you don\'t have an account, please create one.');
      } else if (errorMessage.includes('User already exists')) {
        // This shouldn't happen on login, but handle it
        setError('An account with this email already exists. Please login or use forgot password.');
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
        <div className="absolute top-0 right-0 w-72 h-72 bg-gray-100 rounded-full -translate-y-1/2 translate-x-1/3 opacity-20"></div>
      </div>

      <button
        onClick={() => navigateTo('landing')}
        className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
      >
        <ArrowLeft size={24} className="text-black" />
      </button>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo className="h-16 w-16 shadow-xl border !border-black" />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-black mb-2">Welcome Back</h1>
          <p className="text-gray-600 font-medium">Sign in to your RideMate account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-700 font-semibold text-sm">
              {error}
            </div>
          )}

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
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            icon={<Lock size={20} />}
            required
            disabled={loading}
          />

          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-600">New to RideMate?</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => navigateTo('signup')}
            disabled={loading}
          >
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
}
