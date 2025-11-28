import React, { useEffect, useRef, useState } from 'react';
import './rollerPicker.css';

interface RollerDatePickerProps {
    value: string; // ISO Date string YYYY-MM-DD
    onChange: (date: string) => void;
}

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const RollerDatePicker: React.FC<RollerDatePickerProps> = ({ value, onChange }) => {
    // Parse initial value
    const initialDate = value ? new Date(value) : new Date();
    const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
    const [selectedDay, setSelectedDay] = useState(initialDate.getDate());

    // Generate ranges
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i); // Next 10 years
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Refs for scrolling
    const dayRef = useRef<HTMLDivElement>(null);
    const monthRef = useRef<HTMLDivElement>(null);
    const yearRef = useRef<HTMLDivElement>(null);

    // Sync scroll position with state on mount/update
    useEffect(() => {
        const itemHeight = 40;
        if (dayRef.current) dayRef.current.scrollTop = (selectedDay - 1) * itemHeight;
        if (monthRef.current) monthRef.current.scrollTop = selectedMonth * itemHeight;
        if (yearRef.current) yearRef.current.scrollTop = (years.indexOf(selectedYear)) * itemHeight;
    }, []); // Run once on mount to set initial position. 
    // Note: We don't run on every state change to avoid fighting the user's scroll, 
    // but we might need to adjust if days change (e.g. Feb 28 -> Mar 31)

    // Update parent when state changes
    useEffect(() => {
        // Ensure day is valid for the new month/year
        const maxDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        let validDay = selectedDay;
        if (selectedDay > maxDay) {
            validDay = maxDay;
            setSelectedDay(maxDay);
        }

        const date = new Date(selectedYear, selectedMonth, validDay);
        // Format to YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
    }, [selectedYear, selectedMonth, selectedDay]);

    return (
        <div className="roller-picker-container">
            <div className="roller-highlight" />
            <div className="roller-mask-top" />
            <div className="roller-mask-bottom" />

            {/* Day Column */}
            <div
                className="roller-column"
                ref={dayRef}
                onScroll={() => {
                    if (!dayRef.current) return;
                    const itemHeight = 40;
                    const index = Math.round(dayRef.current.scrollTop / itemHeight);
                    if (days[index]) setSelectedDay(days[index]);
                }}
            >
                <div className="roller-column-content">
                    {days.map((day) => (
                        <div
                            key={day}
                            className={`roller-item ${day === selectedDay ? 'selected' : ''}`}
                            onClick={() => {
                                setSelectedDay(day);
                                if (dayRef.current) dayRef.current.scrollTop = (day - 1) * 40;
                            }}
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>

            {/* Month Column */}
            <div
                className="roller-column"
                ref={monthRef}
                onScroll={() => {
                    if (!monthRef.current) return;
                    const itemHeight = 40;
                    const index = Math.round(monthRef.current.scrollTop / itemHeight);
                    if (MONTHS[index]) setSelectedMonth(index);
                }}
            >
                <div className="roller-column-content">
                    {MONTHS.map((month, index) => (
                        <div
                            key={month}
                            className={`roller-item ${index === selectedMonth ? 'selected' : ''}`}
                            onClick={() => {
                                setSelectedMonth(index);
                                if (monthRef.current) monthRef.current.scrollTop = index * 40;
                            }}
                        >
                            {month}
                        </div>
                    ))}
                </div>
            </div>

            {/* Year Column */}
            <div
                className="roller-column"
                ref={yearRef}
                onScroll={() => {
                    if (!yearRef.current) return;
                    const itemHeight = 40;
                    const index = Math.round(yearRef.current.scrollTop / itemHeight);
                    if (years[index]) setSelectedYear(years[index]);
                }}
            >
                <div className="roller-column-content">
                    {years.map((year) => (
                        <div
                            key={year}
                            className={`roller-item ${year === selectedYear ? 'selected' : ''}`}
                            onClick={() => {
                                setSelectedYear(year);
                                const idx = years.indexOf(year);
                                if (yearRef.current) yearRef.current.scrollTop = idx * 40;
                            }}
                        >
                            {year}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RollerDatePicker;
