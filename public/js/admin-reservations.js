import { supabase, checkAuth, formatDate, formatTime, showElement, hideElement, showMessageBox } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated and is admin
  const session = await checkAuth();
  if (!session) return;

  // Select DOM elements
  const protectedContent = document.querySelector('.protected-content');
  const reservationsList = document.getElementById('reservations-list');
  const fromDateInput = document.getElementById('from-date');
  const toDateInput = document.getElementById('to-date');
  const statusSelect = document.getElementById('status');
  const filterReservationsBtn = document.getElementById('filter-reservations-btn');
  const clearFilterBtn = document.getElementById('clear-filter-btn');

  // Update status options with new statuses
  statusSelect.innerHTML = `
    <option value="">All Statuses</option>
    <option value="Paid">Paid</option>
    <option value="Waiting_Payment">Waiting Payment</option>
    <option value="No_Payment">No Payment</option>
    <option value="User_Cancelled">User Cancelled</option>
    <option value="Admin_Cancelled">Admin Cancelled</option>
  `;

  // Show the protected content
  showElement(protectedContent);

  // Event Listeners
  filterReservationsBtn.addEventListener('click', async () => {
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;
    const status = statusSelect.value;

    if (!fromDate || !toDate) {
      showMessageBox('Error', 'Please select both from and to dates', 'error');
      return;
    }

    if (fromDate > toDate) {
      showMessageBox('Error', 'From date must be before or equal to to date', 'error');
      return;
    }

    await loadReservations(fromDate, toDate, status);
  });

  clearFilterBtn.addEventListener('click', () => {
    fromDateInput.value = '';
    toDateInput.value = '';
    statusSelect.value = '';
    reservationsList.innerHTML = '<p class="no-results">Select a date range to view reservations</p>';
  });

  async function loadReservations(fromDate, toDate, status = '') {
    try {
      // Show loading state
      reservationsList.innerHTML = '<p class="no-results">Loading reservations...</p>';

      // Build URL with query parameters
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-reservation-status`);
      url.searchParams.append('from_date', fromDate);
      url.searchParams.append('to_date', toDate);
      if (status) {
        url.searchParams.append('status', status);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load reservations');
      }

      const reservations = await response.json();

      if (!reservations || reservations.length === 0) {
        reservationsList.innerHTML = '<p class="no-results">No reservations found for the selected criteria</p>';
        return;
      }

      // Render reservations
      let html = '';

      reservations.forEach(reservation => {
        const formattedDate = formatDate(reservation.date);
        const timeRange = `${formatTime(reservation.time_from)} - ${formatTime(reservation.time_to)}`;
        const userName = reservation.users?.name || 'N/A';
        const userPhone = reservation.users?.phone || 'N/A';

        html += `
          <div class="reservation-card" data-id="${reservation.id}">
            <div class="reservation-header">
              <div class="reservation-place">${reservation.fields.places.name} - ${reservation.fields.name}</div>
              <div class="reservation-date">${formattedDate}</div>
            </div>
            <div class="reservation-details">
              <div class="reservation-detail">
                <div class="reservation-detail-label">Time</div>
                <div class="reservation-detail-value">${timeRange}</div>
              </div>
              <div class="reservation-detail">
                <div class="reservation-detail-label">User Name</div>
                <div class="reservation-detail-value">${userName}</div>
              </div>
              <div class="reservation-detail">
                <div class="reservation-detail-label">Phone</div>
                <div class="reservation-detail-value">${userPhone}</div>
              </div>
              <div class="reservation-detail">
                <div class="reservation-detail-label">Status</div>
                <div class="reservation-detail-value">
                  <select class="status-select">
                    <option value="Paid" ${reservation.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="Waiting_Payment" ${reservation.status === 'Waiting_Payment' ? 'selected' : ''}>Waiting Payment</option>
                    <option value="No_Payment" ${reservation.status === 'No_Payment' ? 'selected' : ''}>No Payment</option>
                    <option value="User_Cancelled" ${reservation.status === 'User_Cancelled' ? 'selected' : ''}>User Cancelled</option>
                    <option value="Admin_Cancelled" ${reservation.status === 'Admin_Cancelled' ? 'selected' : ''}>Admin Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="reservation-actions">
              <button class="btn btn-primary save-status-btn">Save Status</button>
            </div>
          </div>
        `;
      });

      reservationsList.innerHTML = html;

      // Add event listeners to save buttons
      const saveButtons = document.querySelectorAll('.save-status-btn');
      saveButtons.forEach(button => {
        button.addEventListener('click', async () => {
          const card = button.closest('.reservation-card');
          const reservationId = card.getAttribute('data-id');
          const statusSelect = card.querySelector('.status-select');
          const newStatus = statusSelect.value;

          try {
            button.disabled = true;
            button.textContent = 'Saving...';

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
      
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-reservation-status`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token || ''}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                reservationId,
                status: newStatus
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to update status');
            }

            showMessageBox('Success', 'Status updated successfully', 'success');
          } catch (error) {
            console.error('Error updating status:', error);
            showMessageBox('Error', error.message || 'Failed to update status', 'error');
          } finally {
            button.disabled = false;
            button.textContent = 'Save Status';
          }
        });
      });

    } catch (error) {
      console.error('Error loading reservations:', error);
      reservationsList.innerHTML = '<p class="error-message">Failed to load reservations. Please try again.</p>';
    }
  }
});