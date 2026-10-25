import React from "react";
import LegalLink from "./legal/LegalLink";

// The site's version, from package.json (see .env)
const VERSION = process.env.REACT_APP_VERSION;

// On every page: the terms and the privacy notice, the copyright and the version
export default function Footer() {
    return (
        <footer className="site-footer">
            <span>Időpontfoglaló</span>
            <LegalLink kind="terms" />
            <LegalLink kind="privacy" />
            <span>© 2026 Németh Dániel</span>
            {VERSION ? <span className="site-footer_version" title="Az oldal verziója">v{VERSION}</span> : <></>}
        </footer>
    );
}
