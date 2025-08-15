import { supabase, formatTime, formatDate, formatTimeRange, formatPrice, checkAuth, showElement, hideElement, showError, showMessageBox } from './main.js';
import i18next from './translations.js';

// Import updateTranslations function
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
  // Check if user is authenticated and is a player
  const session = await checkAuth();
  if (!session) return;

  // Get user role via edge function
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-role`, {
    headers: {
      'Authorization': `Bearer ${session.session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    showMessageBox('Error', error.message || 'Failed to get user role', 'error', () => {
      window.location.href = '/';
    });
    return;
  }

  const userData = await response.json();

  if (userData.role !== 'player') {
    showMessageBox('Access Denied', 'This page is only for players.', 'error', () => {
      window.location.href = '/';
    });
    return;
  }

  const reservationsContainer = document.getElementById('reservations-container');
  const reservationsList = document.getElementById('reservations-list');
  const noReservationsMessage = document.getElementById('no-reservations-message');
  const cancelConfirmation = document.getElementById('cancel-confirmation');
  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  const cancelCancelBtn = document.getElementById('cancel-cancel-btn');
  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');
  const statusFilterSelect = document.getElementById('status-filter');
  const filterReservationsBtn = document.getElementById('filter-reservations-btn');
  const clearFilterBtn = document.getElementById('clear-filter-btn');
  
  let selectedReservationId = null;

  
  // Show reservations container
  showElement(reservationsContainer);
  
  // Set default date range (last 30 days to next 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  fromDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
  toDateInput.value = thirtyDaysFromNow.toISOString().split('T')[0];
  
  // Update status filter options with localized text
  function updateStatusFilterOptions() {
    statusFilterSelect.innerHTML = `
      <option value="">${i18next.t('common.status.allStatuses')}</option>
      <option value="Paid">${i18next.t('common.status.paid')}</option>
      <option value="Waiting_Payment">${i18next.t('common.status.waitingPayment')}</option>
      <option value="No_Payment">${i18next.t('common.status.noPayment')}</option>
      <option value="User_Cancelled">${i18next.t('common.status.userCancelled')}</option>
      <option value="Admin_Cancelled">${i18next.t('common.status.adminCancelled')}</option>
    `;
  }
  
  // Initialize status options
  updateStatusFilterOptions();
  
  // Update status options when language changes
  document.addEventListener('languageChanged', updateStatusFilterOptions);
  
  // Load initial reservations
  await loadReservations();
  
  // Event Listeners
  filterReservationsBtn.addEventListener('click', async () => {
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;
    
    if (!fromDate || !toDate) {
      showError('cancel-error', 'Please select both from and to dates');
      return;
    }
    
    if (fromDate > toDate) {
      showError('cancel-error', 'From date must be before or equal to to date');
      return;
    }
    
    await loadReservations(fromDate, toDate, statusFilterSelect.value);
  });
  
  clearFilterBtn.addEventListener('click', () => {
    fromDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    toDateInput.value = thirtyDaysFromNow.toISOString().split('T')[0];
    statusFilterSelect.value = '';
    loadReservations();
  });
  
  // Cancel reservation confirmation
  cancelCancelBtn.addEventListener('click', () => {
    hideElement(cancelConfirmation);
  });
  
  confirmCancelBtn.addEventListener('click', async () => {
    if (!selectedReservationId) {
      hideElement(cancelConfirmation);
      return;
    }
    
    await cancelReservation(selectedReservationId);
  });

  async function loadReservations(fromDate = null, toDate = null, status = '') {
    try {
      // Show loading state
      reservationsList.innerHTML = '<p class="no-results">Loading reservations...</p>';
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Build URL with query parameters
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/player-reservations`);
      
      if (fromDate && toDate) {
        url.searchParams.append('from_date', fromDate);
        url.searchParams.append('to_date', toDate);
      }
      
      if (status) {
        url.searchParams.append('status', status);
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const reservations = await response.json();
      
      if (!reservations || reservations.length === 0) {
        showElement(noReservationsMessage);
        reservationsList.innerHTML = '';
        return;
      }
      
      hideElement(noReservationsMessage);
      renderReservations(reservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      showError('cancel-error', error.message || 'Failed to fetch your reservations');
    }
  }
  
  function renderReservations(reservations) {
    let html = '';
    
    reservations.forEach(reservation => {
      console.log(JSON.stringify({
          reservation
        }));
      const formattedDate = formatDate(reservation.date);
      const timeRange = formatTimeRange(reservation.time_from, reservation.time_to);

      // Check if reservation can be cancelled
      const reservationDate = new Date(`${reservation.date}T${reservation.time_from}`);
      const now = new Date();
      const canCancel = now.getTime() < reservationDate.getTime() && !reservation.is_cancelled && 
                       !reservation.status.includes('Cancelled');
      
      // Format status for display with localization
      const statusDisplay = getLocalizedStatusDisplay(reservation.status);
      
      html += `
        <div class="reservation-item" data-id="${reservation.id}">
          <div class="reservation-header">
            <div class="reservation-title">${reservation.fields.name}</div>
            <div class="reservation-date">${formattedDate}</div>
          </div>
          <div class="reservation-details">
            <div class="reservation-detail">
              <div class="reservation-detail-label" data-i18n="reservation.time">Time</div>
              <div>${timeRange}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label" data-i18n="reservation.sport">Sport</div>
              <div data-i18n="sports.${reservation.fields.sport_type}">${capitalizeFirstLetter(reservation.fields.sport_type)}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label" data-i18n="reservation.place">Place</div>
              <div>${reservation.fields.places.name}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label" data-i18n="reservation.totalPrice">Total Price</div>
              <div>${formatPrice(reservation.totalPrice)}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label" data-i18n="reservation.reservationFee">Reservation Fee</div>
              <div>${reservation.fee}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label" data-i18n="reservation.status">Status</div>
              <div class="status-${reservation.status}">${statusDisplay}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label" data-i18n="reservation.reservationId">Reservation ID</div>
              <div>${reservation.id}</div>
            </div>
          </div>
          <div class="reservation-actions">
            ${canCancel ? 
              '<button class="btn btn-danger reservation-cancel-btn" data-i18n="reservation.cancelReservation">Cancel Reservation</button>' : 
              `<span class="helper-text" data-i18n="reservation.cannotCancelNotice">Cannot cancel (already cancelled or old reservation)</span>`
            }
          </div>
        </div>
      `;
    });
    
    reservationsList.innerHTML = html;
    
    // Update translations for dynamically added elements
    updateTranslations();
    
    // Add click event to cancel buttons
    const cancelButtons = document.querySelectorAll('.reservation-cancel-btn');
    cancelButtons.forEach(button => {
      button.addEventListener('click', () => {
        const reservationItem = button.closest('.reservation-item');
        selectedReservationId = reservationItem.getAttribute('data-id');
        showElement(cancelConfirmation);
      });
    });
  }
  
  async function cancelReservation(reservationId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/player-cancel-reservation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel reservation');
      }
      
      hideElement(cancelConfirmation);
      
      // Reload reservations to show updated status
      await loadReservations(fromDateInput.value, toDateInput.value, statusFilterSelect.value);
      
      showMessageBox('Success', 'Reservation cancelled successfully!', 'success');
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      hideElement(cancelConfirmation);
      showError('cancel-error', error.message || 'Failed to cancel reservation');
    }
  }
  
  function getLocalizedStatusDisplay(status) {
    const statusMap = {
      'Paid': i18next.t('common.status.paid'),
      'Waiting_Payment': i18next.t('common.status.waitingPayment'),
      'No_Payment': i18next.t('common.status.noPayment'),
      'User_Cancelled': i18next.t('common.status.userCancelled'),
      'Admin_Cancelled': i18next.t('common.status.adminCancelled')
    };
    return statusMap[status] || status;
  }
  
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});