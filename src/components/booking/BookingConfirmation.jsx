import React from "react";
import { Link } from "react-router-dom";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { describeReservation, describeTime } from "../../modules/reservationText";

// A single booking in the calendar's one-line form; a repeating one with its repetition
function timeText(reservation) {
    if (reservation.regularityMeasure !== "never") return describeReservation(reservation);
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    // An all-day booking is stored with its last day; the one-line form wants the day after it
    return describeTime(start, reservation.allDay ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : end, reservation.allDay);
}

// After a new booking: what was booked, and how to find and change it later. `confirmation` is null (closed)
// or { reservation, resource }.
export default function BookingConfirmation({ confirmation, user, onClose }) {
    const reservation = confirmation ? confirmation.reservation : null;
    const contact = reservation ? reservation.contactEmail || reservation.contactPhone : "";

    return (
        <Dialog open={confirmation !== null} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="booking-confirmation-title">
            <DialogTitle id="booking-confirmation-title" className="booking-confirmation_title">
                <CheckCircleIcon color="success" /> Foglalás rögzítve
            </DialogTitle>
            {reservation
                ? <DialogContent className="booking-confirmation">
                    <dl>
                        <div><dt>Erőforrás</dt><dd>{confirmation.resource.title}</dd></div>
                        <div><dt>Megnevezés</dt><dd>{reservation.title}</dd></div>
                        <div><dt>Időpont</dt><dd>{timeText(reservation)}</dd></div>
                    </dl>
                    {user
                        ? <p>A foglalásodat a <Link to="/foglalasaim" onClick={onClose}>Foglalásaim</Link> oldalon találod; ott módosíthatod vagy lemondhatod.</p>
                        : <>
                            {contact !== ""
                                ? <p>Később a naptárban rákattintva, ezzel módosíthatod vagy mondhatod le: <strong>{contact}</strong>. Érdemes megjegyezned.</p>
                                : <></>}
                            {reservation.contactEmail
                                ? <p className="booking-confirmation_tip">Ha ezzel az e-mail címmel regisztrálsz, a Foglalásaim oldalon is megtalálod.</p>
                                : <></>}
                        </>}
                </DialogContent>
                : <></>}
            <DialogActions>
                <Button variant="contained" onClick={onClose} autoFocus>Rendben</Button>
            </DialogActions>
        </Dialog>
    );
}
