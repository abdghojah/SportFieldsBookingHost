import { supabase, SPORTS, checkAuth, showElement, hideElement, showMessageBox, populateDistricts } from './main.js';
import { getDistrictsForCity, getEnglishDistrict, getLocalizedDistrict } from './districts.js';
import { v4 as uuidv4 } from 'uuid';
import i18next from './translations.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const session = await checkAuth();
  if (!session) return;
  
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const placeId = params.get('place_id');
  const fieldId = params.get('field_id');
  console.log("field id : " + fieldId);
  console.log("place id : " + placeId);
  
  if (!placeId) {
    window.location.href = '/place-fields.html';
    return;
  }
  
  // Select DOM elements
  const protectedContent = document.querySelector('.protected-content');
  const formTitle = document.getElementById('form-title');
  const fieldForm = document.getElementById('field-form');
  const saveBtn = document.getElementById('save-btn');
  const viewReservationsBtn = document.getElementById('view-reservations-btn');
  const deleteFieldBtn = document.getElementById('delete-field-btn');
  const deleteConfirmation = document.getElementById('delete-confirmation');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const addTimeBlockBtn = document.getElementById('add-time-block');
  const timeBlocksContainer = document.getElementById('time-blocks-container');
  const addDiscountBlockBtn = document.getElementById('add-discount-block');
  const discountBlocksContainer = document.getElementById('discount-blocks-container');
  const mapElement = document.getElementById('map');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const imagePreviewElement = document.getElementById('image-preview');
  const sportTypeSelect = document.getElementById('sport-type');
  const citySelect = document.getElementById('city');
  const districtSelect = document.getElementById('district');
  const fieldTypeSelect = document.getElementById('field-type');
  
  // Map setup
  let map = null;
  let marker = null;
  const defaultLocation = [31.9539, 35.9106]; // Amman, Jordan
  
  // Initialize mode (create or update)
  const isUpdateMode = !!fieldId;
  let fieldData = null;
  let uploadedImages = [];
  
  // Show the protected content
  showElement(protectedContent);
  
  // Listen for language changes to update the title
  document.addEventListener('languageChanged', () => {
    updateTranslations();
  });
  
  // Configure form based on mode
  if (isUpdateMode) {
    formTitle.setAttribute('data-i18n', 'field.updateFieldTitle');
    saveBtn.textContent = 'Save';
    showElement(viewReservationsBtn);
    showElement(deleteFieldBtn);
    
    // Load field data
    await loadFieldData();
  } else {
    formTitle.setAttribute('data-i18n', 'field.addFieldTitle');
    saveBtn.textContent = 'Save';
    hideElement(viewReservationsBtn);
    hideElement(deleteFieldBtn);
  }
  
  // Update translations after setting the data-i18n attributes
  updateTranslations();
  
  // Initialize map after field data is loaded
  initMap();
  
  // Initialize remove time block listeners
  attachRemoveTimeBlockListeners();
  attachRemoveDiscountBlockListeners();
  
  // City change handler for districts
  citySelect.addEventListener('change', (e) => {
    const selectedCity = e.target.value;
    populateDistricts(selectedCity, districtSelect);
  });
  
  // Event Listeners
  
  // Delete field
  deleteFieldBtn.addEventListener('click', () => {
    showElement(deleteConfirmation);
  });
  
  confirmDeleteBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fields?place_id=${placeId}&field_id=${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete field');
      }

      showMessageBox('Success', 'Field deleted successfully!', 'success', () => {
        window.location.href = '/place-fields.html';
      });
    } catch (error) {
      console.error('Error deleting field:', error);
      showMessageBox('Error', 'Failed to delete field. Please try again.', 'error');
    } finally {
      hideElement(deleteConfirmation);
    }
  });
  
  cancelDeleteBtn.addEventListener('click', () => {
    hideElement(deleteConfirmation);
  });
  
  // Add time block
  addTimeBlockBtn.addEventListener('click', () => {
    addTimeBlockRow();
    updateTranslations();
  });
  
  // Add discount block
  addDiscountBlockBtn.addEventListener('click', () => {
    addDiscountBlockRow();
    updateTranslations();
  });
  
  // View reservations
  viewReservationsBtn.addEventListener('click', () => {
    window.location.href = `/field-reservations.html?field_id=${fieldId}&place_id=${placeId}`;
  });
  
  // Handle image uploads
  document.getElementById('field-images').addEventListener('change', handleImageUpload);
  
  // Form submission
  fieldForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Get form data
    const formData = getFormData();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fields?place_id=${placeId}${fieldId ? `&field_id=${fieldId}` : ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save field');
      }

      const data = await response.json();

      if (isUpdateMode) {
        showMessageBox('Success', 'Field updated successfully!', 'success');
        fieldData = data;
      } else {
        showMessageBox('Success', 'Field created successfully!', 'success', () => {
          window.location.href = '/place-fields.html';
        });
      }
    } catch (error) {
      console.error('Error saving field:', error);
      showMessageBox('Error', error.message || 'Failed to save field. Please try again.', 'error');
    }
  });
  
  // Functions

  // Import updateTranslations function from main.js
  function updateTranslations() {
    console.log("updateTranslations");
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const options = element.getAttribute('data-i18n-options');
      
      // Handle array access for nested translations
      if (key.includes('.items.')) {
        const [baseKey, itemIndex] = key.split('.items.');
        const items = i18next.t(baseKey + '.items', { returnObjects: true });
        if (Array.isArray(items) && items[itemIndex]) {
          element.textContent = items[itemIndex];
        }
      } else {
        element.textContent = i18next.t(key, options ? JSON.parse(options) : undefined);
      }
    });
  }

  async function loadFieldData() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fields?place_id=${placeId}&field_id=${fieldId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load field data');
      }

      const fields = await response.json();
      fieldData = fields[0];

      // Fill form with field data
      document.getElementById('field-name').value = fieldData.name;
      document.getElementById('sport-type').value = fieldData.sport_type;
      document.getElementById('field-type').value = fieldData.field_type || 'outdoor';
      document.getElementById('included-services').value = fieldData.included_services || '';
      document.getElementById('city').value = fieldData.city;
      document.getElementById('price').value = fieldData.price_per_hour;
      document.getElementById('min-time').value = fieldData.min_booking_time;
      
      // Populate districts and set district value
      populateDistricts(fieldData.city, districtSelect);
      if (fieldData.district) {
        // The district in the database is already in English, so we can set it directly
        document.getElementById('district').value = fieldData.district;
        console.log("district selected");
      }
      
      // Set time pattern if exists
      if (fieldData.time_pattern) {
        document.getElementById('pattern-hours').value = fieldData.time_pattern.hours;
        document.getElementById('pattern-start').value = fieldData.time_pattern.start_time;
      }
      
      // Load blocked times
      if (fieldData.blocked_times && fieldData.blocked_times.length > 0) {
        // Clear default block
        timeBlocksContainer.innerHTML = '';
        
        // Add all blocked times
        fieldData.blocked_times.forEach((block, index) => {
          addTimeBlockRow(block.day, block.from, block.to);
        });
      }
      
      // Load discount times
      if (fieldData.discount_times && fieldData.discount_times.length > 0) {
        // Clear default block
        discountBlocksContainer.innerHTML = '';
        
        // Add all discount times
        fieldData.discount_times.forEach((discount, index) => {
          addDiscountBlockRow(discount.day, discount.from, discount.to, discount.percentage);
        });
      }
      
      // Display images if any
      if (fieldData.images && fieldData.images.length > 0) {
        uploadedImages = fieldData.images;
        displayImages(fieldData.images);
      }
    } catch (error) {
      console.error('Error loading field data:', error);
      showMessageBox('Error', 'Failed to load field data. Please try again.', 'error');
    }
  }
  
  function validateForm() {
    // Basic validation
    const requiredFields = [
      'field-name', 'sport-type', 'field-type', 'city', 'district', 'price', 'min-time', 'latitude', 'longitude'
    ];
    
    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field.value.trim()) {
        showMessageBox('Validation Error', `Please fill in the ${field.labels[0].textContent}`, 'error');
        field.focus();
        return false;
      }
    }
    
    // Validate price
    const price = parseFloat(document.getElementById('price').value);
    if (isNaN(price) || price <= 0) {
      showMessageBox('Validation Error', 'Please enter a valid price', 'error');
      document.getElementById('price').focus();
      return false;
    }
    
    // Validate min booking time
    const minTime = parseFloat(document.getElementById('min-time').value);
    if (isNaN(minTime) || minTime <= 0) {
      showMessageBox('Validation Error', 'Please enter a valid minimum booking time', 'error');
      document.getElementById('min-time').focus();
      return false;
    }
    
    // Validate time pattern if provided
    const patternHours = document.getElementById('pattern-hours').value;
    const patternStart = document.getElementById('pattern-start').value;
    
    if (patternHours && !patternStart) {
      showMessageBox('Validation Error', 'Please provide a start time for the time pattern', 'error');
      document.getElementById('pattern-start').focus();
      return false;
    }
    
    if (!patternHours && patternStart) {
      showMessageBox('Validation Error', 'Please provide interval hours for the time pattern', 'error');
      document.getElementById('pattern-hours').focus();
      return false;
    }
    
    // Validate time blocks if any are filled
    const daySelects = document.querySelectorAll('[name="blockDay[]"]');
    const timeFromInputs = document.querySelectorAll('[name="blockFrom[]"]');
    const timeToInputs = document.querySelectorAll('[name="blockTo[]"]');
    
    for (let i = 0; i < daySelects.length; i++) {
      const day = daySelects[i].value;
      const from = timeFromInputs[i].value;
      const to = timeToInputs[i].value;
      
      // If any field in the block is filled, all fields must be filled
      if (day || from || to) {
        if (!day || !from || !to) {
          showMessageBox('Validation Error', 'Please fill in all fields for each time block', 'error');
          return false;
        }
        
        if (from >= to) {
          showMessageBox('Validation Error', 'Start time must be before end time for all time blocks', 'error');
          return false;
        }
      }
    }
    
    // Validate discount blocks if any are filled
    const discountDaySelects = document.querySelectorAll('[name="discountDay[]"]');
    const discountTimeFromInputs = document.querySelectorAll('[name="discountFrom[]"]');
    const discountTimeToInputs = document.querySelectorAll('[name="discountTo[]"]');
    const discountPercentageInputs = document.querySelectorAll('[name="discountPercentage[]"]');
    
    for (let i = 0; i < discountDaySelects.length; i++) {
      const day = discountDaySelects[i].value;
      const from = discountTimeFromInputs[i].value;
      const to = discountTimeToInputs[i].value;
      const percentage = discountPercentageInputs[i].value;
      
      // If any field in the discount block is filled, all fields must be filled
      if (day || from || to || percentage) {
        if (!day || !from || !to || !percentage) {
          showMessageBox('Validation Error', 'Please fill in all fields for each discount block', 'error');
          return false;
        }
        
        if (from >= to) {
          showMessageBox('Validation Error', 'Start time must be before end time for all discount blocks', 'error');
          return false;
        }
        
        const discountValue = parseInt(percentage);
        if (isNaN(discountValue) || discountValue < 1 || discountValue > 99) {
          showMessageBox('Validation Error', 'Discount percentage must be between 1 and 99', 'error');
          return false;
        }
      }
    }
    
    return true;
  }
  
  function getFormData() {
    // Get current language to convert district to English if needed
    const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
    const selectedCity = document.getElementById('city').value;
    const selectedDistrict = document.getElementById('district').value;
    
    // Convert district to English for database storage
    const englishDistrict = getEnglishDistrict(selectedCity, selectedDistrict, currentLanguage);
    
    const formData = {
      name: document.getElementById('field-name').value.trim(),
      sport_type: document.getElementById('sport-type').value,
      field_type: document.getElementById('field-type').value,
      included_services: document.getElementById('included-services').value.trim(),
      city: selectedCity,
      district: englishDistrict, // Always save English district
      price_per_hour: parseFloat(document.getElementById('price').value),
      min_booking_time: parseFloat(document.getElementById('min-time').value),
      latitude: parseFloat(document.getElementById('latitude').value),
      longitude: parseFloat(document.getElementById('longitude').value),
      is_active: true,
      images: uploadedImages
    };
    
    // Time pattern
    const patternHours = document.getElementById('pattern-hours').value;
    const patternStart = document.getElementById('pattern-start').value;
    
    if (patternHours && patternStart) {
      formData.time_pattern = {
        hours: parseFloat(patternHours),
        start_time: patternStart
      };
    } else {
      formData.time_pattern = null;
    }
    
    // Blocked times
    const daySelects = document.querySelectorAll('[name="blockDay[]"]');
    const timeFromInputs = document.querySelectorAll('[name="blockFrom[]"]');
    const timeToInputs = document.querySelectorAll('[name="blockTo[]"]');
    
    const blockedTimes = [];
    
    for (let i = 0; i < daySelects.length; i++) {
      const day = daySelects[i].value;
      const from = timeFromInputs[i].value;
      const to = timeToInputs[i].value;
      
      // Only include complete time blocks
      if (day && from && to) {
        blockedTimes.push({
          day,
          from,
          to
        });
      }
    }
    
    formData.blocked_times = blockedTimes;
    
    // Discount times
    const discountDaySelects = document.querySelectorAll('[name="discountDay[]"]');
    const discountTimeFromInputs = document.querySelectorAll('[name="discountFrom[]"]');
    const discountTimeToInputs = document.querySelectorAll('[name="discountTo[]"]');
    const discountPercentageInputs = document.querySelectorAll('[name="discountPercentage[]"]');
    
    const discountTimes = [];
    
    for (let i = 0; i < discountDaySelects.length; i++) {
      const day = discountDaySelects[i].value;
      const from = discountTimeFromInputs[i].value;
      const to = discountTimeToInputs[i].value;
      const percentage = discountPercentageInputs[i].value;
      
      // Only include complete discount blocks
      if (day && from && to && percentage) {
        discountTimes.push({
          day,
          from,
          to,
          percentage: parseInt(percentage)
        });
      }
    }
    
    formData.discount_times = discountTimes;
    
    return formData;
  }
  
  function attachRemoveTimeBlockListeners() {
    const removeButtons = document.querySelectorAll('.remove-time-block');
    removeButtons.forEach(btn => {
      // Remove existing listeners to prevent duplicates
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add new listener
      newBtn.addEventListener('click', function() {
        this.closest('.time-block').remove();
      });
    });
  }
  
  function attachRemoveDiscountBlockListeners() {
    const removeButtons = document.querySelectorAll('.remove-discount-block');
    removeButtons.forEach(btn => {
      // Remove existing listeners to prevent duplicates
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add new listener
      newBtn.addEventListener('click', function() {
        this.closest('.discount-block').remove();
      });
    });
  }
  
  async function handleImageUpload(event) {
    const files = event.target.files;
    
    if (!files || files.length === 0) return;
    
    // Validate file count
    if (files.length > 5) {
      showMessageBox('Upload Error', 'You can only upload up to 5 images', 'error');
      event.target.value = '';
      return;
    }
    
    // Validate file sizes and types
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        showMessageBox('Upload Error', `File ${file.name} exceeds the 2MB size limit`, 'error');
        event.target.value = '';
        return;
      }
      
      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        showMessageBox('Upload Error', `File ${file.name} is not a supported image type (JPG/PNG only)`, 'error');
        event.target.value = '';
        return;
      }
    }
    
    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.textContent = 'Uploading images...';
      
      // Upload images using Edge Function
      const urls = await uploadImages(files);
      
      // Store uploaded image URLs
      uploadedImages = urls;
      
      // Display image previews
      displayImages(urls);
      
      // Reset form input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading images:', error);
      showMessageBox('Upload Error', 'Failed to upload images. Please try again.', 'error');
    } finally {
      // Reset button state
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  }

  async function uploadImages(files) {
    const urls = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      const { url } = await response.json();
      urls.push(url);
    }
    
    return urls;
  }
  
  function displayImages(urls) {
    imagePreviewElement.innerHTML = '';
    
    urls.forEach(url => {
      const previewItem = document.createElement('div');
      previewItem.className = 'image-preview-item';
      previewItem.style.backgroundImage = `url('${url}')`;
      
      const removeBtn = document.createElement('div');
      removeBtn.className = 'image-preview-remove';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = function() {
        const index = uploadedImages.indexOf(url);
        if (index > -1) {
          uploadedImages.splice(index, 1);
        }
        previewItem.remove();
      };
      
      previewItem.appendChild(removeBtn);
      imagePreviewElement.appendChild(previewItem);
    });
  }
  
  function initMap() {
    if (!mapElement) return;
    
    // Initialize the map
    map = L.map(mapElement);
    
    // Use satellite tile layer instead of OpenStreetMap
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);
    
    if (fieldData && fieldData.latitude && fieldData.longitude) {
      // Use field's location
      const location = [fieldData.latitude, fieldData.longitude];
      map.setView(location, 15);
      marker = L.marker(location, { draggable: true }).addTo(map);
      
      // Set form values
      latitudeInput.value = fieldData.latitude;
      longitudeInput.value = fieldData.longitude;
    } else {
      // Use default location
      map.setView(defaultLocation, 10);
      marker = L.marker(defaultLocation, { draggable: true }).addTo(map);
      
      // Set initial coordinates
      latitudeInput.value = defaultLocation[0];
      longitudeInput.value = defaultLocation[1];
    }
    
    // Update coordinates when marker is moved
    marker.on('dragend', function(e) {
      const position = marker.getLatLng();
      latitudeInput.value = position.lat;
      longitudeInput.value = position.lng;
    });
    
    // Update marker position on map click
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      latitudeInput.value = e.latlng.lat;
      longitudeInput.value = e.latlng.lng;
    });
    
    // Refresh map size after rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }
  
  function addTimeBlockRow(day = 'monday', timeFrom = '', timeTo = '') {
    const blockIndex = document.querySelectorAll('.time-block').length;
    
    const timeBlock = document.createElement('div');
    timeBlock.className = 'time-block';
    
    timeBlock.innerHTML = `
      <div class="day-select">
        <label for="block-day-${blockIndex}" data-i18n="common.day">Day</label>
        <select id="block-day-${blockIndex}" name="blockDay[]">
          <option value="monday" ${day === 'monday' ? 'selected' : ''} data-i18n="days.monday">Monday</option>
          <option value="tuesday" ${day === 'tuesday' ? 'selected' : ''} data-i18n="days.tuesday">Tuesday</option>
          <option value="wednesday" ${day === 'wednesday' ? 'selected' : ''} data-i18n="days.wednesday">Wednesday</option>
          <option value="thursday" ${day === 'thursday' ? 'selected' : ''} data-i18n="days.thursday">Thursday</option>
          <option value="friday" ${day === 'friday' ? 'selected' : ''} data-i18n="days.friday">Friday</option>
          <option value="saturday" ${day === 'saturday' ? 'selected' : ''} data-i18n="days.saturday">Saturday</option>
          <option value="sunday" ${day === 'sunday' ? 'selected' : ''} data-i18n="days.sunday">Sunday</option>
        </select>
      </div>
      <div class="time-range">
        <label data-i18n="common.time">Time</label>
        <div class="time-inputs">
          <div class="time-input-group">
            <label for="block-from-${blockIndex}" data-i18n="common.timeFrom">From</label>
            <input type="time" id="block-from-${blockIndex}" name="blockFrom[]" value="${timeFrom}">
          </div>
          <span class="time-separator" data-i18n="common.to">to</span>
          <div class="time-input-group">
            <label for="block-to-${blockIndex}" data-i18n="common.timeTo">To</label>
            <input type="time" id="block-to-${blockIndex}" name="blockTo[]" value="${timeTo}">
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-icon remove-time-block">
        <i class="icon-delete"></i>
      </button>
    `;
    
    timeBlocksContainer.appendChild(timeBlock);
    
    // Attach remove button listener
    attachRemoveTimeBlockListeners();
  }
  
  function addDiscountBlockRow(day = 'monday', timeFrom = '', timeTo = '', percentage = '') {
    const blockIndex = document.querySelectorAll('.discount-block').length;
    
    const discountBlock = document.createElement('div');
    discountBlock.className = 'discount-block';
    
    discountBlock.innerHTML = `
      <div class="day-select">
        <label for="discount-day-${blockIndex}" data-i18n="common.day">Day</label>
        <select id="discount-day-${blockIndex}" name="discountDay[]">
          <option value="monday" ${day === 'monday' ? 'selected' : ''} data-i18n="days.monday">Monday</option>
          <option value="tuesday" ${day === 'tuesday' ? 'selected' : ''} data-i18n="days.tuesday">Tuesday</option>
          <option value="wednesday" ${day === 'wednesday' ? 'selected' : ''} data-i18n="days.wednesday">Wednesday</option>
          <option value="thursday" ${day === 'thursday' ? 'selected' : ''} data-i18n="days.thursday">Thursday</option>
          <option value="friday" ${day === 'friday' ? 'selected' : ''} data-i18n="days.friday">Friday</option>
          <option value="saturday" ${day === 'saturday' ? 'selected' : ''} data-i18n="days.saturday">Saturday</option>
          <option value="sunday" ${day === 'sunday' ? 'selected' : ''} data-i18n="days.sunday">Sunday</option>
        </select>
      </div>
      <div class="time-range">
        <label data-i18n="common.time">Time</label>
        <div class="time-inputs">
          <div class="time-input-group">
            <label for="discount-from-${blockIndex}" data-i18n="common.timeFrom">From</label>
            <input type="time" id="discount-from-${blockIndex}" name="discountFrom[]" value="${timeFrom}">
          </div>
          <span class="time-separator" data-i18n="common.to">to</span>
          <div class="time-input-group">
            <label for="discount-to-${blockIndex}" data-i18n="common.timeTo">To</label>
            <input type="time" id="discount-to-${blockIndex}" name="discountTo[]" value="${timeTo}">
          </div>
        </div>
      </div>
      <div class="discount-percentage">
        <label for="discount-percentage-${blockIndex}" data-i18n="field.discountPercentage">Discount %</label>
        <input type="number" id="discount-percentage-${blockIndex}" name="discountPercentage[]" min="1" max="99" step="1" value="${percentage}">
      </div>
      <button type="button" class="btn btn-icon remove-discount-block">
        <i class="icon-delete"></i>
      </button>
    `;
    
    discountBlocksContainer.appendChild(discountBlock);
    
    // Attach remove button listener
    attachRemoveDiscountBlockListeners();
  }
});