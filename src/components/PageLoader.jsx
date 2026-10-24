import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";

// Shown while a page waits for the login check. Only after a short delay, so a fast check doesn't flash it.
export default function PageLoader() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="page-loader" role="status" aria-live="polite">
            {visible ? <><CircularProgress size={36} /><span>Betöltés…</span></> : <></>}
        </div>
    );
}
