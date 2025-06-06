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
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} /> 
        </Routes>
      <Footer />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            marginBottom: '120px', //>footer
            zIndex: 9999
          }
        }}
      />
    </UserContextProvider>
  )
}

export default App