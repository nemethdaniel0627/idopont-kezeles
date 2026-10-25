import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Alert,
    Button,
    Checkbox,
    FilledInput,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    InputAdornment,
    MenuItem,
    Radio,
    RadioGroup,
    Snackbar,
    TextField,
    ToggleButton,
    ToggleButtonGroup
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/lab";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import AddIcon from '@mui/icons-material/Add';
import Calendar from "../modules/Calendar";
import { errorMessage } from "../modules/api";

// The admin dialog of a resource: its name and its reservations.
// Temporary until MVP step 3 replaces it with the designed admin page.

const regularityOptions = [
    {
        value: 'never',
        label: 'Ne ismétlődjön',
    },
    {
        value: 'day',
        label: 'Nap',
    },
    {
        value: 'week',
        label: 'Hét',
    },
    {
        value: 'month',
        label: 'Hónap',
    },
];

const regularityUnits = { day: "napon", week: "héten", month: "hónapban" };

// The next whole hour, and one hour after it
function defaultTimes() {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    return { start, end: new Date(start.getTime() + 3600000) };
}

const sameDay = (a, b) => Calendar.getPrefix(a) === Calendar.getPrefix(b);

// A short Hungarian description of a stored reservation, for the list
function describeReservation(reservation) {
    const start = new Date(reservation.startDate);
    let end = new Date(reservation.endDate);
    if (reservation.allDay) end = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const time = reservation.allDay
        ? (sameDay(start, end) ? Calendar.getDateWithFormat(start) : `${Calendar.getDateWithFormat(start)} - ${Calendar.getDateWithFormat(end)}`)
        : `${Calendar.getDateWithFormat(start, true)} - ${sameDay(start, end) ? Calendar.getDateWithFormat(end, true).slice(11) : Calendar.getDateWithFormat(end, true)}`;
    if (reservation.regularityMeasure === "never") return time;

    const every = reservation.regularityRepeatNumber !== 1 ? `${reservation.regularityRepeatNumber}. ` : "";
    const days = reservation.regularityMeasure === "week" ? ` (${reservation.regularityDays.join(", ")})` : "";
    const until = reservation.endsOnType === "occurrence"
        ? `${reservation.endsOnOccurrence} alkalommal`
        : `eddig: ${Calendar.getDateWithFormat(new Date(reservation.endsOnDate))}`;
    return `${time}, minden ${every}${regularityUnits[reservation.regularityMeasure]}${days}, ${until}`;
}

export default function EditSzolgaltatas(props) {
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarStlye, setSnackbarStlye] = useState("success");
    const [snackbarText, setSnackbarText] = useState("");
    const [editTile, setEditTile] = useState(true);
    const [title, setTitle] = useState("");
    const [saving, setSaving] = useState(false);
    const [reservations, setReservations] = useState([]);
    // null while no reservation is being edited, otherwise the edited one ({} for a new one)
    const [editedReservation, setEditedReservation] = useState(null);

    // The reservation form
    const [reservationTitle, setReservationTitle] = useState("");
    const [description, setDescription] = useState("");
    const [regularity, setRegularity] = useState('never');
    const [repeatsEvery, setRepeatsEvery] = useState("1");
    const [daySelected, setDaySelected] = useState([]);
    const [startInputValue, setStartInputValue] = useState(defaultTimes().start);
    const [endInputValue, setEndInputValue] = useState(defaultTimes().end);
    const [repeatEndDate, setRepeatEndDate] = useState(new Date());
    const [repeatEnd, setRepeatEnd] = useState("sixMonths");
    const [occurrence, setOccurrence] = useState("1");
    const [allDayService, setAllDayService] = useState(false);

    const isNewResource = !props.serviceDatas;
    const validStart = startInputValue instanceof Date && !isNaN(startInputValue);
    const repeatLimit = validStart ? Calendar.getRepeatLimit(startInputValue) : new Date();

    const regularityText = useMemo(() => {
        const every = repeatsEvery !== "1" ? `${repeatsEvery}. ` : "";
        switch (regularity) {
            case "never":
                return `Ismétlődjön?`;
            case "day":
                return `Ismétlődjön minden ${every}napon`;
            case "week":
                return `Ismétlődjön minden ${every}héten: ${daySelected.join(", ")}`;
            case "month":
                return `Ismétlődjön minden ${every}hónap ${validStart ? startInputValue.getDate() : ""}. napján`;
            default:
                return "";
        }
    }, [regularity, repeatsEvery, daySelected, startInputValue, validStart]);

    const showMessage = (text, style) => {
        setSnackbarText(text);
        setSnackbarStlye(style);
        setOpenSnackbar(true);
    };

    const loadReservations = () => {
        if (isNewResource) return;
        axios.get(`/resources/${props.serviceDatas.id}/reservations`)
            .then(res => setReservations(res.data.result))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (props.serviceDatas) {
            setEditTile(false);
            setTitle(props.title);
            loadReservations();
        }
        // eslint-disable-next-line
    }, [props.serviceDatas])

    const closeDialog = () => {
        const editServiceContainer = document.querySelector(`#editService_${props.id}`);
        if (editServiceContainer) {

            editServiceContainer.setAttribute("closing", "");
            editServiceContainer.addEventListener("animationend", () => {
                editServiceContainer.close();
                editServiceContainer.removeAttribute("closing");
                editServiceContainer.removeAttribute("open");
            }, { once: true });

        }
    }

    // Creates the resource, or saves its new name
    const saveResource = async () => {
        if (title.trim() === "") {
            showMessage("Nincs megadva az erőforrás neve!", "error");
            return;
        }
        setSaving(true);
        try {
            await props.saveResource(isNewResource ? { title } : { id: props.serviceDatas.id, title });
        } catch (err) {
            showMessage(errorMessage(err, "Nem sikerült menteni az erőforrást!"), "error");
            return;
        } finally {
            setSaving(false);
        }
        if (isNewResource) {
            setTitle("");
            closeDialog();
        } else {
            setEditTile(false);
        }
        showMessage("Sikeres művelet!", "success");
    }

    // Fills the form with a stored reservation, or with defaults for a new one
    const openReservationForm = (reservation) => {
        const times = defaultTimes();
        const start = reservation ? new Date(reservation.startDate) : times.start;
        const repeats = reservation && reservation.regularityMeasure !== "never";
        setEditedReservation(reservation || {});
        setReservationTitle(reservation ? reservation.title : "");
        setDescription(reservation ? reservation.description : "");
        setStartInputValue(start);
        setEndInputValue(reservation ? new Date(reservation.endDate) : times.end);
        setAllDayService(reservation ? reservation.allDay : false);
        setRegularity(reservation ? reservation.regularityMeasure : "never");
        setRepeatsEvery(repeats ? String(reservation.regularityRepeatNumber) : "1");
        setDaySelected(repeats && reservation.regularityMeasure === "week" ? reservation.regularityDays : []);
        setOccurrence(repeats && reservation.endsOnType === "occurrence" ? String(reservation.endsOnOccurrence) : "1");
        if (repeats && reservation.endsOnType === "occurrence") {
            setRepeatEnd("occurrence");
        } else if (repeats && !sameDay(new Date(reservation.endsOnDate), Calendar.getRepeatLimit(start))) {
            setRepeatEnd("onDate");
            setRepeatEndDate(new Date(reservation.endsOnDate));
        } else {
            setRepeatEnd("sixMonths");
            setRepeatEndDate(Calendar.getRepeatLimit(start));
        }
    }

    const saveReservation = async () => {
        if (reservationTitle.trim() === "") {
            showMessage("Nincs megadva a foglalás neve!", "error");
            return;
        }
        const repeats = regularity !== "never";
        // An all-day reservation is stored from its first day to its last day, without times
        const dayOnly = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const reservation = {
            title: reservationTitle,
            description: description,
            startDate: allDayService ? dayOnly(startInputValue) : startInputValue,
            endDate: allDayService ? dayOnly(endInputValue) : endInputValue,
            allDay: allDayService,
            regularityMeasure: regularity,
            regularityRepeatNumber: repeats ? Number(repeatsEvery) : null,
            regularityDays: regularity === "week" ? daySelected : null,
            endsOnType: repeats ? repeatEnd : null,
            endsOnDate: repeats && repeatEnd === "onDate" ? repeatEndDate : null,
            endsOnOccurrence: repeats && repeatEnd === "occurrence" ? Number(occurrence) : null,
        };

        setSaving(true);
        try {
            if (editedReservation.id === undefined) {
                await axios.post(`/resources/${props.serviceDatas.id}/reservations`, reservation);
            } else {
                await axios.put(`/reservations/${editedReservation.id}`, reservation);
            }
        } catch (err) {
            showMessage(errorMessage(err, "Nem sikerült menteni a foglalást!"), "error");
            return;
        } finally {
            setSaving(false);
        }
        setEditedReservation(null);
        loadReservations();
        showMessage("Sikeres művelet!", "success");
    }

    const repeatsEveryChange = (event) => {
        if (event.target.value.length < 3) {
            setRepeatsEvery(event.target.value);
        }
    }

    const occurrenceChange = (event) => {
        if (event.target.value.length < 3) {
            setOccurrence(event.target.value);
        }
    }

    const titleChange = (event) => {
        const editTileInput = document.querySelector(`.editService_edit-title_${props.id}`);
        setTitle(event.target.value);

        if (editTileInput) {
            editTileInput.style.width = event.target.value.length + 5 + "ch";
        }
    }

    const handleMouseDownTitle = (event) => {
        event.preventDefault();
    };

    // An existing resource's name is saved right away, a new resource's name with "Létrehozás"
    const finishEditTitle = () => {
        const root = document.querySelector(":root");
        root.style.setProperty("--editTitleInputWidth", `${title.length + 5}ch`);
        if (isNewResource) {
            setEditTile(false);
        } else {
            saveResource();
        }
    }

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenSnackbar(false);
    };

    const reservationForm = (
        <div className="editService_reservation-form">
            <TextField label="Foglalás neve" value={reservationTitle} onChange={event => setReservationTitle(event.target.value)} variant="filled" />
            <TextField label="Leírás" value={description} onChange={event => setDescription(event.target.value)} variant="filled" multiline minRows={2} />
            <div className="editService_date-time-pickers">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    {allDayService === true ?
                        <>
                            <DatePicker
                                label="Első nap"
                                value={startInputValue}
                                inputFormat="yyyy-MM-dd"
                                onChange={(newValue) => {
                                    setStartInputValue(newValue);
                                }}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        error={startInputValue > endInputValue}
                                        variant="filled" />}
                            />
                            <DatePicker
                                label="Utolsó nap"
                                value={endInputValue}
                                inputFormat="yyyy-MM-dd"
                                onChange={(newValue) => {
                                    setEndInputValue(newValue);
                                }}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        error={startInputValue > endInputValue}
                                        variant="filled" />}
                            />
                        </>
                        :
                        <>
                            <DateTimePicker
                                label="Kezdés"
                                value={startInputValue}
                                ampm={false}
                                inputFormat="yyyy-MM-dd HH:mm"
                                onChange={(newValue) => {
                                    setStartInputValue(newValue);
                                }}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        error={startInputValue > endInputValue}
                                        variant="filled" />}
                            />
                            <DateTimePicker
                                label="Befejezés"
                                value={endInputValue}
                                ampm={false}
                                inputFormat="yyyy-MM-dd HH:mm"
                                onChange={(newValue) => {
                                    setEndInputValue(newValue);
                                }}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        error={startInputValue > endInputValue}
                                        variant="filled" />}
                            />
                        </>
                    }
                </LocalizationProvider>
            </div>
            <FormControlLabel control={<Checkbox onChange={() => { setAllDayService(!allDayService) }} checked={allDayService} />} label="Egész nap?" />
            <hr />
            <div className="editService_repeat-container">
                <p>{regularityText}</p>
                {
                    regularity === "never" ? <></> :
                        <TextField
                            type="number"
                            className="editService_number"
                            onChange={repeatsEveryChange}
                            value={repeatsEvery}
                            variant="filled"
                        />
                }
                <TextField
                    select
                    className="editService_select"
                    value={regularity}
                    onChange={event => setRegularity(event.target.value)}
                    variant="filled"
                >
                    {regularityOptions.map((option) => (
                        <MenuItem className="editService_menu-item" key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            </div>
            {
                regularity === 'week' ?
                    <div className="editService_week-days_container">
                        <hr />
                        <p>A kiválaszott napokon ismétlődik</p>
                        <ToggleButtonGroup
                            color="primary"
                            value={daySelected}
                            className="editService_week-days"
                            onChange={(event, newDays) => setDaySelected(newDays)}
                        >
                            <ToggleButton value="hétfő">Hé</ToggleButton>
                            <ToggleButton value="kedd">Ke</ToggleButton>
                            <ToggleButton value="szerda">Sze</ToggleButton>
                            <ToggleButton value="csütörtök">Csü</ToggleButton>
                            <ToggleButton value="péntek">Pé</ToggleButton>
                            <ToggleButton value="szombat">Szo</ToggleButton>
                            <ToggleButton value="vasárnap">Va</ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    :
                    <></>
            }
            {
                regularity !== "never" ?
                    <div className="editService_repeat-end">
                        <hr />
                        <FormControl>
                            <FormLabel>Ismétlődés vége (legfeljebb 6 hónap)</FormLabel>
                            <RadioGroup
                                row
                                onChange={event => setRepeatEnd(event.target.value)}
                            >
                                <FormControlLabel value="sixMonths" control={<Radio />} checked={repeatEnd === "sixMonths"} label="6 hónap után" />
                                <FormControlLabel value="onDate" control={<Radio />} checked={repeatEnd === "onDate"} />
                                <label onClick={() => setRepeatEnd("onDate")} className="editService_repeat-end_date-picker">
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            disabled={repeatEnd !== "onDate"}
                                            value={repeatEndDate}
                                            inputFormat="yyyy-MM-dd"
                                            minDate={validStart ? startInputValue : undefined}
                                            maxDate={repeatLimit}
                                            onChange={(newValue) => {
                                                setRepeatEndDate(newValue);
                                            }}
                                            renderInput={(params) => <TextField {...params} variant="filled" />}
                                        />
                                        <span>napon</span>
                                    </LocalizationProvider>
                                </label>
                                <FormControlLabel value="occurrence" control={<Radio />} checked={repeatEnd === "occurrence"} />
                                <label onClick={() => setRepeatEnd("occurrence")} className="editService_repeat-end_occurrence">
                                    <TextField
                                        disabled={repeatEnd !== "occurrence"}
                                        type="number"
                                        className="editService_number"
                                        onChange={occurrenceChange}
                                        value={occurrence}
                                        variant="filled"
                                    />
                                    <span>előfordulás után</span>
                                </label>
                            </RadioGroup>
                        </FormControl>
                    </div>
                    : <></>
            }
            <div className="editService_actions">
                <Button onClick={() => setEditedReservation(null)} disabled={saving}>Mégse</Button>
                <Button onClick={saveReservation} disabled={saving} variant="contained">
                    {editedReservation && editedReservation.id !== undefined ? "Mentés" : "Létrehozás"}
                </Button>
            </div>
        </div>
    );

    return (
        <React.Fragment>
            <dialog id={`editService_${props.id}`} className="editService">
                <IconButton onClick={closeDialog} size="large" className="editService_close">
                    <CloseIcon />
                </IconButton>
                {
                    editTile === true ?
                        <FormControl variant="filled" className={`editService_edit-title editService_edit-title_${props.id}`}>
                            <FilledInput
                                type="text"
                                value={title}
                                onChange={titleChange}
                                placeholder="Erőforrás neve"
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="szerkeztés befejezése"
                                            onClick={finishEditTitle}
                                            onMouseDown={handleMouseDownTitle}
                                            edge="end"
                                            disabled={saving}
                                        >
                                            <DoneIcon />
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        :
                        <h2 onClick={() => setEditTile(true)} className="editService_title">
                            {title}
                            <EditIcon />
                        </h2>
                }
                {
                    isNewResource ?
                        <Button onClick={saveResource} disabled={saving} variant="contained">Létrehozás</Button>
                        :
                        <>
                            <hr />
                            <div className="editService_reservations">
                                <h3>Foglalások</h3>
                                {
                                    reservations.length === 0
                                        ? <p>Még nincs foglalás.</p>
                                        : <ul>
                                            {reservations.map(reservation =>
                                                <li key={reservation.id}>
                                                    <div>
                                                        <strong>{reservation.title}</strong>
                                                        <p>{describeReservation(reservation)}</p>
                                                    </div>
                                                    <IconButton aria-label="foglalás szerkesztése" onClick={() => openReservationForm(reservation)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </li>
                                            )}
                                        </ul>
                                }
                                {
                                    editedReservation === null
                                        ? <Button startIcon={<AddIcon />} onClick={() => openReservationForm(null)} variant="outlined">Új foglalás</Button>
                                        : reservationForm
                                }
                            </div>
                        </>
                }
            </dialog >
            <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={handleSnackbarClose}>
                <Alert severity={snackbarStlye}>
                    {snackbarText}
                </Alert>
            </Snackbar>
        </React.Fragment>

    )
}
