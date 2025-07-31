// Email validation service using Mailboxlayer API
const MAILBOXLAYER_API_KEY = process.env.REACT_APP_MAILBOXLAYER_API_KEY;
const MAILBOXLAYER_BASE_URL = 'http://apilayer.net/api/check';

export const validateEmailWithAPI = async (email) => {
  try {
    if (!MAILBOXLAYER_API_KEY) {
      throw new Error('API key not configured');
    }

    const response = await fetch(
      `${MAILBOXLAYER_BASE_URL}?access_key=${MAILBOXLAYER_API_KEY}&email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return validation result with detailed information
    return {
      isValid: data.format_valid && data.mx_found && data.smtp_check,
      details: {
        email: data.email,
        did_you_mean: data.did_you_mean,
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
      score: data.score || 0
    };
  } catch (error) {
    console.error('Email validation error:', error);
    return {
      isValid: false,
      error: error.message,
      details: null,
      suggestion: null,
      score: 0
    };
  }
};

// Basic email format validation (fallback)
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
