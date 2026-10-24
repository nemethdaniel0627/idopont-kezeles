import React, { useEffect, useState } from "react";
import { Button, IconButton, ThemeProvider, Tooltip } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import RepeatIcon from '@mui/icons-material/Repeat';
import { appTheme } from "./AuthPage";
import { describeTime } from "../modules/reservationText";

// A reservation's details over the calendar. Its owner and admins change or cancel it straight away; for others
// the same buttons sit under a question, since they first have to give the booking's email or phone.
export default function ServiceDetails(props) {
    const [details, setDetails] = useState(null);

    useEffect(() => {
        const eventDetails = document.querySelector(".event-details_container");
        if (props.serviceDetails && eventDetails) {
            eventDetails.classList.add("event-details_hidden");
            eventDetails.addEventListener("animationend", (event) => {
                if (event.animationName === "detailsHidden") {
                    setDetails(props.serviceDetails);
                    eventDetails.classList.add("event-details_appear");
                }
            }, { once: true });
            eventDetails.addEventListener("animationend", (event) => {
                if (event.animationName === "detailsAppear") {
                    eventDetails.classList.remove("event-details_hidden");
                    eventDetails.classList.remove("event-details_appear");
                }
            })
        }
    }, [props.serviceDetails])

    const closeEventDetails = () => {
        const tmpEventDetails = document.querySelector(".event-details");
        const eventDetails = document.querySelector(".event-details_container");

        if (tmpEventDetails) {
            tmpEventDetails.setAttribute("closing", "");
            tmpEventDetails.addEventListener("animationend", () => {
                tmpEventDetails.removeAttribute("open");
                tmpEventDetails.removeAttribute("closing");
                recreateNode(eventDetails);
            }, { once: true })
        }
    }

    // Closes the details, then opens the edit form or the cancel confirmation ("edit" or "cancel")
    const change = (action) => {
        const current = props.serviceDetails;
        closeEventDetails();
        props.changeReservation(current, action);
    }

    function recreateNode(el) {
        const newEl = el.cloneNode(false);
        while (el.hasChildNodes()) newEl.appendChild(el.firstChild);
        el.parentNode.replaceChild(newEl, el);
    }

    const direct = details && (details.mine || props.isAdmin);
    const buttons = <>
        <Button startIcon={<EditIcon />} onClick={() => change("edit")} size={direct ? "medium" : "small"}>Módosítás</Button>
        <Button color="error" startIcon={<EventBusyIcon />} onClick={() => change("cancel")} size={direct ? "medium" : "small"}>Lemondás</Button>
    </>;

    return (
        <dialog className="event-details" aria-labelledby="event-details-title">
            <div className="event-details_container">
                <div className="event-details_action-header">
                    <Tooltip title="Bezárás">
                        <IconButton size="large" onClick={closeEventDetails} aria-label="Bezárás">
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </div>
                {details
                    ? <div className="event-details_content">
                        <h3 id="event-details-title">{details.name}</h3>
                        <p className="event-details_time">{describeTime(details.start, details.end, details.allDay === true)}</p>
                        {details.repeating ? <p className="event-details_repeat"><RepeatIcon fontSize="small" /> Ismétlődő foglalás</p> : <></>}
                        {details.description ? <p className="event-details_description">{details.description}</p> : <></>}
                        {details.mine ? <p className="event-details_mine">Ez a te foglalásod.</p> : <></>}
                    </div>
                    : <></>}
                <ThemeProvider theme={appTheme}>
                    {direct
                        ? <div className="event-details_actions">{buttons}</div>
                        : <div className="event-details_actions others">
                            <span>Ez a te foglalásod? A foglaláskor megadott e-mail címmel vagy telefonszámmal:</span>
                            <div>{buttons}</div>
                        </div>}
                </ThemeProvider>
            </div>
        </dialog>
    )
}
