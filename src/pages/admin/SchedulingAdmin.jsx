import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
    Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip
} from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPage from "../../components/AdminPage";
import { errorMessage } from "../../modules/api";

// Every poll, for admins: open, close or delete them
export default function SchedulingAdmin() {
    const [polls, setPolls] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [message, setMessage] = useState(null);

    const load = () => axios.get("/admin/polls")
        .then(res => setPolls(res.data.result))
        .catch(err => setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült betölteni az egyeztetéseket!") }));

    useEffect(() => {
        load();
    }, []);

    const run = async () => {
        const { action, poll } = confirm;
        setConfirm(null);
        try {
            if (action === "close") await axios.post(`/polls/${poll.publicKey}/close`);
            else await axios.delete(`/polls/${poll.publicKey}`);
            setMessage({ severity: "success", text: action === "close" ? `„${poll.title}” lezárva.` : `„${poll.title}” törölve.` });
            load();
        } catch (err) {
            setMessage({ severity: "error", text: errorMessage(err, "A művelet nem sikerült!") });
        }
    };

    return (
        <AdminPage title="Közös időpont-egyeztetés" back={{ to: "/admin", label: "Adminisztráció" }}
            actions={<Button variant="outlined" color="inherit" component={Link} to="/egyeztetesek/uj">Új egyeztetés</Button>}>
            <p className="admin-page_intro">Az összes egyeztetés. Az adminok minden egyeztetés válaszait és eredményét látják.</p>
            {polls === null ? <></> :
                polls.length === 0
                    ? <p className="resources-admin_empty">Még nincs egyeztetés.</p>
                    : <TableContainer className="users-table">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Egyeztetés</TableCell>
                                    <TableCell className="users-table_optional">Szervező</TableCell>
                                    <TableCell align="right">Válasz</TableCell>
                                    <TableCell>Állapot</TableCell>
                                    <TableCell className="users-table_optional">Létrehozva</TableCell>
                                    <TableCell align="right">Műveletek</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {polls.map(poll =>
                                    <TableRow key={poll.publicKey}>
                                        <TableCell><Link to={`/egyeztetes/${poll.publicKey}`}>{poll.title}</Link></TableCell>
                                        <TableCell className="users-table_optional">{poll.organizerName || poll.organizerEmail}</TableCell>
                                        <TableCell align="right">{poll.answerCount}</TableCell>
                                        <TableCell>{poll.closed ? <Chip size="small" label="Lezárva" /> : <Chip size="small" color="success" label="Nyitott" />}</TableCell>
                                        <TableCell className="users-table_optional">{new Date(poll.createdAt).toLocaleDateString("hu-HU")}</TableCell>
                                        <TableCell align="right" className="polls-admin_actions">
                                            {!poll.closed
                                                ? <Tooltip title="Lezárás"><IconButton aria-label={`${poll.title} lezárása`} onClick={() => setConfirm({ action: "close", poll })}><LockIcon /></IconButton></Tooltip>
                                                : <></>}
                                            <Tooltip title="Törlés"><IconButton aria-label={`${poll.title} törlése`} onClick={() => setConfirm({ action: "delete", poll })}><DeleteIcon /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>}

            <Dialog open={confirm !== null} onClose={() => setConfirm(null)}>
                <DialogTitle>{confirm && confirm.action === "close" ? "Egyeztetés lezárása" : "Egyeztetés törlése"}</DialogTitle>
                <DialogContent>
                    {confirm
                        ? confirm.action === "close"
                            ? `A(z) „${confirm.poll.title}” lezárása után már senki sem válaszolhat.`
                            : `A(z) „${confirm.poll.title}” eltűnik, a linkje nem fog működni.`
                        : ""}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirm(null)}>Mégse</Button>
                    <Button variant="contained" color={confirm && confirm.action === "delete" ? "error" : "primary"} onClick={run}>
                        {confirm && confirm.action === "close" ? "Lezárás" : "Törlés"}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
