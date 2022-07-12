import React from "react";

export default function FullscreenEvent(props) {

    const openDetails = () => {
        props.openDetails(props);
    }

    return (
        <span onClick={openDetails} className={`fullscreen-calendar_event fullscreen-calendar_event_${props.type}-long`}>
            <h3>{props.type !== 'middle' && props.type !== 'end' ? props.name : <>&nbsp;</>}</h3>
        </span>
    )
}