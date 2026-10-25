import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import AuthPage from "../../components/AuthPage";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../modules/api";
import LegalLink from "../../components/legal/LegalLink";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", passwordAgain: "" });
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const change = field => event => setForm({ ...form, [field]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        if (form.password !== form.passwordAgain) {
            setError("A két jelszó nem egyezik!");
            return;
        }
        if (!accepted) {
            setError("A regisztrációhoz el kell fogadnod a felhasználási feltételeket és az adatkezelési tájékoztatót!");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, acceptTerms: true });
            // The home page greets new users and tells what they can do now
            navigate("/", { replace: true, state: { welcome: true } });
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült a regisztráció!"));
            setSaving(false);
        }
    };

    return (
        <AuthPage title="Regisztráció">
            <form className="auth-form" onSubmit={submit}>
                {error !== "" ? <Alert severity="error">{error}</Alert> : <></>}
                <TextField label="Név" autoComplete="name" value={form.name} onChange={change("name")} autoFocus />
                <TextField label="E-mail cím" type="email" autoComplete="email" required value={form.email} onChange={change("email")} />
                <TextField label="Telefonszám" type="tel" autoComplete="tel" value={form.phone} onChange={change("phone")}
                    helperText="Nem kötelező; foglaláskor kitöltjük vele az űrlapot." />
                <TextField label="Jelszó" type="password" autoComplete="new-password" required value={form.password}
                    onChange={change("password")} helperText="Legalább 8 karakter." />
                <TextField label="Jelszó még egyszer" type="password" autoComplete="new-password" required
                    value={form.passwordAgain} onChange={change("passwordAgain")} />
                <FormControlLabel className="auth-form_terms"
                    control={<Checkbox checked={accepted} onChange={event => setAccepted(event.target.checked)} required
                        inputProps={{ "aria-label": "Elfogadom a felhasználási feltételeket és az adatkezelési tájékoztatót" }} />}
                    label={<>
                        Elfogadom a <LegalLink kind="terms">felhasználási feltételeket</LegalLink>, és tudomásul vettem
                        az <LegalLink kind="privacy">adatkezelési tájékoztatót</LegalLink>: az adataimat csak a foglalásokhoz
                        és egyeztetésekhez használják, és nem adják át másnak.
                    </>} />
                <Button type="submit" variant="contained" size="large" disabled={saving}>Regisztráció</Button>
            </form>
            <div className="auth-links">
                <Link to="/bejelentkezes">Már van fiókod? Jelentkezz be!</Link>
            </div>
        </AuthPage>
    );
}
