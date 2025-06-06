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
    const [isVaultUnlockedState, setIsVaultUnlockedState] = useState(
        () => localStorage.getItem('isVaultUnlocked') === 'true'
    );
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

    const setIsVaultUnlocked = (val) => {
        setIsVaultUnlockedState(val);
        localStorage.setItem('isVaultUnlocked', val);
    };

    return (
        <UserContext.Provider value={{ user, setUser, isVaultUnlocked: isVaultUnlockedState, setIsVaultUnlocked, loading }}>
            {children}
        </UserContext.Provider>
    );
}