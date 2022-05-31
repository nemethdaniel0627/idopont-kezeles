import React, { useEffect, useState } from "react";
import {
    FilledInput,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    InputAdornment,
    MenuItem,
    Radio,
    RadioGroup,
    TextField,
    ToggleButton,
    ToggleButtonGroup
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/lab";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';

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

    const [regularity, setRegularity] = useState('never');
    const [repeatsEvery, setRepeatsEvery] = useState("1");
    const [daySelected, setDaySelected] = useState(['']);
    const [startInputValue, setStartInputValue] = useState(new Date());
    const [endInputValue, setEndInputValue] = useState(new Date().setHours(new Date().getHours() + 1));
    const [repeatEndDate, setRepeatEndDate] = useState(new Date());
    const [repeatEnd, setRepeatEnd] = useState();
    const [occurrence, setOccurrence] = useState("1");
    const [editTile, setEditTile] = useState(false);
    const [title, setTitle] = useState("");


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

    const closeDialog = (event) => {
        const editSzolgContainer = document.querySelector(`#editSzolgaltatas_${props.id}`);
        if (editSzolgContainer) {

            editSzolgContainer.setAttribute("closing", "");
            editSzolgContainer.addEventListener("animationend", () => {
                editSzolgContainer.close();
                editSzolgContainer.removeAttribute("closing");
                editSzolgContainer.removeAttribute("open");
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
        const editTileInput = document.querySelector(".editSzolg_edit-title");
        setTitle(event.target.value);

        if (editTileInput) {
            editTileInput.style.width = event.target.value.length + 3 + "ch";
        }
    }

    const handleMouseDownTitle = (event) => {
        event.preventDefault();
    };

    const finishEditTitle = () => {
        setEditTile(false);
        const root = document.querySelector(":root");
        root.style.setProperty("--editTitleInputWidth", `${title.length + 3}ch`);
    }

    useEffect(() => {
        setTitle(props.title);
    }, [props.title])

    return (
        <dialog id={`editSzolgaltatas_${props.id}`} className="editSzolg">
            <IconButton onClick={closeDialog} size="large" className="editSzolg_close">
                <CloseIcon />
            </IconButton>
            {
                editTile === true ?
                    <FormControl variant="filled" className="editSzolg_edit-title">
                        <FilledInput
                            id="filled-adornment-password"
                            type="text"
                            value={title}
                            onChange={titleChange}
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
                    <h2 onClick={() => setEditTile(true)} className="editSzolg_title">
                        {title}
                        <EditIcon />
                    </h2>
            }
            <div className="editSzolg_date-time-pickers">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                        label="Erőforrás kezdő időpontja"
                        value={startInputValue}
                        ampm={false}
                        inputFormat="yyyy-MM-dd HH:mm"
                        onChange={(newValue) => {
                            setStartInputValue(newValue);
                        }}
                        renderInput={(params) => <TextField {...params} variant="filled" />}
                    />
                    <DateTimePicker
                        label="Erőforrás záró időpontja"
                        value={endInputValue}
                        ampm={false}
                        inputFormat="yyyy-MM-dd HH:mm"
                        onChange={(newValue) => {
                            setEndInputValue(newValue);
                        }}
                        renderInput={(params) => <TextField {...params} variant="filled" />}
                    />
                </LocalizationProvider>
            </div>
            <div className="editSzolg_repeat-container">
                <p>
                    {
                        regularity === "never" ? "Ismétlődjön?"
                            : regularity === "day" ? `Ismétlődjön minden ${repeatsEvery !== "1" ? `${repeatsEvery}. ` : ""}napon`
                                : regularity === "month" ? `Ismétlődjön minden ${repeatsEvery !== "1" ? `${repeatsEvery}. ` : ""}hónap, ${startInputValue.getDate()}. napján`
                                    : regularity === "year" ? `Ismétlődjön minden ${repeatsEvery !== "1" ? `${repeatsEvery}. ` : ""}évben`
                                        : regularity === "week" ? `Ismétlődjön minden ${repeatsEvery !== "1" ? `${repeatsEvery}. ` : ""} héten: ${daySelected.toString().substring(1)}` : ""
                    }
                </p>
                {
                    regularity === "never" ? <></> :
                        <TextField
                            type="number"
                            className="editSzolg_number"
                            onChange={repeatsEveryChange}
                            value={repeatsEvery}
                            variant="filled"
                        />
                }
                <TextField
                    id="filled-select-currency"
                    select
                    className="editSzolg_select"
                    value={regularity}
                    onChange={selectionChanged}
                    variant="filled"
                >
                    {regularityOptions.map((option) => (
                        <MenuItem className="editSzolg_menu-item" key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            </div>
            {
                regularity === 'week' ?
                    <div className="editSzolg_week-days_container">
                        <hr />
                        <p>A kiválaszott napok minden hétre lefoglalhatóak lesznek</p>
                        <ToggleButtonGroup
                            color="primary"
                            value={daySelected}
                            className="editSzolg_week-days"
                            onChange={daySelectionChanged}
                        >
                            <ToggleButton value="Hé">Hé</ToggleButton>
                            <ToggleButton value="Ke">Ke</ToggleButton>
                            <ToggleButton value="Sze">Sze</ToggleButton>
                            <ToggleButton value="Csü">Csü</ToggleButton>
                            <ToggleButton value="Pé">Pé</ToggleButton>
                            <ToggleButton value="Szo">Szo</ToggleButton>
                            <ToggleButton value="Va">Va</ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    :
                    <></>
            }

            {
                regularity !== "never" ?
                    <div className="editSzolg_repeat-end">
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
                                <label onClick={() => setRepeatEnd("onDate")} className="editSzolg_repeat-end_date-picker">
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
                                <label onClick={() => setRepeatEnd("occurrence")} className="editSzolg_repeat-end_occurrence">
                                    <TextField
                                        disabled={repeatEnd !== "occurrence"}
                                        type="number"
                                        className="editSzolg_number"
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
        </dialog >
    )
}