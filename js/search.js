import { supabase, SPORTS, formatPrice, formatTimeRange } from './main.js';
import { getDistrictsForCity, getLocalizedDistrict } from './districts.js';

document.addEventListener('DOMContentLoaded', async () => {
  const searchForm = document.getElementById('search-form');
  const searchResults = document.getElementById('search-results');
  const dateInput = document.getElementById('date');
  const timeFromInput = document.getElementById('time-from');
  const timeToInput = document.getElementById('time-to');
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
  
  // Set minimum date to today
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  dateInput.min = todayString;
  dateInput.value = todayString;
  
  // City change handler for districts
  citySelect.addEventListener('change', (e) => {
    const selectedCity = e.target.value;
    populateDistricts(selectedCity);
  });
  
  // Set minimum time if date is today
  function updateMinTime() {
    const selectedDate = dateInput.value;
    if (selectedDate === todayString) {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      timeFromInput.min = currentTime;
    } else {
      timeFromInput.removeAttribute('min');
    }
  }
  
  // Update min time when date changes
  dateInput.addEventListener('change', updateMinTime);
  
  // Initial min time setup
  updateMinTime();
  
  function populateDistricts(city) {
    // Clear existing districts
    districtSelect.innerHTML = '<option value="" data-i18n="search.districtPlaceholder">Select District</option>';
    
    if (!city) {
      districtSelect.disabled = true;
      return;
    }
    
    // Get current language
    const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
    // Add "All Districts" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = currentLanguage === 'ar' ? 'جميع المناطق' : 'All Districts';
    districtSelect.appendChild(allOption);
    
    // Get English districts for the values, but display localized names
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
  
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const city = citySelect.value;
    const district = districtSelect.value;
    const sportType = sportTypeSelect.value;
    const date = dateInput.value;
    const timeFrom = timeFromInput.value;
    const timeTo = timeToInput.value;
    
    if (!city || !sportType || !date || !timeFrom || !timeTo) {
      alert('Please fill in all required search fields');
      return;
    }
    
    // Validate date and time are not in the past
    const selectedDateTime = new Date(`${date}T${timeFrom}`);
    const now = new Date();
    
    if (selectedDateTime < now) {
      alert('Cannot search for past dates and times');
      return;
    }
    
    try {
      // Add loading state
      searchResults.innerHTML = '<div class="loading-spinner"></div>';
      
      // Prepare search parameters
      const searchParams = {
        city,
        sportType,
        date,
        timeFrom,
        timeTo
      };
      
      // Add district filter if not "all"
      if (district && district !== 'all') {
        searchParams.district = district;
      }
      
      // Get available fields from Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const fields = await response.json();
      
      // Render search results
      renderSearchResults(fields, date, timeFrom, timeTo);

      // Scroll to results section
      const resultsSection = document.querySelector('.results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Search error:', error);
      searchResults.innerHTML = '<p class="error-message">Error searching for fields. Please try again.</p>';
    }
  });
  
  // Render search results
  function renderSearchResults(fields, date, timeFrom, timeTo) {
    if (!fields || fields.length === 0) {
      searchResults.innerHTML = '<p class="no-results">No available fields found. Try different search criteria.</p>';
      return;
    }
    
    // Get current language for district localization
    const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
    let html = '';
    
    fields.forEach(field => {
      // Get the first image or use default
      const imageUrl = field.images && field.images.length > 0
        ? field.images[0]
        : 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
      
      // Get localized district name for display
      const localizedDistrict = getLocalizedDistrict(field.city, field.district, currentLanguage);
      
      html += `
        <div class="field-card" data-field-id="${field.id}">
          <div class="field-card-image" style="background-image: url('${imageUrl}')"></div>
          <div class="field-card-content">
            <div class="field-card-header">
              <h4 class="field-card-title">${field.name}</h4>
              <p class="field-card-place">${field.places.name} - ${localizedDistrict}</p>
            </div>
            <div class="field-card-detail">
              <span class="field-card-sport">${SPORTS[field.sport_type]}</span>
              <div class="field-card-prices">
                <span class="field-card-price-hour">${formatPrice(field.price_per_hour)}/hour</span>
                <span class="field-card-price-total">Total: ${formatPrice(field.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    searchResults.innerHTML = html;
    
    // Add click event to field cards
    const fieldCards = document.querySelectorAll('.field-card');
    fieldCards.forEach(card => {
      card.addEventListener('click', () => {
        const fieldId = card.getAttribute('data-field-id');
        window.location.href = `/reserve.html?id=${fieldId}&date=${date}&timeFrom=${timeFrom}&timeTo=${timeTo}`;
      });
    });
  }
});