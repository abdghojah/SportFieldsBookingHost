import '../css/style.css';
import i18next from './translations.js';
import { getDistrictsForCity, getLocalizedDistrict } from './districts.js';
import { createClient } from '@supabase/supabase-js';

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

  // Set document language and direction
  updateDocumentLanguage(storedLanguage);

  // Initialize i18next with stored language
  i18next.changeLanguage(storedLanguage).then(() => {
    // Initialize translations for all elements with data-i18n attribute
    updateTranslations();
  });

  // Handle language change
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      const newLanguage = e.target.value;
      localStorage.setItem('selectedLanguage', newLanguage);
      
      // Update document language and direction
      updateDocumentLanguage(newLanguage);
      
      i18next.changeLanguage(newLanguage).then(() => {
        updateTranslations();
        // Dispatch custom event for other components to listen to
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLanguage } }));
      });
    });
  }

  // Initialize navigation visibility
  updateNavigationVisibility();

  // Initialize mobile menu toggle
  initializeMobileMenu();

  // Create custom message box
  createCustomMessageBox();
});

// Function to create custom message box
function createCustomMessageBox() {
  const messageBox = document.createElement('div');
  messageBox.id = 'custom-message-box';
  messageBox.className = 'modal hidden';
  
  messageBox.innerHTML = `
    <div class="modal-content message-box-content">
      <div class="message-box-header">
        <h3 id="message-box-title"></h3>
      </div>
      <div class="message-box-body">
        <p id="message-box-message"></p>
      </div>
      <div class="message-box-actions">
        <button id="message-box-ok" class="btn btn-primary">OK</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(messageBox);
}

// Custom message box function with callback support
export function showMessageBox(title, message, type = 'info', callback = null) {
  const messageBox = document.getElementById('custom-message-box');
  const titleElement = document.getElementById('message-box-title');
  const messageElement = document.getElementById('message-box-message');
  const contentElement = messageBox.querySelector('.message-box-content');
  const okButton = document.getElementById('message-box-ok');
  
  if (!messageBox || !titleElement || !messageElement || !contentElement || !okButton) {
    // Fallback to alert if message box not available
    alert(`${title}: ${message}`);
    if (callback && typeof callback === 'function') {
      callback();
    }
    return;
  }
  
  // Set content
  titleElement.textContent = title;
  messageElement.textContent = message;
  
  // Remove existing type classes
  contentElement.classList.remove('message-box-info', 'message-box-success', 'message-box-error', 'message-box-warning');
  
  // Add type class
  contentElement.classList.add(`message-box-${type}`);
  
  // Remove any existing event listeners by cloning the button
  const newOkButton = okButton.cloneNode(true);
  okButton.parentNode.replaceChild(newOkButton, okButton);
  
  // Add new event listener with callback support
  newOkButton.addEventListener('click', () => {
    hideElement(messageBox);
    if (callback && typeof callback === 'function') {
      callback();
    }
  });
  
  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === messageBox) {
      hideElement(messageBox);
      if (callback && typeof callback === 'function') {
        callback();
      }
      messageBox.removeEventListener('click', handleOverlayClick);
    }
  };
  
  messageBox.addEventListener('click', handleOverlayClick);
  
  // Handle escape key
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' && !messageBox.classList.contains('hidden')) {
      hideElement(messageBox);
      if (callback && typeof callback === 'function') {
        callback();
      }
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };
  
  document.addEventListener('keydown', handleEscapeKey);
  
  // Show message box
  showElement(messageBox);
  
  // Focus the OK button for accessibility
  setTimeout(() => newOkButton.focus(), 100);
}

// Function to update document language and direction
function updateDocumentLanguage(language) {
  const html = document.documentElement;
  const body = document.body;
  
  // Set language attribute
  html.lang = language;
  
  if (language === 'ar') {
    // Set RTL direction for Arabic
    html.dir = 'rtl';
    body.classList.add('rtl');
  } else {
    // Set LTR direction for other languages
    html.dir = 'ltr';
    body.classList.remove('rtl');
  }
}

// Function to update all translations
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
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = i18next.t(key);
  });
}

// Function to initialize mobile menu
function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mainNavUl = document.querySelector('.main-nav ul');
  const body = document.body;

  if (!mobileMenuToggle || !mainNavUl) return;

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';
  document.body.appendChild(overlay);

  // Toggle mobile menu
  mobileMenuToggle.addEventListener('click', () => {
    const isActive = mainNavUl.classList.contains('active');
    
    if (isActive) {
      // Close menu
      mainNavUl.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
      overlay.classList.remove('active');
      body.classList.remove('no-scroll');
    } else {
      // Open menu
      mainNavUl.classList.add('active');
      mobileMenuToggle.classList.add('active');
      overlay.classList.add('active');
      body.classList.add('no-scroll');
    }
  });

  // Close menu when clicking on navigation links
  const navLinks = mainNavUl.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mainNavUl.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
      overlay.classList.remove('active');
      body.classList.remove('no-scroll');
    });
  });

  // Close menu when clicking on overlay
  overlay.addEventListener('click', () => {
    mainNavUl.classList.remove('active');
    mobileMenuToggle.classList.remove('active');
    overlay.classList.remove('active');
    body.classList.remove('no-scroll');
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNavUl.classList.contains('active')) {
      mainNavUl.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
      overlay.classList.remove('active');
      body.classList.remove('no-scroll');
    }
  });
}

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
  return `${price.toFixed(2)} ${i18next.t('common.currency')}`;
}

export function formatDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
  const locale = i18next.t('common.locale');
  return new Date(dateString).toLocaleDateString(locale, options);
}

export function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
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

export function showLoading() {
  document.getElementById('loading-indicator').classList.remove('hidden');
}
export function hideLoading() {
  document.getElementById('loading-indicator').classList.add('hidden');
}

// Navigation visibility management
export async function updateNavigationVisibility() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get navigation elements
    const loginLink = document.querySelector('a[href="/login.html"]');
    const signupLink = document.querySelector('a[href="/owner-signup.html"]');
    const manageReservationLink = document.querySelector('a[href="/cancel-reservation.html"]');
    const myFieldsLink = document.querySelector('a[href="/place-fields.html"]');
    const adminReservationsLink = document.querySelector('a[href="/admin-reservations.html"]');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (session) {
      // User is logged in
      // Get user role via edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-role`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Hide login and signup links
        if (loginLink) hideElement(loginLink.parentElement);
        if (signupLink) hideElement(signupLink.parentElement);
        
        // Show logout button
        if (logoutBtn) showElement(logoutBtn.parentElement);
        
        // Show manage reservation only for playersformatPrice
        if (manageReservationLink) {
          if (userData.role === 'player') {
            showElement(manageReservationLink.parentElement);
          } else {
            hideElement(manageReservationLink.parentElement);
          }
        }
        
        // Show my fields link only for owners
        if (myFieldsLink) {
          if (userData.role === 'owner') {
            showElement(myFieldsLink.parentElement);
          } else {
            hideElement(myFieldsLink.parentElement);
          }
        }
        
        // Show admin reservations link only for admins
        if (adminReservationsLink) {
          if (userData.role === 'admin') {
            showElement(adminReservationsLink.parentElement);
          } else {
            hideElement(adminReservationsLink.parentElement);
          }
        }
      } else {
        // If we can't get user role, show default logged out state
        if (loginLink) showElement(loginLink.parentElement);
        if (signupLink) showElement(signupLink.parentElement);
        if (logoutBtn) hideElement(logoutBtn.parentElement);
        if (manageReservationLink) hideElement(manageReservationLink.parentElement);
        if (myFieldsLink) hideElement(myFieldsLink.parentElement);
        if (adminReservationsLink) hideElement(adminReservationsLink.parentElement);
      }
    } else {
      // User is not logged in
      // Show login and signup links
      if (loginLink) showElement(loginLink.parentElement);
      if (signupLink) showElement(signupLink.parentElement);
      
      // Hide logout button, manage reservation, my fields, and admin reservations
      if (logoutBtn) hideElement(logoutBtn.parentElement);
      if (manageReservationLink) hideElement(manageReservationLink.parentElement);
      if (myFieldsLink) hideElement(myFieldsLink.parentElement);
      if (adminReservationsLink) hideElement(adminReservationsLink.parentElement);
    }
  } catch (error) {
    console.error('Error updating navigation visibility:', error);
    // On error, show default (logged out) state
    const loginLink = document.querySelector('a[href="/login.html"]');
    const signupLink = document.querySelector('a[href="/owner-signup.html"]');
    const manageReservationLink = document.querySelector('a[href="/cancel-reservation.html"]');
    const myFieldsLink = document.querySelector('a[href="/place-fields.html"]');
    const adminReservationsLink = document.querySelector('a[href="/admin-reservations.html"]');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginLink) showElement(loginLink.parentElement);
    if (signupLink) showElement(signupLink.parentElement);
    if (logoutBtn) hideElement(logoutBtn.parentElement);
    if (manageReservationLink) hideElement(manageReservationLink.parentElement);
    if (myFieldsLink) hideElement(myFieldsLink.parentElement);
    if (adminReservationsLink) hideElement(adminReservationsLink.parentElement);
  }
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', () => {
  // Populate sport type select elements
  const sportTypeSelects = document.querySelectorAll('select[id="sport-type"]');
  if (sportTypeSelects.length > 0) {
    sportTypeSelects.forEach(select => {
      populateSportTypeSelect(select);
    });
  }
  
  // Populate city select elements
  const citySelects = document.querySelectorAll('select[id="city"]');
  if (citySelects.length > 0) {
    citySelects.forEach(select => {
      populateCitySelect(select);
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
  
  // Listen for language changes to update dropdowns
  document.addEventListener('languageChanged', () => {
    // Re-populate sport type selects
    const sportTypeSelects = document.querySelectorAll('select[id="sport-type"]');
    sportTypeSelects.forEach(select => {
      const currentValue = select.value;
      populateSportTypeSelect(select);
      select.value = currentValue; // Restore selection
    });
    
    // Re-populate city selects
    const citySelects = document.querySelectorAll('select[id="city"]');
    citySelects.forEach(select => {
      const currentValue = select.value;
      populateCitySelect(select);
      select.value = currentValue; // Restore selection
    });

    // Re-populate districts selects
    const districtSelects = document.querySelectorAll('select[id="district"]');
    districtSelects.forEach(select => {
      const currentValue = select.value;
      console.log(citySelects[0].value);
      populateDistricts(citySelects[0].value, select);
      select.value = currentValue; // Restore selection
    });
  });
});

// Helper function to populate districts select
export function populateDistricts(city, districtSelect) { 
  console.log(districtSelect);
  if (!city) {
    districtSelect.disabled = true;
    return;
  }
  
  // Get current language
  const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';

  var path = window.location.pathname;
  var page = path.split("/").pop();
  if(page === '') {
    // Clear existing districts
    districtSelect.innerHTML = '';
    // Add "All Districts" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = currentLanguage === 'ar' ? 'جميع المناطق' : 'All Districts';
    districtSelect.appendChild(allOption);
  }
  else {
    // Clear existing districts
    districtSelect.innerHTML = '<option value="" data-i18n="field.districtPlaceholder">Select District</option>';
  }
  
  // Get English districts for the values, but display localized names
  const englishDistricts = getDistrictsForCity(city, 'en');
  
  if (englishDistricts.length > 0) {
    districtSelect.disabled = false;
    
    englishDistricts.forEach(englishDistrict => {
      const option = document.createElement('option');
      option.value = englishDistrict; // Always store English value
      option.textContent = getLocalizedDistrict(city, englishDistrict, currentLanguage); // Display localized name
      districtSelect.appendChild(option);
    });
  } else {
    districtSelect.disabled = true;
  }
}

// Helper function to populate sport type select
function populateSportTypeSelect(select) {
  // Store current selection
  const currentValue = select.value;
  
  // Clear existing options except the first placeholder
  const placeholder = select.querySelector('option[value=""]');
  select.innerHTML = '';
  if (placeholder) {
    select.appendChild(placeholder.cloneNode(true));
  }
  
  // Add sport options with localized text
  Object.keys(SPORTS).forEach(sport => {
    const option = document.createElement('option');
    option.value = sport;
    option.textContent = i18next.t(`sports.${sport}`);
    select.appendChild(option);
  });
  
  // Restore selection
  select.value = currentValue;
}

// Helper function to populate city select
function populateCitySelect(select) {
  // Store current selection
  const currentValue = select.value;
  
  // Clear existing options except the first placeholder
  const placeholder = select.querySelector('option[value=""]');
  select.innerHTML = '';
  if (placeholder) {
    select.appendChild(placeholder.cloneNode(true));
  }
  
  // Add city options with localized text
  CITIES.forEach(city => {
    const option = document.createElement('option');
    option.value = city.toLowerCase();
    option.textContent = i18next.t(`cities.${city.toLowerCase()}`);
    select.appendChild(option);
  });
  
  // Restore selection
  select.value = currentValue;

}

//not used
function triggerChangeEvent(select) {
  // Raise the change event on the parent <select> element
  if ("createEvent" in document) {
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("change", false, true);
    select.dispatchEvent(evt);
  } else {
    // Fallback for older Internet Explorer versions
    select.fireEvent("onchange");
  }
}