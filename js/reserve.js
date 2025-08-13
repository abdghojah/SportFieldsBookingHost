import { supabase, SPORTS, formatPrice, formatTime, isValidJordanianPhone, showElement, hideElement, showError, formatJordanianPhone, showMessageBox, showLoading, hideLoading } from './main.js';
import { getLocalizedDistrict } from './districts.js';
import i18next from './translations.js';
import { updateNavigationVisibility } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize navigation visibility
  await updateNavigationVisibility();
  
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
  const reservationError = document.getElementById('reservation-error');
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
    showLoading();
    showTimeInfo(reservationDateInput.value);
    hideLoading();
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
      showLoading();
      // Login player
      const formattedPhone = formatJordanianPhone(phone);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password
      });

      if (error) throw error;

      // Verify user is a player
      const userResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-role`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
        },
      });

      if (!userResponse.ok) {
        await supabase.auth.signOut();
        throw new Error('Failed to verify user role');
      }

      const userData = await userResponse.json();

      if (userData.role !== 'player') {
        await supabase.auth.signOut();
        throw new Error('Only players can make reservations');
      }

      // Create reservation
      await createReservation(data.session.access_token);
      hideLoading();
    } catch (error) {
      hideLoading();
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
      showMessageBox('Error', 'Failed to load field data. Please try again.', 'error');
    }
  }
  
  function updateFieldUI(field) {
    // Get current language for district localization
    const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
    // Set basic field info
    fieldNameElement.textContent = field.name;
    placeNameElement.textContent = field.places.name;
    sportTypeElement.textContent = i18next.t(`sports.${field.sport_type}`);
    
    // Display localized district name
    const localizedDistrict = getLocalizedDistrict(field.city, field.district, currentLanguage);
    cityElement.textContent = i18next.t(`cities.${field.city.toLowerCase()}`) + ` - ${localizedDistrict}`;
    
    priceElement.textContent = `${formatPrice(field.price_per_hour)}${i18next.t('field.pricePerHour')}`;
    minTimeElement.textContent = `${field.min_booking_time} ${i18next.t('views.hour')}`;
    minBookingTimeElement.textContent = `${field.min_booking_time} ${i18next.t('views.hour')}`;
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
        timePatternInfo.textContent = `${i18next.t('field.searchPatternEvery')} ${hours} ${i18next.t('field.searchPatterenHour')} ${i18next.t('field.startingFrom')} ${formatTime(start_time)}`;
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

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Get and display existing reservations
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reservations?field_id=${fieldId}&from_date=${dateString}&to_date=${dateString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
        reservationsInfo.textContent = i18next.t('reservation.noReservationsForDay');
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
      showMessageBox('Error', 'Failed to load time information. Please try again.', 'error');
    }
  }

  async function validateTimeRange() {
    if (!timeFromInput.value || !timeToInput.value || !currentDate) return;
    
    const timeFrom = timeFromInput.value;
    const timeTo = timeToInput.value;
    
    // Clear any previous error messages and reservation form
    console.log('Starting validation for:', timeFrom, 'to', timeTo);
    if (reservationError) {
      reservationError.textContent = '';
      hideElement(reservationError);
      console.log('Cleared previous error');
    }
    hideElement(reservationFormContainer);
    
    try {
      showLoading();
      // Validate date and time are not in the past
      const fromDate = new Date(`${currentDate}T${timeFrom}`);
      const toDate = new Date(`${currentDate}T${timeTo}`);
      const now = new Date();
      
      if (fromDate < now) {
        hideLoading();
        reservationError.textContent = i18next.t('common.error.pastTime');
        showElement(reservationError);
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
        hideLoading();
        const plural = fieldData.min_booking_time > 1 ? 's' : '';
        const errorMsg = i18next.t('common.error.tooShort', { 
          hours: fieldData.min_booking_time,
          plural: plural
        });
        console.log('Showing error:', errorMsg);
        if (reservationError) {
          reservationError.textContent = errorMsg;
          reservationError.style.display = 'block';
          showElement(reservationError);
          console.log('Error element updated');
        } else {
          console.error('reservationError element not found!');
        }
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
          hideLoading();
          const plural = hours > 1 ? 's' : '';
          const errorMsg = i18next.t('common.error.patternMismatch', {
            hours: hours,
            plural: plural,
            startTime: formatTime(start_time)
          });
          console.log('Showing pattern error:', errorMsg);
          if (reservationError) {
            reservationError.textContent = errorMsg;
            reservationError.style.display = 'block';
            showElement(reservationError);
          }
          return;
        }
        
        // Check if duration matches pattern
        const durationMinutes = toMinutes - fromMinutes;
        if (durationMinutes % patternMinutes !== 0) {
          hideLoading();
          const plural = hours > 1 ? 's' : '';
          const errorMsg = i18next.t('common.error.durationPattern', {
            hours: hours,
            plural: plural
          });
          console.log('Showing duration error:', errorMsg);
          if (reservationError) {
            reservationError.textContent = errorMsg;
            reservationError.style.display = 'block';
            showElement(reservationError);
          }
          return;
        }
      }
      
      // Check blocked times
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(currentDate).getDay()];
      const blockedForDay = fieldData.blocked_times?.filter(block => block.day === dayOfWeek) || [];
      
      for (const block of blockedForDay) {
        if (hasTimeConflict(timeFrom, timeTo, block.from, block.to)) {
          hideLoading();
          const errorMsg = i18next.t('common.error.blockedTime', {
            from: formatTime(block.from),
            to: formatTime(block.to)
          });
          console.log('Showing blocked time error:', errorMsg);
          if (reservationError) {
            reservationError.textContent = errorMsg;
            reservationError.style.display = 'block';
            showElement(reservationError);
          }
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Check existing reservations
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reservations?field_id=${fieldId}&from_date=${currentDate}&to_date=${currentDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
            hideLoading();
            const errorMsg = i18next.t('common.error.alreadyBooked', {
              from: formatTime(reservation.time_from),
              to: formatTime(reservation.time_to)
            });
            console.log('Showing conflict error:', errorMsg);
            if (reservationError) {
              reservationError.textContent = errorMsg;
              reservationError.style.display = 'block';
              showElement(reservationError);
            }
            return;
          }
        }
      }
      
      // All validations passed, show reservation form
      selectedTimeSlot = { from: timeFrom, to: timeTo };
      
      // Calculate total price with adjusted duration
      let totalPrice = calculateTotalPrice(fieldData.price_per_hour, timeFrom, timeTo, currentDate, fieldData.discount_times);
      
      // Update selected slot info
      selectedSlotText.textContent = `${formatTime(timeFrom)} - ${formatTime(timeTo)}`;
      selectedSlotPrice.innerHTML = `<span data-i18n="reservation.totalLabel">${i18next.t('reservation.totalLabel')}</span> : ${formatPrice(totalPrice)}`;

      hideLoading();
      showElement(reservationFormContainer);
      
    } catch (error) {
      hideLoading();
      console.error('Error validating time range:', error);
      const errorMsg = i18next.t('common.error.checkAvailability');
      console.log('Showing general error:', errorMsg);
      if (reservationError) {
        reservationError.textContent = errorMsg;
        reservationError.style.display = 'block';
        showElement(reservationError);
      }
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
      
      // Update success message with fee information
      const successMessageElement = document.querySelector('#reservation-success p');
      if (successMessageElement && data.fee) {
        const feeAmount = parseFloat(data.fee).toFixed(3);
        successMessageElement.textContent = i18next.t('reservation.successMessageWithFee', { fee: feeAmount, currency: i18next.t('common.currency') });
      }
      
      showElement(reservationSuccess);
    } catch (error) {
      console.error('Error creating reservation:', error);
      showError('reservation-error', error.message || 'Failed to create reservation. Please try again.');
    }
  }

  function calculateTotalPrice(price_per_hour, time_from, time_to, date, discount_times) {
  const fromMinutes = timeToMinutes(time_from);
  let toMinutes = timeToMinutes(time_to);
  
  // Adjust for midnight spanning
  if (toMinutes <= fromMinutes) {
    toMinutes += 24 * 60;
  }
  
  const durationHours = (toMinutes - fromMinutes) / 60;
  let totalPrice = price_per_hour * durationHours;

  // Apply discount if applicable
  if (discount_times) {
    console.log("we have discount times !");
    const searchDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][searchDate.getDay()];
    
    // Check if the entire reservation time falls within any discount period
    for (const discount of discount_times) {
      if (discount.day === dayOfWeek) {
        console.log("we have day match !");
        const discountFromMinutes = timeToMinutes(discount.from);
        const discountToMinutes = timeToMinutes(discount.to);

        console.log("check discount match : reqFrom: " + time_from + " reqTo: " + time_to + " disFrom: " + discount.from + " disTo: " + discount.to);
        // Check if entire reservation is within discount period
        if (fromMinutes >= discountFromMinutes && toMinutes <= discountToMinutes) {
          console.log("discount calculated !");
          const discountAmount = totalPrice * (discount.percentage / 100);
          totalPrice = totalPrice - discountAmount;

          console.log("total after discount = " + totalPrice + " Discount value = " + discountAmount + "discount precentage = " + (discount.percentage / 100));
          break; // Apply only the first matching discount
        }
      }
    }
  }

  return totalPrice;
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