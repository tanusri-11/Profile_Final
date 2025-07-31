# 🚀 Profile Manager - Full Stack React Application

A comprehensive profile management system built with React, Node.js, PostgreSQL, and deployed on Vercel and Render. This application demonstrates modern web development practices including form validation, database management, API integration, and cloud deployment.

[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13-blue.svg)](https://postgresql.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.0-purple.svg)](https://mui.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-black.svg)](https://vercel.com/)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46e3b7.svg)](https://render.com/)

## 🌐 Live Deployment

- **Frontend (Vercel)**: [https://profile-final-two.vercel.app/](https://profile-final-two.vercel.app/)
- **Backend API (Render)**: [https://profile-backend-t8m7.onrender.com/](https://profile-backend-t8m7.onrender.com/)


## ✨ Features

### 🎯 Core Functionality
- **Complete CRUD Operations**: Create, Read, Update, Delete profiles
- **Advanced Form Validation**: Real-time client-side and server-side validation
- **Email Verification**: Integration with MailboxLayer API for email validation
- **Responsive Design**: Mobile-first approach using Material-UI components
- **Real-time Statistics**: Dashboard with profile analytics and recent activity

### 🔍 Smart Validations
- **Email Validation**: 
  - Format validation using regex
  - Real-time API validation with MailboxLayer
  - Conditional validation (skip for existing profiles during updates)
- **Age & Date of Birth Synchronization**: 
  - Auto-calculate age from date of birth
  - Auto-estimate birth year from age
  - Cross-validation to ensure consistency
- **Phone Number Validation**: Exactly 10 digits with formatting support
- **Gender-Based Avatars**: Dynamic avatar selection based on gender

### 📊 Dashboard Features
- **Recent Profile Display**: Shows the most recently added profile
- **Statistics Panel**: Total profiles, current page info, gender distribution
- **Advanced Filtering**: Filter by name, gender, and age groups
- **Pagination**: Efficient data loading with customizable page sizes
- **Profile Management**: Quick access to view, edit, and delete operations

### 🎨 UI/UX Features
- **Material-UI Components**: Modern, consistent design system
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Interactive Elements**: Hover effects, smooth transitions, and loading states
- **Error Handling**: User-friendly error messages and fallback UI
- **Toast Notifications**: Real-time feedback for user actions

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern functional components with hooks
- **Material-UI (MUI)** - Complete UI component library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Day.js** - Date manipulation and formatting
- **React DatePicker** - Advanced date selection component

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **pg (node-postgres)** - PostgreSQL client
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **node-fetch** - HTTP client for email validation API

### Third-Party Services
- **MailboxLayer API** - Email validation and verification
- **Render PostgreSQL** - Managed database hosting
- **SSL/TLS** - Secure database connections

### Deployment & DevOps
- **Vercel** - Frontend hosting and deployment
- **Render** - Backend API and database hosting
- **Git & GitHub** - Version control and repository management
- **Environment Variables** - Secure configuration management


## 🌍 Deployment

### Frontend Deployment (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Backend Deployment (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables in Render dashboard
4. Configure PostgreSQL database service
5. Deploy with automatic SSL/TLS configuration

### Database Setup (Render PostgreSQL)
1. Create PostgreSQL service on Render
2. Use internal database URL for backend connection
3. Automatic SSL/TLS encryption enabled
4. Auto-scaling and backup management


## 🎯 Key Features Demonstrated

### 1. Advanced Form Validation
- **Client-side validation** with real-time feedback
- **Server-side validation** for data integrity
- **Cross-field validation** (age vs. date of birth)
- **API integration** for email verification

### 2. State Management
- **React Hooks** (useState, useEffect) for local state
- **Lifting state up** for component communication
- **Conditional rendering** based on application state
- **Error boundary** implementation

### 3. Database Integration
- **PostgreSQL** with proper schema design
- **Connection pooling** for performance
- **Prepared statements** for security
- **Transaction management** for data consistency

### 4. API Design
- **RESTful endpoints** with proper HTTP methods
- **Error handling** with meaningful status codes
- **Input validation** and sanitization
- **CORS configuration** for cross-origin requests

### 5. Deployment & DevOps
- **Environment-based configuration**
- **SSL/TLS encryption** for secure connections
- **Health monitoring** and diagnostics
- **Automatic deployments** with git integration



### Frontend
