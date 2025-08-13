import { SPORTS, formatPrice, showLoading, hideLoading } from './main.js';
import i18next from './translations.js';

// Import updateTranslations function from main.js
function updateTranslations() {
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

document.addEventListener('DOMContentLoaded', async () => {
  const placesList = document.getElementById('places-list');
  const listViewBtn = document.getElementById('list-view-btn');
  const mapViewBtn = document.getElementById('map-view-btn');
  const listView = document.getElementById('list-view');
  const mapView = document.getElementById('map-view');
  const fieldsMapElement = document.getElementById('fields-map');

  showLoading();

  let fieldsMap = null;
  let markerClusterGroup = null;
  let fieldsData = [];
  
  // Sport type colors for markers
  const sportColors = {
    football: '#4CAF50',
    tennis: '#FF9800',
    volleyball: '#2196F3',
    basketball: '#9C27B0',
    padel: '#F44336'
  };
  
  // Initialize view toggle
  listViewBtn.addEventListener('click', () => switchToListView());
  mapViewBtn.addEventListener('click', () => switchToMapView());
  
  // Listen for language changes to update translations
  document.addEventListener('languageChanged', () => {
    updateTranslations();
    // Re-render places list to update sport counts
    if (fieldsData.length > 0) {
      renderPlacesList(fieldsData);
    }
  });
  
  // Load data
  await loadFieldsData();
  
  function switchToListView() {
    listViewBtn.classList.add('active');
    listViewBtn.classList.remove('btn-secondary');
    listViewBtn.classList.add('btn-primary');
    
    mapViewBtn.classList.remove('active');
    mapViewBtn.classList.remove('btn-primary');
    mapViewBtn.classList.add('btn-secondary');
    
    listView.classList.remove('hidden');
    mapView.classList.add('hidden');
  }
  
  function switchToMapView() {
    mapViewBtn.classList.add('active');
    mapViewBtn.classList.remove('btn-secondary');
    mapViewBtn.classList.add('btn-primary');
    
    listViewBtn.classList.remove('active');
    listViewBtn.classList.remove('btn-primary');
    listViewBtn.classList.add('btn-secondary');
    
    listView.classList.add('hidden');
    mapView.classList.remove('hidden');
    
    // Initialize map if not already done
    if (!fieldsMap) {
      initializeMap();
    }
    
    // Refresh map size after showing
    setTimeout(() => {
      if (fieldsMap) {
        fieldsMap.invalidateSize();
      }
    }, 100);
  }
  
  function initializeMap() {
    try {
      showLoading();
      // Initialize map centered on Jordan
      fieldsMap = L.map(fieldsMapElement).setView([31.9539, 35.9106], 8);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(fieldsMap);
      
      // Initialize marker cluster group
      markerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      });
      
      // Add markers for all fields
      addFieldMarkersToMap();
      
      // Add cluster group to map
      fieldsMap.addLayer(markerClusterGroup);
      
      console.log(`Added ${getTotalFieldsWithCoordinates()} field markers to map`);
      hideLoading();
    }
    catch(error) {
      hideLoading();
      console.error('Adding fields to map:', error);
    }
  }
  
  function getTotalFieldsWithCoordinates() {
    let count = 0;
    fieldsData.forEach(place => {
      place.fields.forEach(field => {
        if (field.latitude && field.longitude) {
          count++;
        }
      });
    });
    return count;
  }
  
  function addFieldMarkersToMap() {
    if (!markerClusterGroup) return;
    
    console.log('Adding field markers to map...', fieldsData);
    
    fieldsData.forEach(place => {
      place.fields.forEach(field => {
        // Only add fields with valid coordinates
        if (field.latitude && field.longitude) {
          console.log(`Adding marker for field: ${field.name} at [${field.latitude}, ${field.longitude}]`);
          const marker = createFieldMarker(field, place);
          markerClusterGroup.addLayer(marker);
        } else {
          console.log(`Skipping field ${field.name} - no coordinates`);
        }
      });
    });
    
    console.log(`Total markers in cluster group: ${markerClusterGroup.getLayers().length}`);
  }
  
  function createFieldMarker(field, place) {
    // Create custom icon based on sport type
    const sportColor = sportColors[field.sport_type] || '#1E88E5';
    
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${sportColor};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    // Create marker
    const marker = L.marker([field.latitude, field.longitude], {
      icon: customIcon
    });
    
    // Create popup content
    const popupContent = createPopupContent(field, place);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });
    
    return marker;
  }
  
  function createPopupContent(field, place) {
    const sportName = i18next.t(`sports.${field.sport_type}`);
    const priceText = `${formatPrice(field.price_per_hour)} ${i18next.t('field.pricePerHour')}`;
    
    return `
      <div class="popup-content">
        <div class="popup-title">${field.name}</div>
        <div class="popup-place">${place.name}</div>
        <div class="popup-sport">${sportName}</div>
        <div class="popup-price">${priceText}</div>
        <a href="/reserve.html?id=${field.id}" class="popup-button" target="_blank">
          ${i18next.t('views.reserveField')}
        </a>
      </div>
    `;
  }
  
  async function loadFieldsData() {
    try {
      // Fetch all active places with their fields
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribed-fields`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load places');
      }

      const places = await response.json();
      
      console.log('Loaded places data:', places);
      
      if (!places || places.length === 0) {
        hideLoading();
        placesList.innerHTML = '<p class="no-results">No places found.</p>';
        return;
      }
      
      // Store data for map use
      fieldsData = places;
      
      // Render list view
      renderPlacesList(places);
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Error loading places:', error);
      placesList.innerHTML = '<p class="error-message">Failed to load places. Please try again.</p>';
    }
  }
  
  function renderPlacesList(places) {
    let html = '';
    
    places.forEach(place => {
      // Group fields by sport type
      const sportCounts = place.fields.reduce((acc, field) => {
        acc[field.sport_type] = (acc[field.sport_type] || 0) + 1;
        return acc;
      }, {});
      
      // Create sport type badges
      const sportBadges = Object.entries(sportCounts)
        .map(([sport, count]) => `
          <span class="place-card-stat">
            ${i18next.t(`sports.${sport}`)}: ${i18next.t(count > 1 ? 'views.fieldsCountPlural' : 'views.fieldsCount', { count })}
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
  }
});