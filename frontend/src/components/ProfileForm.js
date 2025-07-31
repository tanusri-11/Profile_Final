import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Avatar,
  FormHelperText,
  Snackbar,
  InputAdornment,
  IconButton,
  Chip,
  Card,
  CardContent,
  Divider,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
  CheckCircle, 
  Error, 
  Email, 
  Phone, 
  Person, 
  Cake,
  Numbers,
  Wc,
  Verified
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { profileAPI, validateEmailWithAPI } from '../services/api'; // Import both functions

// Email validation service functions
const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const ProfileForm = ({ profileId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    phone_number: '',
    date_of_birth: null,
    gender: ''
  });
  
  const [validation, setValidation] = useState({
    name: { isValid: false, message: '' },
    age: { isValid: false, message: '' },
    email: { isValid: false, message: '', isValidating: false, apiValidated: false },
    phone_number: { isValid: false, message: '' },
    date_of_birth: { isValid: false, message: '' },
    gender: { isValid: false, message: '' },
    ageAndDateMatch: { isValid: false, message: '' }
  });
  
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [emailValidationResult, setEmailValidationResult] = useState(null);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const today = dayjs();
    const birth = dayjs(dateOfBirth);
    return today.diff(birth, 'year');
  };

  // Calculate birth year from age
  const calculateBirthYear = (age) => {
    const currentYear = dayjs().year();
    return currentYear - parseInt(age);
  };

  // Load profile data for editing
  useEffect(() => {
    if (profileId) {
      loadProfile(profileId);
    }
  }, [profileId]);

  // Auto-calculate age when date of birth changes and validate age-date matching
  useEffect(() => {
    if (formData.date_of_birth) {
      const calculatedAge = calculateAge(formData.date_of_birth);
      if (calculatedAge !== parseInt(formData.age)) {
        setFormData(prev => ({
          ...prev,
          age: calculatedAge.toString()
        }));
      }
      validateField('age', calculatedAge.toString());
      validateAgeAndDateMatch(calculatedAge.toString(), formData.date_of_birth);
    }
  }, [formData.date_of_birth]);

  // Auto-calculate birth year when age changes and validate age-date matching
  useEffect(() => {
    if (formData.age && !formData.date_of_birth) {
      const age = parseInt(formData.age);
      if (age > 0 && age < 120) {
        const birthYear = calculateBirthYear(age);
        const estimatedBirthDate = dayjs(`${birthYear}-01-01`);
        setFormData(prev => ({
          ...prev,
          date_of_birth: estimatedBirthDate
        }));
      }
    }
    if (formData.age && formData.date_of_birth) {
      validateAgeAndDateMatch(formData.age, formData.date_of_birth);
    }
  }, [formData.age]);

  // UPDATED: Load profile from actual database
  const loadProfile = async (id) => {
    try {
      setLoading(true);
      const response = await profileAPI.getProfileById(id);
      const profile = response.data;
      const profileData = {
        ...profile,
        date_of_birth: profile.date_of_birth ? dayjs(profile.date_of_birth) : null
      };
      setFormData(profileData);
      
      // Validate all fields for existing profile
      Object.keys(profileData).forEach(field => {
        if (field !== 'id') {
          validateField(field, profileData[field]);
        }
      });
      
      // Validate age and date matching
      if (profileData.age && profileData.date_of_birth) {
        validateAgeAndDateMatch(profileData.age, profileData.date_of_birth);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load profile data: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAgeAndDateMatch = (age, dateOfBirth) => {
    if (!age || !dateOfBirth) {
      setValidation(prev => ({
        ...prev,
        ageAndDateMatch: { isValid: false, message: '' }
      }));
      return false;
    }

    const calculatedAge = calculateAge(dateOfBirth);
    const enteredAge = parseInt(age);
    const isMatch = calculatedAge === enteredAge;

    setValidation(prev => ({
      ...prev,
      ageAndDateMatch: { 
        isValid: isMatch, 
        message: isMatch ? '' : 'Age and date of birth do not match'
      }
    }));

    return isMatch;
  };

  // UPDATED: Use the API function from services/api.js
  const validateEmailWithAPICall = async (email) => {
    if (!email || !validateEmailFormat(email)) {
      return false;
    }

    setValidation(prev => ({
      ...prev,
      email: { ...prev.email, isValidating: true }
    }));

    try {
      const result = await validateEmailWithAPI(email); // Use imported function
      setEmailValidationResult(result);
      
      const isValid = result.isValid;
      let message = '';
      
      if (isValid) {
        message = 'Email verified successfully ✓';
      } else {
        // Provide specific error message based on validation result
        if (!result.details.format_valid) {
          message = 'Email format is invalid - please check your email address';
        } else if (!result.details.mx_found) {
          message = 'Email domain does not exist - please verify the domain';
        } else if (!result.details.smtp_check) {
          message = 'Email address cannot receive emails - please check the address';
        } else if (result.details.score < 0.6) {
          message = 'Email address quality is too low - please use a different email';
        } else {
          message = `Email validation failed: ${result.reason}`;
        }
        
        // Show suggestion if available
        if (result.suggestion) {
          message += ` (Did you mean: ${result.suggestion}?)`;
        }
      }
      
      setValidation(prev => ({
        ...prev,
        email: { 
          isValid, 
          message,
          isValidating: false,
          apiValidated: true
        }
      }));

      return isValid;
    } catch (error) {
      console.error('Email validation error:', error);
      setValidation(prev => ({
        ...prev,
        email: { 
          isValid: false, 
          message: 'Email validation service is currently unavailable. Please try again later.',
          isValidating: false,
          apiValidated: false
        }
      }));
      
      setSnackbar({
        open: true,
        message: 'Unable to validate email: ' + error.message,
        severity: 'warning'
      });
      
      return false;
    }
  };

  const validateField = async (fieldName, value) => {
    let isValid = false;
    let message = '';

    switch (fieldName) {
      case 'name':
        isValid = value && value.trim().length >= 2;
        message = !value ? 'Name is required' : (!isValid ? 'Name must be at least 2 characters' : '');
        setValidation(prev => ({
          ...prev,
          [fieldName]: { isValid, message }
        }));
        break;
        
      case 'age':
        const ageNum = parseInt(value);
        isValid = value && ageNum > 0 && ageNum <= 120;
        message = !value ? 'Age is required' : (!isValid ? 'Age must be between 1 and 120' : '');
        setValidation(prev => ({
          ...prev,
          [fieldName]: { isValid, message }
        }));
        break;
        
      case 'email':
        if (!value) {
          setValidation(prev => ({
            ...prev,
            email: { isValid: false, message: 'Email is required', isValidating: false, apiValidated: false }
          }));
          return false;
        }
        
        if (!validateEmailFormat(value)) {
          setValidation(prev => ({
            ...prev,
            email: { isValid: false, message: 'Please enter a valid email format', isValidating: false, apiValidated: false }
          }));
          return false;
        }
        
        // Perform API validation
        return await validateEmailWithAPICall(value);
        
      case 'phone_number':
        // Enhanced phone validation - exactly 10 digits (can include spaces, dashes, parentheses)
        const cleanPhone = value ? value.replace(/[\s\-\(\)]/g, '') : '';
        const phoneRegex = /^\d{10}$/;
        isValid = value && phoneRegex.test(cleanPhone);
        message = !value ? 'Phone number is required' : (!isValid ? 'Please enter exactly 10 digits' : '');
        setValidation(prev => ({
          ...prev,
          [fieldName]: { isValid, message }
        }));
        break;
        
      case 'date_of_birth':
        isValid = value && dayjs(value).isValid() && dayjs(value).isBefore(dayjs());
        message = !value ? 'Date of birth is required' : (!isValid ? 'Please enter a valid birth date' : '');
        setValidation(prev => ({
          ...prev,
          [fieldName]: { isValid, message }
        }));
        break;
        
      case 'gender':
        isValid = value && ['Male', 'Female', 'Other'].includes(value);
        message = !value ? 'Please select your gender' : '';
        setValidation(prev => ({
          ...prev,
          [fieldName]: { isValid, message }
        }));
        break;
        
      default:
        break;
    }

    return isValid;
  };

  const handleInputChange = async (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validate field on change
    await validateField(field, value);
    
    // If age or date_of_birth changed, validate their matching
    if (field === 'age' || field === 'date_of_birth') {
      const otherField = field === 'age' ? formData.date_of_birth : formData.age;
      const currentValue = field === 'age' ? value : formData.age;
      const currentDateOfBirth = field === 'date_of_birth' ? value : formData.date_of_birth;
      
      if (otherField) {
        validateAgeAndDateMatch(currentValue, currentDateOfBirth);
      }
    }
  };

  const getAvatarSrc = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return '/images/boy.svg';
      case 'female':
        return '/images/girl.svg';
      case 'other':
        return '/images/other.svg';
      default:
        return '/images/boy.svg'; // Default avatar
    }
  };

  const isFormValid = () => {
    const mainFieldsValid = Object.entries(validation)
      .filter(([key]) => key !== 'ageAndDateMatch')
      .every(([, field]) => field.isValid);
    
    return mainFieldsValid && validation.ageAndDateMatch.isValid && validation.email.apiValidated;
  };

  // UPDATED: Save to actual database
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const fieldsToValidate = ['name', 'age', 'email', 'phone_number', 'date_of_birth', 'gender'];
    let allValid = true;
    
    for (const field of fieldsToValidate) {
      const isValid = await validateField(field, formData[field]);
      if (!isValid) allValid = false;
    }

    // Validate age and date matching
    if (!validateAgeAndDateMatch(formData.age, formData.date_of_birth)) {
      allValid = false;
    }

    // Check if email is API validated
    if (!validation.email.apiValidated) {
      setSnackbar({
        open: true,
        message: 'Please wait for email validation to complete',
        severity: 'warning'
      });
      return;
    }

    if (!allValid) {
      setSnackbar({
        open: true,
        message: 'Please fix all validation errors before submitting',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        date_of_birth: formData.date_of_birth.format('YYYY-MM-DD'),
        // Clean phone number before submitting (remove spaces, dashes, parentheses)
        phone_number: formData.phone_number.replace(/[\s\-\(\)]/g, '')
      };

      let response;
      if (profileId) {
        // Update existing profile
        response = await profileAPI.updateProfile(profileId, submitData);
      } else {
        // Create new profile
        response = await profileAPI.createProfile(submitData);
      }
      
      setSnackbar({
        open: true,
        message: profileId ? 'Profile updated successfully! ✓' : 'Profile created successfully! ✓',
        severity: 'success'
      });

      // Reset form for new profile creation
      if (!profileId) {
        setFormData({
          name: '',
          age: '',
          email: '',
          phone_number: '',
          date_of_birth: null,
          gender: ''
        });
        setValidation({
          name: { isValid: false, message: '' },
          age: { isValid: false, message: '' },
          email: { isValid: false, message: '', isValidating: false, apiValidated: false },
          phone_number: { isValid: false, message: '' },
          date_of_birth: { isValid: false, message: '' },
          gender: { isValid: false, message: '' },
          ageAndDateMatch: { isValid: false, message: '' }
        });
        setEmailValidationResult(null);
      }

      if (onSuccess) {
        setTimeout(() => onSuccess(response), 1500);
      }

    } catch (error) {
      console.error('Error saving profile:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save profile: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && profileId) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper 
        elevation={6} 
        sx={{ 
          p: 4, 
          maxWidth: 800, 
          mx: 'auto', 
          fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        {/* Avatar Section */}
        <Box display="flex" justifyContent="center" mb={4}>
          <Avatar
            src={getAvatarSrc(formData.gender)}
            sx={{ 
              width: 120, 
              height: 120,
              border: '4px solid white',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              bgcolor: '#f5f5f5'
            }}
          />
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Personal Information Section */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                  <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  {/* Name Field - Full Width */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      variant="outlined"
                      required
                      error={!!validation.name.message}
                      helperText={validation.name.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: validation.name.isValid && (
                          <InputAdornment position="end">
                            <CheckCircle color="success" />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  {/* Age and Date of Birth - Side by Side */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      variant="outlined"
                      required
                      error={!!validation.age.message || !!validation.ageAndDateMatch.message}
                      helperText={validation.age.message || validation.ageAndDateMatch.message}
                      inputProps={{ min: 1, max: 120 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Numbers color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (validation.age.isValid && validation.ageAndDateMatch.isValid) && (
                          <InputAdornment position="end">
                            <CheckCircle color="success" />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date of Birth"
                      value={formData.date_of_birth}
                      onChange={(newValue) => handleInputChange('date_of_birth', newValue)}
                      maxDate={dayjs().subtract(1, 'day')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          variant: 'outlined',
                          error: !!validation.date_of_birth.message || !!validation.ageAndDateMatch.message,
                          helperText: validation.date_of_birth.message || validation.ageAndDateMatch.message,
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Cake color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: (validation.date_of_birth.isValid && validation.ageAndDateMatch.isValid) && (
                              <InputAdornment position="end">
                                <CheckCircle color="success" />
                              </InputAdornment>
                            )
                          }
                        }
                      }}
                    />
                  </Grid>

                  {/* Gender Field */}
                  <Grid item xs={12}>
                    <FormControl component="fieldset" error={!!validation.gender.message} fullWidth>
                      <FormLabel component="legend" sx={{ fontFamily: 'Roboto', fontWeight: 'bold', mb: 2 }}>
                        <Wc sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Gender *
                      </FormLabel>
                      <RadioGroup
                        row
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        sx={{ justifyContent: 'space-around', mt: 1 }}
                      >
                        <FormControlLabel 
                          value="Male" 
                          control={<Radio />} 
                          label="Male"
                          sx={{ 
                            fontFamily: 'Roboto',
                            border: formData.gender === 'Male' ? '2px solid #1976d2' : '2px solid transparent',
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <FormControlLabel 
                          value="Female" 
                          control={<Radio />} 
                          label="Female"
                          sx={{ 
                            fontFamily: 'Roboto',
                            border: formData.gender === 'Female' ? '2px solid #e91e63' : '2px solid transparent',
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <FormControlLabel 
                          value="Other" 
                          control={<Radio />} 
                          label="Other"
                          sx={{ 
                            fontFamily: 'Roboto',
                            border: formData.gender === 'Other' ? '2px solid #9c27b0' : '2px solid transparent',
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            transition: 'all 0.3s ease'
                          }}
                        />
                      </RadioGroup>
                      {validation.gender.message && (
                        <FormHelperText>{validation.gender.message}</FormHelperText>
                      )}
                      {validation.gender.isValid && (
                        <Box display="flex" alignItems="center" mt={1}>
                          <CheckCircle color="success" fontSize="small" />
                          <Typography variant="caption" color="success.main" ml={1}>
                            Gender selected
                          </Typography>
                        </Box>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Contact Information Section */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                  <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  {/* Email Field - Full Width with API Validation */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      variant="outlined"
                      required
                      error={!!validation.email.message}
                      helperText={
                        <Box>
                          {validation.email.message}
                          {emailValidationResult && emailValidationResult.suggestion && (
                            <Box mt={1}>
                              <Chip 
                                label={`Did you mean: ${emailValidationResult.suggestion}?`}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            </Box>
                          )}
                        </Box>
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {validation.email.isValidating ? (
                              <CircularProgress size={20} />
                            ) : validation.email.isValid && validation.email.apiValidated ? (
                              <Verified color="success" />
                            ) : validation.email.message && !validation.email.isValidating ? (
                              <Error color="error" />
                            ) : null}
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  {/* Phone Number Field - Full Width */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      variant="outlined"
                      required
                      error={!!validation.phone_number.message}
                      helperText={validation.phone_number.message}
                      placeholder="1234567890"
                      inputProps={{ maxLength: 15 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: validation.phone_number.isValid && (
                          <InputAdornment position="end">
                            <CheckCircle color="success" />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Email Validation Details */}
            {emailValidationResult && emailValidationResult.details && (
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                    <Verified sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Email Validation Details
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Chip 
                        label={`Format: ${emailValidationResult.details.format_valid ? 'Valid' : 'Invalid'}`}
                        color={emailValidationResult.details.format_valid ? 'success' : 'error'}
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Chip 
                        label={`MX Record: ${emailValidationResult.details.mx_found ? 'Found' : 'Not Found'}`}
                        color={emailValidationResult.details.mx_found ? 'success' : 'error'}
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Chip 
                        label={`SMTP: ${emailValidationResult.details.smtp_check ? 'Valid' : 'Invalid'}`}
                        color={emailValidationResult.details.smtp_check ? 'success' : 'error'}
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Chip 
                        label={`Score: ${emailValidationResult.details.score}`}
                        color={emailValidationResult.details.score > 0.7 ? 'success' : 'warning'}
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Box display="flex" justifyContent="center" gap={2} mt={4}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  sx={{ 
                    minWidth: 140, 
                    fontFamily: 'Roboto',
                    borderRadius: 2,
                    py: 1.5
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={!isFormValid() || loading || validation.email.isValidating}
                sx={{ 
                  minWidth: 140, 
                  fontFamily: 'Roboto',
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <>
                    {profileId ? 'Update Profile' : 'Create Profile'}
                    {isFormValid() && <CheckCircle sx={{ ml: 1 }} />}
                  </>
                )}
              </Button>
            </Box>
          </Stack>
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </LocalizationProvider>
  );
};

export default ProfileForm;
