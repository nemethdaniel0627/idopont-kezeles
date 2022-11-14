import React, { useEffect, useMemo, useState } from "react";
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
import Calendar from "../modules/Calendar";

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
    {
        value: 'year',
        label: 'Év',
    },
];

export default function EditSzolgaltatas(props) {
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarStlye, setSnackbarStlye] = useState("success");
    const [snackbarText, setSnackbarText] = useState("");
    const [regularity, setRegularity] = useState('never');
    const [repeatsEvery, setRepeatsEvery] = useState("1");
    const [daySelected, setDaySelected] = useState(['']);
    const [startInputValue, setStartInputValue] = useState(new Date());
    const [endInputValue, setEndInputValue] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
    const [repeatEndDate, setRepeatEndDate] = useState(new Date());
    const [repeatEnd, setRepeatEnd] = useState();
    const [occurrence, setOccurrence] = useState("1");
    const [editTile, setEditTile] = useState(true);
    const [title, setTitle] = useState("");
    const [allDayService, setAllDayService] = useState(false);
    const regularityText = useMemo(() => {
        let returnText = "";
        switch (regularity) {
            case "never":
                returnText = `Ismétlődjön?`;
                break;
            case "day":
                if (Calendar.getPrefix(startInputValue) === Calendar.getPrefix(endInputValue)) {
                    returnText = `Ismétlődjön minden ${repeatsEvery !== "1" ? `${repeatsEvery}. ` : ""}napon`;
                }
                else {
                    const tmpRepeatsEvery = (Math.abs((startInputValue.getDate() - endInputValue.getDate())).toString());
                    if (tmpRepeatsEvery < repeatsEvery) {
                        returnText = `Ismétlődjön minden ${repeatsEvery}. napon`;
                    }
                    else {
                        returnText = `Ismétlődjön minden ${tmpRepeatsEvery}. napon`;
                        setRepeatsEvery(tmpRepeatsEvery)
                    }
                }
                // returnText = `Ismétlődjön minden ${repeatsEvery !== (
                //     Calendar.getPrefix(startInputValue) === Calendar.getPrefix(endInputValue)
                //         ? "1"
                //         : 
                // )
                //     ? `${repeatsEvery}. `
                //     : ""}napon`;
                break;
            case "month":
                returnText = `Ismétlődjön minden ${repeatsEvery !== "1" ? `${repeatsEvery}. ` : ""}hónap, ${startInputValue.getDate()}. napján`;
                break;
            case "year":
                returnText = `Ismétlődjön minden ${repeatsEvery !== "1" ? `${repeatsEvery}. ` : ""}évben`;
                break;
            case "week":
                returnText = `Ismétlődjön minden ${repeatsEvery !== "1" ? `${repeatsEvery}. ` : ""} héten: ${daySelected.toString()}`;
                break;

            default:
                returnText = "";
                break;
        }
        return returnText;
        // eslint-disable-next-line
    }, [regularity, startInputValue, endInputValue])
    const [maxParticipants, setMaxParticipants] = useState(1);

    const saveService = () => {
        if (title !== "") {
            let tmpEndsOnDate;
            let tmpEndsOnOccurrence;
            switch (repeatEnd) {
                case "onDate":
                    tmpEndsOnOccurrence = undefined;
                    break;
                case "occurrence":
                    tmpEndsOnDate = undefined;
                    break;
                case "never":
                    tmpEndsOnDate = undefined;
                    tmpEndsOnOccurrence = undefined;
                    break;

                default:
                    break;
            }
            props.saveService({
                id: -1,
                date: {
                    start: startInputValue,
                    end: endInputValue
                },
                allDay: allDayService,
                title: title,
                regularity: {
                    measure: regularity,
                    repeatNumber: Number(repeatsEvery),
                    days: daySelected.length === 0 ? undefined : daySelected,
                    endsOn: {
                        type: repeatEnd,
                        date: tmpEndsOnDate,
                        occurrence: tmpEndsOnOccurrence,
                    }
                },
                participants: 0,
                maxParticipants: maxParticipants,
            });
            const editServiceContainer = document.querySelector(`#editService_${props.id}`);
            if (editServiceContainer) {

                editServiceContainer.setAttribute("closing", "");
                editServiceContainer.addEventListener("animationend", () => {
                    editServiceContainer.close();
                    editServiceContainer.removeAttribute("closing");
                    editServiceContainer.removeAttribute("open");
                }, { once: true });

            }
            setSnackbarText("Sikeres művelet!")
            setSnackbarStlye("success");
            setOpenSnackbar(true);
        } else {
            setSnackbarText("Nincs megadva erőforrás cím!")
            setSnackbarStlye("error");
            setOpenSnackbar(true);
        }
    }

    const selectionChanged = (event) => {
        setRegularity(event.target.value);
    };

    const repeatsEveryChange = (event) => {
        if (event.target.value.length < 3) {
            setRepeatsEvery(event.target.value);
        }
    }

    const daySelectionChanged = (event, newAlignment) => {
        setDaySelected(newAlignment);
    };

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

    const repeatEndChange = (event) => {
        setRepeatEnd(event.target.value);
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

    const maxParticipantsChange = (event) => {
        setMaxParticipants(Number(event.target.value));
    }

    const handleMouseDownTitle = (event) => {
        event.preventDefault();
    };

    const finishEditTitle = () => {
        setEditTile(false);
        const root = document.querySelector(":root");
        root.style.setProperty("--editTitleInputWidth", `${title.length + 5}ch`);
    }

    useEffect(() => {
        if (props.serviceDatas) {
            setEditTile(false);
            setTitle(props.title);
            const serviceDatas = props.serviceDatas;
            setStartInputValue(new Date(serviceDatas.startDate));
            setEndInputValue(new Date(serviceDatas.endDate));
            if (serviceDatas.regularity !== "never") {
                setRegularity(serviceDatas.regularityMeasure);
                setRepeatsEvery(serviceDatas.regularityRepeatNumber)
                if (serviceDatas.regularityMeasure === "week")
                    setDaySelected(serviceDatas.regularityDays);
                switch (serviceDatas.endsOnType) {
                    case "never":
                        setRepeatEnd(serviceDatas.endsOnType);
                        break;
                    case "onDate":
                        setRepeatEnd(serviceDatas.endsOnType);
                        setRepeatEndDate(serviceDatas.endsOnDate);
                        break;
                    case "occurrence":
                        setRepeatEnd(serviceDatas.endsOnType);
                        setOccurrence(serviceDatas.endsOnOccurrence);
                        break;

                    default:
                        break;
                }
            }
        }
        // eslint-disable-next-line
    }, [props.serviceDatas])

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenSnackbar(false);
    };

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
                                id="filled-adornment-password"
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
                <div className="editService_date-time-pickers">
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        {allDayService === true ?
                            <>
                                <DatePicker
                                    label="Erőforrás kezdő időpontja"
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
                                    label="Erőforrás záró időpontja"
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
                                    label="Erőforrás kezdő időpontja"
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
                                    label="Erőforrás záró időpontja"
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
                <FormControlLabel control={<Checkbox onChange={() => { setAllDayService(!allDayService) }} value={allDayService} />} label="Egész nap?" />
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
                                error={(Math.abs((startInputValue.getDate() - endInputValue.getDate()))) > repeatsEvery}
                            />
                    }
                    <TextField
                        id="filled-select-currency"
                        select
                        className="editService_select"
                        value={regularity}
                        onChange={selectionChanged}
                        variant="filled"
                    >
                        {regularityOptions.map((option) => (
                            <MenuItem className="editService_menu-item" key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <p className="text-error">
                        {
                            (Math.abs((startInputValue.getDate() - endInputValue.getDate()))) > repeatsEvery && regularity === "day"
                                ? "Az ismétlődő szám nem lehet kisebb mint a napok különbsége"
                                : ""
                        }
                    </p>
                </div>
                {
                    regularity === 'week' ?
                        <div className="editService_week-days_container">
                            <hr />
                            <p>A kiválaszott napok minden hétre lefoglalhatóak lesznek</p>
                            <ToggleButtonGroup
                                color="primary"
                                value={daySelected}
                                className="editService_week-days"
                                onChange={daySelectionChanged}
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
                                <FormLabel id="demo-row-radio-buttons-group-label">Ismétlődés vége</FormLabel>
                                <RadioGroup
                                    row
                                    aria-labelledby="demo-row-radio-buttons-group-label"
                                    name="row-radio-buttons-group"
                                    onChange={repeatEndChange}
                                >
                                    <FormControlLabel value="never" control={<Radio />} checked={repeatEnd === "never"} label="Soha" />
                                    <FormControlLabel value="onDate" control={<Radio />} checked={repeatEnd === "onDate"} />
                                    <label onClick={() => setRepeatEnd("onDate")} className="editService_repeat-end_date-picker">
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                                disabled={repeatEnd !== "onDate"}
                                                value={repeatEndDate}
                                                inputFormat="yyyy-MM-dd"
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
                <hr />
                <div className="editService_max-participants">
                    <p>Jelentkezők maximális száma</p>
                    <TextField
                        type="number"
                        className="editService_number"
                        onChange={maxParticipantsChange}
                        value={maxParticipants}
                        variant="filled"
                        error={maxParticipants < 1}
                    />
                </div>
                <Button onClick={saveService} variant="contained">Létrehozás</Button>
            </dialog >
            <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={handleSnackbarClose}>
                <Alert severity={snackbarStlye}>
                    {snackbarText}
                </Alert>
            </Snackbar>
        </React.Fragment>

    )
}