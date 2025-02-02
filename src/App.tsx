import React, { useState, useEffect } from 'react';
import './App.css';
import UploadPassportForm from './components/UploadPassportForm';
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import UserHistoryTable from "./components/UserHistoryTable";
import MapView from "./components/MapView";
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, AuthContextType } from './hooks/useAuth';
import { ToastContainer } from 'react-toastify';

const App: React.FC = () => {
  const { isAuthenticated, logout, authInitialized }: AuthContextType = useAuth();
  const [showBackground, setShowBackground] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (location.pathname === '/' && !isAuthenticated) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  }, [location.pathname, isAuthenticated]);

   useEffect(() => {
    if (authInitialized && isAuthenticated && location.pathname !== '/history' && location.pathname !== '/home' && location.pathname !== '/map-view') {
        navigate('/home');
    }
  }, [isAuthenticated, navigate, location.pathname, authInitialized]);

  const handleLoginClick = () => {
    setShowBackground(false);
    setTimeout(() => {
      navigate("/login");
    }, 300);
  };

  if (!authInitialized) {
    return <div>Loading...</div>; // Add a loading state while auth is being initialized
  }

  return (
    <div className="App">
      {/* Background Container */}
      <div
        className="background-container"
        style={{
          opacity: showBackground ? 1 : 0,
          visibility: showBackground ? 'visible' : 'hidden'
        }}
      />

      {/* Login Button on Home Page */}
      {location.pathname === '/' && !isAuthenticated && (
        <div className="login-button-container">
          <button onClick={handleLoginClick}>Login</button>
        </div>
      )}

      {/* Routes */}
      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />

        {/* Protected Routes */}
       <Route
          path="/home"
          element={
            isAuthenticated ? (
              <>
                <button onClick={handleLogout}>Logout</button>
                <UploadPassportForm />
              </>
            ) : null
          }
        />
        <Route path="/history" element={isAuthenticated ? <UserHistoryTable /> : null } />
        <Route path="/map-view" element={isAuthenticated ? <MapView /> : null} />
      </Routes>
    </div>
  );
};

// App Wrapper with AuthProvider
const AppWrapper: React.FC = () => (
  <AuthProvider>
    <ToastContainer position="top-center" />
    <App />
  </AuthProvider>
);

export default AppWrapper;