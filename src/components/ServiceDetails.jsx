import React, { useEffect, useState } from "react";
import { Button, IconButton, ThemeProvider } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { appTheme } from "./AuthPage";
import Calendar from "../modules/Calendar";

export default function ServiceDetails(props) {
    const [name, setName] = useState();
    const [description, setDescription] = useState("");
    const [repeating, setRepeating] = useState(false);
    const [serviceStart, setServiceStart] = useState(new Date());
    const [serviceEnd, setServiceEnd] = useState(new Date());
    const [serviceAllDay, setServiceAllDay] = useState(false);

    // An all-day reservation ends at the start of the day after its last day; show that last day instead
    const shownEnd = serviceAllDay ? new Date(serviceEnd.getFullYear(), serviceEnd.getMonth(), serviceEnd.getDate() - 1) : serviceEnd;

    useEffect(() => {
        const eventDetails = document.querySelector(".event-details_container");
        if (props.serviceDetails && eventDetails) {
            eventDetails.classList.add("event-details_hidden");
            eventDetails.addEventListener("animationend", (event) => {
                if (event.animationName === "detailsHidden") {
                    setName(props.serviceDetails.name);
                    setDescription(props.serviceDetails.description || "");
                    setRepeating(props.serviceDetails.repeating === true);
                    setServiceStart(props.serviceDetails.start);
                    setServiceEnd(props.serviceDetails.end);
                    setServiceAllDay(props.serviceDetails.allDay === true);
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
        const details = props.serviceDetails;
        closeEventDetails();
        props.changeReservation(details, action);
    }

    function recreateNode(el, withChildren) {
        if (withChildren) {
            el.parentNode.replaceChild(el.cloneNode(true), el);
        }
        else {
            var newEl = el.cloneNode(false);
            while (el.hasChildNodes()) newEl.appendChild(el.firstChild);
            el.parentNode.replaceChild(newEl, el);
        }
    }

    // useEffect(() => {


    //     if (eventDetails) {
    //         observer.observe(eventDetails, {
    //             attributes: true,
    //             attributeFilter: ['name'],
    //             childList: true,
    //             characterData: false,
    //         })
    //     }
    // }, [eventDetails])


    // useEffect(() => {
    //     console.log(name);
    //     if (eventDetails) {

    //     }
    // }, [name])



    return (
        <dialog className="event-details">
            <div className="event-details_container" name={name}>
                <div className="event-details_action-header">
                    <IconButton size="large" onClick={closeEventDetails}>
                        <CloseIcon />
                    </IconButton>
                </div>
                <div className="event-details_content">
                    <h3>{name}</h3>
                    <p>Időtartam: {Calendar.getDateWithFormat(serviceStart, !serviceAllDay)} - {Calendar.getDateWithFormat(shownEnd, !serviceAllDay)}</p>
                    {serviceAllDay ? <p>Egész napos</p> : <></>}
                    {repeating ? <p>Ismétlődő foglalás</p> : <></>}
                    {description !== "" ? <p>{description}</p> : <></>}
                </div>
                <ThemeProvider theme={appTheme}>
                    <div className="event-details_actions">
                        <Button startIcon={<EditIcon />} onClick={() => change("edit")}>Módosítás</Button>
                        <Button color="error" startIcon={<EventBusyIcon />} onClick={() => change("cancel")}>Lemondás</Button>
                    </div>
                </ThemeProvider>
            </div>
        </dialog>
    )
}