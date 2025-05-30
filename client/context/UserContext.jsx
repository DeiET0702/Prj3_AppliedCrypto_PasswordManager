import axios from 'axios';
import { createContext, useState, useEffect } from 'react';

<<<<<<< HEAD
export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // kiểm tra trạng thái load user

    useEffect(() => {
        axios.get('/profile')
            .then(({ data }) => {
                setUser(data);
            })
            .catch(() => {
                setUser(null); // Session expired hoặc chưa đăng nhập
            })
            .finally(() => {
                setLoading(false);
            });
    }, []); // Chỉ chạy 1 lần khi app khởi động

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
}
=======
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
        const fetchUserProfile = async () => {
            try {
                const { data } = await axios.get('/profile', { withCredentials: true });
                setUser(data);
                // isVaultUnlocked vẫn là false vì cần kích hoạt masterKey
            } catch (error) {
                setUser(null);
                setIsVaultUnlocked(false);
                if (error.response?.status !== 401) {
                    console.error('Error fetching profile:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isVaultUnlocked, setIsVaultUnlocked, loading }}>
            {children}
        </UserContext.Provider>
    );
}
>>>>>>> test_cud
