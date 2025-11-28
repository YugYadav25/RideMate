import { ReactNode } from 'react';
import Footer from './Footer';
import Navbar from './Navbar';
import VoiceAssistant from './VoiceAssistant';

interface LayoutProps {
    children: ReactNode;
    fullWidth?: boolean;
    className?: string;
}

export default function Layout({ children, fullWidth = false, className = 'bg-gray-50' }: LayoutProps) {
    return (
        <div className={`min-h-screen flex flex-col font-sans text-gray-900 ${className}`}>
            <div className={`flex-1 flex flex-col w-full ${fullWidth ? '' : 'max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
                {children}
            </div>
            <VoiceAssistant />
            <Footer />
        </div>
    );
}
