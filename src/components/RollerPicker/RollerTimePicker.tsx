import React, { useEffect, useRef, useState } from 'react';
import './rollerPicker.css';

interface RollerTimePickerProps {
    value: string; // HH:mm (24-hour format)
    onChange: (time: string) => void;
}

const RollerTimePicker: React.FC<RollerTimePickerProps> = ({ value, onChange }) => {
    // Parse initial value
    // value is "14:30"
    const [initialHours, initialMinutes] = (value || '12:00').split(':').map(Number);

    const [hour, setHour] = useState(initialHours % 12 || 12);
    const [minute, setMinute] = useState(initialMinutes);
    const [ampm, setAmpm] = useState(initialHours >= 12 ? 'PM' : 'AM');

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59
    const ampms = ['AM', 'PM'];

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const ampmRef = useRef<HTMLDivElement>(null);

    // Sync scroll position with state on mount
    useEffect(() => {
        const itemHeight = 40;
        if (hourRef.current) {
            // hours array is 1-12. Index is hour - 1.
            // But wait, if hour is 12, index is 11. If hour is 1, index is 0.
            // So index = hour - 1.
            let idx = hour - 1;
            if (idx < 0) idx = 11; // Should not happen if logic is correct
            hourRef.current.scrollTop = idx * itemHeight;
        }
        if (minuteRef.current) minuteRef.current.scrollTop = minute * itemHeight;
        if (ampmRef.current) ampmRef.current.scrollTop = (ampm === 'PM' ? 1 : 0) * itemHeight;
    }, []);

    // Update parent
    useEffect(() => {
        let h = hour;
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        const hh = String(h).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        onChange(`${hh}:${mm}`);
    }, [hour, minute, ampm]);

    return (
        <div className="roller-picker-container">
            <div className="roller-highlight" />
            <div className="roller-mask-top" />
            <div className="roller-mask-bottom" />

            {/* Hour Column */}
            <div
                className="roller-column"
                ref={hourRef}
                onScroll={() => {
                    if (!hourRef.current) return;
                    const itemHeight = 40;
                    const index = Math.round(hourRef.current.scrollTop / itemHeight);
                    if (hours[index]) setHour(hours[index]);
                }}
            >
                <div className="roller-column-content">
                    {hours.map((h) => (
                        <div
                            key={h}
                            className={`roller-item ${h === hour ? 'selected' : ''}`}
                            onClick={() => {
                                setHour(h);
                                if (hourRef.current) hourRef.current.scrollTop = (h - 1) * 40;
                            }}
                        >
                            {h}
                        </div>
                    ))}
                </div>
            </div>

            {/* Minute Column */}
            <div
                className="roller-column"
                ref={minuteRef}
                onScroll={() => {
                    if (!minuteRef.current) return;
                    const itemHeight = 40;
                    const index = Math.round(minuteRef.current.scrollTop / itemHeight);
                    // minutes array includes 0, so index matches value
                    if (minutes[index] !== undefined) setMinute(minutes[index]);
                }}
            >
                <div className="roller-column-content">
                    {minutes.map((m) => (
                        <div
                            key={m}
                            className={`roller-item ${m === minute ? 'selected' : ''}`}
                            onClick={() => {
                                setMinute(m);
                                if (minuteRef.current) minuteRef.current.scrollTop = m * 40;
                            }}
                        >
                            {String(m).padStart(2, '0')}
                        </div>
                    ))}
                </div>
            </div>

            {/* AM/PM Column */}
            <div
                className="roller-column"
                ref={ampmRef}
                onScroll={() => {
                    if (!ampmRef.current) return;
                    const itemHeight = 40;
                    const index = Math.round(ampmRef.current.scrollTop / itemHeight);
                    if (ampms[index]) setAmpm(ampms[index]);
                }}
            >
                <div className="roller-column-content">
                    {ampms.map((ap, index) => (
                        <div
                            key={ap}
                            className={`roller-item ${ap === ampm ? 'selected' : ''}`}
                            onClick={() => {
                                setAmpm(ap);
                                if (ampmRef.current) ampmRef.current.scrollTop = index * 40;
                            }}
                        >
                            {ap}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RollerTimePicker;
