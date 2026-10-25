import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Alert, Button, TextField } from "@mui/material";
import AuthPage from "../../components/AuthPage";
import { errorMessage } from "../../modules/api";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const [saving, setSaving] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            await axios.post("/auth/password-reset", { email });
            setSent(true);
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült elküldeni a levelet!"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AuthPage title="Elfelejtett jelszó">
            {sent
                // The same answer whether or not the address is registered
                ? <Alert severity="success">
                    Ha a(z) {email} cím regisztrálva van, küldtünk rá egy linket, amivel új jelszót adhatsz meg.
                    A link 1 óráig érvényes.
                </Alert>
                : <form className="auth-form" onSubmit={submit}>
                    <p>Add meg az e-mail címed, és küldünk egy linket az új jelszó megadásához.</p>
                    {error !== "" ? <Alert severity="error">{error}</Alert> : <></>}
                    <TextField label="E-mail cím" type="email" autoComplete="email" required autoFocus
                        value={email} onChange={event => setEmail(event.target.value)} />
                    <Button type="submit" variant="contained" size="large" disabled={saving}>Link küldése</Button>
                </form>
            }
            <div className="auth-links">
                <Link to="/bejelentkezes">Vissza a bejelentkezéshez</Link>
            </div>
        </AuthPage>
    );
}
