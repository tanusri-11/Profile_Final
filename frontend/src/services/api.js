import axios from 'axios';

// Updated API base URL to use environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  }
});

// Utility function to validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ADDED: Email validation API function
export const validateEmailWithAPI = async (email) => {
  try {
    // Call your backend API endpoint for email validation
    const response = await api.post('/api/validate-email', { email });
    return response.data;
  } catch (error) {
    console.error('Email validation API failed:', error);
    throw error;
  }
};

// Utility function to calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Utility function to calculate birth year from age
export const calculateBirthYear = (age) => {
  if (!age || age <= 0) return new Date().getFullYear();
  
  const currentYear = new Date().getFullYear();
  return currentYear - age;
};

// API calls
export const profileAPI = {
  // Get all profiles with pagination support
  getAllProfiles: async (page = 1, limit = 5) => {
    try {
      console.log(`Fetching profiles - Page: ${page}, Limit: ${limit}`);
      
      const response = await api.get('/profiles', {
        params: { page, limit }
      });
      
      console.log('Profiles fetched successfully:', response.data);
      
      // Handle both paginated and simple array responses
      if (response.data.profiles) {
        return response;
      }
      
      // If backend returns a simple array, simulate pagination
      const allProfiles = response.data;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const profiles = allProfiles.slice(startIndex, endIndex);
      const totalPages = Math.ceil(allProfiles.length / limit);
      
      return {
        data: {
          profiles: profiles,
          total: allProfiles.length,
          totalPages: totalPages,
          currentPage: page,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching profiles:', error);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Failed to fetch')) {
        throw new Error('Server is not running. Please start the backend server.');
      }
      throw error;
    }
  },
  
  // Get single profile by ID
  getProfileById: async (id) => {
    try {
      console.log(`Fetching profile with ID: ${id}`);
      const response = await api.get(`/profiles/${id}`);
      console.log('Profile fetched successfully:', response.data);
      return response;
    } catch (error) {
      console.error(`Error fetching profile ${id}:`, error);
      if (error.response?.status === 404) {
        throw new Error('Profile not found');
      }
      if (error.code === 'ECONNREFUSED' || error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },
  
  // Get most recent profile
  getRecentProfile: async () => {
    try {
      console.log('Fetching most recent profile...');
      const response = await api.get('/profiles/recent/latest');
      console.log('Recent profile fetched successfully:', response.data);
      return response;
    } catch (error) {
      console.log('Recent profile endpoint not available, trying fallback...');
      // Fallback: get all profiles and return the most recent one
      try {
        const allProfiles = await api.get('/profiles');
        const profiles = allProfiles.data;
        
        if (Array.isArray(profiles) && profiles.length > 0) {
          // If it's paginated response, use profiles array
          const profilesArray = profiles.profiles || profiles;
          const mostRecent = profilesArray[profilesArray.length - 1];
          console.log('Recent profile from fallback:', mostRecent);
          return { data: mostRecent };
        }
        
        console.log('No profiles found');
        return { data: null };
      } catch (fallbackError) {
        console.error('Error fetching recent profile (fallback):', fallbackError);
        return { data: null };
      }
    }
  },
  
  // Create new profile
  createProfile: async (profileData) => {
    try {
      console.log('Creating new profile:', profileData);
      
      // Validate required fields
      const requiredFields = ['name', 'age', 'email', 'phone_number', 'date_of_birth', 'gender'];
      for (const field of requiredFields) {
        if (!profileData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      const response = await api.post('/profiles', profileData);
      console.log('Profile created successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating profile:', error);
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please ensure the backend is running.');
      }
      
      throw error;
    }
  },
  
  // Update profile
  updateProfile: async (id, profileData) => {
    try {
      console.log(`Updating profile ${id}:`, profileData);
      
      // Validate required fields
      const requiredFields = ['name', 'age', 'email', 'phone_number', 'date_of_birth', 'gender'];
      for (const field of requiredFields) {
        if (!profileData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      const response = await api.put(`/profiles/${id}`, profileData);
      console.log('Profile updated successfully:', response.data);
      return response;
    } catch (error) {
      console.error(`Error updating profile ${id}:`, error);
      
      if (error.response?.status === 404) {
        throw new Error('Profile not found');
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please ensure the backend is running.');
      }
      
      throw error;
    }
  },
  
  // Delete profile
  deleteProfile: async (id) => {
    try {
      console.log(`Deleting profile ${id}`);
      const response = await api.delete(`/profiles/${id}`);
      console.log('Profile deleted successfully:', response.data);
      return response;
    } catch (error) {
      console.error(`Error deleting profile ${id}:`, error);
      
      if (error.response?.status === 404) {
        throw new Error('Profile not found');
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please ensure the backend is running.');
      }
      
      throw error;
    }
  }
};

// Add request interceptor for debugging and error handling
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method.toUpperCase()} request to ${config.baseURL}${config.url}`);
    if (config.data) {
      console.log('📤 Request data:', config.data);
    }
    if (config.params) {
      console.log('📤 Request params:', config.params);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from ${response.config.url}:`, response.status);
    console.log('📥 Response data:', response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('❌ Server Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
    } else {
      // Something else happened
      console.error('❌ Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Test API connection
export const testConnection = async () => {
  try {
    const response = await api.get('/');
    console.log('✅ API Connection Test Successful:', response.data);
    console.log(`🔗 Connected to: ${API_BASE_URL}`);
    return true;
  } catch (error) {
    console.error('❌ API Connection Test Failed:', error.message);
    console.error(`🔗 Failed to connect to: ${API_BASE_URL}`);
    return false;
  }
};

export default api;
