import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Switch,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";
import AdminPage from "../../components/AdminPage";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../modules/api";

// Admins grant or take away admin rights here
export default function UsersAdmin() {
    const { user: currentUser } = useAuth();
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

    return (
        <AdminPage title="Felhasználók és jogosultságok" back={{ to: "/admin", label: "Adminisztráció" }}>
            <p className="admin-page_intro">Az adminok kezelhetik az erőforrásokat, a foglalásokat és az időpont-egyeztetéseket.</p>
            {users === null ? <></> :
                <TableContainer className="users-table">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Név</TableCell>
                                <TableCell>E-mail</TableCell>
                                <TableCell className="users-table_optional">Telefon</TableCell>
                                <TableCell className="users-table_optional">Regisztrált</TableCell>
                                <TableCell align="center">Admin</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map(user => {
                                const isSelf = currentUser && currentUser.id === user.id;
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.name || "–"}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="users-table_optional">{user.phone || "–"}</TableCell>
                                        <TableCell className="users-table_optional">{new Date(user.createdAt).toLocaleDateString("hu-HU")}</TableCell>
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
