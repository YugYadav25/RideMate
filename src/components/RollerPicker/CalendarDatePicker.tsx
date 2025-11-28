import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarDatePickerProps {
    value: string; // ISO Date string YYYY-MM-DD
    onChange: (date: string) => void;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({ value, onChange }) => {
    const today = new Date();
    // Parse initial value or default to today
    const initialDate = value ? new Date(value) : today;

    // State for the currently displayed month/year
    const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
    const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

    // State for the selected date
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? initialDate : null);

    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setSelectedDate(date);
                // Only update view if the date is drastically different (optional, but good UX)
                // For now, let's keep the user's view unless they select something
            }
        }
    }, [value]);

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);
        setSelectedDate(newDate);

        // Format to YYYY-MM-DD for parent
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const d = String(newDate.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${d}`);
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
        }

        // Days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const isSelected = selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

            // Check if date is in the past (compare with today at 00:00:00)
            const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isPast = date < todayZero;

            days.push(
                <button
                    key={day}
                    disabled={isPast}
                    onClick={(e) => {
                        e.preventDefault(); // Prevent form submission if inside a form
                        if (!isPast) handleDateClick(day);
                    }}
                    className={`
            h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
            ${isSelected
                            ? 'bg-black text-white shadow-md transform scale-105'
                            : isPast
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-100'
                        }
            ${!isSelected && isToday ? 'border border-black font-bold' : ''}
          `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="w-full max-w-sm mx-auto bg-white rounded-xl border border-gray-200 p-4 shadow-sm select-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={(e) => { e.preventDefault(); handlePrevMonth(); }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} className="text-black" />
                </button>
                <h3 className="text-lg font-bold text-black">
                    {MONTHS[currentMonth]} {currentYear}
                </h3>
                <button
                    onClick={(e) => { e.preventDefault(); handleNextMonth(); }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronRight size={20} className="text-black" />
                </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 mb-2">
                {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="h-10 flex items-center justify-center text-xs font-semibold text-gray-400">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {renderCalendarDays()}
            </div>
        </div>
    );
};

export default CalendarDatePicker;
