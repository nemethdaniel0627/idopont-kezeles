import React, { useState, useEffect } from "react";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextField from '@mui/material/TextField';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import TimePicker from '@mui/lab/TimePicker';

export default function NewEvent(props) {
    const [eventTime, setEventTime] = useState({
        startHour: 8,
        startMinute: "00",
        endHour: 8,
        endMinute: "00",
        startTime: "7:00",
        endTime: "8:00"
    });
    const [value, setValue] = useState(null);

    function newEventInputChange(event) {
        const { value, name } = event.target;

        setEventTime((prevTime) => {
            if (value.length !== 3) {
                return {
                    ...prevTime,
                    [name]: value,
                };
            } else {
                return { ...prevTime };
            }
        });
    }

    function newEventClose(event) {
        let item = event.target.attributes[0].value.split("_")[0];
        // console.log(event);
        // item = item !== "currentColor" ? event.target.attributes[0].value.split("_")[0] : event.target.parentNode.attributes[0].value;
        console.log(item);
        document.getElementById(item + "newEvent").style.animation =
            "slideOutRight .6s ease-out forwards";
    }

    useEffect(() => {
        setEventTime(props.eventTime);
    }, [props.eventTime])

    return (
        <div
            id={props.item + "newEvent"}
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
                <input
                    max="24"
                    type="number"
                    id={props.item + " hour"}
                    name="startHour"
                    onChange={newEventInputChange}
                    size="1"
                    maxLength="1"
                    className="days--new-event--input days--new-event--hour"
                    value={eventTime.startHour}
                />
                <input
                    type="number"
                    id={props.item + " minute"}
                    name="startMinute"
                    onChange={newEventInputChange}
                    size="2"
                    maxLength="2"
                    className="days--new-event--input days--new-event--minute"
                    value={eventTime.startMinute}
                />
            </div>
            <div className="days--new-event_endTime">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                        label="Basic example"
                        value={value}
                        onChange={(newValue) => {
                            setValue(newValue);
                        }}
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>

                <input
                    max="24"
                    type="number"
                    id={props.item + " hour"}
                    name="endHour"
                    onChange={newEventInputChange}
                    size="1"
                    maxLength="1"
                    className="days--new-event--input days--new-event--hour"
                    value={eventTime.endHour}
                />
                <input
                    type="number"
                    id={props.item + " minute"}
                    name="endMinute"
                    onChange={newEventInputChange}
                    size="2"
                    maxLength="2"
                    className="days--new-event--input days--new-event--minute"
                    value={eventTime.endMinute}
                />
            </div>
        </div>
    )
}