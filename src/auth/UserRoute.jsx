import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import PageLoader from "../components/PageLoader";

// Shows its page only to logged in users; others go to the login page and come back after logging in
export default function UserRoute({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    if (user === undefined) return <PageLoader />;
    if (user === null) return <Navigate to="/bejelentkezes" state={{ from: location.pathname }} replace />;
    return children;
}
