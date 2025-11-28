import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const FloatingActionButton: React.FC = () => {
    const { navigateTo } = useApp();
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Hide button when the black section is visible
                setIsVisible(!entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0.1, // Trigger when 10% of the target is visible
            }
        );

        const target = document.getElementById('app-showcase');
        if (target) {
            observer.observe(target);
        }

        return () => {
            if (target) {
                observer.unobserve(target);
            }
        };
    }, []);

    return (
        <button
            onClick={() => navigateTo('signup')}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-black text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group cursor-hover ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
                }`}
        >
            <span className="font-bold text-sm uppercase tracking-wider">Get Started</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
    );
};

export default FloatingActionButton;
