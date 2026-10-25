import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
    Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Switch,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";
import AdminPage from "../../components/AdminPage";
import { useAuth } from "../../auth/AuthContext";
import { useSettings } from "../../auth/SettingsContext";
import { errorMessage } from "../../modules/api";

const RIGHTS = { canBook: "foglalhat", canPoll: "egyeztetést hozhat létre" };

// Admins grant or take away the rights to book, to create polls and admin rights here.
// Guests (not logged in) have their own booking switch in the first row.
export default function UsersAdmin() {
    const { user: currentUser } = useAuth();
    const { settings, saveSettings } = useSettings();
    const [users, setUsers] = useState(null);
    const [message, setMessage] = useState(null);
    // The user whose admin right is about to change, asked first since it is a big change
    const [pending, setPending] = useState(null);

    useEffect(() => {
        axios.get("/users")
            .then(res => setUsers(res.data.result))
            .catch(err => setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült betölteni a felhasználókat!") }));
    }, []);

    const confirmToggle = async () => {
        const user = pending;
        setPending(null);
        await toggleAdmin(user);
    };

    const toggleAdmin = async (user) => {
        const role = user.role === "admin" ? "regular" : "admin";
        try {
            const res = await axios.put(`/users/${user.id}/role`, { role });
            setUsers(users.map(item => item.id === user.id ? res.data.result : item));
            setMessage({
                severity: "success",
                text: role === "admin" ? `${user.name || user.email} mostantól admin.` : `${user.name || user.email} már nem admin.`,
            });
        } catch (err) {
            setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült menteni a jogosultságot!") });
        }
    };

    // canBook or canPoll of a regular user, saved at once: it is easy to switch back
    const toggleRight = async (user, right) => {
        const value = !user[right];
        try {
            const res = await axios.put(`/users/${user.id}/permissions`, { [right]: value });
            setUsers(users.map(item => item.id === user.id ? res.data.result : item));
            setMessage({ severity: "success", text: `${user.name || user.email} ${value ? "mostantól" : "már nem"} ${RIGHTS[right]}.` });
        } catch (err) {
            setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült menteni a jogosultságot!") });
        }
    };

    const toggleGuests = async () => {
        const value = !settings.guestsCanBook;
        try {
            await saveSettings({ guestsCanBook: value });
            setMessage({ severity: "success", text: value ? "Bejelentkezés nélkül is lehet foglalni." : "Mostantól csak bejelentkezve lehet foglalni." });
        } catch (err) {
            setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült menteni a beállítást!") });
        }
    };

    // Admins may do everything: a switch that is on and can't be changed
    const rightCell = (user, right, label) => user.role === "admin"
        ? <Switch checked disabled title="Az adminok mindig" inputProps={{ "aria-label": `${user.name || user.email} ${label} (admin, mindig)` }} />
        : <Switch checked={Boolean(user[right])} onChange={() => toggleRight(user, right)}
            inputProps={{ "aria-label": `${user.name || user.email} ${label}` }} />;

    return (
        <AdminPage title="Felhasználók és jogosultságok" back={{ to: "/admin", label: "Adminisztráció" }}>
            <p className="admin-page_intro">
                <strong>Foglalás</strong>: foglalhat az erőforrásokra. <strong>Egyeztetés</strong>: létrehozhat időpont-egyeztetést
                (válaszolni linkkel bárki tud). Az új felhasználók egyiket sem tehetik, amíg itt meg nem adod.
                Az adminok mindent kezelhetnek.
            </p>
            {!settings.bookingEnabled || !settings.pollsEnabled
                ? <Alert severity="info" className="users-admin_off">
                    {!settings.bookingEnabled && !settings.pollsEnabled ? "A foglalás és az időpont-egyeztetés"
                        : !settings.bookingEnabled ? "A foglalás" : "Az időpont-egyeztetés"} az egész oldalon ki van
                    kapcsolva (<Link to="/admin">Adminisztráció</Link>), így az ehhez tartozó jogok most nem számítanak.
                </Alert>
                : <></>}
            {users === null ? <></> :
                <TableContainer className="users-table">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Név</TableCell>
                                <TableCell className="users-table_optional">E-mail</TableCell>
                                <TableCell className="users-table_optional">Telefon</TableCell>
                                <TableCell className="users-table_optional">Regisztrált</TableCell>
                                <TableCell align="center">Foglalás</TableCell>
                                <TableCell align="center">Egyeztetés</TableCell>
                                <TableCell align="center">Admin</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow className="users-table_guests">
                                <TableCell>
                                    <strong>Vendégek</strong>
                                    <span className="users-table_sub">bejelentkezés nélkül</span>
                                </TableCell>
                                <TableCell className="users-table_optional" colSpan={3} />
                                <TableCell align="center">
                                    <Switch checked={settings.guestsCanBook} onChange={toggleGuests}
                                        inputProps={{ "aria-label": "Vendégek foglalhatnak bejelentkezés nélkül" }} />
                                </TableCell>
                                <TableCell align="center" title="Egyeztetést csak bejelentkezve lehet létrehozni">–</TableCell>
                                <TableCell align="center">–</TableCell>
                            </TableRow>
                            {users.map(user => {
                                const isSelf = currentUser && currentUser.id === user.id;
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            {user.name || "–"}
                                            {/* Phones have no e-mail column: it goes under the name */}
                                            <span className="users-table_sub phone-only">{user.email}</span>
                                        </TableCell>
                                        <TableCell className="users-table_optional">{user.email}</TableCell>
                                        <TableCell className="users-table_optional">{user.phone || "–"}</TableCell>
                                        <TableCell className="users-table_optional">{new Date(user.createdAt).toLocaleDateString("hu-HU")}</TableCell>
                                        <TableCell align="center">{rightCell(user, "canBook", "foglalhat")}</TableCell>
                                        <TableCell align="center">{rightCell(user, "canPoll", "egyeztetést hozhat létre")}</TableCell>
                                        <TableCell align="center">
                                            {isSelf
                                                // Your own right can't be taken away: no switch, just who you are
                                                ? <Chip size="small" color="primary" label="Te (admin)" title="A saját admin jogodat nem veheted el" />
                                                : <Switch checked={user.role === "admin"} onChange={() => setPending(user)}
                                                    inputProps={{ "aria-label": `${user.name || user.email} admin` }} />}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            }
            <Dialog open={pending !== null} onClose={() => setPending(null)} maxWidth="xs">
                <DialogTitle>{pending && pending.role === "admin" ? "Admin jog elvétele" : "Admin jog megadása"}</DialogTitle>
                <DialogContent>
                    {pending
                        ? pending.role === "admin"
                            ? `${pending.name || pending.email} ezután nem kezelheti az erőforrásokat, a foglalásokat és az egyeztetéseket.`
                            : `${pending.name || pending.email} admin lesz: minden erőforrást, foglalást és egyeztetést kezelhet, és másokat is adminná tehet.`
                        : ""}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPending(null)}>Mégse</Button>
                    <Button variant="contained" color={pending && pending.role === "admin" ? "error" : "primary"} onClick={confirmToggle}>
                        {pending && pending.role === "admin" ? "Elveszem" : "Admin lesz"}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
