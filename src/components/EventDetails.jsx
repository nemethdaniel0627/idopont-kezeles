import React, { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

export default function EventDetails(props) {
    const [name, setName] = useState();

    useEffect(() => {
        const eventDetails = document.querySelector(".event-details_container");
        if (props.eventDetails && eventDetails) {
            eventDetails.classList.add("event-details_hidden");
            eventDetails.addEventListener("animationend", (event) => {
                console.log(event.animationName);
                if (event.animationName === "detailsHidden") {
                    setName(props.eventDetails.name);
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
    }, [props.eventDetails])

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
                    <p>Munkaszüneti nap</p>
                    <p>Ünnep</p>
                    <p>Nyilvános</p>
                </div>
            </div>
        </dialog>
    )
}