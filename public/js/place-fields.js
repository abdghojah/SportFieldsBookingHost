import { supabase, checkAuth, showElement, hideElement, showMessageBox } from './main.js';
import i18next from './translations.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const session = await checkAuth();
  if (!session) return;
  
  // Select DOM elements
  const protectedContent = document.querySelector('.protected-content');
  const placeNameElement = document.getElementById('place-name');
  const placePhoneElement = document.getElementById('place-phone');
  const editPlaceNameBtn = document.getElementById('edit-place-name-btn');
  const editPlaceNameForm = document.getElementById('edit-place-name-form');
  const placeNameInput = document.getElementById('place-name-input');
  const savePlaceNameBtn = document.getElementById('save-place-name-btn');
  const cancelPlaceNameBtn = document.getElementById('cancel-place-name-btn');
  const fieldsList = document.getElementById('fields-list');
  const noFieldsMessage = document.getElementById('no-fields-message');
  const addFieldBtn = document.getElementById('add-field-btn');
  
  let placeData = null;
  let fieldsData = [];
  
  // Show the protected content
  showElement(protectedContent);
  
  // Load place and fields data
  await loadPlaceData();
  
  // Event Listeners
  
  // Edit Place Name
  editPlaceNameBtn.addEventListener('click', () => {
    placeNameInput.value = placeData.name;
    hideElement(placeNameElement);
    hideElement(editPlaceNameBtn);
    showElement(editPlaceNameForm);
  });
  
  savePlaceNameBtn.addEventListener('click', async () => {
    const newName = placeNameInput.value.trim();
    
    if (!newName) {
      showMessageBox('Validation Error', 'Please enter a place name', 'error');
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/places`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: placeData.id,
          name: newName
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update place name');
      }

      const data = await response.json();
      
      placeData = data;
      placeNameElement.textContent = data.name;

      hideElement(editPlaceNameForm);
      showElement(placeNameElement);
      showElement(editPlaceNameBtn);
    } catch (error) {
      console.error('Failed to update place name:', error);
      showMessageBox('Error', 'Failed to update place name. Please try again.', 'error');
    }
  });
  
  cancelPlaceNameBtn.addEventListener('click', () => {
    hideElement(editPlaceNameForm);
    showElement(placeNameElement);
    showElement(editPlaceNameBtn);
  });
  
  // Add Field
  addFieldBtn.addEventListener('click', () => {
    window.location.href = `/field-form.html?place_id=${placeData.id}`;
  });
  
  // Functions
  
  async function loadPlaceData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/places`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load place data');
      }

      const place = await response.json();
      
      // Store place data
      placeData = place;
      
      // Update UI with place details
      placeNameElement.textContent = place.name;
      
      // Show phone numbers (primary and secondary if available)
      let phoneText = `${i18next.t("contact.phone")}: ${place.phone_number || 'Not provided'}`;

      // Get user data to check for secondary phone
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-role`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.secondary_phone) {
            phoneText += ` | Secondary: ${userData.secondary_phone}`;
          }
        }
      } catch (error) {
        console.log('Could not fetch secondary phone:', error);
        // Continue without secondary phone display
      }
      
      placePhoneElement.textContent = phoneText;
      
      // Get fields for this place
      await loadFieldsData();
    } catch (error) {
      console.error('Error loading place data:', error);
      showMessageBox('Error', 'Failed to load place data. Please refresh the page.', 'error');
    }
  }
  
  async function loadFieldsData() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fields?place_id=${placeData.id}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load fields');
      }

      const fields = await response.json();
      
      // Store fields data
      fieldsData = fields;
      
      // Render fields
      renderFields(fields);
    } catch (error) {
      console.error('Error loading fields:', error);
      showMessageBox('Error', 'Failed to load fields. Please refresh the page.', 'error');
    }
  }
  
  function renderFields(fields) {
    if (!fields || fields.length === 0) {
      showElement(noFieldsMessage);
      return;
    }
    
    hideElement(noFieldsMessage);
    
    let html = '';
    
    fields.forEach(field => {
      const sportType = (field.sport_type.charAt(0).toUpperCase() + field.sport_type.slice(1)).toLowerCase();
      
      // Use the first image from the images array or a default
      const imageUrl = field.images && field.images.length > 0
        ? field.images[0]
        : 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
      
      html += `
        <div class="field-item" onclick="window.location.href='/field-form.html?place_id=${placeData.id}&field_id=${field.id}'">
          <div class="field-item-image" style="background-image: url('${imageUrl}')">
            <span class="field-item-sport" data-i18n="sports.${sportType}">${i18next.t("sports."+sportType)}</span>
          </div>
          <div class="field-item-content">
            <h4 class="field-item-title">${field.name}</h4>
          </div>
        </div>
      `;
    });
    
    fieldsList.innerHTML = html;
  }
});