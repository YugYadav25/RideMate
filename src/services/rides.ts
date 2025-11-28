const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

// Log API base URL in development (helps debug configuration issues)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE);
}

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const buildQueryString = (params?: Record<string, string | number | undefined | null>) => {
  if (!params) return '';
  const query = Object.entries(params).reduce<string[]>((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    acc.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    return acc;
  }, []);
  return query.length ? `?${query.join('&')}` : '';
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  try {
    return await response.json() as Promise<T>;
  } catch (e) {
    throw new Error('Invalid JSON response from server');
  }
};

export type RideRequest = {
  _id: string;
  rider: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    rating?: number;
  } | null;
  name: string;
  rating: number;
  status: 'Approved' | 'Pending' | 'Rejected' | 'PaymentPending';
  seatsRequested: number;
  addons?: {
    firstAid: boolean;
    doorToDoor: boolean;
  };
  addonCharges?: number;
  finalCost?: number;
  riderReview?: {
    rating: number;
    text?: string;
  };
  driverReview?: {
    rating: number;
    text?: string;
  };
  driverRated?: boolean;
  riderRatedDriver?: boolean;
  createdAt: string;
};

export type Ride = {
  _id: string;
  id: string;
  driver: {
    id: string;
    name: string;
    rating: number;
  };
  start: {
    label: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    label: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  date: string;
  time: string;
  duration?: number;
  status: 'Active' | 'Pending' | 'Completed' | 'Confirmed';
  rideStatus?: 'pending' | 'accepted' | 'rejected' | 'started' | 'completed';
  startTime?: string | null;
  endTime?: string | null;
  seats: {
    total: number;
    available: number;
  };
  notes?: string;
  requests: RideRequest[];
  participants?: Array<{
    rider: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    } | null;
    name: string;
    status: string;
    seatsBooked: number;
    addons?: {
      firstAid: boolean;
      doorToDoor: boolean;
    };
    finalCost?: number;
  }>;
  vehicleId?: string | null;
  driverLocation?: {
    lat: number;
    lng: number;
  } | null;
  vehicle?: {
    _id: string;
    registrationNumber: string;
    model?: string;
    make?: string;
    color?: string;
    type: '2-wheeler' | '3-wheeler' | '4-wheeler';
    seatingLimit: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type RideCreatePayload = {
  driverName: string;
  driverRating?: number;
  start: {
    label: string;
    lat: number;
    lng: number;
  };
  destination: {
    label: string;
    lat: number;
    lng: number;
  };
  date: string;
  time: string;
  duration?: number;
  seats: number;
  price?: number;
  notes?: string;
  vehicleId?: string;
  driverLocation?: {
    lat: number;
    lng: number;
  };
};

export type RideQueryParams = {
  from?: string;
  to?: string;
  nearStart?: string; // Location name for geo-search
  nearDest?: string; // Location name for geo-search
  radius?: number; // Search radius in meters (default: 50000)
  date?: string;
  status?: string;
  driver?: string;
  driverId?: string;
  participant?: string;
  participantId?: string;
  limit?: number;
};

export type RideMatchPoint = {
  label?: string;
  name?: string;
  lat: number;
  lng: number;
};

export type RideMatchPayload = {
  pickup: RideMatchPoint | string;
  drop: RideMatchPoint | string;
  preferredTime?: string; // ISO string
  seatsRequired?: number;
};

export type RideMatchMetrics = {
  pickupDistanceKm: number;
  dropDistanceKm: number;
  timeDiffMinutes: number | null;
  seatsAvailable: number;
  routeSimilarity: number;
};

export type RideMatch = {
  ride: Ride;
  metrics: RideMatchMetrics;
  score: number;
  matchQuality: 'perfect' | 'good' | 'nearby';
};

export type RideMatchResponse = {
  success: boolean;
  rider: {
    pickup: RideMatchPoint;
    drop: RideMatchPoint;
    preferredTime: string | null;
    seatsRequired: number;
  };
  matches: {
    perfect: RideMatch[];
    good: RideMatch[];
    nearby: RideMatch[];
  };
  totals: {
    perfect: number;
    good: number;
    nearby: number;
  };
};

export const rideApi = {
  async list(params?: RideQueryParams) {
    try {
      const response = await fetch(`${API_BASE}/rides${buildQueryString(params)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return handleResponse<Ride[]>(response);
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to fetch: Unable to connect to the server. Please check if the server is running.');
      }
      throw error;
    }
  },

  async create(payload: RideCreatePayload) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in to create a ride.');
    }
    const response = await fetch(`${API_BASE}/rides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Ride>(response);
  },

  async getById(id: string) {
    const response = await fetch(`${API_BASE}/rides/${id}`);
    return handleResponse<Ride>(response);
  },

  async delete(id: string) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in to delete a ride.');
    }
    const response = await fetch(`${API_BASE}/rides/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<{ success: true; message: string }>(response);
  },

  async updateStatus(id: string, status: Ride['status']) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in to update ride status.');
    }
    const response = await fetch(`${API_BASE}/rides/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Ride>(response);
  },

  async addRequest(id: string, payload: { name?: string; rating?: number; seatsRequested?: number; addons?: { firstAid: boolean; doorToDoor: boolean } }) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in to add a request.');
    }
    const response = await fetch(`${API_BASE}/rides/${id}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Ride>(response);
  },

  async updateRequestStatus(rideId: string, requestId: string, status: 'Approved' | 'Rejected') {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in to update request status.');
    }
    const response = await fetch(`${API_BASE}/rides/${rideId}/requests/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Ride>(response);
  },

  async match(payload: RideMatchPayload) {
    const response = await fetch(`${API_BASE}/rides/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<RideMatchResponse>(response);
  },

  async rateRide(id: string, payload: { rating: number; review?: string; type: 'driver' | 'rider'; targetUserId?: string }) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required.');
    }
    const response = await fetch(`${API_BASE}/rides/${id}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Ride>(response);
  },

  async deleteRequest(id: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');
    const response = await fetch(`${API_BASE}/rides/${id}/requests`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<{ success: true; message: string }>(response);
  },

  async cancelBooking(id: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');
    const response = await fetch(`${API_BASE}/rides/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<{ success: true; message: string }>(response);
  },

  async startRide(id: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');
    const response = await fetch(`${API_BASE}/rides/${id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<Ride>(response);
  },

  async completeRide(id: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');
    const response = await fetch(`${API_BASE}/rides/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<Ride>(response);
  },

  async confirmPayment(id: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');
    const response = await fetch(`${API_BASE}/rides/${id}/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<{ success: true; message: string }>(response);
  },
};

