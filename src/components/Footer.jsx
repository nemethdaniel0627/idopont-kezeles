import React from "react";
import LegalLink from "./legal/LegalLink";

// On every page: the terms and the privacy notice
export default function Footer() {
    return (
        <footer className="site-footer">
            <span>Időpontfoglaló</span>
            <LegalLink kind="terms" />
            <LegalLink kind="privacy" />
        </footer>
    );
}
