import './App.css'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'
import { UserContextProvider } from '../context/UserContext.jsx'
import React, { useEffect } from 'react';

axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.withCredentials = true


function App() {

  useEffect(() => {
    document.title = "password-manager";
  }, []); 

  return (
    <UserContextProvider>
      <Header />
      <Toaster position='bottom-right' toastOptions={{ duration: 2000 }} />
        <Routes>
<<<<<<< HEAD
          <Route path="/" element={<Dashboard />} />
=======
          <Route path="/" element={<Login />} />
>>>>>>> test_cud
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} /> 
        </Routes>
      <Footer />
    </UserContextProvider>
  )
}

export default App