import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Autocomplete, Button, Checkbox, FormControlLabel, MenuItem, TextField, ToggleButton, ToggleButtonGroup
} from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/lab";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import AdminPage from "../../components/AdminPage";
import DayPicker from "../../components/polls/DayPicker";
import { errorMessage } from "../../modules/api";
import { WEEK_DAYS, durationText, timeOptions, toMinutes } from "../../modules/pollSlots";

const DEFAULT_TIME_ZONE = "Europe/Budapest";

// The zones the browser knows, the default first
function timeZones() {
    const zones = typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : ["Europe/London", "Europe/Berlin", "Europe/Bucharest", "America/New_York", "Asia/Tokyo", "UTC"];
    return [DEFAULT_TIME_ZONE, ...zones.filter(zone => zone !== DEFAULT_TIME_ZONE)];
}

// A new poll in two steps, like the reference: first the days, then the name and the times
export default function PollCreate() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState("dates");
    const [dates, setDates] = useState(new Set());
    const [weekDays, setWeekDays] = useState([]);
    const [form, setForm] = useState({
        title: "", description: "", dayStart: "09:00", dayEnd: "17:00", slotMinutes: 30, meetingMinutes: "",
        hasDeadline: false, deadline: null, timeZone: DEFAULT_TIME_ZONE, answersVisible: true,
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const zones = useMemo(timeZones, []);
    const set = (field, value) => setForm(previous => ({ ...previous, [field]: value }));

    const dayCount = mode === "dates" ? dates.size : weekDays.length;
    const toggleDate = day => setDates(previous => {
        const next = new Set(previous);
        if (next.has(day)) next.delete(day);
        else next.add(day);
        return next;
    });

    const windowMinutes = toMinutes(form.dayEnd) - toMinutes(form.dayStart);
    const meetingOptions = timeOptions(form.slotMinutes, form.slotMinutes, Math.max(form.slotMinutes, windowMinutes))
        .map(toMinutes).filter(minutes => minutes <= windowMinutes);

    // A new slot size moves the window onto its grid
    const changeSlot = (event, value) => {
        if (value === null) return;
        const snap = (time, latest) => {
            const minutes = Math.min(Math.round(toMinutes(time) / value) * value, latest);
            return timeOptions(value)[minutes / value];
        };
        setForm(previous => ({
            ...previous, slotMinutes: value, meetingMinutes: "",
            dayStart: snap(previous.dayStart, 24 * 60 - value), dayEnd: snap(previous.dayEnd, 24 * 60),
        }));
    };

    const create = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await axios.post("/polls", {
                title: form.title,
                description: form.description,
                mode,
                dates: mode === "dates" ? [...dates] : null,
                weekDays: mode === "weekdays" ? weekDays : null,
                dayStart: form.dayStart,
                dayEnd: form.dayEnd,
                slotMinutes: form.slotMinutes,
                meetingMinutes: form.meetingMinutes === "" ? null : form.meetingMinutes,
                deadline: form.hasDeadline ? form.deadline : null,
                timeZone: form.timeZone,
                answersVisible: form.answersVisible,
            });
            navigate(`/egyeztetes/${res.data.result.publicKey}`);
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült létrehozni az egyeztetést!"));
            setSaving(false);
        }
    };

    return (
        <AdminPage title="Új egyeztetés" back={{ to: "/egyeztetesek", label: "Egyeztetéseim" }}>
            {step === 1
                ? <section className="admin-section poll-create">
                    <h2>Mely napokon találkoznátok?</h2>
                    <ToggleButtonGroup exclusive color="primary" value={mode} onChange={(event, value) => value && setMode(value)}>
                        <ToggleButton value="dates">Dátumok</ToggleButton>
                        <ToggleButton value="weekdays">A hét napjai</ToggleButton>
                    </ToggleButtonGroup>
                    {mode === "dates"
                        ? <DayPicker selected={dates} onToggle={toggleDate} />
                        : <ToggleButtonGroup color="primary" value={weekDays} onChange={(event, value) => setWeekDays(value)}
                            className="poll-create_week-days" aria-label="A hét napjai">
                            {WEEK_DAYS.map(day => <ToggleButton key={day} value={day}>{day}</ToggleButton>)}
                        </ToggleButtonGroup>}
                    <p className="admin-section_hint poll-create_count">{dayCount === 0 ? "Még nincs kiválasztott nap." : `${dayCount} nap kiválasztva`}</p>
                    <div className="admin-section_actions">
                        <Button variant="contained" disabled={dayCount === 0} onClick={() => setStep(2)}>Tovább</Button>
                    </div>
                </section>
                : <form className="admin-section poll-create" onSubmit={create}>
                    <h2>Az egyeztetés adatai</h2>
                    {error !== "" ? <p className="reservation-form_error" role="alert">{error}</p> : <></>}
                    <TextField label="Az egyeztetés neve" required autoFocus value={form.title} onChange={event => set("title", event.target.value)} />
                    <TextField label="Miről szól?" multiline minRows={2} value={form.description} onChange={event => set("description", event.target.value)} />

                    <h3>Milyen időközben találkoznátok?</h3>
                    <div className="admin-section_row">
                        <TextField select label="Ettől" value={form.dayStart} onChange={event => set("dayStart", event.target.value)}>
                            {timeOptions(form.slotMinutes, 0, 24 * 60 - form.slotMinutes).map(time => <MenuItem key={time} value={time}>{time}</MenuItem>)}
                        </TextField>
                        <TextField select label="Eddig" value={form.dayEnd} onChange={event => set("dayEnd", event.target.value)}
                            error={windowMinutes <= 0} helperText={windowMinutes <= 0 ? "A vége legyen a kezdete után!" : undefined}>
                            {timeOptions(form.slotMinutes, form.slotMinutes).map(time => <MenuItem key={time} value={time}>{time}</MenuItem>)}
                        </TextField>
                        <Autocomplete options={zones} value={form.timeZone} disableClearable
                            onChange={(event, value) => set("timeZone", value)}
                            renderInput={params => <TextField {...params} label="Időzóna" />} />
                    </div>
                    <div>
                        <p className="admin-section_label">Idősávok hossza (lehetséges egység hossza)</p>
                        <ToggleButtonGroup exclusive color="primary" value={form.slotMinutes} onChange={changeSlot}>
                            <ToggleButton value={30}>30 perc</ToggleButton>
                            <ToggleButton value={60}>60 perc</ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    <TextField select label="A megbeszélés hossza" value={form.meetingMinutes}
                        onChange={event => set("meetingMinutes", event.target.value)}
                        helperText="Az eredményben csak az ennél nem rövidebb közös időpontok jelennek meg.">
                        <MenuItem value="">Nincs megadva</MenuItem>
                        {meetingOptions.map(minutes => <MenuItem key={minutes} value={minutes}>{durationText(minutes)}</MenuItem>)}
                    </TextField>

                    <h3>Beállítások</h3>
                    <FormControlLabel label="Határidő a válaszokra"
                        control={<Checkbox checked={form.hasDeadline} onChange={() => set("hasDeadline", !form.hasDeadline)} />} />
                    {form.hasDeadline
                        ? <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker label="Határidő" value={form.deadline} ampm={false} inputFormat="yyyy-MM-dd HH:mm"
                                disablePast onChange={value => set("deadline", value)}
                                renderInput={params => <TextField {...params} helperText="Utána már nem lehet válaszolni." />} />
                        </LocalizationProvider>
                        : <></>}
                    <FormControlLabel label="Mindenki láthatja a válaszokat és az eredményt"
                        control={<Checkbox checked={form.answersVisible} onChange={() => set("answersVisible", !form.answersVisible)} />} />
                    {!form.answersVisible
                        ? <p className="admin-section_hint">Így csak te és az adminok látjátok, ki mikor ér rá.</p>
                        : <></>}

                    <div className="admin-section_actions poll-create_actions">
                        <Button onClick={() => setStep(1)} disabled={saving}>Vissza</Button>
                        <Button type="submit" variant="contained" disabled={saving || windowMinutes <= 0}>Létrehozás</Button>
                    </div>
                </form>}
        </AdminPage>
    );
}
