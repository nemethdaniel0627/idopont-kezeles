import React, { useEffect, useState } from "react";

export default function FullscreenEvent(props) {

    const [backgroundColor, setBackgorundColor] = useState("");

    const openDetails = () => {
        props.openDetails(props);
    }

    useEffect(() => {
        let eventColors = getComputedStyle(document.documentElement).getPropertyValue("--event-colors").toString().trim().split(",");
        setBackgorundColor(props.serviceId !== -1 ? eventColors[props.serviceId - 1] : "");
    }, [])

    return (
        <span onClick={props.serviceId !== -1 ? openDetails : () => { }} className={`fullscreen-calendar_event fullscreen-calendar_event_${props.type}-long${props.serviceId === -1 ? " ghost_event" : ""}`} style={{ backgroundColor: backgroundColor }}>
            <h3>{props.type !== 'middle' && props.type !== 'end' && props.name !== "" ? props.name : <>&nbsp;</>}</h3>
        </span>
    )
}