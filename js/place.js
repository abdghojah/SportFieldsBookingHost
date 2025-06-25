import { SPORTS, formatPrice } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Get place ID from URL
  const params = new URLSearchParams(window.location.search);
  const placeId = params.get('id');
  
  if (!placeId) {
    window.location.href = '/';
    return;
  }
  
  try {
    // Fetch place data
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/place?id=${placeId}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to load place data');
    }

    const place = await response.json();
    
    // Update page title
    document.title = `${place.name} - SportSpot`;
    
    // Update place info
    document.getElementById('place-name').textContent = place.name;
    
    // Render fields
    const fieldsList = document.getElementById('fields-list');
    
    if (!place.fields || place.fields.length === 0) {
      fieldsList.innerHTML = '<p class="no-results">No fields available at this place.</p>';
      return;
    }
    
    let html = '';
    
    place.fields.forEach(field => {
      if (!field.is_active) return;
      
      // Use the first image from the images array or a default
      const imageUrl = field.images && field.images.length > 0
        ? field.images[0]
        : 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
      
      html += `
        <div class="field-card" onclick="window.location.href='/reserve.html?id=${field.id}'">
          <div class="field-card-image" style="background-image: url('${imageUrl}')"></div>
          <div class="field-card-content">
            <div class="field-card-header">
              <h4 class="field-card-title">${field.name}</h4>
              <p class="field-card-place">${field.city}</p>
            </div>
            <div class="field-card-detail">
              <span class="field-card-sport">${SPORTS[field.sport_type]}</span>
              <div class="field-card-prices">
                <span class="field-card-price-hour">${formatPrice(field.price_per_hour)}/hour</span>
                <span class="field-card-price-total">Min booking: ${field.min_booking_time}h</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    fieldsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading place:', error);
    document.getElementById('fields-list').innerHTML = '<p class="error-message">Failed to load place data. Please try again.</p>';
  }
});