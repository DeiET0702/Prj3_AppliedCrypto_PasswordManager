// Register.jsx (No changes needed here based on the new backend flow, as it wasn't collecting masterPassword)
import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import '../styles/Register.css';

export default function Register() {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    const [data, setData] = useState({
        name: '',
        email: '',
        password: '',
        // No masterPassword state here
    });

    useEffect(() => {
        if (user) {
            // If user is somehow already logged in, maybe redirect to login or dashboard
            // Original logic was navigate('/login'), which might be fine or could be /dashboard
             navigate('/'); // Or '/dashboard' if they might already have an active session
        }
    }, [user, navigate]);

    const RegisterUser = async (e) => {
        e.preventDefault();
        const { name, email, password } = data; // Only these fields
        try {
            // Backend /register now only expects these
            const res = await axios.post('/register', { name, email, password });
            if (res.data.error) {
                toast.error(res.data.error);
            } else {
                setData({ name: '', email: '', password: '' });
                toast.success(res.data.message || 'Registration successful! Please login.');
                navigate('/login');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An error occurred. Please try again!';
            toast.error(errorMessage);
            console.log(error);
        }
    };

    return (
        <div className="register-container">
            <form className="register-form" onSubmit={RegisterUser}>
                <h2>Register</h2>
                {/* Form inputs as before, without masterPassword */}
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    required
                />
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    required
                />
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                    required
                />
                <button type="submit">Register</button>
            </form>
        </div>
    );
}