import React from "react";
import { createTheme, Paper, ThemeProvider } from "@mui/material";

// The page's root font size is 62.5% (1rem = 10px); this tells MUI, so its components get their usual size
export const appTheme = createTheme({
    typography: { htmlFontSize: 10 },
    palette: { primary: { main: "#053742" } },
});

// A centered card for the login, registration, password and profile pages
export default function AuthPage(props) {
    return (
        <ThemeProvider theme={appTheme}>
            <div className="auth-page">
                <Paper className="auth-page_card" elevation={3}>
                    <h1>{props.title}</h1>
                    {props.children}
                </Paper>
            </div>
        </ThemeProvider>
    );
}
