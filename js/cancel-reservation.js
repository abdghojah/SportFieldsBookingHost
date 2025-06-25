import { supabase, formatTime, formatDate, formatTimeRange, formatPrice, checkAuth, showElement, hideElement, showError } from './main.js';
import i18next from './translations.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated and is a player
  const session = await checkAuth();
  if (!session) return;

  // Verify user is a player
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, phone')
    .eq('id', session.user.id)
    .single();

  if (userError || userData.role !== 'player') {
    alert('Access denied. This page is only for players.');
    window.location.href = '/';
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
  
  // Hide OTP forms since player is already authenticated
  hideElement(document.getElementById('request-otp-form'));
  hideElement(document.getElementById('verify-otp-form'));
  
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
  
  // Update status filter options with new statuses
  statusFilterSelect.innerHTML = `
    <option value="">All Statuses</option>
    <option value="Paid">Paid</option>
    <option value="Waiting_Payment">Waiting Payment</option>
    <option value="No_Payment">No Payment</option>
    <option value="User_Cancelled">User Cancelled</option>
    <option value="Admin_Cancelled">Admin Cancelled</option>
  `;
  
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
      const formattedDate = formatDate(reservation.date);
      const timeRange = formatTimeRange(reservation.time_from, reservation.time_to);
      
      // Check if reservation can be cancelled
      const reservationDate = new Date(`${reservation.date}T${reservation.time_from}`);
      const now = new Date();
      const timeDiff = reservationDate.getTime() - now.getTime();
      const hoursUntilReservation = timeDiff / (1000 * 60 * 60);
      const canCancel = hoursUntilReservation > 12 && !reservation.is_cancelled && 
                       !reservation.status.includes('Cancelled');
      
      // Format status for display
      const statusDisplay = getStatusDisplay(reservation.status);
      
      html += `
        <div class="reservation-item" data-id="${reservation.id}">
          <div class="reservation-header">
            <div class="reservation-title">${reservation.fields.name}</div>
            <div class="reservation-date">${formattedDate}</div>
          </div>
          <div class="reservation-details">
            <div class="reservation-detail">
              <div class="reservation-detail-label">Time</div>
              <div>${timeRange}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label">Sport</div>
              <div>${capitalizeFirstLetter(reservation.fields.sport_type)}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label">Place</div>
              <div>${reservation.fields.places.name}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label">Total Price</div>
              <div>${formatPrice(reservation.totalPrice)}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label">Status</div>
              <div class="status-${reservation.status}">${statusDisplay}</div>
            </div>
            <div class="reservation-detail">
              <div class="reservation-detail-label">Reservation ID</div>
              <div>${reservation.id}</div>
            </div>
          </div>
          <div class="reservation-actions">
            ${canCancel ? 
              '<button class="btn btn-danger reservation-cancel-btn">Cancel Reservation</button>' : 
              '<span class="helper-text">Cannot cancel (less than 12 hours or already cancelled)</span>'
            }
          </div>
        </div>
      `;
    });
    
    reservationsList.innerHTML = html;
    
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/player-cancel-reservation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
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
      
      alert('Reservation cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      hideElement(cancelConfirmation);
      showError('cancel-error', error.message || 'Failed to cancel reservation');
    }
  }
  
  function getStatusDisplay(status) {
    const statusMap = {
      'Paid': 'Paid',
      'Waiting_Payment': 'Waiting Payment',
      'No_Payment': 'No Payment',
      'User_Cancelled': 'User Cancelled',
      'Admin_Cancelled': 'Admin Cancelled'
    };
    return statusMap[status] || status;
  }
  
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});