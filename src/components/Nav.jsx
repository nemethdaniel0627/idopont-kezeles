import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Button, ThemeProvider } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import GroupsIcon from '@mui/icons-material/Groups';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { appTheme } from "./AuthPage";
import { useAuth } from "../auth/AuthContext";

// "Kiss Anna" -> "KA", "anna@example.hu" -> "A"
function initials(user) {
    const words = (user.name || user.email).trim().split(/\s+/);
    return words.slice(0, 2).map(word => word[0]).join("").toUpperCase();
}

// A nav button with its icon. On phones only the icon shows; the label stays for screen readers and as a tooltip.
function NavButton({ icon, label, active, className = "", ...props }) {
    return (
        <Button color="inherit" startIcon={icon} title={label} aria-label={label} aria-current={active ? "page" : undefined}
            className={`nav_link${active ? " active" : ""} ${className}`} {...props}>
            <span className="nav_label">{label}</span>
        </Button>
    );
}

export default function Nav() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    // The page's own button is highlighted; a poll's page belongs to "Egyeztetések"
    const isActive = prefix => prefix === "/" ? pathname === "/" : pathname.startsWith(prefix);

    const logoutAndLeave = async () => {
        await logout();
        navigate("/");
    };

    return (
        <ThemeProvider theme={appTheme}>
            <nav className="nav">
                <div className="nav_group">
                    <NavButton component={Link} to="/" icon={<HomeIcon />} label="Főoldal" active={isActive("/")} />
                    {user
                        ? <>
                            <NavButton component={Link} to="/foglalasaim" icon={<EventNoteIcon />} label="Foglalásaim" active={isActive("/foglalasaim")} />
                            <NavButton component={Link} to="/egyeztetesek" icon={<GroupsIcon />} label="Egyeztetések" active={isActive("/egyeztetes")} />
                        </>
                        : <></>}
                    {user && user.role === "admin"
                        ? <NavButton component={Link} to="/admin" icon={<AdminPanelSettingsIcon />} label="Admin" active={isActive("/admin")} />
                        : <></>}
                </div>
                {/* Nothing until the first login check is done, so the buttons do not flicker */}
                {user === undefined ? <></> :
                    <div className="nav_group">
                        {user
                            ? <>
                                <NavButton component={Link} to="/profil" label={user.name || user.email} active={isActive("/profil")}
                                    icon={<Avatar className="nav_avatar">{initials(user)}</Avatar>} className="nav_profile" />
                                <NavButton icon={<LogoutIcon />} label="Kijelentkezés" onClick={logoutAndLeave} />
                            </>
                            : <>
                                <NavButton component={Link} to="/bejelentkezes" icon={<LoginIcon />} label="Bejelentkezés" active={isActive("/bejelentkezes")} />
                                <NavButton component={Link} to="/regisztracio" icon={<PersonAddIcon />} label="Regisztráció" variant="outlined"
                                    active={isActive("/regisztracio")} />
                            </>
                        }
                    </div>
                }
            </nav>
        </ThemeProvider>
    );
}
