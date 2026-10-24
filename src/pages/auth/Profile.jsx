import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Divider, TextField } from "@mui/material";
import AuthPage from "../../components/AuthPage";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../modules/api";
import PageLoader from "../../components/PageLoader";

// The user's own data; step 4 fills the booking form with it
export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", phone: "" });
    const [profileMessage, setProfileMessage] = useState(null);
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", newPasswordAgain: "" });
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) setForm({ name: user.name, email: user.email, phone: user.phone });
    }, [user]);

    if (user === undefined) return <PageLoader />;
    if (user === null) return <Navigate to="/bejelentkezes" state={{ from: "/profil" }} replace />;

    const saveProfile = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await updateProfile(form);
            setProfileMessage({ severity: "success", text: "Az adataidat elmentettük." });
        } catch (err) {
            setProfileMessage({ severity: "error", text: errorMessage(err, "Nem sikerült menteni az adatokat!") });
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async (event) => {
        event.preventDefault();
        if (passwords.newPassword !== passwords.newPasswordAgain) {
            setPasswordMessage({ severity: "error", text: "A két új jelszó nem egyezik!" });
            return;
        }
        setSaving(true);
        try {
            await axios.put("/auth/password", { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
            setPasswords({ currentPassword: "", newPassword: "", newPasswordAgain: "" });
            setPasswordMessage({ severity: "success", text: "A jelszavad megváltozott. A többi eszközödön újra be kell jelentkezned." });
        } catch (err) {
            setPasswordMessage({ severity: "error", text: errorMessage(err, "Nem sikerült megváltoztatni a jelszót!") });
        } finally {
            setSaving(false);
        }
    };

    const change = field => event => setForm({ ...form, [field]: event.target.value });
    const changePasswordField = field => event => setPasswords({ ...passwords, [field]: event.target.value });

    return (
        <AuthPage title="Profil">
            <form className="auth-form" onSubmit={saveProfile}>
                <p>Ezekkel az adatokkal töltjük ki a foglalási űrlapot, ha be vagy jelentkezve.</p>
                {profileMessage ? <Alert severity={profileMessage.severity}>{profileMessage.text}</Alert> : <></>}
                <TextField label="Név" autoComplete="name" value={form.name} onChange={change("name")} />
                <TextField label="E-mail cím" type="email" autoComplete="email" required value={form.email} onChange={change("email")} />
                <TextField label="Telefonszám" type="tel" autoComplete="tel" value={form.phone} onChange={change("phone")} />
                <Button type="submit" variant="contained" size="large" disabled={saving}>Adatok mentése</Button>
            </form>
            <Divider />
            <form className="auth-form" onSubmit={changePassword}>
                <h2>Jelszó módosítása</h2>
                {passwordMessage ? <Alert severity={passwordMessage.severity}>{passwordMessage.text}</Alert> : <></>}
                <TextField label="Jelenlegi jelszó" type="password" autoComplete="current-password" required
                    value={passwords.currentPassword} onChange={changePasswordField("currentPassword")} />
                <TextField label="Új jelszó" type="password" autoComplete="new-password" required helperText="Legalább 8 karakter."
                    value={passwords.newPassword} onChange={changePasswordField("newPassword")} />
                <TextField label="Új jelszó még egyszer" type="password" autoComplete="new-password" required
                    value={passwords.newPasswordAgain} onChange={changePasswordField("newPasswordAgain")} />
                <Button type="submit" variant="outlined" size="large" disabled={saving}>Jelszó módosítása</Button>
            </form>
        </AuthPage>
    );
}
