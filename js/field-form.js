import { supabase, SPORTS, checkAuth, showElement, hideElement } from './main.js';
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
  const mapElement = document.getElementById('map');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const imagePreviewElement = document.getElementById('image-preview');
  const sportTypeSelect = document.getElementById('sport-type');
  const citySelect = document.getElementById('city');
  const districtSelect = document.getElementById('district');
  
  // Populate sport types
  Object.entries(SPORTS).forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    sportTypeSelect.appendChild(option);
  });
  
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
  
  // Configure form based on mode
  if (isUpdateMode) {
    formTitle.textContent = 'Update Field';
    saveBtn.textContent = 'Save';
    showElement(viewReservationsBtn);
    showElement(deleteFieldBtn);
    
    // Load field data
    await loadFieldData();
  } else {
    formTitle.textContent = 'Create a New Field';
    saveBtn.textContent = 'Save';
    hideElement(viewReservationsBtn);
    hideElement(deleteFieldBtn);
  }
  
  // Initialize map after field data is loaded
  initMap();
  
  // Initialize remove time block listeners
  attachRemoveTimeBlockListeners();
  
  // City change handler for districts
  citySelect.addEventListener('change', (e) => {
    const selectedCity = e.target.value;
    populateDistricts(selectedCity);
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
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete field');
      }

      alert('Field deleted successfully!');
      window.location.href = '/place-fields.html';
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Failed to delete field. Please try again.');
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
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
        alert('Field updated successfully!');
        fieldData = data;
      } else {
        alert('Field created successfully!');
        window.location.href = '/place-fields.html';
      }
    } catch (error) {
      console.error('Error saving field:', error);
      alert(error.message || 'Failed to save field. Please try again.');
    }
  });
  
  // Functions
  
  function populateDistricts(city) {
    // Clear existing districts
    districtSelect.innerHTML = '<option value="" data-i18n="field.districtPlaceholder">Select District</option>';
    
    if (!city) {
      districtSelect.disabled = true;
      return;
    }
    
    // Get current language
    const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
    // Always get English districts for the values, but display localized names
    const englishDistricts = getDistrictsForCity(city, 'en');
    
    if (englishDistricts.length > 0) {
      districtSelect.disabled = false;
      
      englishDistricts.forEach(englishDistrict => {
        const option = document.createElement('option');
        option.value = englishDistrict; // Always store English value
        option.textContent = getLocalizedDistrict(city, englishDistrict, currentLanguage); // Display localized name
        districtSelect.appendChild(option);
      });
    } else {
      districtSelect.disabled = true;
    }
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
      document.getElementById('included-services').value = fieldData.included_services || '';
      document.getElementById('city').value = fieldData.city;
      document.getElementById('price').value = fieldData.price_per_hour;
      document.getElementById('min-time').value = fieldData.min_booking_time;
      
      // Populate districts and set district value
      populateDistricts(fieldData.city);
      if (fieldData.district) {
        // The district in the database is already in English, so we can set it directly
        document.getElementById('district').value = fieldData.district;
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
      
      // Display images if any
      if (fieldData.images && fieldData.images.length > 0) {
        uploadedImages = fieldData.images;
        displayImages(fieldData.images);
      }
    } catch (error) {
      console.error('Error loading field data:', error);
      alert('Failed to load field data. Please try again.');
    }
  }
  
  function validateForm() {
    // Basic validation
    const requiredFields = [
      'field-name', 'sport-type', 'city', 'district', 'price', 'min-time', 'latitude', 'longitude'
    ];
    
    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field.value.trim()) {
        alert(`Please fill in the ${field.labels[0].textContent}`);
        field.focus();
        return false;
      }
    }
    
    // Validate price
    const price = parseFloat(document.getElementById('price').value);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      document.getElementById('price').focus();
      return false;
    }
    
    // Validate min booking time
    const minTime = parseFloat(document.getElementById('min-time').value);
    if (isNaN(minTime) || minTime <= 0) {
      alert('Please enter a valid minimum booking time');
      document.getElementById('min-time').focus();
      return false;
    }
    
    // Validate time pattern if provided
    const patternHours = document.getElementById('pattern-hours').value;
    const patternStart = document.getElementById('pattern-start').value;
    
    if (patternHours && !patternStart) {
      alert('Please provide a start time for the time pattern');
      document.getElementById('pattern-start').focus();
      return false;
    }
    
    if (!patternHours && patternStart) {
      alert('Please provide interval hours for the time pattern');
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
          alert('Please fill in all fields for each time block');
          return false;
        }
        
        if (from >= to) {
          alert('Start time must be before end time for all time blocks');
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
  
  async function handleImageUpload(event) {
    const files = event.target.files;
    
    if (!files || files.length === 0) return;
    
    // Validate file count
    if (files.length > 5) {
      alert('You can only upload up to 5 images');
      event.target.value = '';
      return;
    }
    
    // Validate file sizes and types
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 2MB size limit`);
        event.target.value = '';
        return;
      }
      
      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert(`File ${file.name} is not a supported image type (JPG/PNG only)`);
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
      alert('Failed to upload images. Please try again.');
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
      formData.append('userId', session.user.id);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
        <label for="block-day-${blockIndex}">Day</label>
        <select id="block-day-${blockIndex}" name="blockDay[]">
          <option value="monday" ${day === 'monday' ? 'selected' : ''}>Monday</option>
          <option value="tuesday" ${day === 'tuesday' ? 'selected' : ''}>Tuesday</option>
          <option value="wednesday" ${day === 'wednesday' ? 'selected' : ''}>Wednesday</option>
          <option value="thursday" ${day === 'thursday' ? 'selected' : ''}>Thursday</option>
          <option value="friday" ${day === 'friday' ? 'selected' : ''}>Friday</option>
          <option value="saturday" ${day === 'saturday' ? 'selected' : ''}>Saturday</option>
          <option value="sunday" ${day === 'sunday' ? 'selected' : ''}>Sunday</option>
        </select>
      </div>
      <div class="time-range">
        <label>Time</label>
        <div class="time-inputs">
          <input type="time" id="block-from-${blockIndex}" name="blockFrom[]" value="${timeFrom}">
          <span>to</span>
          <input type="time" id="block-to-${blockIndex}" name="blockTo[]" value="${timeTo}">
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
});