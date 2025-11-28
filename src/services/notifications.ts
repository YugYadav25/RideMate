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

export type Notification = {
  _id: string;
  receiverId: string;
  type: 'ride_request' | 'request_accepted' | 'request_rejected' | 'request_cancelled' | 'ride_started' | 'ride_completed' | 'ride_booked' | 'ride_confirmed' | 'payment_required';
  message: string;
  rideId?: string;
  requestId?: string;
  isRead: boolean;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationResponse = {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
};

export const notificationApi = {
  async list(unreadOnly = false): Promise<NotificationResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await fetch(`${API_BASE}/notifications${unreadOnly ? '?unreadOnly=true' : ''}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<NotificationResponse>(response);
  },

  async markAsRead(notificationId: string): Promise<{ success: boolean; notification: Notification }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<{ success: boolean; notification: Notification }>(response);
  },

  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};


