import React, { useState, useEffect } from 'react';
import './App.css';
import UploadPassportForm from './components/UploadPassportForm';
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            navigate("/home");
        }
    }, [navigate]);


    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate("/");
    }


    return (
        <div className="App">
            <Routes>
                <Route path="/" element={
                    !isLoggedIn ?
                    <><LoginForm/>
                     <SignupForm/></> : null
                }/>
                <Route path="/signup" element={<SignupForm />} />
                 <Route path="/home" element={
                   isLoggedIn ? <>
                    <button onClick={handleLogout}>Logout</button>
                    <UploadPassportForm/> </> :  null} />
            </Routes>
        </div>
    );
}

export default App;