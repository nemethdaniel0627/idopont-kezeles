import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, ThemeProvider } from "@mui/material";
import { appTheme } from "../AuthPage";
import LegalLink from "./LegalLink";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../modules/api";

// A logged-in user who has not accepted the current terms and privacy notice (registered before them, or they
// changed since) is asked to accept them before going on; the other way out is logging out.
export default function TermsUpdateDialog() {
    const { user, acceptTerms, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [current, setCurrent] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;
        axios.get("/legal").then(res => setCurrent(res.data.result)).catch(err => console.error(err));
    }, [user]);

    // Not on the Profile page, where the account can be deleted instead
    const outdated = Boolean(user && current && pathname !== "/profil"
        && (user.termsVersion !== current.terms || user.privacyVersion !== current.privacy));
    const firstTime = Boolean(user && user.termsVersion === null);

    const accept = async () => {
        setSaving(true);
        setError("");
        try {
            await acceptTerms();
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült menteni az elfogadást!"));
        } finally {
            setSaving(false);
        }
    };

    const leave = async () => {
        await logout();
        navigate("/");
    };

    return (
        <ThemeProvider theme={appTheme}>
            <Dialog open={outdated} maxWidth="xs" aria-labelledby="terms-update-title">
                <DialogTitle id="terms-update-title">{firstTime ? "Kérjük, fogadd el a feltételeket" : "Frissültek a feltételek"}</DialogTitle>
                <DialogContent className="contact-dialog">
                    {error !== "" ? <Alert severity="error">{error}</Alert> : <></>}
                    <p>
                        {firstTime
                            ? "A folytatáshoz olvasd el és fogadd el a felhasználási feltételeket és az adatkezelési tájékoztatót."
                            : "A felhasználási feltételek vagy az adatkezelési tájékoztató megváltozott. A folytatáshoz olvasd el és fogadd el őket."}
                    </p>
                    <p className="terms-update_links">
                        <LegalLink kind="terms" />
                        <LegalLink kind="privacy" />
                    </p>
                    <p className="admin-section_hint">
                        Ha nem fogadod el, kijelentkezhetsz, vagy a <Link to="/profil">Profil</Link> oldalon letöltheted az adataidat és törölheted a fiókodat.
                    </p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={leave} disabled={saving}>Kijelentkezés</Button>
                    <Button variant="contained" onClick={accept} disabled={saving}>Elfogadom</Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}
