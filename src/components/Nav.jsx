import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ThemeProvider } from "@mui/material";
import { appTheme } from "./AuthPage";
import { useAuth } from "../auth/AuthContext";

export default function Nav() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const logoutAndLeave = async () => {
        await logout();
        navigate("/");
    };

    return (
        <ThemeProvider theme={appTheme}>
            <nav className="nav">
                <div className="nav_group">
                    <Button color="inherit" component={Link} to="/">Főoldal</Button>
                    {user ? <Button color="inherit" component={Link} to="/egyeztetesek">Egyeztetések</Button> : <></>}
                    {user && user.role === "admin" ? <Button color="inherit" component={Link} to="/admin">Admin</Button> : <></>}
                </div>
                {/* Nothing until the first login check is done, so the buttons do not flicker */}
                {user === undefined ? <></> :
                    <div className="nav_group">
                        {user
                            ? <>
                                <Button color="inherit" component={Link} to="/profil">{user.name || user.email}</Button>
                                <Button color="inherit" onClick={logoutAndLeave}>Kijelentkezés</Button>
                            </>
                            : <>
                                <Button color="inherit" component={Link} to="/bejelentkezes">Bejelentkezés</Button>
                                <Button color="inherit" variant="outlined" component={Link} to="/regisztracio">Regisztráció</Button>
                            </>
                        }
                    </div>
                }
            </nav>
        </ThemeProvider>
    );
}
