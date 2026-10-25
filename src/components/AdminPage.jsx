import React from "react";
import { Link } from "react-router-dom";
import { Button, ThemeProvider } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { appTheme } from "./AuthPage";

// The frame of the admin and poll pages: title, a way back, buttons on the right (`actions`), and MUI sized
// for the page's 10px rem
export default function AdminPage({ title, back, actions, children }) {
    return (
        <ThemeProvider theme={appTheme}>
            <div className="admin-page">
                <header className="admin-page_header">
                    {back
                        ? <Button component={Link} to={back.to} startIcon={<ArrowBackIcon />}>{back.label}</Button>
                        : <></>}
                    <div className="admin-page_title-row">
                        <h1>{title}</h1>
                        {actions ? <div className="admin-page_actions">{actions}</div> : <></>}
                    </div>
                </header>
                {children}
            </div>
        </ThemeProvider>
    );
}
