import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReservationForm from "../ReservationForm";
import { describeReservation } from "../../modules/reservationText";
import { errorMessage } from "../../modules/api";

// The reservations of a resource, with contact data (admins only), add / edit / delete
export default function ResourceReservations({ resourceId, showMessage }) {
    const [reservations, setReservations] = useState([]);
    // null, "new" or the reservation being edited
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const load = useCallback(() => {
        axios.get(`/resources/${resourceId}/reservations`)
            .then(res => setReservations(res.data.result))
            .catch(err => showMessage({ severity: "error", text: errorMessage(err, "Nem sikerült betölteni a foglalásokat!") }));
    }, [resourceId, showMessage]);

    useEffect(() => {
        load();
    }, [load]);

    const saved = () => {
        setEditing(null);
        load();
        showMessage({ severity: "success", text: "A foglalást elmentettük." });
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/reservations/${deleting.id}`);
            showMessage({ severity: "success", text: `A(z) „${deleting.title}” foglalást töröltük.` });
            load();
        } catch (err) {
            showMessage({ severity: "error", text: errorMessage(err, "Nem sikerült törölni a foglalást!") });
        }
        setDeleting(null);
    };

    return (
        <section className="admin-section">
            <h2>Foglalások</h2>
            {reservations.length === 0 ? <p className="admin-section_empty">Még nincs foglalás.</p> :
                <ul className="reservation-list">
                    {reservations.map(reservation =>
                        <li key={reservation.id}>
                            <div>
                                <strong>{reservation.title}</strong>
                                <p>{describeReservation(reservation)}</p>
                                {reservation.description ? <p className="reservation-list_description">{reservation.description}</p> : <></>}
                                {reservation.contactEmail || reservation.contactPhone
                                    ? <p className="reservation-list_contact">
                                        {[reservation.contactEmail, reservation.contactPhone].filter(Boolean).join(" · ")}
                                    </p>
                                    : <></>}
                            </div>
                            <div className="reservation-list_actions">
                                <IconButton aria-label={`${reservation.title} szerkesztése`} onClick={() => setEditing(reservation)}><EditIcon /></IconButton>
                                <IconButton aria-label={`${reservation.title} törlése`} onClick={() => setDeleting(reservation)}><DeleteIcon /></IconButton>
                            </div>
                        </li>
                    )}
                </ul>
            }
            {editing === null
                ? <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setEditing("new")}>Új foglalás</Button>
                : <ReservationForm
                    key={editing === "new" ? "new" : editing.id}
                    resourceId={resourceId}
                    reservation={editing === "new" ? null : editing}
                    onSaved={saved}
                    onCancel={() => setEditing(null)} />
            }

            <Dialog open={deleting !== null} onClose={() => setDeleting(null)}>
                <DialogTitle>Foglalás törlése</DialogTitle>
                <DialogContent>
                    Biztosan törlöd a(z) „{deleting ? deleting.title : ""}” foglalást
                    {deleting && deleting.regularityMeasure !== "never" ? ", az összes ismétlődésével együtt" : ""}?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleting(null)}>Mégse</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>Törlés</Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}
