import React, { useState } from "react";
import axios from "axios";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ThemeProvider } from "@mui/material";
import { appTheme } from "../AuthPage";
import { errorMessage } from "../../modules/api";

// Before editing or cancelling without admin rights: asks for the email or phone number given at booking.
// `request` is null (closed) or { id, title, action }; on success onAccess(reservation, contact, action).
export default function ContactDialog({ request, onClose, onAccess }) {
    const [contact, setContact] = useState("");
    const [error, setError] = useState("");
    const [checking, setChecking] = useState(false);

    const close = () => {
        setContact("");
        setError("");
        onClose();
    };

    const submit = async (event) => {
        event.preventDefault();
        setChecking(true);
        setError("");
        try {
            const res = await axios.post(`/reservations/${request.id}/access`, { contact });
            onAccess(res.data.result, contact, request.action);
            setContact("");
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült megnyitni a foglalást!"));
        }
        setChecking(false);
    };

    return (
        <ThemeProvider theme={appTheme}>
            <Dialog open={request !== null} onClose={close} fullWidth maxWidth="xs">
                <form onSubmit={submit}>
                    <DialogTitle>{request && request.action === "cancel" ? "Foglalás lemondása" : "Foglalás módosítása"}</DialogTitle>
                    <DialogContent className="contact-dialog">
                        <p>Add meg az e-mail címet vagy a telefonszámot, amelyet a(z) „{request ? request.title : ""}” foglalásakor megadtál.</p>
                        {error !== "" ? <p className="contact-dialog_error" role="alert">{error}</p> : <></>}
                        <TextField label="E-mail cím vagy telefonszám" value={contact} required autoFocus fullWidth
                            inputProps={{ autoCapitalize: "none", autoCorrect: "off", spellCheck: false }}
                            onChange={event => setContact(event.target.value)} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={close} disabled={checking}>Mégse</Button>
                        <Button type="submit" variant="contained" disabled={checking}>Tovább</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </ThemeProvider>
    );
}
