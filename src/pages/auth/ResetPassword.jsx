import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Alert, Button, TextField } from "@mui/material";
import AuthPage from "../../components/AuthPage";
import { errorMessage } from "../../modules/api";

// Opened from the link in the password reset email: /jelszo-visszaallitas?token=...
export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [password, setPassword] = useState("");
    const [passwordAgain, setPasswordAgain] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [saving, setSaving] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        if (password !== passwordAgain) {
            setError("A két jelszó nem egyezik!");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await axios.post("/auth/password-reset/confirm", { token, password });
            setDone(true);
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült beállítani az új jelszót!"));
        } finally {
            setSaving(false);
        }
    };

    let content;
    if (token === "") {
        content = <Alert severity="error">A link hiányos. Nyisd meg újra a levélben kapott linket, vagy kérj újat!</Alert>;
    } else if (done) {
        content = <Alert severity="success">Az új jelszavad beállítottuk. Most már bejelentkezhetsz vele.</Alert>;
    } else {
        content = (
            <form className="auth-form" onSubmit={submit}>
                {error !== "" ? <Alert severity="error">{error}</Alert> : <></>}
                <TextField label="Új jelszó" type="password" autoComplete="new-password" required autoFocus
                    value={password} onChange={event => setPassword(event.target.value)} helperText="Legalább 8 karakter." />
                <TextField label="Új jelszó még egyszer" type="password" autoComplete="new-password" required
                    value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)} />
                <Button type="submit" variant="contained" size="large" disabled={saving}>Új jelszó mentése</Button>
            </form>
        );
    }

    return (
        <AuthPage title="Új jelszó">
            {content}
            <div className="auth-links">
                <Link to="/bejelentkezes">Bejelentkezés</Link>
                <Link to="/elfelejtett-jelszo">Új link kérése</Link>
            </div>
        </AuthPage>
    );
}
