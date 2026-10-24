import React, { useMemo, useState } from "react";
import axios from "axios";
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormLabel,
    MenuItem,
    Radio,
    RadioGroup,
    TextField,
    ToggleButton,
    ToggleButtonGroup
} from "@mui/material";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/lab";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import Calendar from "../modules/Calendar";
import { errorMessage } from "../modules/api";

const regularityOptions = [
    { value: 'never', label: 'Ne ismétlődjön' },
    { value: 'day', label: 'Naponta' },
    { value: 'week', label: 'Hetente' },
    { value: 'month', label: 'Havonta' },
];

const weekDays = [
    { value: "hétfő", label: "Hé" }, { value: "kedd", label: "Ke" }, { value: "szerda", label: "Sze" },
    { value: "csütörtök", label: "Csü" }, { value: "péntek", label: "Pé" }, { value: "szombat", label: "Szo" },
    { value: "vasárnap", label: "Va" },
];

// The next whole hour, and one hour after it
function defaultTimes() {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    return { start, end: new Date(start.getTime() + 3600000) };
}

const sameDay = (a, b) => Calendar.getPrefix(a) === Calendar.getPrefix(b);
const dayOnly = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// The form state for a stored reservation, or the defaults for a new one
function initialState(reservation) {
    const times = defaultTimes();
    const start = reservation ? new Date(reservation.startDate) : times.start;
    const repeats = reservation && reservation.regularityMeasure !== "never";
    let repeatEnd = "sixMonths";
    let repeatEndDate = Calendar.getRepeatLimit(start);
    if (repeats && reservation.endsOnType === "occurrence") {
        repeatEnd = "occurrence";
    } else if (repeats && !sameDay(new Date(reservation.endsOnDate), Calendar.getRepeatLimit(start))) {
        repeatEnd = "onDate";
        repeatEndDate = new Date(reservation.endsOnDate);
    }
    return {
        title: reservation ? reservation.title : "",
        description: reservation ? reservation.description : "",
        start,
        end: reservation ? new Date(reservation.endDate) : times.end,
        allDay: reservation ? reservation.allDay : false,
        regularity: reservation ? reservation.regularityMeasure : "never",
        repeatsEvery: repeats ? String(reservation.regularityRepeatNumber) : "1",
        days: repeats && reservation.regularityMeasure === "week" ? reservation.regularityDays : [],
        repeatEnd,
        repeatEndDate,
        occurrence: repeats && reservation.endsOnType === "occurrence" ? String(reservation.endsOnOccurrence) : "1",
        contactEmail: reservation ? reservation.contactEmail : "",
        contactPhone: reservation ? reservation.contactPhone : "",
    };
}

// Creates a reservation for the resource, or edits `reservation`. Repeats for at most 6 months.
export default function ReservationForm({ resourceId, reservation, onSaved, onCancel }) {
    const [form, setForm] = useState(() => initialState(reservation));
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const set = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
    const change = field => event => set(field, event.target.value);

    const validStart = form.start instanceof Date && !isNaN(form.start);
    const repeatLimit = validStart ? Calendar.getRepeatLimit(form.start) : new Date();
    const repeats = form.regularity !== "never";
    const isNew = !reservation;

    const regularityText = useMemo(() => {
        const every = form.repeatsEvery !== "1" ? `${form.repeatsEvery}. ` : "";
        switch (form.regularity) {
            case "day": return `Ismétlődik minden ${every}napon`;
            case "week": return `Ismétlődik minden ${every}héten${form.days.length ? `: ${form.days.join(", ")}` : ""}`;
            case "month": return `Ismétlődik minden ${every}hónap ${validStart ? form.start.getDate() : ""}. napján`;
            default: return "Nem ismétlődik";
        }
    }, [form.regularity, form.repeatsEvery, form.days, form.start, validStart]);

    const save = async (event) => {
        event.preventDefault();
        const body = {
            title: form.title,
            description: form.description,
            // An all-day reservation is stored from its first day to its last day, without times
            startDate: form.allDay ? dayOnly(form.start) : form.start,
            endDate: form.allDay ? dayOnly(form.end) : form.end,
            allDay: form.allDay,
            regularityMeasure: form.regularity,
            regularityRepeatNumber: repeats ? Number(form.repeatsEvery) : null,
            regularityDays: form.regularity === "week" ? form.days : null,
            endsOnType: repeats ? form.repeatEnd : null,
            endsOnDate: repeats && form.repeatEnd === "onDate" ? form.repeatEndDate : null,
            endsOnOccurrence: repeats && form.repeatEnd === "occurrence" ? Number(form.occurrence) : null,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
        };
        setSaving(true);
        setError("");
        try {
            if (isNew) {
                await axios.post(`/resources/${resourceId}/reservations`, body);
            } else {
                await axios.put(`/reservations/${reservation.id}`, body);
            }
            onSaved();
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült menteni a foglalást!"));
            setSaving(false);
        }
    };

    const timeError = validStart && form.end instanceof Date && form.start > form.end;

    return (
        <form className="reservation-form" onSubmit={save}>
            <h3>{isNew ? "Új foglalás" : "Foglalás szerkesztése"}</h3>
            {error !== "" ? <p className="reservation-form_error" role="alert">{error}</p> : <></>}
            <TextField label="Foglalás neve" required value={form.title} onChange={change("title")} autoFocus />
            <TextField label="Leírás" multiline minRows={2} value={form.description} onChange={change("description")} />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <div className="reservation-form_row">
                    {form.allDay
                        ? <>
                            <DatePicker label="Első nap" value={form.start} inputFormat="yyyy-MM-dd"
                                onChange={value => set("start", value)}
                                renderInput={params => <TextField {...params} error={timeError} />} />
                            <DatePicker label="Utolsó nap" value={form.end} inputFormat="yyyy-MM-dd"
                                onChange={value => set("end", value)}
                                renderInput={params => <TextField {...params} error={timeError} />} />
                        </>
                        : <>
                            <DateTimePicker label="Kezdés" value={form.start} ampm={false} inputFormat="yyyy-MM-dd HH:mm"
                                onChange={value => set("start", value)}
                                renderInput={params => <TextField {...params} error={timeError} />} />
                            <DateTimePicker label="Befejezés" value={form.end} ampm={false} inputFormat="yyyy-MM-dd HH:mm"
                                onChange={value => set("end", value)}
                                renderInput={params => <TextField {...params} error={timeError} />} />
                        </>
                    }
                </div>
                <FormControlLabel label="Egész napos"
                    control={<Checkbox checked={form.allDay} onChange={() => set("allDay", !form.allDay)} />} />

                <div className="reservation-form_row">
                    <TextField select label="Ismétlődés" value={form.regularity} onChange={change("regularity")}>
                        {regularityOptions.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                    {repeats
                        ? <TextField label="Hányadik alkalommal" type="number" value={form.repeatsEvery}
                            inputProps={{ min: 1, max: 99 }} onChange={change("repeatsEvery")} />
                        : <></>}
                </div>
                <p className="reservation-form_hint">{regularityText}</p>

                {form.regularity === "week"
                    ? <ToggleButtonGroup color="primary" value={form.days} onChange={(event, days) => set("days", days)}
                        className="reservation-form_days" aria-label="Napok">
                        {weekDays.map(day => <ToggleButton key={day.value} value={day.value}>{day.label}</ToggleButton>)}
                    </ToggleButtonGroup>
                    : <></>}

                {repeats
                    ? <FormControl>
                        <FormLabel>Ismétlődés vége (legfeljebb 6 hónap)</FormLabel>
                        <RadioGroup value={form.repeatEnd} onChange={change("repeatEnd")}>
                            <FormControlLabel value="sixMonths" control={<Radio />} label="6 hónap után" />
                            <div className="reservation-form_choice">
                                <FormControlLabel value="onDate" control={<Radio />} label="Ezen a napon:" />
                                <DatePicker value={form.repeatEndDate} inputFormat="yyyy-MM-dd" disabled={form.repeatEnd !== "onDate"}
                                    minDate={validStart ? form.start : undefined} maxDate={repeatLimit}
                                    onChange={value => set("repeatEndDate", value)}
                                    renderInput={params => <TextField {...params} size="small" />} />
                            </div>
                            <div className="reservation-form_choice">
                                <FormControlLabel value="occurrence" control={<Radio />} label="Ennyi alkalom után:" />
                                <TextField type="number" size="small" value={form.occurrence} disabled={form.repeatEnd !== "occurrence"}
                                    inputProps={{ min: 1, max: 999 }} onChange={change("occurrence")} />
                            </div>
                        </RadioGroup>
                    </FormControl>
                    : <></>}
            </LocalizationProvider>

            <div className="reservation-form_row">
                <TextField label="Kapcsolattartó e-mail" type="email" value={form.contactEmail} onChange={change("contactEmail")}
                    helperText="Csak adminok látják. Erre küldünk értesítést, ha az erőforrás megszűnik." />
                <TextField label="Kapcsolattartó telefon" type="tel" value={form.contactPhone} onChange={change("contactPhone")} />
            </div>

            <div className="reservation-form_actions">
                <Button onClick={onCancel} disabled={saving}>Mégse</Button>
                <Button type="submit" variant="contained" disabled={saving}>{isNew ? "Létrehozás" : "Mentés"}</Button>
            </div>
        </form>
    );
}
