import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { vehicleApi } from '../services/vehicles';
import { authApi, User } from '../services/auth';

export type EmergencyContact = {
  name: string;
  phone: string;
};

export type LocationPoint = {
  lat: number;
  lng: number;
};

export type RideSummaryInput = {
  start: LocationPoint;
  destination: LocationPoint;
};

export type Vehicle = {
  _id: string;
  registrationNumber: string;
  seatingLimit: number;
  vehicleType: '2-wheeler' | '3-wheeler' | '4-wheeler';
  make?: string;
  model?: string;
  color?: string;
  createdAt: string;
};

export type RideSchedule = {
  rideId: string;
  days: string[];
  time: string;
  startLocation: LocationPoint;
  destinationLocation: LocationPoint;
  vehicleId: string;
  seats: number;
  notes?: string;
};

interface AppContextType {
  currentScreen: string;
  userRole: 'driver' | 'rider' | null;
  userId: string | null;
  userName: string;
  userEmail: string;
  userPhone: string;
  authToken: string | null;
  user: User | null;
  emergencyContacts: EmergencyContact[];
  activeRideId: string | null;
  rideSummaryInput: RideSummaryInput | null;
  vehicles: Vehicle[];
  rideVehicles: Record<string, string>; // Maps rideId to vehicleId
  rideSchedules: RideSchedule[]; // Weekly schedules
  navigateTo: (screen: string, state?: any) => void;
  goBack: () => void;
  setRole: (role: 'driver' | 'rider') => void;
  setUserId: (id: string | null) => void;
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setUserPhone: (phone: string) => void;
  setAuthToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setEmergencyContacts: (contacts: EmergencyContact[]) => void;
  setActiveRideId: (rideId: string | null) => void;
  setRideSummaryInput: (input: RideSummaryInput | null) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Omit<Vehicle, '_id' | 'createdAt'>) => Promise<void>;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  setRideVehicle: (rideId: string, vehicleId: string) => void;
  addRideSchedule: (schedule: RideSchedule) => void;
  fetchUserProfile: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    phone?: string;
    emergencyName1?: string;
    emergencyPhone1?: string;
    emergencyName2?: string;
    emergencyPhone2?: string;
    emergencyName3?: string;
    emergencyPhone3?: string;
    profilePhoto?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage if available
  const [currentScreen, setCurrentScreen] = useState(() => localStorage.getItem('currentScreen') || 'landing');
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('navHistory');
    return saved ? JSON.parse(saved) : ['landing'];
  });

  const [userRole, setUserRole] = useState<'driver' | 'rider' | null>(() => {
    return (localStorage.getItem('userRole') as 'driver' | 'rider') || null;
  });
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('userPhone') || '');
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);

  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [rideSummaryInput, setRideSummaryInput] = useState<RideSummaryInput | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rideVehicles, setRideVehicles] = useState<Record<string, string>>({});
  const [rideSchedules, setRideSchedules] = useState<RideSchedule[]>([]);

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('currentScreen', currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    localStorage.setItem('navHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (userRole) localStorage.setItem('userRole', userRole);
    else localStorage.removeItem('userRole');
  }, [userRole]);

  useEffect(() => {
    if (userId) localStorage.setItem('userId', userId);
    else localStorage.removeItem('userId');
  }, [userId]);

  useEffect(() => {
    localStorage.setItem('userName', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('userEmail', userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('userPhone', userPhone);
  }, [userPhone]);

  useEffect(() => {
    if (authToken) localStorage.setItem('authToken', authToken);
    else localStorage.removeItem('authToken');
  }, [authToken]);

  // Fetch vehicles when user is a driver and has a token
  useEffect(() => {
    if (userRole === 'driver' && authToken) {
      vehicleApi.list()
        .then(response => {
          if (response.success) {
            setVehicles(response.vehicles);
          }
        })
        .catch(err => console.error('Failed to fetch vehicles:', err));
    } else if (!authToken) {
      setVehicles([]);
    }
  }, [userRole, authToken]);

  // Fetch user profile when token is available
  useEffect(() => {
    if (authToken) {
      fetchUserProfile();
    } else {
      setUser(null);
    }
  }, [authToken]);

  const navigateTo = (screen: string, state?: any) => {
    if (state) {
      (window as any).__navigationState = state;
      window.dispatchEvent(new Event('navigation-state-change'));
    }

    if (screen !== currentScreen) {
      setHistory(prev => [...prev, screen]);
      setCurrentScreen(screen);
    }
  };

  const goBack = () => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      const previousScreen = newHistory[newHistory.length - 1];
      setCurrentScreen(previousScreen);
      return newHistory;
    });
  };

  const handleSetRole = (role: 'driver' | 'rider') => {
    setUserRole(role);
  };

  const logout = () => {
    setAuthToken(null);
    setUserRole(null);
    setUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setUser(null);
    setVehicles([]);
    setRideVehicles({});
    setRideSchedules([]);

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('currentScreen');
    localStorage.removeItem('navHistory');

    setHistory(['landing']);
    setCurrentScreen('landing'); // Don't use navigateTo here to avoid adding to history
  };

  const addVehicle = async (vehicle: Omit<Vehicle, '_id' | 'createdAt'>) => {
    try {
      const response = await vehicleApi.create(vehicle);
      if (response.success) {
        setVehicles([...vehicles, response.vehicle]);
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const response = await vehicleApi.update(id, updates);
      if (response.success) {
        setVehicles(vehicles.map(v => v._id === id ? response.vehicle : v));
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await vehicleApi.delete(id);
      setVehicles(vehicles.filter(v => v._id !== id));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  };

  const setRideVehicle = (rideId: string, vehicleId: string) => {
    setRideVehicles(prev => ({ ...prev, [rideId]: vehicleId }));
  };

  const fetchUserProfile = async () => {
    if (!authToken) return;

    try {
      const response = await authApi.getMe(authToken);
      if (response.success) {
        setUser(response.user);
        // Sync individual state variables for backward compatibility
        setUserName(response.user.name);
        setUserEmail(response.user.email);
        setUserPhone(response.user.phone || '');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const updateProfile = async (updates: {
    name?: string;
    phone?: string;
    emergencyName1?: string;
    emergencyPhone1?: string;
    emergencyName2?: string;
    emergencyPhone2?: string;
    emergencyName3?: string;
    emergencyPhone3?: string;
    profilePhoto?: string;
  }) => {
    if (!authToken) throw new Error('Not authenticated');

    try {
      const response = await authApi.updateProfile(authToken, updates);
      if (response.success) {
        setUser(response.user);
        // Sync individual state variables
        if (updates.name !== undefined) setUserName(updates.name);
        if (updates.phone !== undefined) setUserPhone(updates.phone);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const addRideSchedule = (schedule: RideSchedule) => {
    setRideSchedules(prev => [...prev, schedule]);
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        userRole,
        userId,
        userName,
        userEmail,
        userPhone,
        authToken,
        user,
        emergencyContacts,
        activeRideId,
        rideSummaryInput,
        vehicles,
        navigateTo,
        goBack,
        setRole: handleSetRole,
        setUserId,
        setUserName,
        setUserEmail,
        setUserPhone,
        setAuthToken,
        setUser,
        setEmergencyContacts,
        setActiveRideId,
        setRideSummaryInput,
        setVehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        rideVehicles,
        setRideVehicle,
        rideSchedules,
        addRideSchedule,
        fetchUserProfile,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
