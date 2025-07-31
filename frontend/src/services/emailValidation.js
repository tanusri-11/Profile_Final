// Email validation service using your backend API (recommended approach)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

// Alternative: Direct Mailboxlayer API (your current approach)
const MAILBOXLAYER_API_KEY = process.env.REACT_APP_MAILBOXLAYER_API_KEY;
const MAILBOXLAYER_BASE_URL = 'http://apilayer.net/api/check';

// Main email validation function - use backend API (recommended)
export const validateEmailWithAPI = async (email) => {
  try {
    if (!email || !validateEmailFormat(email)) {
      return {
        isValid: false,
        details: null,
        suggestion: null,
        error: 'Invalid email format',
        score: 0
      };
    }

    console.log(`🔍 Validating email via backend: ${email}`);
    
    // Use your backend API endpoint (recommended)
    const response = await fetch(`${API_BASE_URL}/api/validate-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error(`Backend API error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Backend email validation result:', data);
    
    return {
      isValid: data.isValid || false,
      details: {
        format_valid: data.details?.format_valid || false,
        mx_found: data.details?.mx_found || false,
        smtp_check: data.details?.smtp_check || false,
        score: data.details?.score || 0,
        email: email,
        user: data.additionalInfo?.user || email.split('@')[0],
        domain: data.additionalInfo?.domain || email.split('@')[1],
        catch_all: data.additionalInfo?.catch_all || false,
        role: data.additionalInfo?.role || false,
        disposable: data.additionalInfo?.disposable || false,
        free: data.additionalInfo?.free || false
      },
      suggestion: data.suggestion || null,
      score: data.details?.score || 0,
      reason: data.reason || 'Unknown'
    };

  } catch (backendError) {
    console.warn('⚠️ Backend validation failed, trying direct API:', backendError.message);
    
    // Fallback to direct Mailboxlayer API if backend fails
    return await validateEmailWithDirectAPI(email);
  }
};

// Fallback: Direct Mailboxlayer API validation
const validateEmailWithDirectAPI = async (email) => {
  try {
    if (!MAILBOXLAYER_API_KEY) {
      throw new Error('Email validation service not configured');
    }

    console.log(`🔍 Validating email via direct API: ${email}`);

    const response = await fetch(
      `${MAILBOXLAYER_BASE_URL}?access_key=${MAILBOXLAYER_API_KEY}&email=${encodeURIComponent(email)}&smtp=1&format=1`
    );

    if (!response.ok) {
      throw new Error(`Direct API error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Direct API email validation result:', data);
    
    // Return validation result with detailed information
    return {
      isValid: data.format_valid && data.mx_found && data.smtp_check,
      details: {
        email: data.email,
        user: data.user,
        domain: data.domain,
        format_valid: data.format_valid,
        mx_found: data.mx_found,
        smtp_check: data.smtp_check,
        catch_all: data.catch_all,
        role: data.role,
        disposable: data.disposable,
        free: data.free,
        score: data.score
      },
      suggestion: data.did_you_mean || null,
      score: data.score || 0,
      reason: !data.format_valid ? 'Invalid format' : 
              !data.mx_found ? 'MX record not found' : 
              !data.smtp_check ? 'SMTP check failed' : 'Valid'
    };
  } catch (error) {
    console.error('❌ Email validation error:', error);
    return {
      isValid: false,
      error: error.message,
      details: {
        format_valid: validateEmailFormat(email),
        mx_found: false,
        smtp_check: false,
        score: 0
      },
      suggestion: null,
      score: 0,
      reason: 'Validation service unavailable'
    };
  }
};

// Basic email format validation (fallback)
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utility function to determine if email validation should be performed
export const shouldValidateEmail = (isEditMode, currentEmail, originalEmail) => {
  // Only validate for new profiles (create mode)
  if (!isEditMode) {
    console.log('🆕 Create mode: Email validation required');
    return true;
  }
  
  // Skip validation for edit mode
  console.log('✏️ Edit mode: Skipping email validation');
  return false;
};

// Utility function to get appropriate validation message
export const getEmailValidationMessage = (validationResult, isEditMode, isUnchanged = false) => {
  if (isEditMode && isUnchanged) {
    return 'Email validation skipped for existing profile';
  }
  
  if (!validationResult) {
    return 'Email validation pending...';
  }

  if (validationResult.error) {
    return `Email validation failed: ${validationResult.error}`;
  }

  if (validationResult.isValid) {
    return 'Email verified successfully ✓';
  }

  // Provide specific error messages
  const { details, reason, suggestion } = validationResult;
  let message = reason || 'Email validation failed';
  
  if (suggestion) {
    message += ` (Did you mean: ${suggestion}?)`;
  }
  
  return message;
};

// Test email validation service
export const testEmailValidationService = async () => {
  try {
    const testEmail = 'test@example.com';
    const result = await validateEmailWithAPI(testEmail);
    console.log('📧 Email validation test:', result);
    return !result.error;
  } catch (error) {
    console.error('❌ Email validation test failed:', error);
    return false;
  }
};

export default {
  validateEmailWithAPI,
  validateEmailFormat,
  shouldValidateEmail,
  getEmailValidationMessage,
  testEmailValidationService
};
