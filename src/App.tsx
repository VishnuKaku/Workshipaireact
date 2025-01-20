import React, { useState, useEffect } from 'react';
import './App.css';
import UploadPassportForm from './components/UploadPassportForm';
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setShowBackground(false);
      navigate("/home");
    }
  }, [navigate]);

  const handleLoginClick = () => {
    setShowBackground(false);
    setTimeout(() => {
      navigate("/login");
    }, 300);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate("/");
    setTimeout(() => {
      setShowBackground(true);
    }, 100);
  };

  useEffect(() => {
    if (location.pathname === '/' && !isLoggedIn) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  }, [location.pathname, isLoggedIn]);

  return (
    <div className="App">
      <div 
        className="background-container" 
        style={{ 
          opacity: showBackground ? 1 : 0,
          visibility: showBackground ? 'visible' : 'hidden'
        }} 
      />

      {location.pathname === '/' && !isLoggedIn && (
        <div className="login-button-container">
          <button onClick={handleLoginClick}>Login</button>
        </div>
      )}

      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route 
          path="/home" 
          element={
            isLoggedIn ? (
              <>
                <button onClick={handleLogout}>Logout</button>
                <UploadPassportForm />
              </>
            ) : null
          } 
        />
      </Routes>
    </div>
  );
};

export default App;