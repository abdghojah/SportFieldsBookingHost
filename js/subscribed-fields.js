import { SPORTS, formatPrice } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  const placesList = document.getElementById('places-list');
  const listViewBtn = document.getElementById('list-view-btn');
  const mapViewBtn = document.getElementById('map-view-btn');
  const listView = document.getElementById('list-view');
  const mapView = document.getElementById('map-view');
  const fieldsMapElement = document.getElementById('fields-map');
  
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
    const sportName = SPORTS[field.sport_type] || field.sport_type;
    const priceText = formatPrice(field.price_per_hour);
    
    return `
      <div class="popup-content">
        <div class="popup-title">${field.name}</div>
        <div class="popup-place">${place.name}</div>
        <div class="popup-sport">${sportName}</div>
        <div class="popup-price">${priceText}/hour</div>
        <a href="/reserve.html?id=${field.id}" class="popup-button" target="_blank">
          Reserve Field
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
        placesList.innerHTML = '<p class="no-results">No places found.</p>';
        return;
      }
      
      // Store data for map use
      fieldsData = places;
      
      // Render list view
      renderPlacesList(places);
      
    } catch (error) {
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
  }
});