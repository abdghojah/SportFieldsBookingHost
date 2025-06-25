import { SPORTS, showElement, hideElement } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  const placeNameInput = document.getElementById('place-name');
  const searchPlacesBtn = document.getElementById('search-places-btn');
  const placeResults = document.getElementById('place-results');
  const placesList = document.getElementById('places-list');
  const fieldResults = document.getElementById('field-results');
  const searchForm = document.getElementById('search-form');
  
  // Handle place search
  searchPlacesBtn.addEventListener('click', async () => {
    const placeName = placeNameInput.value.trim();
    
    if (!placeName) {
      alert('Please enter a place name');
      return;
    }
    
    try {
      // Show loading state
      placesList.innerHTML = '<p class="no-results">Searching places...</p>';
      showElement(placeResults);
      hideElement(fieldResults);
      
      // Clear field search form
      searchForm.reset();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-places?name=${encodeURIComponent(placeName)}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to search places');
      }

      const places = await response.json();
      
      if (!places || places.length === 0) {
        placesList.innerHTML = '<p class="no-results">No places found matching your search.</p>';
        return;
      }
      
      // Render places
      let html = '';
      
      places.forEach(place => {
        // Group fields by sport type
        const sportCounts = place.fields.reduce((acc, field) => {
          acc[field.sport_type] = (acc[field.sport_type] || 0) + field.field_count;
          return acc;
        }, {});
        
        // Create sport type badges
        const sportBadges = Object.entries(sportCounts)
          .map(([sport, count]) => `
            <span class="place-card-stat">
              ${SPORTS[sport]}: ${count} field${count > 1 ? 's' : ''}
            </span>
          `)
          .join('');
        
        html += `
          <div class="place-card" onclick="window.location.href='/place.html?id=${place.id}'">
            <div class="place-card-header">
              <h4 class="place-card-title">${place.name}</h4>
            </div>
            <div class="place-card-stats">
              ${sportBadges}
            </div>
          </div>
        `;
      });
      
      placesList.innerHTML = html;

      // Scroll to results section
      const resultsSection = document.querySelector('.results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
    } catch (error) {
      console.error('Error searching places:', error);
      placesList.innerHTML = '<p class="error-message">Failed to search places. Please try again.</p>';
    }
  });
  
  // Handle field search form submission
  searchForm.addEventListener('submit', () => {
    // Hide place results when using field search
    hideElement(placeResults);
    showElement(fieldResults);
    
    // Clear place search input
    placeNameInput.value = '';
  });
  
  // Handle place name input enter key
  placeNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchPlacesBtn.click();
    }
  });
});