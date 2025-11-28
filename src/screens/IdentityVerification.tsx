import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { verificationApi } from '../services/verification';
import Layout from '../components/Layout';

export default function IdentityVerification() {
    const { navigateTo, authToken: token, fetchUserProfile, user } = useApp();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!token) {
            navigateTo('login');
        } else {
            // Check if already verified
            if (user?.verificationStatus === 'verified') {
                setResult({ verificationStatus: 'verified', details: {} });
            }
        }
    }, [token, navigateTo, user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select an image first.');
            return;
        }

        if (!token) {
            setError('Authentication required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await verificationApi.verifyLicense(file, token);
            setResult(data.data);
            if (data.data.verificationStatus === 'verified') {
                await fetchUserProfile();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigateTo('profile')}
                    className="mb-6 flex items-center text-gray-600 hover:text-black transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Profile
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Identity Verification</h1>
                    <p className="text-gray-600">
                        Upload a clear photo of your Driver's License. Our AI will verify your details instantly.
                    </p>
                </div>

                <Card className="p-6 sm:p-8">
                    {!result ? (
                        <>
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors mb-6"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {preview ? (
                                    <div className="relative">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="max-h-64 mx-auto rounded-lg shadow-md"
                                        />
                                        <p className="mt-4 text-sm text-gray-500">Click to change image</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-8">
                                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                            <Upload size={32} />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Upload Driver's License</h3>
                                        <p className="text-sm text-gray-500 max-w-xs">
                                            JPG, PNG or JPEG. Max 5MB. Make sure text is readable.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            )}

                            <Button
                                fullWidth
                                size="lg"
                                onClick={handleUpload}
                                disabled={loading || !file}
                                className="flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Verifying with AI...
                                    </>
                                ) : (
                                    <>
                                        <Camera size={20} />
                                        Verify Identity
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            {result.verificationStatus === 'verified' ? (
                                <div className="mb-6">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-green-700 mb-2">Verification Successful!</h2>
                                    <p className="text-gray-600">Your identity has been verified.</p>

                                    <div className="mt-8">
                                        <Button
                                            fullWidth
                                            onClick={() => navigateTo('profile')}
                                            className="bg-black text-white hover:bg-gray-800"
                                        >
                                            Go to Profile
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle size={40} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h2>
                                    <p className="text-gray-600">
                                        {result.failReason || "We couldn't verify your ID. Please try again with a clearer photo."}
                                    </p>

                                    <div className="mt-8">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setFile(null);
                                                setPreview(null);
                                                setResult(null);
                                            }}
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {result.details && Object.keys(result.details).length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto mt-8">
                                    <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Extracted Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Name:</span>
                                            <span className="font-medium">{result.details.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">License No:</span>
                                            <span className="font-medium">{result.details.licenseNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Expiry Date:</span>
                                            <span className="font-medium">{result.details.expiryDate || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
}
