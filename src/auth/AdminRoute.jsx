import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Alert } from "@mui/material";
import AuthPage from "../components/AuthPage";
import { useAuth } from "./AuthContext";
import PageLoader from "../components/PageLoader";

// Shows its page only to admins: logged out users go to the login page, others get a message
export default function AdminRoute({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    if (user === undefined) return <PageLoader />;
    if (user === null) return <Navigate to="/bejelentkezes" state={{ from: location.pathname }} replace />;
    if (user.role !== "admin") {
        return (
            <AuthPage title="Nincs jogosultság">
                <Alert severity="warning">Ezt az oldalt csak adminisztrátorok láthatják.</Alert>
            </AuthPage>
        );
    }
    return children;
}
