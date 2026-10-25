import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Alert, Button, Checkbox, FormControlLabel, Snackbar, TextField, ThemeProvider, ToggleButton, ToggleButtonGroup
} from "@mui/material";
import AdminPage from "../../components/AdminPage";
import LegalText from "../../components/legal/LegalText";
import { LEGAL_TITLES } from "../../components/legal/LegalLink";
import { appTheme } from "../../components/AuthPage";
import { errorMessage } from "../../modules/api";

// The [bracketed] parts of the draft still to be filled in
const placeholdersIn = text => [...new Set(text.match(/\[[^\]\n]+\]/g) || [])];

// Admins edit the terms and the privacy notice here. A major change makes a new version that users accept again;
// a minor one (a typo) keeps the version they accepted.
export default function LegalAdmin() {
    const [kind, setKind] = useState("terms");
    const [saved, setSaved] = useState(null);
    const [body, setBody] = useState("");
    const [major, setMajor] = useState(false);
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        setSaved(null);
        axios.get(`/legal/${kind}`)
            .then(res => {
                setSaved(res.data.result);
                setBody(res.data.result.body);
                setMajor(false);
            })
            .catch(err => setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült betölteni a szöveget!") }));
    }, [kind]);

    const dirty = saved !== null && body !== saved.body;

    const switchKind = (event, value) => {
        if (value === null || value === kind) return;
        if (dirty && !window.confirm("A módosítások nincsenek mentve. Elveted őket?")) return;
        setKind(value);
    };

    const save = async () => {
        setSaving(true);
        try {
            const res = await axios.put(`/legal/${kind}`, { body, major });
            setSaved(res.data.result);
            setBody(res.data.result.body);
            setMessage({
                severity: "success",
                text: major
                    ? `Elmentve ${res.data.result.version}. verzióként: a felhasználóknak a következő látogatáskor újra el kell fogadniuk.`
                    : "Elmentve; a verzió nem változott, a felhasználóknak nem kell újra elfogadniuk.",
            });
            setMajor(false);
        } catch (err) {
            setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült menteni a szöveget!") });
        } finally {
            setSaving(false);
        }
    };

    const placeholders = placeholdersIn(body);

    return (
        <AdminPage title="Feltételek és adatkezelés" back={{ to: "/admin", label: "Adminisztráció" }}>
            <ThemeProvider theme={appTheme}>
                <p className="admin-page_intro">
                    Ezeket a szövegeket fogadják el a felhasználók regisztráláskor; a lábléc linkjeiről bárki elolvashatja őket.
                    A kezdő szöveg minta: töltsd ki a [szögletes zárójeles] részeket, és érdemes jogásszal is átnézetni.
                </p>
                <ToggleButtonGroup exclusive color="primary" value={kind} onChange={switchKind} className="legal-admin_kinds">
                    <ToggleButton value="terms">{LEGAL_TITLES.terms}</ToggleButton>
                    <ToggleButton value="privacy">{LEGAL_TITLES.privacy}</ToggleButton>
                </ToggleButtonGroup>

                {saved
                    ? <section className="admin-section legal-admin">
                        <p className="legal-dialog_version">
                            Jelenleg: {saved.version}. verzió{saved.createdAt ? `, mentve ${new Date(saved.createdAt).toLocaleString("hu-HU")}` : " (a beépített minta, még nincs mentve)"}
                        </p>
                        {placeholders.length
                            ? <Alert severity="warning">
                                Még kitöltendő részek: {placeholders.join(", ")}
                            </Alert>
                            : <></>}
                        <div className="legal-admin_toolbar">
                            <ToggleButtonGroup exclusive size="small" value={preview ? "preview" : "edit"} onChange={(event, value) => value && setPreview(value === "preview")}>
                                <ToggleButton value="edit">Szerkesztés</ToggleButton>
                                <ToggleButton value="preview">Előnézet</ToggleButton>
                            </ToggleButtonGroup>
                            <span className="admin-section_hint">„## ” címsor, „- ” felsorolás, üres sor új bekezdés.</span>
                        </div>
                        {preview
                            ? <div className="legal-admin_preview"><LegalText body={body} /></div>
                            : <TextField multiline minRows={18} fullWidth value={body} onChange={event => setBody(event.target.value)}
                                inputProps={{ "aria-label": LEGAL_TITLES[kind], spellCheck: true }} className="legal-admin_editor" />}
                        <FormControlLabel
                            control={<Checkbox checked={major} onChange={event => setMajor(event.target.checked)} />}
                            label="Lényeges változás: új verzió, a felhasználóknak újra el kell fogadniuk" />
                        <div className="admin-section_actions">
                            <Button onClick={() => setBody(saved.body)} disabled={!dirty || saving}>Elvetés</Button>
                            <Button variant="contained" onClick={save} disabled={(!dirty && !major) || saving}>Mentés</Button>
                        </div>
                    </section>
                    : <></>}
            </ThemeProvider>
            <Snackbar open={message !== null} autoHideDuration={6000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
