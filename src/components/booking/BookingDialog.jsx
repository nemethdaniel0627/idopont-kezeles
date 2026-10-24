import React from "react";
import { Dialog, DialogContent, ThemeProvider, useMediaQuery } from "@mui/material";
import ReservationForm from "../ReservationForm";
import { appTheme } from "../AuthPage";
import { useAuth } from "../../auth/AuthContext";

// The booking form above the calendar. `booking` is null (closed), { initial } for a new reservation or
// { reservation, contact } to edit one. Admins book without the rules and without a required contact.
export default function BookingDialog({ resource, booking, onClose, onSaved }) {
    const { user } = useAuth();
    const isAdmin = Boolean(user && user.role === "admin");
    const fullScreen = useMediaQuery("(max-width: 600px)");

    return (
        <ThemeProvider theme={appTheme}>
            <Dialog open={booking !== null} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" scroll="body"
                aria-labelledby="booking-dialog-title">
                {booking !== null
                    ? <DialogContent className="booking-dialog">
                        <p className="booking-dialog_resource" id="booking-dialog-title">{resource.title}</p>
                        <ReservationForm resourceId={resource.id} reservation={booking.reservation} initial={booking.initial}
                            forUser={!isAdmin} rules={resource} contact={booking.contact} onSaved={onSaved} onCancel={onClose} />
                    </DialogContent>
                    : <></>}
            </Dialog>
        </ThemeProvider>
    );
}
