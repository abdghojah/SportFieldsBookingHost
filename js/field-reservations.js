import { supabase, checkAuth, formatDate, formatTime, formatPrice, showElement, hideElement, showLoading, hideLoading
 } from './main.js';
import i18next from './translations.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const session = await checkAuth();
  if (!session) return;
  
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const fieldId = params.get('field_id');
  const placeId = params.get('place_id');
  
  if (!fieldId || !placeId) {
    window.location.href = '/place-fields.html';
    return;
  }
  
  // Update field page link
  const fieldPageLink = document.getElementById('field-page-link');
  fieldPageLink.href = `/field-form.html?place_id=${placeId}&field_id=${fieldId}`;
  
  // Select DOM elements
  const fieldNameElement = document.getElementById('field-name');
  const reservationsList = document.getElementById('reservations-list');
  const protectedContent = document.querySelector('.protected-content');
  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');
  const filterReservationsBtn = document.getElementById('filter-reservations-btn');
  const clearFilterBtn = document.getElementById('clear-filter-btn');
  
  // Show the protected content
  showElement(protectedContent);
  
  // Load field data
  await loadFieldData();
  
  // Event Listeners
  filterReservationsBtn.addEventListener('click', async () => {
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;
    
    if (!fromDate || !toDate) {
      alert(i18next.t('common.error.selectDates'));
      return;
    }
    
    if (fromDate > toDate) {
      alert(i18next.t('common.error.invalidDateRange'));
      return;
    }

    await loadReservations(fromDate, toDate);
  });
  
  clearFilterBtn.addEventListener('click', () => {
    fromDateInput.value = '';
    toDateInput.value = '';
    reservationsList.innerHTML = `<p class="no-results">${i18next.t('reservation.selectDateRange')}</p>`;
  });
  
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
      
      // Update field name
      fieldNameElement.textContent = `${i18next.t('field.reservations')} - ${field.name}`;
    } catch (error) {
      console.error('Error loading field data:', error);
      alert(i18next.t('common.error.loadField'));
    }
  }
  
  async function loadReservations(fromDate, toDate) {
    try {
      showLoading();
      const { data: { session } } = await supabase.auth.getSession();
      // Show loading state
      reservationsList.innerHTML = `<p class="no-results">${i18next.t('common.loading')}</p>`;
      
      // Fetch reservations using GET request with query parameters
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reservations`);
      url.searchParams.append('field_id', fieldId);
      url.searchParams.append('from_date', fromDate);
      url.searchParams.append('to_date', toDate);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load reservations');
      }

      const reservations = await response.json();
      
      if (!reservations || reservations.length === 0) {
        hideLoading();
        reservationsList.innerHTML = `<p class="no-results">${i18next.t('reservation.noReservations')}</p>`;
        return;
      }
      
      // Render reservations
      let html = '';
      
      reservations.forEach(reservation => {
        const formattedDate = formatDate(reservation.date);
        const timeRange = `${formatTime(reservation.time_from)} - ${formatTime(reservation.time_to)}`;
        const statusClass = reservation.is_cancelled ? 'status-cancelled' : 'status-active';
        const statusText = reservation.is_cancelled ? i18next.t('common.status.cancelled') : i18next.t('common.status.active');
        
        // Get user name and phone from the users relationship
        const userName = reservation.users?.name || 'N/A';
        const userPhone = reservation.users?.phone || 'N/A';
        
        html += `
          <div class="reservation-card">
            <div class="reservation-header">
              <div class="reservation-id">${i18next.t('reservation.reservationId')}: ${reservation.id}</div>
              <div class="reservation-date">${formattedDate}</div>
            </div>
            <div class="reservation-details">
              <div class="reservation-detail">
                <span class="reservation-detail-label">${i18next.t('reservation.time')}</span>
                <span>${timeRange}</span>
              </div>
              <div class="reservation-detail">
                <span class="reservation-detail-label">${i18next.t('reservation.reserverName')}</span>
                <span>${userName}</span>
              </div>
              <div class="reservation-detail">
                <span class="reservation-detail-label">${i18next.t('reservation.reserverPhone')}</span>
                <span>${userPhone}</span>
              </div>
              <div class="reservation-detail">
                <span class="reservation-detail-label">${i18next.t('reservation.totalPrice')}</span>
                <span>${formatPrice(reservation.totalPrice)}</span>
              </div>
              <div class="reservation-detail">
                <span class="reservation-detail-label">${i18next.t('common.status.label')}</span>
                <span class="reservation-status ${statusClass}">${statusText}</span>
              </div>
            </div>
          </div>
        `;
      });
      
      reservationsList.innerHTML = html;
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Error loading reservations:', error);
      reservationsList.innerHTML = `<p class="error-message">${i18next.t('common.error.loadReservations')}</p>`;
    }
  }
});