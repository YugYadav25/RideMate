import React, { useState, useEffect } from 'react';
import './clockPicker.css';

interface ClockTimePickerProps {
    value: string; // HH:mm (24-hour format)
    onChange: (time: string) => void;
}

const ClockTimePicker: React.FC<ClockTimePickerProps> = ({ value, onChange }) => {
    // Parse initial value
    const [initialHours, initialMinutes] = (value || '12:00').split(':').map(Number);

    const [hour, setHour] = useState(initialHours % 12 || 12);
    const [minute, setMinute] = useState(initialMinutes);
    const [ampm, setAmpm] = useState<'AM' | 'PM'>(initialHours >= 12 ? 'PM' : 'AM');
    const [mode, setMode] = useState<'hour' | 'minute'>('hour');

    // Update parent when state changes
    useEffect(() => {
        let h = hour;
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        const hh = String(h).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        onChange(`${hh}:${mm}`);
    }, [hour, minute, ampm]);

    const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = e.clientX - rect.left - centerX;
        const y = e.clientY - rect.top - centerY;

        // Calculate angle in degrees
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (mode === 'hour') {
            const h = Math.round(angle / 30) || 12;
            setHour(h);
            // Auto-switch to minute mode after selecting hour
            setTimeout(() => setMode('minute'), 300);
        } else {
            const m = Math.round(angle / 6);
            const normalizedM = m === 60 ? 0 : m;
            setMinute(normalizedM);
        }
    };

    const renderClockFace = () => {
        const radius = 85; // slightly less than 100 to fit numbers
        const numbers = mode === 'hour'
            ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

        return (
            <div className="clock-face" onClick={handleClockClick}>
                <div className="clock-center" />

                {/* Hand */}
                <div
                    className="clock-hand"
                    style={{
                        height: mode === 'hour' ? '60px' : '80px',
                        transform: `translate(-50%, -100%) rotate(${mode === 'hour' ? hour * 30 : minute * 6
                            }deg)`
                    }}
                />

                {/* Numbers */}
                {numbers.map((num, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const x = 100 + radius * Math.cos(angle);
                    const y = 100 + radius * Math.sin(angle);

                    const isSelected = mode === 'hour'
                        ? num === hour
                        : num === minute;

                    return (
                        <div
                            key={num}
                            className={`clock-number ${isSelected ? 'selected' : ''}`}
                            style={{ left: `${x}px`, top: `${y}px` }}
                        >
                            {mode === 'minute' && num % 5 !== 0 ? '' : num === 0 && mode === 'minute' ? '00' : num}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="clock-picker-container">
            <div className="time-display">
                <div
                    className={`time-unit ${mode === 'hour' ? 'active' : ''}`}
                    onClick={() => setMode('hour')}
                >
                    {String(hour).padStart(2, '0')}
                </div>
                <div className="time-separator">:</div>
                <div
                    className={`time-unit ${mode === 'minute' ? 'active' : ''}`}
                    onClick={() => setMode('minute')}
                >
                    {String(minute).padStart(2, '0')}
                </div>

                <div className="ampm-toggle ml-2">
                    <button
                        className={`ampm-btn ${ampm === 'AM' ? 'active' : ''}`}
                        onClick={() => setAmpm('AM')}
                    >
                        AM
                    </button>
                    <button
                        className={`ampm-btn ${ampm === 'PM' ? 'active' : ''}`}
                        onClick={() => setAmpm('PM')}
                    >
                        PM
                    </button>
                </div>
            </div>

            {renderClockFace()}

            <div className="text-center text-sm text-gray-500 mt-2">
                {mode === 'hour' ? 'Select Hour' : 'Select Minute'}
            </div>
        </div>
    );
};

export default ClockTimePicker;
