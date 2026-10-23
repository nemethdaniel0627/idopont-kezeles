import React, { useState, useEffect } from "react";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextField from '@mui/material/TextField';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import TimePicker from '@mui/lab/TimePicker';
import { Button } from "@mui/material";
import CalendarModule from "../modules/Calendar";

export default function NewEvent(props) {
    // const [eventTime, setEventTime] = useState({
    //     startHour: 8,
    //     startMinute: "00",
    //     endHour: 8,
    //     endMinute: "00",
    //     startTime: "7:00",
    //     endTime: "8:00"
    // });
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [onceOpen, setOnceOpen] = useState(false);
    const [startTimeIsClosed, setStartTimeIsClosed] = useState(null);
    const isValidTime = time => time instanceof Date && !isNaN(time);
    const timesAreValid = isValidTime(startTime) && isValidTime(endTime) && startTime < endTime;

    // A time typed into the picker gets today's date, so move it to the selected day
    function onSelectedDay(time) {
        return isValidTime(time)
            ? CalendarModule.setTimeOnDate(CalendarModule.getDateFromPrefix(props.item), time)
            : time;
    }

    function addNewEvent(id) {
        if (!timesAreValid) return;
        props.addNewEvent(startTime, endTime);
        newEventClose("event", id);
    }

    function newEventClose(event, tmpItem = undefined) {
        setOnceOpen(false);
        let item = tmpItem === undefined ? event.target.attributes[0].value.split("_")[0] : tmpItem;
        console.log(item);
        // item = item !== "currentColor" ? event.target.attributes[0].value.split("_")[0] : event.target.parentNode.attributes[0].value;
        console.log(item);
        document.getElementById(item + "_newEvent").style.animation =
            "slideOutRight .6s ease-out forwards";
    }

    useEffect(() => {
        let tmpStartTime = CalendarModule.getDateFromPrefix(props.item);
        tmpStartTime.setHours(props.eventTime.startHour, props.eventTime.startMinute);
        setStartTime(tmpStartTime);
        let tmpEndTime = CalendarModule.getDateFromPrefix(props.item);
        tmpEndTime.setHours(props.eventTime.endHour, props.eventTime.endMinute);
        setEndTime(tmpEndTime)
    }, [props.eventTime, props.item])

    useEffect(() => {
        if (startTime !== null && onceOpen !== true && startTimeIsClosed === true) {
            const tmpEnd = new Date(startTime);
            tmpEnd.setHours(Number(tmpEnd.getHours()) + 1, tmpEnd.getMinutes());
            setEndTime(tmpEnd);
        }
        // eslint-disable-next-line
    }, [startTime])


    return (
        <div
            id={props.item + "_newEvent"}
            className="days-window-style days--new-event"
        >
            {/* <input type="number" name="" id="" /> */}
            <span
                onClick={newEventClose}
                datavalue={props.item + "_newEventClose"}
                className="days--info--close newEvent"
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </span>
            <div className="days--new-event_startTime">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                        label="Időpont kezdés"
                        value={startTime}
                        onChange={(newStart) => {
                            setStartTime(onSelectedDay(newStart));
                        }}
                        onClose={() => { setStartTimeIsClosed(true) }}
                        onOpen={() => { setStartTimeIsClosed(false) }}
                        ampm={false}
                        renderInput={(params) =>
                            <TextField
                                {...params}
                                error={!timesAreValid}
                                helperText={timesAreValid ? "" : "Az időpont végének a kezdete után kell lennie"} />
                        }
                    />
                </LocalizationProvider>
            </div>
            <div className="days--new-event_endTime">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                        label="Időpont vége"
                        value={endTime}
                        onChange={(newEnd) => {
                            setEndTime(onSelectedDay(newEnd));
                        }}
                        onOpen={() => { setOnceOpen(true) }}
                        ampm={false}
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
            </div>
            <Button
                variant="outlined"
                disabled={!timesAreValid}
                onClick={() => { addNewEvent(props.item) }}>
                Létrehozás
            </Button>
        </div>
    )
}