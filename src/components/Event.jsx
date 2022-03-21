import React from "react";

export default function Event(props) {
    return (
        <span id={props.id} className="event">
            <label>{props.eventName}</label>
        </span>
    )
}
