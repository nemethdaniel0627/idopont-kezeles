import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Chip, Snackbar } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AddIcon from '@mui/icons-material/Add';
import AdminPage from "../components/AdminPage";
import BookingDialog from "../components/booking/BookingDialog";
import CancelDialog from "../components/booking/CancelDialog";
import { errorMessage } from "../modules/api";
import { describeReservation, describeTime } from "../modules/reservationText";

// The logged in user's upcoming bookings: made while logged in, or with the account's email.
// They are changed or cancelled here without giving the email again.
export default function MyBookings({ resources }) {
    const [bookings, setBookings] = useState(null);
    const [editing, setEditing] = useState(null);
    const [cancelRequest, setCancelRequest] = useState(null);
    const [message, setMessage] = useState(null);

    const load = useCallback(() => axios.get("/reservations/mine")
        .then(res => setBookings(res.data.result))
        .catch(err => setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült betölteni a foglalásaidat!") })), []);

    useEffect(() => {
        load();
    }, [load]);

    const resourceOf = booking => resources.find(resource => resource.id === booking.resourceId) || { id: booking.resourceId, title: booking.resourceTitle };

    const saved = () => {
        setEditing(null);
        setMessage({ severity: "success", text: "A foglalást módosítottuk." });
        load();
    };

    const cancelled = (reservation) => {
        setCancelRequest(null);
        setMessage({ severity: "success", text: `A(z) „${reservation.title}” foglalást lemondtuk.` });
        load();
    };

    return (
        <AdminPage title="Foglalásaim"
            actions={<Button variant="outlined" color="inherit" startIcon={<AddIcon />} component={Link} to="/">Új foglalás</Button>}>
            <p className="admin-page_intro">
                A közelgő foglalásaid: amelyeket bejelentkezve foglaltál, vagy amelyeknél az e-mail címedet adtad meg.
            </p>
            {bookings === null ? <></> :
                bookings.length === 0
                    ? <section className="admin-section">
                        <p className="admin-section_empty">Nincs közelgő foglalásod.</p>
                        <Button variant="contained" component={Link} to="/" className="admin-section_add">Foglalás</Button>
                    </section>
                    : <ul className="my-bookings">
                        {bookings.map(booking => {
                            const repeating = booking.regularityMeasure !== "never";
                            return (
                                <li key={booking.id} className="admin-section my-bookings_item">
                                    <div className="my-bookings_main">
                                        <span className="my-bookings_resource">{booking.resourceTitle}</span>
                                        <strong>{booking.title}</strong>
                                        <span className="my-bookings_time">
                                            {repeating ? "Következő: " : ""}{describeTime(new Date(booking.nextStart), new Date(booking.nextEnd), booking.allDay)}
                                        </span>
                                        {repeating ? <Chip size="small" label={describeReservation(booking).split(", ").slice(1).join(", ")} /> : <></>}
                                    </div>
                                    <div className="my-bookings_actions">
                                        <Button startIcon={<EditIcon />} onClick={() => setEditing(booking)}>Módosítás</Button>
                                        <Button color="error" startIcon={<EventBusyIcon />} onClick={() => setCancelRequest({ reservation: booking, contact: "" })}>
                                            Lemondás
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>}

            <BookingDialog resource={editing ? resourceOf(editing) : {}} booking={editing ? { reservation: editing, contact: "" } : null}
                onClose={() => setEditing(null)} onSaved={saved} />
            <CancelDialog request={cancelRequest} onClose={() => setCancelRequest(null)} onCancelled={cancelled} />
            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
