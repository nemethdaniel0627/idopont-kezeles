import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Chip, List, ListItem, ListItemButton, ListItemText, Snackbar } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import AdminPage from "../../components/AdminPage";
import { errorMessage } from "../../modules/api";
import { copyText } from "../../modules/clipboard";
import { describeDays } from "../../modules/pollSlots";
import { useSettings } from "../../auth/SettingsContext";

// The logged in user's own polls
export default function MyPolls() {
    const [polls, setPolls] = useState(null);
    const { settings, can } = useSettings();
    const [message, setMessage] = useState(null);

    useEffect(() => {
        axios.get("/polls/mine")
            .then(res => setPolls(res.data.result))
            .catch(err => setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült betölteni az egyeztetéseket!") }));
    }, []);

    const copyLink = async (key) => {
        try {
            await copyText(`${window.location.origin}/egyeztetes/${key}`);
            setMessage({ severity: "success", text: "A linket a vágólapra másoltuk." });
        } catch (err) {
            setMessage({ severity: "warning", text: "Nem sikerült a vágólapra másolni." });
        }
    };

    return (
        <AdminPage title="Egyeztetéseim"
            actions={can.createPolls ? <Button variant="outlined" color="inherit" startIcon={<AddIcon />} component={Link} to="/egyeztetesek/uj">Új egyeztetés</Button> : null}>
            {can.createPolls
                ? <p className="admin-page_intro">
                    Hozz létre egy egyeztetést, küldd el a linkjét, és a válaszokból kiderül, mikor ér rá mindenki.
                </p>
                : <Alert severity="info" className="admin-page_intro">
                    {settings.pollsEnabled
                        ? "Egyeztetést létrehozni egy admin jóváhagyása után tudsz. A neked küldött egyeztetésekre addig is válaszolhatsz."
                        : "Az időpont-egyeztetés jelenleg nem elérhető."}
                </Alert>}
            {polls === null ? <></> :
                polls.length === 0
                    ? <p className="resources-admin_empty">Még nincs egyeztetésed.</p>
                    : <List className="my-polls">
                        {polls.map(poll =>
                            // The link button is next to the item, not laid over it, so the status never slides under it
                            <ListItem key={poll.publicKey} disablePadding className="my-polls_item">
                                <ListItemButton component={Link} to={`/egyeztetes/${poll.publicKey}`}>
                                    <ListItemText primary={poll.title} secondary={`${describeDays(poll)} · ${poll.answerCount} válasz`} />
                                    {poll.closed ? <Chip size="small" label="Lezárva" /> : <Chip size="small" color="success" label="Nyitott" />}
                                </ListItemButton>
                                <Button startIcon={<LinkIcon />} onClick={() => copyLink(poll.publicKey)} className="my-polls_link"
                                    aria-label={`${poll.title} linkjének másolása`}>
                                    Link
                                </Button>
                            </ListItem>
                        )}
                    </List>}
            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
