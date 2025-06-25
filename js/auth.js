import { supabase, showError, formatJordanianPhone, isValidJordanianPhone, updateNavigationVisibility } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate inputs
    if (!identifier || !password) {
      showError('login-error', 'Phone number and password are required');
      return;
    }

    // Only accept phone numbers now
    if (!isValidJordanianPhone(identifier)) {
      showError('login-error', 'Please enter a valid Jordanian phone number (07xxxxxxxx)');
      return;
    }

    try {
      // Format phone number to 962xxxxxxxx format
      const formattedPhone = formatJordanianPhone(identifier);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          identifier: formattedPhone,
          password
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to login');
      }

      if (!result.session) {
        console.error('No session data received from auth response');
        throw new Error('Login failed - no session data received');
      }

      console.log('Setting session from auth response');
      const { error: sessionError } = await supabase.auth.setSession(result.session);
      
      if (sessionError) {
        console.error('Failed to set session:', sessionError);
        throw sessionError;
      }

      // Update navigation visibility after successful login
      await updateNavigationVisibility();

      // Redirect based on user role
      if (result.role === 'admin') {
        window.location.href = '/admin-reservations.html';
      } else if (result.role === 'player') {
        window.location.href = '/cancel-reservation.html';
      } else {
        window.location.href = '/place-fields.html';
      }
    } catch (error) {
      showError('login-error', error.message || 'Failed to login. Please check your credentials.');
      console.error('Login error:', error);
    }
  });
});