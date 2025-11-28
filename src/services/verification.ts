// Helper to get API base URL (same logic as auth.ts)
const getApiBase = () => {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    if (!cleanBase.endsWith('/api')) {
        return cleanBase.endsWith('/') ? `${cleanBase}api` : `${cleanBase}/api`;
    }
    return cleanBase;
};

const API_BASE = getApiBase();

export type VerificationResponse = {
    success: boolean;
    data: {
        verificationStatus: 'verified' | 'rejected';
        details: {
            name: string;
            licenseNumber: string;
            expiryDate: string;
            extractedData: any;
        };
    };
};

export const verificationApi = {
    /**
     * Upload and verify driver license
     */
    async verifyLicense(file: File, token: string): Promise<VerificationResponse> {
        if (!token) {
            throw new Error('Authentication required. Please log in.');
        }

        try {
            const formData = new FormData();
            formData.append('license', file);

            const response = await fetch(`${API_BASE}/verification/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Unable to connect to the server. Please check if the server is running.');
            }
            throw error;
        }
    },
};
