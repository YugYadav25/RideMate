import React, { useEffect, useState } from 'react';
import '../../styles/customCursor.css';

const CustomCursor: React.FC = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const updatePosition = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.classList.contains('cursor-hover')
            ) {
                setIsHovered(true);
            } else {
                setIsHovered(false);
            }
        };

        window.addEventListener('mousemove', updatePosition);
        window.addEventListener('mouseover', handleMouseOver);

        // Add class to hide default cursor
        document.body.classList.add('use-custom-cursor');

        return () => {
            window.removeEventListener('mousemove', updatePosition);
            window.removeEventListener('mouseover', handleMouseOver);
            // Remove class to restore default cursor
            document.body.classList.remove('use-custom-cursor');
        };
    }, []);

    return (
        <>
            <div
                className={`custom-cursor ${isHovered ? 'hovered' : ''}`}
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
            />
            <div
                className={`custom-cursor-dot ${isHovered ? 'hovered' : ''}`}
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
            />
        </>
    );
};

export default CustomCursor;
