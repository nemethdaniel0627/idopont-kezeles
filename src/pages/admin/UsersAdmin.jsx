import React, { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Snackbar, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import AdminPage from "../../components/AdminPage";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../modules/api";

// Admins grant or take away admin rights here
export default function UsersAdmin() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        axios.get("/users")
            .then(res => setUsers(res.data.result))
            .catch(err => setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült betölteni a felhasználókat!") }));
    }, []);

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
                                const toggle = <Switch checked={user.role === "admin"} disabled={isSelf} onChange={() => toggleAdmin(user)}
                                    inputProps={{ "aria-label": `${user.name || user.email} admin` }} />;
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.name || "–"}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="users-table_optional">{user.phone || "–"}</TableCell>
                                        <TableCell className="users-table_optional">{new Date(user.createdAt).toLocaleDateString("hu-HU")}</TableCell>
                                        <TableCell align="center">
                                            {isSelf
                                                // A disabled switch gets no hover events, so the tooltip needs a wrapper
                                                ? <Tooltip title="A saját admin jogodat nem veheted el"><span>{toggle}</span></Tooltip>
                                                : toggle}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            }
            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
