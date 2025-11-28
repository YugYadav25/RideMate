import React, { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
    children,
    className = '',
    delay = 0,
    direction = 'up',
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    const getTransform = () => {
        switch (direction) {
            case 'up':
                return 'translateY(30px)';
            case 'down':
                return 'translateY(-30px)';
            case 'left':
                return 'translateX(30px)';
            case 'right':
                return 'translateX(-30px)';
            default:
                return 'translateY(30px)';
        }
    };

    return (
        <div
            ref={sectionRef}
            className={`${className}`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translate(0)' : getTransform(),
                transition: `opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
};

export default AnimatedSection;
