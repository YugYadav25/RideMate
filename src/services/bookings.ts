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

export type Booking = {
    _id: string;
    ride: {
        _id: string;
        from: string;
        to: string;
        date: string;
        time: string;
        duration?: number;
        isActive?: boolean;
        driver: {
            name: string;
            phone?: string;
            email?: string;
        };
        vehicle?: {
            registrationNumber: string;
            model: string;
            make: string;
            color: string;
        };
        rideStatus?: 'upcoming' | 'started' | 'completed' | 'cancelled';
    };
    rider: {
        _id: string;
        name: string;
    };
    seatsBooked: number;
    totalPrice: number;
    status: 'Pending' | 'Accepted' | 'Approved' | 'Rejected' | 'Cancelled';
    bookingDate: string;
};

export const bookingApi = {
    async getMyBookings() {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required.');
        }
        const response = await fetch(`${API_BASE}/bookings/me`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        const result = await handleResponse<{ success: true; data: Booking[] }>(response);
        return result.data;
    },
};
