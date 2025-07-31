import React from 'react';
import { Container, Box, Button, Typography, Fab, Tooltip, Zoom, Paper } from '@mui/material';
import { ArrowBack, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';

const Profile = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to home page after successful profile creation
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Floating Action Button */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Tooltip title="Back to Home" placement="left">
          <Zoom in={true}>
            <Fab 
              color="primary" 
              onClick={() => navigate('/')}
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <HomeIcon />
            </Fab>
          </Zoom>
        </Tooltip>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          variant="outlined"
          sx={{ 
            mb: 3,
            fontFamily: 'Roboto',
            fontWeight: 'bold',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateX(-5px)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Back to Home
        </Button>
        
        {/* Title in Card/Box */}
        <Paper 
          elevation={4} 
          sx={{ 
            p: 4, 
            mb: 4, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3
          }}
        >
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            fontFamily="Roboto"
            fontWeight="bold"
            sx={{
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              mb: 2
            }}
          >
            Profile Management
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: 'Helvetica',
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6,
              opacity: 0.9
            }}
          >
            Create and manage your personal profile information with our intuitive form system
          </Typography>
        </Paper>
      </Box>

      <ProfileForm onSuccess={handleSuccess} />
    </Container>
  );
};

export default Profile;