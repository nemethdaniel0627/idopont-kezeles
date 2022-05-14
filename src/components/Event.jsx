import React, { useEffect } from "react";
import Calendar from "../modules/Calendar";

export default function Event(props) {

    useEffect(() => {

        const eventLength = props.eventLength;
        let oneHourLength;
        switch (props.id.split("_")[3]) {
            case "60":
                oneHourLength = document.querySelector(`#timeUnit_${props.prefix}_1_60`).offsetTop - document.querySelector(`#timeUnit_${props.prefix}_0_60`).offsetTop;
                break;
            case "30":
                oneHourLength = document.querySelector(`#timeUnit_${props.prefix}_1\\:0_30`).offsetTop - document.querySelector(`#timeUnit_${props.prefix}_0\\:0_30`).offsetTop;
                break;
            case "5":
                oneHourLength = document.querySelector(`#timeUnit_${props.prefix}_1\\:0_5`).offsetTop - document.querySelector(`#timeUnit_${props.prefix}_0\\:0_5`).offsetTop;
                break;

            default:
                break;
        }
        const oneMinuteLength = oneHourLength / 60;

        let event = props.id.includes(":") ? document.querySelector(`#${props.id.split(":")[0]}\\:${props.id.split(":")[1]}`) : document.querySelector(`#${props.id}`);

        if (event) {
            event.style.height = `${oneMinuteLength * eventLength}px`;
            if (props.eventNotRound !== undefined) {
                event.style.marginTop = `${oneMinuteLength * props.eventNotRound}px`;
            }
        }
    }, [props.eventLength, props.id]);
    return (
        <span id={props.id} className="event">
            <label className="event-name">{props.eventName}</label>
        </span>
    )
}
