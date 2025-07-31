import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { Home as HomeIcon, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';

// Create Material-UI theme with Roboto font
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#764ba2',
      dark: '#4c5fd6',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontFamily: '"Roboto", sans-serif',
    },
    h2: {
      fontWeight: 700,
      fontFamily: '"Roboto", sans-serif',
    },
    h3: {
      fontWeight: 600,
      fontFamily: '"Roboto", sans-serif',
    },
    h4: {
      fontWeight: 600,
      fontFamily: '"Roboto", sans-serif',
    },
    h5: {
      fontWeight: 600,
      fontFamily: '"Roboto", sans-serif',
    },
    h6: {
      fontWeight: 500,
      fontFamily: '"Roboto", sans-serif',
    },
    body1: {
      fontFamily: '"Helvetica", "Arial", sans-serif',
    },
    body2: {
      fontFamily: '"Helvetica", "Arial", sans-serif',
    },
    button: {
      fontFamily: '"Roboto", sans-serif',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@import': [
          'url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap")',
          'url("https://fonts.googleapis.com/css2?family=Helvetica:wght@300;400;500;600;700&display=swap")'
        ],
        body: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
  },
});

// Navigation Bar Component
const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        borderRadius: 0,
      }}
    >
      <Toolbar sx={{ py: 1.5, px: 3 }}>
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              mr: 2.5,
              width: 48,
              height: 48,
              border: '2px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <img 
              src="/images/boy.svg" 
              alt="Logo" 
              style={{ 
                width: '28px', 
                height: '28px',
                //filter: 'brightness(0) invert(1)' // Makes SVG white
              }} 
            />
          </Avatar>
          <Box>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                fontFamily: 'Roboto',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                letterSpacing: '0.5px',
                background: 'linear-gradient(45deg, #ffffff, #f0f0f0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'white',
              }}
            >
              Profile Manager
            </Typography>
            <Typography 
              variant="caption"
              sx={{ 
                opacity: 0.85,
                fontFamily: 'Helvetica',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 400,
              }}
            >
              Manage your personal information
            </Typography>
          </Box>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            color="inherit"
            startIcon={<HomeIcon sx={{ fontSize: '20px' }} />}
            onClick={() => navigate('/')}
            sx={{ 
              color: 'white',
              fontFamily: 'Roboto',
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 2.5,
              py: 1,
              borderRadius: 3,
              textTransform: 'none',
              border: location.pathname === '/' ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
              backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                border: '2px solid rgba(255,255,255,0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: '100px',
            }}
          >
            Home
          </Button>
          <Button
            color="inherit"
            startIcon={<Person sx={{ fontSize: '20px' }} />}
            onClick={() => navigate('/profile')}
            sx={{ 
              color: 'white',
              fontFamily: 'Roboto',
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 2.5,
              py: 1,
              borderRadius: 3,
              textTransform: 'none',
              border: location.pathname === '/profile' ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
              backgroundColor: location.pathname === '/profile' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                border: '2px solid rgba(255,255,255,0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: '100px',
            }}
          >
            Profile
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

// Main App Layout
const AppLayout = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
    }}>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

// Main App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  );
}

export default App;
