import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { permissions } from "../modules/permissions";

// The site-wide switches (booking, polls, guest booking) and what the current viewer may do by them
const SettingsContext = createContext(null);

// Until loaded everything counts as on, so nothing is hidden and then shown again on a normal load
const DEFAULTS = { bookingEnabled: true, pollsEnabled: true, guestsCanBook: true };

export function SettingsProvider({ children }) {
    const { user } = useAuth();
    const [settings, setSettings] = useState(DEFAULTS);

    useEffect(() => {
        axios.get("/settings")
            .then(res => setSettings(res.data.result))
            .catch(err => console.error(err));
    }, []);

    // Admins only; throws on failure, the page shows the server's message
    const saveSettings = useCallback(async (changes) => {
        const res = await axios.put("/settings", changes);
        setSettings(res.data.result);
        return res.data.result;
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, can: permissions(settings, user || null), saveSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
