import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface PickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const PickerModal: React.FC<PickerModalProps> = ({ isOpen, onClose, title, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-50' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`
          relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl 
          transform transition-transform duration-300 pointer-events-auto
          ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'}
        `}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-black">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="mb-4">
                    {children}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-black text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
                >
                    Confirm
                </button>
            </div>
        </div>
    );
};

export default PickerModal;
