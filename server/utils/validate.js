// Validation utility functions

const validateEmail = (email) => {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return re.test(phone);
};

const validateRole = (role) => {
  return role === 'driver' || role === 'rider';
};

const validateRideInput = (data) => {
  const errors = [];

  if (!data.from || typeof data.from !== 'string' || data.from.trim().length === 0) {
    errors.push('From location is required');
  }

  if (!data.to || typeof data.to !== 'string' || data.to.trim().length === 0) {
    errors.push('To location is required');
  }

  if (!data.date || typeof data.date !== 'string' || data.date.trim().length === 0) {
    errors.push('Date is required');
  }

  if (!data.time || typeof data.time !== 'string' || data.time.trim().length === 0) {
    errors.push('Time is required');
  }

  if (data.price === undefined || data.price === null || isNaN(data.price) || data.price < 0) {
    errors.push('Valid price is required');
  }

  if (data.seatsAvailable === undefined || data.seatsAvailable === null || isNaN(data.seatsAvailable) || data.seatsAvailable < 1) {
    errors.push('Seats available must be at least 1');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateBookingInput = (data) => {
  const errors = [];

  if (!data.ride || typeof data.ride !== 'string') {
    errors.push('Ride ID is required');
  }

  if (data.seatsBooked === undefined || data.seatsBooked === null || isNaN(data.seatsBooked) || data.seatsBooked < 1) {
    errors.push('Seats booked must be at least 1');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validatePhone,
  validateRole,
  validateRideInput,
  validateBookingInput,
};

