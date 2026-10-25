import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

// The logged in user for the whole app. The session itself is an HttpOnly cookie the browser sends along.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // undefined until the first check is done, then the user ({ id, email, name, phone, role }) or null
    const [user, setUser] = useState(undefined);

    const refresh = useCallback(() => {
        return axios.get("/auth/me")
            .then(res => setUser(res.data.result))
            .catch(() => setUser(null));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // These throw on failure; the pages show the server's message
    const login = async (email, password) => {
        const res = await axios.post("/auth/login", { email, password });
        setUser(res.data.result);
        return res.data.result;
    };

    const register = async (data) => {
        const res = await axios.post("/auth/register", data);
        setUser(res.data.result);
        return res.data.result;
    };

    const logout = async () => {
        await axios.post("/auth/logout");
        setUser(null);
    };

    const updateProfile = async (data) => {
        const res = await axios.put("/auth/profile", data);
        setUser(res.data.result);
        return res.data.result;
    };

    return (
        <AuthContext.Provider value={{ user, refresh, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
