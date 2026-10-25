import React, { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, TextField } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LegalLink from "../../components/legal/LegalLink";
import AuthPage from "../../components/AuthPage";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../modules/api";
import PageLoader from "../../components/PageLoader";

// The user's own data; step 4 fills the booking form with it. Here they also download everything stored about
// them, or delete their account (GDPR).
export default function Profile() {
    const { user, updateProfile, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [dataMessage, setDataMessage] = useState(null);
    // The account deletion dialog: null, or the password typed in it
    const [deletePassword, setDeletePassword] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    // Once deleted, the page only leaves for the home page (not for the login, as for a logged-out visitor)
    const deleted = useRef(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "" });
    const [profileMessage, setProfileMessage] = useState(null);
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", newPasswordAgain: "" });
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) setForm({ name: user.name, email: user.email, phone: user.phone });
    }, [user]);

    if (deleted.current) return <></>;
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

    // Everything stored about the user, as a JSON file
    const downloadData = async () => {
        setSaving(true);
        try {
            const res = await axios.get("/auth/my-data");
            const file = new Blob([JSON.stringify(res.data.result, null, 2)], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(file);
            link.download = `idopontfoglalo-adataim-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(link.href);
            setDataMessage({ severity: "success", text: "Az adataidat letöltöttük egy JSON fájlba." });
        } catch (err) {
            setDataMessage({ severity: "error", text: errorMessage(err, "Nem sikerült letölteni az adataidat!") });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async (event) => {
        event.preventDefault();
        setSaving(true);
        setDeleteError("");
        try {
            deleted.current = true;
            await deleteAccount(deletePassword);
            navigate("/", { replace: true, state: { accountDeleted: true } });
        } catch (err) {
            deleted.current = false;
            setDeleteError(errorMessage(err, "Nem sikerült törölni a fiókot!"));
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
            <Divider />
            <section className="auth-form profile-data">
                <h2>Adataim</h2>
                <p>
                    Letöltheted az összes rólad tárolt adatot, vagy törölheted a fiókodat.
                    Részletek: <LegalLink kind="privacy" />.
                </p>
                {dataMessage ? <Alert severity={dataMessage.severity}>{dataMessage.text}</Alert> : <></>}
                <Button variant="outlined" size="large" startIcon={<DownloadIcon />} onClick={downloadData} disabled={saving}>
                    Adataim letöltése
                </Button>
                <Button variant="outlined" color="error" size="large" startIcon={<DeleteForeverIcon />}
                    onClick={() => { setDeleteError(""); setDeletePassword(""); }} disabled={saving}>
                    Fiók törlése
                </Button>
            </section>
            <Dialog open={deletePassword !== null} onClose={() => setDeletePassword(null)} maxWidth="xs" aria-labelledby="delete-account-title">
                <form onSubmit={confirmDelete}>
                    <DialogTitle id="delete-account-title">Fiók végleges törlése</DialogTitle>
                    <DialogContent className="contact-dialog">
                        {deleteError !== "" ? <Alert severity="error">{deleteError}</Alert> : <></>}
                        <ul className="profile-data_consequences">
                            <li>A fiókod, a neved, az e-mail címed és a telefonszámod törlődik; nem tudsz többé bejelentkezni.</li>
                            <li>A jövőbeli foglalásaidat lemondjuk. A korábbiak a naptárban maradnak, de az elérhetőséged nélkül.</li>
                            <li>Az általad létrehozott egyeztetések a válaszokkal együtt törlődnek.</li>
                            <li>Mások egyeztetéseire adott válaszaidból az elérhetőséged törlődik.</li>
                        </ul>
                        <p>Ez nem vonható vissza. Ha kell, előbb töltsd le az adataidat.</p>
                        <TextField label="Jelszó a megerősítéshez" type="password" autoComplete="current-password" required autoFocus
                            value={deletePassword || ""} onChange={event => setDeletePassword(event.target.value)} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeletePassword(null)} disabled={saving}>Mégse</Button>
                        <Button type="submit" variant="contained" color="error" disabled={saving || !deletePassword}>Fiók törlése</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </AuthPage>
    );
}
