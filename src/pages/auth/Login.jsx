import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, TextField } from "@mui/material";
import AuthPage from "../../components/AuthPage";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../modules/api";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            await login(email, password);
            // Back to the page that asked for a login, e.g. /admin
            navigate(location.state && location.state.from ? location.state.from : "/", { replace: true });
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült a bejelentkezés!"));
            setSaving(false);
        }
    };

    return (
        <AuthPage title="Bejelentkezés">
            <form className="auth-form" onSubmit={submit}>
                {error !== "" ? <Alert severity="error">{error}</Alert> : <></>}
                <TextField label="E-mail cím" type="email" autoComplete="email" required autoFocus
                    value={email} onChange={event => setEmail(event.target.value)} />
                <TextField label="Jelszó" type="password" autoComplete="current-password" required
                    value={password} onChange={event => setPassword(event.target.value)} />
                <Button type="submit" variant="contained" size="large" disabled={saving}>Bejelentkezés</Button>
            </form>
            <div className="auth-links">
                <Link to="/elfelejtett-jelszo">Elfelejtetted a jelszavad?</Link>
                <Link to="/regisztracio">Még nincs fiókod? Regisztrálj!</Link>
            </div>
        </AuthPage>
    );
}
