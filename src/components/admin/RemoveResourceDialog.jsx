import React, { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel } from "@mui/material";
import { errorMessage } from "../../modules/api";

// Confirms removing a resource; shows who has upcoming reservations and offers to notify them by email
export default function RemoveResourceDialog({ resource, open, onClose, removeResource, onRemoved }) {
    const [preview, setPreview] = useState(null);
    const [notify, setNotify] = useState(true);
    const [error, setError] = useState("");
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setPreview(null);
        setError("");
        axios.get(`/resources/${resource.id}/removal-preview`)
            .then(res => {
                setPreview(res.data.result);
                setNotify(res.data.result.notifiable > 0);
            })
            .catch(err => setError(errorMessage(err, "Nem sikerült betölteni a foglalásokat!")));
    }, [open, resource.id]);

    const remove = async () => {
        setRemoving(true);
        try {
            const result = await removeResource(resource.id, notify);
            onRemoved(result.notified);
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült törölni az erőforrást!"));
        } finally {
            setRemoving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>„{resource.title}” törlése</DialogTitle>
            <DialogContent className="remove-dialog">
                {error !== "" ? <Alert severity="error">{error}</Alert> : <></>}
                <p>Az erőforrás eltűnik a foglalható erőforrások közül. Az adatai megmaradnak, de már nem lesz látható.</p>
                {preview === null ? <></> :
                    preview.upcomingReservations === 0
                        ? <p>Nincs rá közelgő foglalás.</p>
                        : <>
                            <p>
                                {preview.upcomingReservations} közelgő foglalás van rá.{" "}
                                {preview.notifiable > 0
                                    ? `Ezekhez ${preview.notifiable} e-mail cím tartozik.`
                                    : "Egyikhez sincs megadva e-mail cím, ezért értesítést nem tudunk küldeni."}
                            </p>
                            <FormControlLabel
                                control={<Checkbox checked={notify} disabled={preview.notifiable === 0} onChange={() => setNotify(!notify)} />}
                                label="Értesítsük őket e-mailben" />
                        </>
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={removing}>Mégse</Button>
                <Button color="error" variant="contained" onClick={remove} disabled={removing || preview === null}>Törlés</Button>
            </DialogActions>
        </Dialog>
    );
}
