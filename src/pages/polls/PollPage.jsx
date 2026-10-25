import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
    Alert, AlertTitle, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, ListItemIcon, Menu, MenuItem, Snackbar, TextField
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InsightsIcon from '@mui/icons-material/Insights';
import LinkIcon from '@mui/icons-material/Link';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPage from "../../components/AdminPage";
import PollGrid from "../../components/polls/PollGrid";
import AnswerDialog from "../../components/polls/AnswerDialog";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../modules/api";
import Calendar from "../../modules/Calendar";
import { describeDays, dayLabel, durationText, rangeText, toMinutes, toTime } from "../../modules/pollSlots";
import { privateLink, remember, remembered } from "../../modules/pollStorage";

const nameKey = name => name.trim().replace(/\s+/g, " ").toLowerCase();

// The poll's settings in a few short lines
function PollInfo({ data }) {
    const { poll } = data;
    return (
        <section className="admin-section poll-info">
            <div className="poll-info_status">
                {data.closed ? <Chip icon={<LockIcon />} label="Lezárva" /> : <Chip color="success" label="Nyitott" />}
                {poll.organizerName ? <span>Szervező: {poll.organizerName}</span> : <></>}
            </div>
            {poll.description ? <p className="poll-info_description">{poll.description}</p> : <></>}
            <dl className="poll-info_settings">
                <div><dt>Napok</dt><dd>{describeDays(poll)}</dd></div>
                <div><dt>Időablak</dt><dd>{poll.dayStart}–{poll.dayEnd}, {poll.slotMinutes} perces sávok</dd></div>
                {poll.meetingMinutes ? <div><dt>Megbeszélés hossza</dt><dd>{durationText(poll.meetingMinutes)}</dd></div> : <></>}
                {poll.deadline ? <div><dt>Határidő</dt><dd>{Calendar.getDateWithFormat(new Date(poll.deadline), true)}</dd></div> : <></>}
                <div><dt>Időzóna</dt><dd>{poll.timeZone}</dd></div>
            </dl>
        </section>
    );
}

// The page behind a poll's link. Anyone can answer without login; see the plan for who sees what.
export default function PollPage() {
    const { key } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState("");
    // { name, editKey } this browser remembers. A private link's key is taken over first.
    const [stored, setStored] = useState(() => {
        const fromLink = new URLSearchParams(location.search).get("valasz");
        if (fromLink) remember(key, { ...(remembered(key) || {}), editKey: fromLink });
        return remembered(key);
    });
    const [own, setOwn] = useState(null);
    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [respondent, setRespondent] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [focusedSlot, setFocusedSlot] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [newLink, setNewLink] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [message, setMessage] = useState(null);
    // Right after creating: the link to send is shown at the top
    const [created, setCreated] = useState(Boolean(location.state && location.state.created));
    // The slot clicked before answering, marked once the name is given
    const [pendingSlot, setPendingSlot] = useState(null);
    const [confirmEmpty, setConfirmEmpty] = useState(false);
    const [linkDialog, setLinkDialog] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);

    // The key leaves the address bar once it is remembered; "created" is shown once
    useEffect(() => {
        if (new URLSearchParams(location.search).has("valasz") || (location.state && location.state.created)) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]);

    const editKey = stored ? stored.editKey : undefined;
    const storedName = stored ? stored.name : undefined;
    const load = useCallback(async () => {
        try {
            const res = await axios.get(`/polls/${key}`);
            const { answers } = res.data.result;
            let mine = res.data.result.myAnswer;
            if (!mine && editKey) {
                try {
                    mine = (await axios.post(`/polls/${key}/my-answer`, { editKey })).data.result;
                } catch (err) {
                    // The key is not (or no longer) valid here; answering by name still works
                }
            }
            // Answered by name in this browser, without a key: found by the remembered name (when answers are visible)
            if (!mine && storedName && answers) {
                const byName = answers.find(answer => nameKey(answer.name) === nameKey(storedName));
                if (byName) mine = { contactEmail: "", contactPhone: "", ...byName };
            }
            setData(res.data.result);
            setOwn(mine);
        } catch (err) {
            setLoadError(errorMessage(err, "Nem sikerült betölteni az egyeztetést!"));
        }
    }, [key, editKey, storedName]);

    useEffect(() => {
        load();
    }, [load, user]);

    const startEditing = (who, slots) => {
        setRespondent(who);
        setSelected(new Set(slots));
        setSaveError("");
        setFocusedSlot(null);
        setEditing(true);
    };

    const answerButton = () => {
        if (own) {
            startEditing({ name: own.name, contactEmail: own.contactEmail, contactPhone: own.contactPhone }, own.slots);
        } else {
            setDialogOpen(true);
        }
    };

    // The same name as an earlier answer edits that answer, as on lettucemeet
    const continueWithName = (values) => {
        setDialogOpen(false);
        const earlier = data.answers ? data.answers.find(answer => nameKey(answer.name) === nameKey(values.name)) : undefined;
        if (earlier) setMessage({ severity: "info", text: `Már van válasz ${earlier.name} névvel, most azt módosítod.` });
        startEditing(values, earlier ? earlier.slots : pendingSlot ? [pendingSlot] : []);
        setPendingSlot(null);
    };

    // Clicking the grid before answering starts answering, with that slot marked; otherwise it shows who is free then
    const slotClicked = (slot) => {
        if (slot !== null && !data.closed && !own && !editing) {
            setPendingSlot(slot);
            setDialogOpen(true);
            return;
        }
        setFocusedSlot(slot);
    };

    // While editing the dialog only changes the name and contacts
    const dialogContinue = (values) => {
        if (!editing) return continueWithName(values);
        setRespondent(values);
        setDialogOpen(false);
    };

    // Someone else answering in this browser: forget the remembered answer
    const answerAsSomeoneElse = () => {
        remember(key, null);
        setStored(null);
        setOwn(null);
        setEditing(false);
        setDialogOpen(true);
    };

    // An answer with no slot means "never available", which leaves no common time for anyone: asked first
    const save = async (emptyConfirmed = false) => {
        if (selected.size === 0 && !emptyConfirmed) {
            setConfirmEmpty(true);
            return;
        }
        setConfirmEmpty(false);
        setSaving(true);
        setSaveError("");
        try {
            const res = await axios.put(`/polls/${key}/answer`, { ...respondent, slots: [...selected], editKey });
            const { answer, editKey: newKey } = res.data.result;
            const next = { name: answer.name, editKey: newKey || editKey };
            remember(key, next);
            setStored(next);
            setNewLink(Boolean(newKey));
            // The private link can't be missed: it opens in front
            if (newKey) setLinkDialog(true);
            setOwn(answer);
            setEditing(false);
            setMessage({ severity: "success", text: "A válaszodat elmentettük." });
            await load();
        } catch (err) {
            setSaveError(errorMessage(err, "Nem sikerült menteni a válaszodat!"));
        }
        setSaving(false);
    };

    // The phone's share sheet when the browser has one (most phones), copying the link otherwise
    const canShare = typeof navigator.share === "function";
    const share = async (text, title) => {
        if (!canShare) return copy(text, "A linket a vágólapra másoltuk.");
        try {
            await navigator.share({ title, url: text });
        } catch (err) {
            // Closing the share sheet is not an error
        }
    };

    const copy = async (text, done) => {
        try {
            await navigator.clipboard.writeText(text);
            setMessage({ severity: "success", text: done });
        } catch (err) {
            setMessage({ severity: "warning", text: "Nem sikerült a vágólapra másolni; jelöld ki és másold ki kézzel." });
        }
    };

    const manage = async (action) => {
        setConfirm(null);
        try {
            if (action === "close") {
                await axios.post(`/polls/${key}/close`);
                setMessage({ severity: "success", text: "Az egyeztetést lezártuk." });
                await load();
            } else {
                await axios.delete(`/polls/${key}`);
                navigate(data.isOrganizer ? "/egyeztetesek" : "/admin/egyeztetesek", { replace: true });
            }
        } catch (err) {
            setMessage({ severity: "error", text: errorMessage(err, "A művelet nem sikerült!") });
        }
    };

    if (loadError !== "") {
        return (
            <AdminPage title="Egyeztetés">
                <Alert severity="error">{loadError}</Alert>
            </AdminPage>
        );
    }
    if (data === null) return <></>;

    const { poll } = data;
    const pollLink = `${window.location.origin}/egyeztetes/${key}`;
    const total = data.answers ? data.answers.length : 0;
    const namesIn = slot => data.answers ? data.answers.filter(answer => answer.slots.includes(slot)).map(answer => answer.name) : [];
    const focused = focusedSlot ? (() => {
        const [day, time] = focusedSlot.split(" ");
        const names = namesIn(focusedSlot);
        return { label: `${dayLabel(day)} ${time}–${toTime(toMinutes(time) + poll.slotMinutes)}`, names };
    })() : null;

    const common = data.results ? data.results.common : [];

    // Sharing is the main action; closing and deleting are kept apart in a menu
    const actions = <>
        <Button variant="outlined" color="inherit" startIcon={<InsightsIcon />} component={Link} to={`/egyeztetes/${key}/attekintes`}>
            Áttekintés
        </Button>
        <Button variant="contained" startIcon={<LinkIcon />} onClick={() => share(pollLink, poll.title)}>
            {canShare ? "Megosztás" : "Link másolása"}
        </Button>
        {data.canManage
            ? <Button variant="outlined" color="inherit" endIcon={<MoreVertIcon />} onClick={event => setMenuAnchor(event.currentTarget)}
                aria-haspopup="menu" aria-expanded={menuAnchor !== null}>
                Továbbiak
            </Button>
            : <></>}
        <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
            {!data.closed
                ? <MenuItem onClick={() => { setMenuAnchor(null); setConfirm("close"); }}>
                    <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>Lezárás
                </MenuItem>
                : null}
            <MenuItem onClick={() => { setMenuAnchor(null); setConfirm("delete"); }} className="poll-menu_danger">
                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Törlés
            </MenuItem>
        </Menu>
    </>;

    return (
        <AdminPage title={poll.title} back={user ? { to: "/egyeztetesek", label: "Egyeztetéseim" } : undefined} actions={actions}>
            <div className="poll-page">
                {created
                    ? <Alert severity="success" onClose={() => setCreated(false)} className="poll-created">
                        <AlertTitle>Kész az egyeztetés!</AlertTitle>
                        <p>Küldd el ezt a linket a résztvevőknek. Belépés nélkül megnyithatják, és bejelölhetik, mikor érnek rá.</p>
                        <div className="poll-answers_link">
                            <TextField size="small" fullWidth value={pollLink} InputProps={{ readOnly: true }} onFocus={event => event.target.select()}
                                inputProps={{ "aria-label": "Az egyeztetés linkje" }} />
                            <Button variant="contained" startIcon={<LinkIcon />} onClick={() => share(pollLink, poll.title)}>{canShare ? "Megosztás" : "Másolás"}</Button>
                        </div>
                    </Alert>
                    : <></>}
                <PollInfo data={data} />

                {data.results && data.results.respondents > 0
                    ? <section className="admin-section poll-common">
                        <h2>Mindenkinek megfelelő időpontok</h2>
                        {common.length === 0
                            ? <p className="admin-section_empty">Még nincs olyan időpont, amely mind a(z) {data.results.respondents} válaszolónak megfelel.</p>
                            : <div className="poll-overview_ranges">
                                {common.map(range => <Chip key={`${range.day}_${range.from}`} label={rangeText(range)} />)}
                            </div>}
                        <Link to={`/egyeztetes/${key}/attekintes`} className="poll-common_more">Részletek az áttekintésben</Link>
                    </section>
                    : <></>}

                <section className="admin-section poll-answers">
                    <div className="poll-answers_header">
                        <h2>Ki mikor ér rá?</h2>
                        <span className="poll-answers_count">{data.answerCount} válasz</span>
                        {!data.closed && !editing
                            ? <Button variant="contained" startIcon={<EventAvailableIcon />} onClick={answerButton}>
                                {own ? "Saját válaszom módosítása" : "Időpontjaim megadása"}
                            </Button>
                            : <></>}
                    </div>

                    {data.closed ? <Alert severity="info">Ez az egyeztetés lezárult, már nem lehet válaszolni.</Alert> : <></>}
                    {!data.answers && !editing
                        ? <Alert severity="info">A válaszokat és az eredményt csak a szervező és az adminok látják.</Alert>
                        : <></>}

                    {editing
                        ? <div className="poll-answers_editing" role="status">
                            <p><strong>{respondent.name}</strong>, jelöld be, mikor érsz rá!</p>
                            <p className="admin-section_hint poll-answers_hint-mouse">
                                Egérrel húzva több idősávot is kijelölhetsz vagy törölhetsz.
                                A nap nevére kattintva az egész napot kijelölöd vagy törlöd.
                            </p>
                            <p className="admin-section_hint poll-answers_hint-touch">Koppints az idősávokra, vagy a nap nevére az egész naphoz.</p>
                            {saveError !== "" ? <p className="reservation-form_error" role="alert">{saveError}</p> : <></>}
                            <div className="poll-answers_editing-actions">
                                <Button onClick={() => setEditing(false)} disabled={saving}>Mégse</Button>
                                {/* Shorter labels on phones, so the three buttons fit in one row */}
                                <Button onClick={() => setDialogOpen(true)} disabled={saving} aria-label="Név, e-mail, telefon">
                                    <span className="label-long">Név, e-mail, telefon</span><span className="label-short">Adataim</span>
                                </Button>
                                <Button variant="contained" onClick={() => save()} disabled={saving} aria-label={`Mentés (${selected.size} sáv)`}>
                                    <span className="label-long">Mentés ({selected.size} sáv)</span><span className="label-short">Mentés ({selected.size})</span>
                                </Button>
                            </div>
                        </div>
                        : <></>}

                    <div className="poll-answers_grid">
                        <PollGrid days={data.days} times={data.times} slotMinutes={poll.slotMinutes} editing={editing}
                            selected={selected} setSelected={setSelected} counts={data.results ? data.results.counts : {}}
                            total={total} focusedSlot={focusedSlot} onSlotFocus={slotClicked} />
                    </div>
                    <p className="admin-section_hint poll-answers_zone">Az időpontok {poll.timeZone} időzóna szerint értendők.</p>

                    {!editing && focused
                        ? <p className="poll-answers_focused" role="status">
                            <strong>{focused.label}</strong>: {total === 0
                                ? "még senki sem válaszolt."
                                : <>{focused.names.length}/{total} ráér{focused.names.length ? ` – ${focused.names.join(", ")}` : ""}</>}
                        </p>
                        : <></>}
                    {!editing && data.answers && data.answers.length
                        ? <p className="admin-section_hint">Minél kékebb egy idősáv, annál többen érnek rá; kattints rá, hogy lásd, kik.</p>
                        : <></>}
                    {!editing && !own && !data.closed
                        ? <p className="admin-section_hint">Kattints egy idősávra, vagy az „Időpontjaim megadása” gombra a válaszadáshoz.</p>
                        : <></>}

                    {own && !editing
                        ? <div className="poll-answers_own">
                            <p>Saját válaszod: <strong>{own.name}</strong>, {own.slots.length} idősáv.</p>
                            {editKey
                                ? <>
                                    {newLink
                                        ? <Alert severity="success">Mentsd el ezt a privát linket: ezzel bármelyik böngészőből módosíthatod a válaszod.</Alert>
                                        : <></>}
                                    <div className="poll-answers_link">
                                        <TextField size="small" fullWidth label="Privát szerkesztő link" value={privateLink(key, editKey)}
                                            InputProps={{ readOnly: true }} onFocus={event => event.target.select()} />
                                        <Button onClick={() => copy(privateLink(key, editKey), "A privát linket a vágólapra másoltuk.")}>Másolás</Button>
                                    </div>
                                </>
                                : <></>}
                            {!data.closed ? <Button size="small" onClick={answerAsSomeoneElse}>Valaki más válaszol ebből a böngészőből</Button> : <></>}
                        </div>
                        : <></>}
                </section>
            </div>

            <AnswerDialog open={dialogOpen}
                initial={respondent || {
                    name: stored && stored.name ? stored.name : (user && user.name) || "",
                    contactEmail: user ? user.email : "", contactPhone: user ? user.phone : "",
                }}
                existingNames={data.answers && !editing ? data.answers.map(answer => answer.name) : []}
                onClose={() => { setDialogOpen(false); setPendingSlot(null); }}
                onContinue={dialogContinue} />

            <Dialog open={confirmEmpty} onClose={() => setConfirmEmpty(false)} maxWidth="xs">
                <DialogTitle>Egyik időpontot sem jelölted be</DialogTitle>
                <DialogContent>
                    Így úgy számít, hogy egyik időpontban sem érsz rá, és nem lesz mindenkinek megfelelő időpont. Így mented?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmEmpty(false)} variant="contained">Vissza a jelöléshez</Button>
                    <Button onClick={() => save(true)}>Mentés így</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={linkDialog && Boolean(editKey)} onClose={() => setLinkDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Elmentettük a válaszodat</DialogTitle>
                <DialogContent className="contact-dialog">
                    <p>Ezzel a privát linkkel bármelyik böngészőből módosíthatod később. Mentsd el, vagy küldd el magadnak:</p>
                    {editKey
                        ? <div className="poll-answers_link">
                            <TextField size="small" fullWidth value={privateLink(key, editKey)} InputProps={{ readOnly: true }}
                                onFocus={event => event.target.select()} inputProps={{ "aria-label": "Privát szerkesztő link" }} />
                            <Button variant="contained" onClick={() => copy(privateLink(key, editKey), "A privát linket a vágólapra másoltuk.")}>Másolás</Button>
                        </div>
                        : <></>}
                    <p className="admin-section_hint">Ebben a böngészőben enélkül is megtaláljuk a válaszodat.</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLinkDialog(false)}>Rendben</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirm !== null} onClose={() => setConfirm(null)}>
                <DialogTitle>{confirm === "close" ? "Egyeztetés lezárása" : "Egyeztetés törlése"}</DialogTitle>
                <DialogContent>
                    {confirm === "close"
                        ? "Lezárás után már senki sem válaszolhat. Az eredmény megmarad."
                        : "Az egyeztetés eltűnik, a linkje nem fog működni. Biztosan törlöd?"}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirm(null)}>Mégse</Button>
                    <Button variant="contained" color={confirm === "delete" ? "error" : "primary"} onClick={() => manage(confirm)}>
                        {confirm === "close" ? "Lezárás" : "Törlés"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
