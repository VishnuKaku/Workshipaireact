// App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import UploadPassportForm from './components/UploadPassportForm';
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import UserHistoryTable from "./components/UserHistoryTable";
import { AuthProvider, useAuth, AuthContextType } from './hooks/useAuth'; // Import types
import { ToastContainer } from 'react-toastify';

const App: React.FC = () => {
  const { isAuthenticated, logout } : AuthContextType = useAuth();
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
      if (isAuthenticated && location.pathname !== '/history' && location.pathname !== '/home') {
          navigate('/home');
      }
  }, [isAuthenticated, navigate, location.pathname]);


  const handleLoginClick = () => {
    setShowBackground(false);
    setTimeout(() => {
      navigate("/login");
    }, 300);
  };

  return (
    <div className="App">
      <div
        className="background-container"
        style={{
          opacity: showBackground ? 1 : 0,
          visibility: showBackground ? 'visible' : 'hidden'
        }}
      />
      {location.pathname === '/' && !isAuthenticated && (
        <div className="login-button-container">
          <button onClick={handleLoginClick}>Login</button>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route
            path="/home"
            element={isAuthenticated ? (
              <>
                <button onClick={handleLogout}>Logout</button>
                <UploadPassportForm />
              </>
            ) : null
            }
        />
        <Route path="/history" element={<UserHistoryTable />} />
      </Routes>
    </div>
  );
};

const AppWrapper: React.FC = () => (
    <AuthProvider>
        <ToastContainer position="top-center" />
        <App />
    </AuthProvider>
);

export default AppWrapper;