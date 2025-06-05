import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext({
    user: null,
    setUser: () => {},
    isVaultUnlocked: false,
    setIsVaultUnlocked: () => {},
    loading: false,
});

export function UserContextProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Try to fetch user profile on mount
        axios.get('/profile', { withCredentials: true })
            .then(res => {
                if (res.data && res.data.username) {
                    setUser(res.data);
                } else {
                    setUser(null);
                }
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isVaultUnlocked, setIsVaultUnlocked, loading }}>
            {children}
        </UserContext.Provider>
    );
}