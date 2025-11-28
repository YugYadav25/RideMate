const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

const getAuthToken = () => {
  return localStorage.getItem('authToken');
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

export type VehicleCreatePayload = {
  registrationNumber: string;
  seatingLimit: number;
  vehicleType: '2-wheeler' | '3-wheeler' | '4-wheeler';
  make?: string;
  model?: string;
  color?: string;
};

export type VehicleUpdatePayload = Partial<VehicleCreatePayload>;

export type VehicleResponse = {
  success: boolean;
  vehicle: Vehicle;
};

export type VehiclesResponse = {
  success: boolean;
  vehicles: Vehicle[];
};

export const vehicleApi = {
  async list() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/vehicles`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<VehiclesResponse>(response);
  },

  async create(payload: VehicleCreatePayload) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<VehicleResponse>(response);
  },

  async update(vehicleId: string, payload: VehicleUpdatePayload) {
    console.log('[VehicleService] Updating vehicle:', vehicleId, payload);
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<VehicleResponse>(response);
  },

  async delete(vehicleId: string) {
    console.log('[VehicleService] Deleting vehicle:', vehicleId);
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

