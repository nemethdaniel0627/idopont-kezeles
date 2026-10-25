import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ThemeProvider, Tooltip, useMediaQuery } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ReservationForm from "../ReservationForm";
import { appTheme } from "../AuthPage";
import { useAuth } from "../../auth/AuthContext";

// The booking form above the calendar. `booking` is null (closed), { initial } for a new reservation or
// { reservation, contact } to edit one. Admins book without the rules and without a required contact.
// Closing a form that was changed asks first, so nothing typed is lost by a stray click.
export default function BookingDialog({ resource, booking, onClose, onSaved }) {
    const { user } = useAuth();
    const isAdmin = Boolean(user && user.role === "admin");
    const fullScreen = useMediaQuery("(max-width: 600px)");
    const [dirty, setDirty] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);

    useEffect(() => {
        if (booking !== null) setDirty(false);
    }, [booking]);

    const requestClose = () => {
        if (dirty) setConfirmClose(true);
        else onClose();
    };

    const discard = () => {
        setConfirmClose(false);
        onClose();
    };

    return (
        <ThemeProvider theme={appTheme}>
            <Dialog open={booking !== null} onClose={requestClose} fullScreen={fullScreen} fullWidth maxWidth="sm" scroll="body"
                aria-labelledby="booking-dialog-title">
                {booking !== null
                    ? <DialogContent className="booking-dialog">
                        <div className="booking-dialog_head">
                            <p className="booking-dialog_resource" id="booking-dialog-title">{resource.title}</p>
                            <Tooltip title="Bezárás">
                                <IconButton onClick={requestClose} aria-label="Bezárás" className="booking-dialog_close"><CloseIcon /></IconButton>
                            </Tooltip>
                        </div>
                        <ReservationForm resourceId={resource.id} reservation={booking.reservation} initial={booking.initial}
                            forUser={!isAdmin} rules={resource} contact={booking.contact} onSaved={onSaved} onCancel={requestClose}
                            onDirty={() => setDirty(true)} />
                    </DialogContent>
                    : <></>}
            </Dialog>
            <Dialog open={confirmClose} onClose={() => setConfirmClose(false)} maxWidth="xs">
                <DialogTitle>Elveted a módosításokat?</DialogTitle>
                <DialogContent>A foglalás nem lesz elmentve.</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmClose(false)}>Vissza a foglaláshoz</Button>
                    <Button color="error" variant="contained" onClick={discard}>Elvetés</Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}
