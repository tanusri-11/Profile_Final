import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CardContent,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Pagination,
  Snackbar,
  Fab,
  Tooltip,
  Zoom,
  DialogContentText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Card
} from '@mui/material';
import {
  PersonAdd,
  Edit,
  Delete,
  Email,
  Phone,
  Cake,
  Wc,
  Home as HomeIcon,
  AccountCircle,
  Search,
  Clear,
  FilterList,
  Refresh,
  Person,
  Numbers,
  Visibility,
  TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { profileAPI, testConnection } from '../services/api';
import ProfileForm from '../components/ProfileForm';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [recentProfile, setRecentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, profile: null });
  const [editDialog, setEditDialog] = useState({ open: false, profileId: null });
  const [viewDialog, setViewDialog] = useState({ open: false, profile: null });
  
  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    gender: '',
    ageGroup: ''
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const profilesPerPage = 5;

  // Age groups for filtering
  const ageGroups = [
    { value: '0-18', label: '0-18 years' },
    { value: '19-30', label: '19-30 years' },
    { value: '31-45', label: '31-45 years' },
    { value: '46-60', label: '46-60 years' },
    { value: '60+', label: '60+ years' }
  ];

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (!connectionError) {
      loadData();
    }
  }, [currentPage, connectionError]);

  useEffect(() => {
    applyFilters();
  }, [profiles, filters]);

  const checkConnection = async () => {
    const isConnected = await testConnection();
    setConnectionError(!isConnected);
    if (!isConnected) {
      setSnackbar({
        open: true,
        message: 'Cannot connect to server. Please ensure the backend is running on port 3005.',
        severity: 'error'
      });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load profiles and recent profile in parallel
      const [profilesResponse, recentResponse] = await Promise.all([
        profileAPI.getAllProfiles(currentPage, profilesPerPage),
        profileAPI.getRecentProfile()
      ]);
      
      // Handle profiles response
      if (profilesResponse.data.profiles) {
        setProfiles(profilesResponse.data.profiles);
        setTotalPages(profilesResponse.data.totalPages || 1);
        setTotalProfiles(profilesResponse.data.total || 0);
      } else {
        // Fallback for simple array response
        setProfiles(profilesResponse.data || []);
        setTotalPages(Math.ceil((profilesResponse.data || []).length / profilesPerPage));
        setTotalProfiles((profilesResponse.data || []).length);
      }
      
      // Handle recent profile response
      setRecentProfile(recentResponse.data);
      setConnectionError(false);
      
    } catch (error) {
      console.error('Error loading data:', error);
      
      let errorMessage = 'Failed to load profiles.';
      if (error.message.includes('Server is not running') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 3005.';
        setConnectionError(true);
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      
      // Set empty defaults on error
      setProfiles([]);
      setRecentProfile(null);
      setTotalPages(1);
      setTotalProfiles(0);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...profiles];

    // Filter by name
    if (filters.name) {
      filtered = filtered.filter(profile => 
        profile.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // Filter by gender
    if (filters.gender) {
      filtered = filtered.filter(profile => 
        profile.gender.toLowerCase() === filters.gender.toLowerCase()
      );
    }

    // Filter by age group
    if (filters.ageGroup) {
      const [minAge, maxAge] = filters.ageGroup.split('-');
      if (maxAge === '+') {
        // Handle 60+ case
        filtered = filtered.filter(profile => profile.age >= parseInt(minAge));
      } else {
        filtered = filtered.filter(profile => 
          profile.age >= parseInt(minAge) && profile.age <= parseInt(maxAge)
        );
      }
    }

    setFilteredProfiles(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      gender: '',
      ageGroup: ''
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return filters.name || filters.gender || filters.ageGroup;
  };

  const handleDelete = async (profile) => {
    try {
      await profileAPI.deleteProfile(profile.id);
      setDeleteDialog({ open: false, profile: null });
      setSnackbar({
        open: true,
        message: `Profile for ${profile.name} deleted successfully!`,
        severity: 'success'
      });
      
      // If we deleted the last item on the current page and it's not page 1, go to previous page
      if (profiles.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete profile: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleEditSuccess = () => {
    setEditDialog({ open: false, profileId: null });
    setSnackbar({
      open: true,
      message: 'Profile updated successfully!',
      severity: 'success'
    });
    loadData(); // Refresh data
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getGenderColor = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male': return 'primary';
      case 'female': return 'secondary';
      default: return 'default';
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
        return '/images/other.svg';
    }
  };

  // UPDATED: Get genders with all available options for filter dropdown
  const getGenderOptions = () => {
    const uniqueGenders = [...new Set(profiles.map(profile => profile.gender))].filter(Boolean);
    // Return all available genders from the profiles
    return uniqueGenders.length > 0 ? uniqueGenders : ['Male', 'Female', 'Other'];
  };

  const handleRetryConnection = () => {
    setConnectionError(false);
    setLoading(true);
    checkConnection();
  };

  // Handle create profile button click - redirect to profile page
  const handleCreateProfile = () => {
    navigate('/profile');
  };

  if (connectionError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Paper elevation={4} sx={{ borderRadius: 3, p: 4 }}>
          <Typography variant="h4" color="error" gutterBottom fontFamily="Roboto" fontWeight="bold">
            🔌 Connection Error
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontFamily: 'Helvetica' }}>
            Cannot connect to the backend server
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontFamily: 'Helvetica' }}>
            Please ensure that:
            <br />
            • The backend server is running on port 3005
            <br />
            • PostgreSQL database is connected
            <br />
            • No firewall is blocking the connection
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Refresh />}
            onClick={handleRetryConnection}
            sx={{ fontFamily: 'Roboto', fontWeight: 'bold' }}
          >
            Retry Connection
          </Button>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2, fontFamily: 'Roboto' }}>
            Loading profiles...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Header Section */}
      <Paper elevation={4} sx={{ borderRadius: 3, mb: 4, p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
        <Typography 
          variant={isMobile ? "h3" : "h2"} 
          gutterBottom 
          sx={{ 
            fontFamily: 'Roboto', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 1,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.75rem' }
          }}
        >
          Profile Dashboard
        </Typography>
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          color="text.secondary" 
          sx={{ fontFamily: 'Helvetica' }}
        >
          Manage and view all your profiles in one place
        </Typography>
      </Paper>

      {/* Top Section - Equal sized cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recently Added Profile */}
        <Grid item xs={12} md={4}>
          {recentProfile ? (
            <Paper 
              elevation={4} 
              sx={{ 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                color: 'white',
                p: { xs: 2, sm: 3 },
                height: 320,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} />
                Recently Added
              </Typography>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" sx={{ flex: 1, justifyContent: 'center' }}>
                <Avatar
                  src={getAvatarSrc(recentProfile.gender)}
                  sx={{ 
                    width: { xs: 60, sm: 80 }, 
                    height: { xs: 60, sm: 80 }, 
                    mb: 2,
                    border: '3px solid white'
                  }}
                />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {recentProfile.name}
                </Typography>
                <Box display="flex" gap={1} mb={2} flexWrap="wrap" justifyContent="center">
                  <Chip 
                    label={`${recentProfile.age} years`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip 
                    label={recentProfile.gender} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                  📧 {recentProfile.email}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => setViewDialog({ open: true, profile: recentProfile })}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white'
                    }
                  }}
                >
                  View Details
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper 
              elevation={4} 
              sx={{ 
                borderRadius: 3,
                p: { xs: 2, sm: 3 },
                textAlign: 'center',
                bgcolor: '#f8f9fa',
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <AccountCircle sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Profiles Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first profile to get started
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Create Profile Section */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={4} 
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: { xs: 2, sm: 3 },
              textAlign: 'center',
              height: 320,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <PersonAdd sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Create New Profile
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
              Add a new profile with comprehensive validation and real-time email verification
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleCreateProfile}
              sx={{ 
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 'bold',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Create Profile
            </Button>
          </Paper>
        </Grid>

        {/* Statistics Section */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={4} 
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              p: { xs: 2, sm: 3 },
              height: 320
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <Numbers sx={{ mr: 1 }} />
              Statistics
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body1">Total Profiles:</Typography>
                <Typography variant="h5" fontWeight="bold">{totalProfiles}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body1">Current Page:</Typography>
                <Typography variant="h6">{currentPage} of {totalPages}</Typography>
              </Box>
              {getGenderOptions().length > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Gender Distribution:</Typography>
                  {getGenderOptions().map(gender => {
                    const count = profiles.filter(p => p.gender === gender).length;
                    return (
                      <Box key={gender} display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{gender}:</Typography>
                        <Typography variant="body2" fontWeight="bold">{count}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* UPDATED: Filters Section with all gender options */}
      <Paper elevation={3} sx={{ borderRadius: 3, p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <FilterList sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            Filter Profiles
          </Typography>
          {hasActiveFilters() && (
            <Chip 
              label={`${filteredProfiles.length} filtered`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search by Name"
              placeholder="Enter name to search..."
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
  <FormControl fullWidth size="small">
    <InputLabel id="gender-filter-label">Filter by Gender</InputLabel>
    <Select
      labelId="gender-filter-label"
      id="gender-filter"
      value={filters.gender}
      label="Filter by Gender"
      onChange={(e) => handleFilterChange('gender', e.target.value)}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <em style={{ color: '#aaa' }}>Filter by Gender</em>;
        }
        return selected;
      }}
    >
      <MenuItem disabled value="">
        <em>Filter by Gender</em>
      </MenuItem>
      {getGenderOptions().map((gender) => (
        <MenuItem key={gender} value={gender}>
          {gender}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>

          
          <Grid item xs={12} sm={6} md={3}>
  <FormControl fullWidth size="small">
    <InputLabel id="age-filter-label">Filter by Age</InputLabel>
    <Select
      labelId="age-filter-label"
      id="age-filter"
      value={filters.ageGroup}
      label="Filter by Age"
      onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <em style={{ color: '#aaa' }}>Filter by Age</em>;
        }
        return ageGroups.find(group => group.value === selected)?.label || selected;
      }}
    >
      <MenuItem disabled value="">
        <em>Filter by Age</em>
      </MenuItem>
      {ageGroups.map((group) => (
        <MenuItem key={group.value} value={group.value}>
          {group.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Clear />}
              onClick={clearFilters}
              disabled={!hasActiveFilters()}
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Profiles Table */}
      <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1 }} />
            All Profiles ({hasActiveFilters() ? filteredProfiles.length : totalProfiles})
          </Typography>
        </Box>
        
        {(hasActiveFilters() ? filteredProfiles : profiles).length === 0 ? (
          <Box textAlign="center" py={6}>
            <AccountCircle sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {hasActiveFilters() ? 'No profiles match your filters' : 'No profiles found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {hasActiveFilters() ? 'Try adjusting your filter criteria' : 'Create your first profile to get started'}
            </Typography>
            {!hasActiveFilters() && (
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={handleCreateProfile}
                sx={{ fontWeight: 'bold' }}
              >
                Create First Profile
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Profile</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>}
                    <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(hasActiveFilters() ? filteredProfiles : profiles).map((profile) => (
                    <TableRow 
                      key={profile.id} 
                      sx={{ 
                        '&:hover': { bgcolor: '#f8f9fa' },
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar
                            src={getAvatarSrc(profile.gender)}
                            sx={{ 
                              width: { xs: 40, sm: 50 }, 
                              height: { xs: 40, sm: 50 }, 
                              mr: 2,
                              border: '2px solid #e0e0e0'
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {profile.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {profile.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      {!isMobile && (
                        <TableCell>
                          <Box>
                            <Box display="flex" alignItems="center" mb={1}>
                              <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{profile.email}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                              <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{profile.phone_number}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      )}
                      
                      <TableCell>
                        <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                          <Chip 
                            label={`${profile.age} years`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Chip 
                            label={profile.gender} 
                            size="small" 
                            color={getGenderColor(profile.gender)}
                            variant="outlined"
                          />
                        </Box>
                        <Box display="flex" alignItems="center">
                          <Cake sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(profile.date_of_birth)}
                          </Typography>
                        </Box>
                        {isMobile && (
                          <Box mt={1}>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              📧 {profile.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              📱 {profile.phone_number}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                          <Tooltip title="View Profile">
                            <IconButton
                              size="small"
                              onClick={() => setViewDialog({ open: true, profile })}
                              sx={{ color: 'primary.main' }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Profile">
                            <IconButton
                              size="small"
                              onClick={() => setEditDialog({ open: true, profileId: profile.id })}
                              sx={{ color: 'warning.main' }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Profile">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteDialog({ open: true, profile })}
                              sx={{ color: 'error.main' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            {!hasActiveFilters() && totalPages > 1 && (
              <Box display="flex" justifyContent="center" py={3}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Floating Action Button */}
      <Zoom in={true}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, md: 32 },
            right: { xs: 16, md: 32 },
            zIndex: 1000,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
            },
            transition: 'all 0.3s ease'
          }}
          onClick={handleCreateProfile}
        >
          <PersonAdd />
        </Fab>
      </Zoom>

      {/* Edit Profile Dialog */}
      <Dialog
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, profileId: null })}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontWeight: 'bold', 
          fontSize: { xs: '1.5rem', md: '2rem' },
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
          color: 'white'
        }}>
          Edit Profile
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ProfileForm
            profileId={editDialog.profileId}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialog({ open: false, profileId: null })}
          />
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog
        maxWidth="sm"
        fullWidth
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, profile: null })}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          Profile Details
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {viewDialog.profile && (
            <Box textAlign="center">
              <Avatar
                src={getAvatarSrc(viewDialog.profile.gender)}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 3,
                  border: '4px solid #e0e0e0'
                }}
              />
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {viewDialog.profile.name}
              </Typography>
              
              <Box display="flex" gap={1} justifyContent="center" mb={3}>
                <Chip 
                  label={`${viewDialog.profile.age} years old`} 
                  color="primary" 
                />
                <Chip 
                  label={viewDialog.profile.gender} 
                  color={getGenderColor(viewDialog.profile.gender)}
                />
              </Box>

              <Card variant="outlined" sx={{ textAlign: 'left', mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                    Contact Information
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Email sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{viewDialog.profile.email}</Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Phone sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{viewDialog.profile.phone_number}</Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <Cake sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                      <Typography variant="body1">{formatDate(viewDialog.profile.date_of_birth)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Box display="flex" gap={2} justifyContent="center" mt={3}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => {
                    setViewDialog({ open: false, profile: null });
                    setEditDialog({ open: true, profileId: viewDialog.profile.id });
                  }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => {
                    setViewDialog({ open: false, profile: null });
                    setDeleteDialog({ open: true, profile: viewDialog.profile });
                  }}
                >
                  Delete Profile
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setViewDialog({ open: false, profile: null })}
            variant="contained"
            fullWidth
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, profile: null })}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          color: 'error.main', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Delete sx={{ mr: 1 }} />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the profile for{' '}
            <strong>{deleteDialog.profile?.name}</strong>?
            <br /><br />
            This action cannot be undone and will permanently remove all profile data.
          </DialogContentText>
          
          {deleteDialog.profile && (
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: '#fff3e0', 
                borderRadius: 2,
                border: '1px solid #ffcc02'
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Profile to be deleted:
              </Typography>
              <Box display="flex" alignItems="center">
                <Avatar
                  src={getAvatarSrc(deleteDialog.profile.gender)}
                  sx={{ width: 40, height: 40, mr: 2 }}
                />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {deleteDialog.profile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {deleteDialog.profile.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, profile: null })}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteDialog.profile)}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            sx={{ fontWeight: 'bold' }}
          >
            Delete Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: isMobile ? 'center' : 'left' 
        }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            fontSize: { xs: '0.85rem', md: '0.875rem' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home;
