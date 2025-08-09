import { supabase, isValidJordanianPhone, showElement, hideElement, showError, formatJordanianPhone } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  const requestOtpForm = document.getElementById('request-otp-form');
  const resetPasswordForm = document.getElementById('reset-password-form');
  const resendOtpBtn = document.getElementById('resend-otp-btn');
  
  let identifier = '';
  
  // Step 1: Request OTP
  requestOtpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    identifier = document.getElementById('identifier').value.trim();
    
    // Validate input
    if (!identifier) {
      showError('reset-error', 'Phone number is required');
      return;
    }
    
    // Only accept phone numbers now
    if (!isValidJordanianPhone(identifier)) {
      showError('reset-error', 'Please enter a valid Jordanian phone number (07xxxxxxxx)');
      return;
    }
    
    try {
      const formattedPhone = formatJordanianPhone(identifier);
      await requestPhoneOTP(formattedPhone);
      
      // Show the OTP verification form
      hideElement(requestOtpForm);
      showElement(resetPasswordForm);
    } catch (error) {
      showError('reset-error', error.message || 'Failed to send verification code');
      console.error('Reset password error:', error);
    }
  });
  
  // Step 2: Verify OTP and Reset Password
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const otp = document.getElementById('otp').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate inputs
    if (!otp) {
      showError('reset-error', 'Verification code is required');
      return;
    }
    
    if (!newPassword || !confirmPassword) {
      showError('reset-error', 'Both password fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showError('reset-error', 'Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      showError('reset-error', 'Password must be at least 6 characters long');
      return;
    }
    
    try {
      const formattedPhone = formatJordanianPhone(identifier);
      await verifyPhoneOTPAndResetPassword(formattedPhone, otp, newPassword);
      
      // Show success message and redirect to login
      alert('Password has been reset successfully. You can now log in with your new password.');
      window.location.href = '/login.html';
    } catch (error) {
      showError('reset-error', error.message || 'Failed to reset password');
      console.error('Reset password error:', error);
    }
  });
  
  // Resend OTP
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async () => {
      if (!identifier) {
        showError('reset-error', 'Missing phone number');
        return;
      }
      
      try {
        const formattedPhone = formatJordanianPhone(identifier);
        await requestPhoneOTP(formattedPhone);
        alert('A new verification code has been sent!');
      } catch (error) {
        showError('reset-error', error.message || 'Failed to resend verification code');
        console.error('Resend OTP error:', error);
      }
    });
  }
  
  // Helper Functions
  async function requestPhoneOTP(phone) {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    
    if (error) throw error;
  }
  
  async function verifyPhoneOTPAndResetPassword(phone, token, newPassword) {
    // First verify the OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    if (verifyError) throw verifyError;
    
    // Then update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (updateError) throw updateError;
  }
});