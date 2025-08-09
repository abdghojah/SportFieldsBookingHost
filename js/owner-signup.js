import { supabase, isValidJordanianPhone, showElement, hideElement, showError, formatJordanianPhone, updateNavigationVisibility, showMessageBox } from './main.js';
import i18next from './translations.js';

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const verifyOtpForm = document.getElementById('verify-otp-form');
  const resendOtpBtn = document.getElementById('resend-otp-btn');
  const countdownText = document.getElementById('countdown-text');
  const roleSelect = document.getElementById('role');
  const nameGroup = document.getElementById('name-group');
  const nameInput = document.getElementById('name');
  const secondaryPhoneGroup = document.getElementById('secondary-phone-group');
  const secondaryPhoneInput = document.getElementById('secondary-phone');
  
  let identifier = '';
  let password = '';
  let selectedRole = '';
  let playerName = '';
  let secondaryPhone = '';
  let cooldownTimer = null;
  let cooldownSeconds = 0;
  
  // Show/hide fields based on role selection
  roleSelect.addEventListener('change', (e) => {
    const role = e.target.value;
    
    console.log('Role selected:', role); // Debug log
    
    if (role === 'player') {
      console.log('Showing name field for player'); // Debug log
      showElement(nameGroup);
      nameInput.required = true;
      hideElement(secondaryPhoneGroup);
      secondaryPhoneInput.required = false;
      secondaryPhoneInput.value = '';
    } else if (role === 'owner') {
      console.log('Showing secondary phone field for owner'); // Debug log
      hideElement(nameGroup);
      nameInput.required = false;
      nameInput.value = '';
      showElement(secondaryPhoneGroup);
      secondaryPhoneInput.required = false;
    } else {
      console.log('Hiding all conditional fields'); // Debug log
      hideElement(nameGroup);
      hideElement(secondaryPhoneGroup);
      nameInput.required = false;
      secondaryPhoneInput.required = false;
      nameInput.value = '';
      secondaryPhoneInput.value = '';
    }
  });
  
  // Step 1: Initial Signup
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    identifier = document.getElementById('identifier').value.trim();
    password = document.getElementById('password').value;
    selectedRole = document.getElementById('role').value;
    playerName = document.getElementById('name').value.trim();
    secondaryPhone = document.getElementById('secondary-phone').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value;
    
    console.log('Form submission:', { selectedRole, playerName, secondaryPhone }); // Debug log
    
    // Validate inputs
    if (!selectedRole) {
      showError('signup-error', 'Please select an account type');
      return;
    }
    
    if (!identifier || !password || !confirmPassword) {
      showError('signup-error', 'All required fields must be filled');
      return;
    }
    
    if (selectedRole === 'player' && !playerName) {
      showError('signup-error', 'Name is required for player accounts');
      return;
    }
    
    if (password !== confirmPassword) {
      showError('signup-error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      showError('signup-error', 'Password must be at least 6 characters long');
      return;
    }
    
    // Validate phone numbers
    if (!isValidJordanianPhone(identifier)) {
      showError('signup-error', 'Please enter a valid Jordanian phone number (07xxxxxxxx)');
      return;
    }
    
    if (secondaryPhone && !isValidJordanianPhone(secondaryPhone)) {
      showError('signup-error', 'Please enter a valid secondary phone number (07xxxxxxxx)');
      return;
    }
    
    try {
      // Request OTP for phone verification
      await signUpWithPhone(identifier, password);
      
      // Show OTP verification form
      hideElement(signupForm);
      showElement(verifyOtpForm);
      
      // Start cooldown timer
      startCooldown();
    } catch (error) {
      showError('signup-error', error.message || 'Failed to create account');
      console.error('Signup error:', error);
    }
  });
  
  // Step 2: Verify OTP
  verifyOtpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const otp = document.getElementById('otp').value.trim();
    
    if (!otp) {
      showError('signup-error', 'Please enter the verification code');
      return;
    }
    
    try {
      // Verify phone OTP and update user role
      await verifyOTPAndSetRole(identifier, otp, selectedRole, playerName, secondaryPhone);
      
      // Update navigation visibility
      await updateNavigationVisibility();
      
      // Redirect based on role
      showMessageBox('Success', 'Account created successfully! You can now login.', 'success', () => {
        window.location.href = '/login.html';
      });
    } catch (error) {
      showError('signup-error', error.message || 'Failed to verify code');
      console.error('OTP verification error:', error);
    }
  });
  
  // Resend OTP
  resendOtpBtn.addEventListener('click', async () => {
    if (cooldownSeconds > 0) {
      return;
    }

    try {
      await requestOTP(identifier);
      startCooldown();
      showMessageBox('Info', 'A new verification code has been sent!', 'info');
    } catch (error) {
      showError('signup-error', error.message || 'Failed to resend verification code');
      console.error('Resend OTP error:', error);
    }
  });
  
  // Helper Functions
  function startCooldown() {
    cooldownSeconds = 60;
    updateResendButton();

    if (cooldownTimer) {
      clearInterval(cooldownTimer);
    }

    cooldownTimer = setInterval(() => {
      cooldownSeconds--;
      updateResendButton();

      if (cooldownSeconds <= 0) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }, 1000);
  }

  function updateResendButton() {
    if (cooldownSeconds > 0) {
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = i18next.t('auth.resendCode');
      
      // Show countdown in separate element
      showElement(countdownText);
      countdownText.querySelector('span').textContent = i18next.t('common.cooldown', { seconds: cooldownSeconds });
    } else {
      resendOtpBtn.disabled = false;
      resendOtpBtn.textContent = i18next.t('auth.resendCode');
      
      // Hide countdown
      hideElement(countdownText);
    }
  }
  
  async function requestOTP(phone) {
    const formattedPhone = formatJordanianPhone(phone);
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone
    });
  
    if (error) {
      throw new Error(error.message || 'Failed to send verification code');
    }
    return data;
  }

  async function verifyOTPAndSetRole(phone, code, role, name = '', secondaryPhone = '') {
    const formattedPhone = formatJordanianPhone(phone);
    
    console.log('Verifying OTP with data:', { role, name, secondaryPhone }); // Debug log
    
    // First verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: code,
      type: 'sms'
    });
  
    if (error) {
      throw new Error(error.message || 'Failed to verify code');
    }

    // Update user role, name, and secondary phone using edge function
    const updateData = { role };
    if (name) updateData.name = name;
    if (secondaryPhone) updateData.secondaryPhone = formatJordanianPhone(secondaryPhone);

    console.log('Sending update data:', updateData); // Debug log

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-role`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to set user role');
    }

    return data;
  }

  async function signUpWithPhone(phone, password) {
    const formattedPhone = formatJordanianPhone(phone);
    const { data, error } = await supabase.auth.signUp({
      phone: formattedPhone,
      password: password
    });

    if (error) throw error;
  }
});