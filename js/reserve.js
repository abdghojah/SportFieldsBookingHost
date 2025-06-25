import { supabase, SPORTS, formatPrice, formatTime, isValidJordanianPhone, showElement, hideElement, showError, formatJordanianPhone } from './main.js';
import { getLocalizedDistrict } from './districts.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const fieldId = params.get('id');
  const selectedDate = params.get('date');
  const selectedTimeFrom = params.get('timeFrom');
  const selectedTimeTo = params.get('timeTo');
  
  if (!fieldId) {
    window.location.href = '/';
    return;
  }
  
  // Select DOM elements
  const fieldNameElement = document.getElementById('field-name');
  const placeNameElement = document.getElementById('place-name');
  const sportTypeElement = document.getElementById('sport-type');
  const cityElement = document.getElementById('city');
  const priceElement = document.getElementById('price');
  const minTimeElement = document.getElementById('min-time');
  const minBookingTimeElement = document.getElementById('min-booking-time');
  const includedServicesElement = document.getElementById('included-services');
  const fieldImageMain = document.getElementById('field-image-main');
  const fieldImageThumbnails = document.getElementById('field-image-thumbnails');
  const mapElement = document.getElementById('map');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const timeInfoContainer = document.getElementById('time-info-container');
  const timePatternInfoItem = document.getElementById('time-pattern-info-item');
  const timePatternInfo = document.getElementById('time-pattern-info');
  const blockedTimesInfoItem = document.getElementById('blocked-times-info-item');
  const blockedTimesInfo = document.getElementById('blocked-times-info');
  const reservationsInfo = document.getElementById('reservations-info');
  const timeFromInput = document.getElementById('time-from');
  const timeToInput = document.getElementById('time-to');
  const selectedSlotInfo = document.getElementById('selected-slot-info');
  const selectedSlotText = document.getElementById('selected-slot-text');
  const selectedSlotPrice = document.getElementById('selected-slot-price');
  const reservationFormContainer = document.getElementById('reservation-form-container');
  const loginForm = document.getElementById('login-form');
  const reservationSuccess = document.getElementById('reservation-success');
  const reservationId = document.getElementById('reservation-id');
  const reservationDateInput = document.getElementById('reservation-date');
  
  // State variables
  let fieldData = null;
  let map = null;
  let marker = null;
  let selectedTimeSlot = null;
  let currentDate = null;
  
  // Initialize
  await loadFieldData();
  
  // Event Listeners
  
  // Date selection
  reservationDateInput.addEventListener('change', () => {
    showTimeInfo(reservationDateInput.value);
  });
  
  // Time range selection
  timeFromInput.addEventListener('change', validateTimeRange);
  timeToInput.addEventListener('change', validateTimeRange);
  
  // Player login for reservation
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Validate inputs
    if (!isValidJordanianPhone(phone)) {
      showError('reservation-error', 'Please enter a valid Jordanian phone number (07xxxxxxxx)');
      return;
    }
    
    if (!password) {
      showError('reservation-error', 'Please enter your password');
      return;
    }
    
    try {
      // Login player
      const formattedPhone = formatJordanianPhone(phone);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password
      });

      if (error) throw error;

      // Verify user is a player
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', data.user.id)
        .single();

      if (userError || userData.role !== 'player') {
        await supabase.auth.signOut();
        throw new Error('Only players can make reservations');
      }

      // Create reservation
      await createReservation(data.session.access_token);
    } catch (error) {
      console.error('Error during login/reservation:', error);
      showError('reservation-error', error.message || 'Failed to login or create reservation');
    }
  });
  
  // Functions
  
  async function loadFieldData() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/field?id=${fieldId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load field data');
      }

      const field = await response.json();
      
      // Store field data
      fieldData = field;
      
      // Update UI with field details
      updateFieldUI(field);
      
      // Initialize map
      initMap(field);
      
      // Set up date picker
      const today = new Date().toISOString().split('T')[0];
      reservationDateInput.min = today;
      
      if (selectedDate) {
        // If date was provided in URL, show time info directly
        reservationDateInput.value = selectedDate;
        await showTimeInfo(selectedDate);
        
        if (selectedTimeFrom && selectedTimeTo) {
          // Set the time range if provided in URL
          timeFromInput.value = selectedTimeFrom;
          timeToInput.value = selectedTimeTo;
          validateTimeRange();
        }
      } else {
        // Set today's date and show time info
        reservationDateInput.value = today;
        await showTimeInfo(today);
      }
    } catch (error) {
      console.error('Error loading field data:', error);
      alert('Failed to load field data. Please try again.');
    }
  }
  
  function updateFieldUI(field) {
    // Get current language for district localization
    const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
    // Set basic field info
    fieldNameElement.textContent = field.name;
    placeNameElement.textContent = field.places.name;
    sportTypeElement.textContent = SPORTS[field.sport_type];
    
    // Display localized district name
    const localizedDistrict = getLocalizedDistrict(field.city, field.district, currentLanguage);
    cityElement.textContent = `${field.city} - ${localizedDistrict}`;
    
    priceElement.textContent = `${formatPrice(field.price_per_hour)} per hour`;
    minTimeElement.textContent = `${field.min_booking_time} hour${field.min_booking_time > 1 ? 's' : ''}`;
    minBookingTimeElement.textContent = `${field.min_booking_time} hour${field.min_booking_time > 1 ? 's' : ''}`;
    includedServicesElement.textContent = field.included_services || 'None';
    
    // Set field images
    setFieldImages(field);
  }
  
  function setFieldImages(field) {
    // Default image if none provided
    const defaultImage = 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
    
    // Set main image
    if (field.images && field.images.length > 0) {
      fieldImageMain.style.backgroundImage = `url('${field.images[0]}')`;
      
      // Set thumbnails
      fieldImageThumbnails.innerHTML = '';
      
      field.images.forEach((imageUrl, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `field-image-thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.style.backgroundImage = `url('${imageUrl}')`;
        
        thumbnail.addEventListener('click', () => {
          // Update main image
          fieldImageMain.style.backgroundImage = `url('${imageUrl}')`;
          
          // Update active thumbnail
          document.querySelectorAll('.field-image-thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
          });
          thumbnail.classList.add('active');
        });
        
        fieldImageThumbnails.appendChild(thumbnail);
      });
    } else {
      fieldImageMain.style.backgroundImage = `url('${defaultImage}')`;
      fieldImageThumbnails.innerHTML = '';
    }
  }
  
  function initMap(field) {
    // Initialize the map
    if (field.latitude && field.longitude) {
      map = L.map(mapElement).setView([field.latitude, field.longitude], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add a marker
      marker = L.marker([field.latitude, field.longitude]).addTo(map);

      // Add click handler to open Google Maps
      mapElement.addEventListener('click', (e) => {
        e.preventDefault();
        const googleMapsUrl = `https://www.google.com/maps?q=${field.latitude},${field.longitude}`;
        window.open(googleMapsUrl, '_blank');
      });

      // Change cursor to pointer to indicate clickability
      mapElement.style.cursor = 'pointer';
      
      // Set form values
      latitudeInput.value = field.latitude;
      longitudeInput.value = field.longitude;
    } else {
      // Use default location (Amman, Jordan)
      map = L.map(mapElement).setView([31.9539, 35.9106], 10);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
    }
    
    // Refresh map size after rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }
  
  async function showTimeInfo(dateString) {
    try {
      currentDate = dateString;
      
      // Show time info container
      showElement(timeInfoContainer);
      
      // Display time pattern info only if it exists
      if (fieldData.time_pattern) {
        const { hours, start_time } = fieldData.time_pattern;
        timePatternInfo.textContent = `Every ${hours} hour${hours > 1 ? 's' : ''} starting from ${formatTime(start_time)}`;
        showElement(timePatternInfoItem);
      } else {
        hideElement(timePatternInfoItem);
      }
      
      // Display blocked times info only if there are blocked times for this day
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(dateString).getDay()];
      const blockedForDay = fieldData.blocked_times?.filter(block => block.day === dayOfWeek) || [];
      
      if (blockedForDay.length > 0) {
        blockedTimesInfo.innerHTML = blockedForDay.map(block => 
          `<div class="time-block">${formatTime(block.from)} - ${formatTime(block.to)}</div>`
        ).join('');
        showElement(blockedTimesInfoItem);
      } else {
        hideElement(blockedTimesInfoItem);
      }
      
      // Get and display existing reservations
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reservations?field_id=${fieldId}&from_date=${dateString}&to_date=${dateString}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch reservations');
      }

      const reservations = await response.json();
      
      if (reservations && reservations.length > 0) {
        reservationsInfo.innerHTML = reservations.map(reservation => 
          `<div class="time-block">${formatTime(reservation.time_from)} - ${formatTime(reservation.time_to)}</div>`
        ).join('');
      } else {
        reservationsInfo.textContent = 'No reservations for this day';
      }
      
      // Reset time inputs
      timeFromInput.value = '';
      timeToInput.value = '';
      hideElement(reservationFormContainer);

      // Set minimum time if date is today
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      if (dateString === todayString) {
        const currentHour = today.getHours().toString().padStart(2, '0');
        const currentMinute = today.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;
        timeFromInput.min = currentTime;
        timeToInput.min = currentTime;
      } else {
        timeFromInput.removeAttribute('min');
        timeToInput.removeAttribute('min');
      }
      
    } catch (error) {
      console.error('Error showing time info:', error);
      alert('Failed to load time information. Please try again.');
    }
  }

  async function validateTimeRange() {
    if (!timeFromInput.value || !timeToInput.value || !currentDate) return;
    
    const timeFrom = timeFromInput.value;
    const timeTo = timeToInput.value;
    
    try {
      // Validate date and time are not in the past
      const fromDate = new Date(`${currentDate}T${timeFrom}`);
      const toDate = new Date(`${currentDate}T${timeTo}`);
      const now = new Date();
      
      if (fromDate < now) {
        showError('reservation-error', 'Cannot book time slots in the past');
        return;
      }
      
      // Calculate duration in hours
      const fromMinutes = timeToMinutes(timeFrom);
      let toMinutes = timeToMinutes(timeTo);
      
      // Adjust for midnight spanning
      if (toMinutes <= fromMinutes) {
        toMinutes += 24 * 60; // Add 24 hours worth of minutes
      }
      
      const durationHours = (toMinutes - fromMinutes) / 60;
      
      // Check minimum booking time
      if (durationHours < fieldData.min_booking_time) {
        showError('reservation-error', `Minimum booking time is ${fieldData.min_booking_time} hour${fieldData.min_booking_time > 1 ? 's' : ''}`);
        return;
      }
      
      // Check time pattern if exists
      if (fieldData.time_pattern) {
        const { hours, start_time } = fieldData.time_pattern;
        const startTimeMinutes = timeToMinutes(start_time);
        const patternMinutes = hours * 60;
        
        // Check if start time matches pattern
        const minutesSinceStart = (fromMinutes - startTimeMinutes) % patternMinutes;
        if (minutesSinceStart !== 0) {
          showError('reservation-error', `Start time must match the pattern: every ${hours} hour${hours > 1 ? 's' : ''} from ${formatTime(start_time)}`);
          return;
        }
        
        // Check if duration matches pattern
        const durationMinutes = toMinutes - fromMinutes;
        if (durationMinutes % patternMinutes !== 0) {
          showError('reservation-error', `Duration must be a multiple of ${hours} hour${hours > 1 ? 's' : ''}`);
          return;
        }
      }
      
      // Check blocked times
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(currentDate).getDay()];
      const blockedForDay = fieldData.blocked_times?.filter(block => block.day === dayOfWeek) || [];
      
      for (const block of blockedForDay) {
        if (hasTimeConflict(timeFrom, timeTo, block.from, block.to)) {
          showError('reservation-error', `Selected time conflicts with blocked time: ${formatTime(block.from)} - ${formatTime(block.to)}`);
          return;
        }
      }
      
      // Check existing reservations
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reservations?field_id=${fieldId}&from_date=${currentDate}&to_date=${currentDate}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch reservations');
      }

      const reservations = await response.json();
      
      if (reservations) {
        for (const reservation of reservations) {
          if (hasTimeConflict(timeFrom, timeTo, reservation.time_from, reservation.time_to)) {
            showError('reservation-error', `Selected time conflicts with existing reservation: ${formatTime(reservation.time_from)} - ${formatTime(reservation.time_to)}`);
            return;
          }
        }
      }
      
      // All validations passed, show reservation form
      selectedTimeSlot = { from: timeFrom, to: timeTo };
      
      // Calculate total price with adjusted duration
      const totalPrice = fieldData.price_per_hour * durationHours;
      
      // Update selected slot info
      selectedSlotText.textContent = `${formatTime(timeFrom)} - ${formatTime(timeTo)}`;
      selectedSlotPrice.textContent = `Total: ${formatPrice(totalPrice)}`;
      
      showElement(reservationFormContainer);
      
    } catch (error) {
      console.error('Error validating time range:', error);
      showError('reservation-error', 'Failed to validate time range. Please try again.');
    }
  }
  
  async function createReservation(accessToken) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/player-reservation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldId,
          date: currentDate,
          timeFrom: selectedTimeSlot.from,
          timeTo: selectedTimeSlot.to
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create reservation');
      }

      const data = await response.json();
      
      // Show success message
      hideElement(loginForm);
      reservationId.textContent = data.id;
      showElement(reservationSuccess);
    } catch (error) {
      console.error('Error creating reservation:', error);
      showError('reservation-error', error.message || 'Failed to create reservation. Please try again.');
    }
  }
  
  function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  function hasTimeConflict(requestFrom, requestTo, existingFrom, existingTo) {
    const requestFromMinutes = timeToMinutes(requestFrom);
    const requestToMinutes = timeToMinutes(requestTo);
    const existingFromMinutes = timeToMinutes(existingFrom);
    const existingToMinutes = timeToMinutes(existingTo);

    // Handle midnight spanning for both time slots
    const adjustedRequestTo = requestToMinutes <= requestFromMinutes ? requestToMinutes + 24 * 60 : requestToMinutes;
    const adjustedExistingTo = existingToMinutes <= existingFromMinutes ? existingToMinutes + 24 * 60 : existingToMinutes;

    // Check for overlap, excluding exactly consecutive slots
    return (
      (requestFromMinutes < adjustedExistingTo && adjustedRequestTo > existingFromMinutes) &&
      !(requestFromMinutes === existingToMinutes || adjustedRequestTo === existingFromMinutes)
    );
  }
});