import axios from 'axios';
import { createContext, useState, useEffect } from 'react';

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
