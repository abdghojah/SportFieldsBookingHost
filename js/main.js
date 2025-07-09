import '../css/style.css';
import i18next from './translations.js';
import { createClient } from 'npm:@supabase/supabase-js';

// Create supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize translations
document.addEventListener('DOMContentLoaded', () => {
  // Get the stored language or default to 'en'
  const storedLanguage = localStorage.getItem('selectedLanguage') || 'en';
  
  // Set the language dropdown to match stored language
  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.value = storedLanguage;
  }

  // Initialize i18next with stored language
  i18next.changeLanguage(storedLanguage).then(() => {
    // Initialize translations for all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const options = element.getAttribute('data-i18n-options');
      element.textContent = i18next.t(key, options ? JSON.parse(options) : undefined);
    });
  });

  // Handle language change
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      const newLanguage = e.target.value;
      localStorage.setItem('selectedLanguage', newLanguage);
      
      i18next.changeLanguage(newLanguage).then(() => {
        document.querySelectorAll('[data-i18n]').forEach(element => {
          const key = element.getAttribute('data-i18n');
          const options = element.getAttribute('data-i18n-options');
          element.textContent = i18next.t(key, options ? JSON.parse(options) : undefined);
        });
      });
    });
  }

  // Initialize navigation visibility
  updateNavigationVisibility();
});

// Global constants
export const SPORTS = {
  football: 'Football',
  tennis: 'Tennis',
  volleyball: 'Volleyball',
  basketball: 'Basketball',
  padel: 'Padel'
};

export const CITIES = [
  'Amman',
  'Irbid',
  'Zarqa',
  'Aqaba',
  'Jerash',
  'Madaba',
  'Salt',
  'Karak',
  'Ajloun',
  'Mafraq'
];

// Helper Functions
export function formatPrice(price) {
  return `${price.toFixed(2)} JOD`;
}

export function formatDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export function formatTime(timeString) {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTimeRange(fromTime, toTime) {
  return `${formatTime(fromTime)} - ${formatTime(toTime)}`;
}

export function isValidJordanianPhone(phone) {
  // Check if the phone number already has the country code
  if (phone.startsWith('962')) {
    return /^962[7][0-9]{8}$/.test(phone);
  }
  // Check local format
  return /^07[0-9]{8}$/.test(phone);
}

export function formatJordanianPhone(phone) {
  if (phone.startsWith('962')) {
    return phone;
  }
  return `962${phone.substring(1)}`;
}

export function showElement(element) {
  if (typeof element === 'string') {
    document.querySelector(element).classList.remove('hidden');
  } else {
    element.classList.remove('hidden');
  }
}

export function hideElement(element) {
  if (typeof element === 'string') {
    document.querySelector(element).classList.add('hidden');
  } else {
    element.classList.add('hidden');
  }
}

export function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  showElement(errorElement);

  // Increased duration to 10 seconds (10000ms)
  setTimeout(() => {
    hideElement(errorElement);
  }, 10000);
}

// Authentication Functions
export async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-auth`, {
      headers: {
        'Authorization': `Bearer ${token || ''}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const { user } = await response.json();
    
    if (!user) {
      window.location.href = '/login.html';
      return null;
    }
    
    return { user, session };
  } catch (error) {
    window.location.href = '/login.html';
    return null;
  }
}

export async function logout() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || ''}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Logout failed');
    }

    await supabase.auth.signOut();
    
    // Update navigation after logout
    updateNavigationVisibility();
    
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/login.html';
  }
}

// Navigation visibility management
export async function updateNavigationVisibility() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get navigation elements
    const loginLink = document.querySelector('a[href="/login.html"]');
    const signupLink = document.querySelector('a[href="/owner-signup.html"]');
    const manageReservationLink = document.querySelector('a[href="/cancel-reservation.html"]');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (session) {
      // User is logged in
      // Get user role
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (!error && userData) {
        // Hide login and signup links
        if (loginLink) hideElement(loginLink.parentElement);
        if (signupLink) hideElement(signupLink.parentElement);
        
        // Show logout button
        if (logoutBtn) showElement(logoutBtn.parentElement);
        
        // Show manage reservation only for players
        if (manageReservationLink) {
          if (userData.role === 'player') {
            showElement(manageReservationLink.parentElement);
          } else {
            hideElement(manageReservationLink.parentElement);
          }
        }
      }
    } else {
      // User is not logged in
      // Show login and signup links
      if (loginLink) showElement(loginLink.parentElement);
      if (signupLink) showElement(signupLink.parentElement);
      
      // Hide logout button and manage reservation
      if (logoutBtn) hideElement(logoutBtn.parentElement);
      if (manageReservationLink) hideElement(manageReservationLink.parentElement);
    }
  } catch (error) {
    console.error('Error updating navigation visibility:', error);
    // On error, show default (logged out) state
    const loginLink = document.querySelector('a[href="/login.html"]');
    const signupLink = document.querySelector('a[href="/owner-signup.html"]');
    const manageReservationLink = document.querySelector('a[href="/cancel-reservation.html"]');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginLink) showElement(loginLink.parentElement);
    if (signupLink) showElement(signupLink.parentElement);
    if (logoutBtn) hideElement(logoutBtn.parentElement);
    if (manageReservationLink) hideElement(manageReservationLink.parentElement);
  }
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', () => {
  // Populate city select elements
  const citySelects = document.querySelectorAll('select[id="city"]');
  if (citySelects.length > 0) {
    citySelects.forEach(select => {
      CITIES.forEach(city => {
        const option = document.createElement('option');
        option.value = city.toLowerCase();
        option.textContent = city;
        select.appendChild(option);
      });
    });
  }
  
  // Initialize logout confirmation if present
  const logoutBtn = document.getElementById('logout-btn');
  const logoutConfirmation = document.getElementById('logout-confirmation');
  const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
  const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
  
  if (logoutBtn && logoutConfirmation) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showElement(logoutConfirmation);
    });
    
    cancelLogoutBtn.addEventListener('click', () => {
      hideElement(logoutConfirmation);
    });
    
    confirmLogoutBtn.addEventListener('click', () => {
      logout();
    });
  }

  // Add fade-in animation to sections
  document.querySelectorAll('section').forEach(section => {
    section.classList.add('fade-in');
  });
});