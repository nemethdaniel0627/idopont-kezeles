import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Chip } from "@mui/material";
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AdminPage from "../../components/AdminPage";
import { errorMessage } from "../../modules/api";
import { dayLabel, durationText } from "../../modules/pollSlots";

// The common times grouped by day: [{ day, ranges: [{ from, to }] }]
function byDay(common) {
    const groups = [];
    for (const range of common) {
        const last = groups[groups.length - 1];
        if (last && last.day === range.day) last.ranges.push(range);
        else groups.push({ day: range.day, ranges: [range] });
    }
    return groups;
}

// The overview behind the poll page's top-right button: the times good for everyone and who answered.
// Recalculated by the server on every load.
export default function PollOverview() {
    const { key } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        axios.get(`/polls/${key}`)
            .then(res => setData(res.data.result))
            .catch(err => setError(errorMessage(err, "Nem sikerült betölteni az egyeztetést!")));
    }, [key]);

    if (error !== "") {
        return <AdminPage title="Áttekintés"><Alert severity="error">{error}</Alert></AdminPage>;
    }
    if (data === null) return <></>;

    const { poll, results, answers } = data;
    const back = { to: `/egyeztetes/${key}`, label: "Vissza az egyeztetéshez" };

    return (
        <AdminPage title={`${poll.title} – áttekintés`} back={back}
            actions={!data.closed
                ? <Button variant="outlined" color="inherit" startIcon={<EventAvailableIcon />} component={Link} to={`/egyeztetes/${key}`}>
                    Időpontjaim megadása
                </Button>
                : undefined}>
            <div className="poll-page">
                {results === null
                    ? <Alert severity="info">
                        A válaszokat és az eredményt csak a szervező és az adminok látják. Eddig {data.answerCount} válasz érkezett.
                    </Alert>
                    : <>
                        <section className="admin-section poll-overview">
                            <h2>Mindenkinek megfelelő időpontok</h2>
                            <p className="admin-section_hint">
                                {results.respondents} válasz alapján
                                {poll.meetingMinutes ? `, legalább ${durationText(poll.meetingMinutes)} hosszan` : ""}
                                {data.closed ? " (lezárva)" : ". Minden új válasz után frissül."}
                            </p>
                            {results.respondents === 0
                                ? <p className="admin-section_empty">Még senki sem válaszolt.</p>
                                : results.common.length === 0
                                    ? <p className="admin-section_empty">Még nincs olyan időpont, amely mindenkinek megfelel.</p>
                                    : <ul className="poll-overview_days">
                                        {byDay(results.common).map(group =>
                                            <li key={group.day}>
                                                <strong>{dayLabel(group.day)}</strong>
                                                <span className="poll-overview_ranges">
                                                    {group.ranges.map(range => <Chip key={range.from} label={`${range.from}–${range.to}`} />)}
                                                </span>
                                            </li>
                                        )}
                                    </ul>}
                        </section>

                        <section className="admin-section">
                            <h2>Válaszolók</h2>
                            {answers.length === 0
                                ? <p className="admin-section_empty">Még senki sem válaszolt.</p>
                                : <ul className="poll-overview_people">
                                    {answers.map(answer =>
                                        <li key={answer.id}>
                                            <strong>{answer.name}</strong>
                                            <span>{answer.slots.length} idősáv</span>
                                            {data.canManage && (answer.contactEmail || answer.contactPhone)
                                                ? <span className="poll-overview_contact">
                                                    {[answer.contactEmail, answer.contactPhone].filter(Boolean).join(" · ")}
                                                </span>
                                                : <></>}
                                        </li>
                                    )}
                                </ul>}
                        </section>
                    </>}
            </div>
        </AdminPage>
    );
}
