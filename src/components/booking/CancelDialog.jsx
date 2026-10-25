import React, { useState } from "react";
import axios from "axios";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, ThemeProvider } from "@mui/material";
import { appTheme } from "../AuthPage";
import { errorMessage } from "../../modules/api";
import { describeReservation } from "../../modules/reservationText";

// Confirms cancelling a reservation. `request` is null (closed) or { reservation, contact }.
export default function CancelDialog({ request, onClose, onCancelled }) {
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const reservation = request ? request.reservation : null;

    const close = () => {
        setError("");
        onClose();
    };

    const cancel = async () => {
        setCancelling(true);
        setError("");
        try {
            await axios.delete(`/reservations/${reservation.id}`, { data: { contact: request.contact } });
            onCancelled(reservation);
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült lemondani a foglalást!"));
        }
        setCancelling(false);
    };

    return (
        <ThemeProvider theme={appTheme}>
            <Dialog open={request !== null} onClose={close} fullWidth maxWidth="xs">
                <DialogTitle>Foglalás lemondása</DialogTitle>
                {reservation
                    ? <DialogContent className="contact-dialog">
                        <p>Biztosan lemondod a(z) „{reservation.title}” foglalást?</p>
                        <p className="contact-dialog_time">{describeReservation(reservation)}</p>
                        {reservation.regularityMeasure !== "never" ? <p>Az összes ismétlődése is törlődik.</p> : <></>}
                        {error !== "" ? <p className="contact-dialog_error" role="alert">{error}</p> : <></>}
                    </DialogContent>
                    : <></>}
                <DialogActions>
                    <Button onClick={close} disabled={cancelling}>Mégse</Button>
                    <Button color="error" variant="contained" onClick={cancel} disabled={cancelling}>Lemondás</Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}
