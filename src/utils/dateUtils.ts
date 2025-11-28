export const parseRideDate = (dateStr: string, timeStr: string): Date => {
    try {
        // Handle time format (e.g., "3:00 PM" -> "15:00")
        let time = timeStr;
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
            const [timePart, modifier] = timeStr.split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        return new Date(`${dateStr}T${time}:00`);
    } catch (e) {
        console.error('Error parsing date:', dateStr, timeStr, e);
        return new Date(); // Fallback to now
    }
};
