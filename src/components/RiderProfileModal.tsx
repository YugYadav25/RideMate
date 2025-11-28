import { X, User, Star, Phone, Mail, Check, X as XIcon } from 'lucide-react';
import Button from './Button';

interface RiderProfileModalProps {
    rider: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
    } | null;
    rating: number;
    onAccept: () => void;
    onReject: () => void;
    onClose: () => void;
}

export default function RiderProfileModal({ rider, rating, onAccept, onReject, onClose }: RiderProfileModalProps) {
    if (!rider) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-md rounded-3xl border-4 border-black bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full border-2 border-black p-1 text-black hover:bg-black hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-full border-2 border-black flex items-center justify-center mb-4">
                        <User size={48} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-black">{rider.name}</h2>
                    <div className="flex items-center mt-2 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-300">
                        <Star size={16} className="text-yellow-600 fill-yellow-600 mr-1" />
                        <span className="font-bold text-yellow-800">{rating.toFixed(1)} Rating</span>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <Mail size={20} className="text-gray-500 mr-3" />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Email</p>
                            <p className="text-black font-medium">{rider.email || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <Phone size={20} className="text-gray-500 mr-3" />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Phone</p>
                            <p className="text-black font-medium">{rider.phone || 'Not provided'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={onAccept} className="bg-black text-white hover:bg-gray-800">
                        <Check size={20} className="mr-2" />
                        Accept
                    </Button>
                    <Button onClick={onReject} variant="secondary" className="border-red-500 text-red-600 hover:bg-red-50">
                        <XIcon size={20} className="mr-2" />
                        Reject
                    </Button>
                </div>
            </div>
        </div>
    );
}
