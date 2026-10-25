import React, { useEffect, useState } from "react";

export default function FullscreenEvent(props) {

    const [backgroundColor, setBackgorundColor] = useState("");

    // Not the day's click, which would start a new booking
    const openDetails = (event) => {
        event.stopPropagation();
        // The reservation's id is `id` in the details, like in the small calendar's events
        props.openDetails({ ...props, id: props.serviceId });
    }

    useEffect(() => {
        let eventColors = getComputedStyle(document.documentElement).getPropertyValue("--event-colors").toString().trim().split(",");
        // One color per reservation, starting over after the last color
        setBackgorundColor(props.serviceId !== -1 ? eventColors[(props.serviceId - 1) % eventColors.length].trim() : "");
    }, [props.serviceId])

    return (
        <span onClick={props.serviceId !== -1 ? openDetails : () => { }} className={`fullscreen-calendar_event fullscreen-calendar_event_${props.type}-long${props.serviceId === -1 ? " ghost_event" : ""}`} style={{ backgroundColor: backgroundColor }}>
            <h3>{props.type !== 'middle' && props.type !== 'end' && props.name !== "" ? props.name : <>&nbsp;</>}</h3>
        </span>
    )
}
