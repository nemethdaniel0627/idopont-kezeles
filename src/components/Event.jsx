import React, { useEffect } from "react";
import Calendar from "../modules/Calendar";

export default function Event(props) {

    useEffect(() => {

        const serviceLength = props.serviceLength;
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
            event.style.height = `${oneMinuteLength * serviceLength}px`;
            let eventColors = getComputedStyle(document.documentElement).getPropertyValue("--event-colors").toString().trim().split(",");
            const r = Math.floor(Math.random() * 7);
            event.style.backgroundColor = eventColors[r];
            const sameStartEvents = props.id.includes(":")
                ? document.querySelectorAll(`.${props.id.slice(0, -2).split(":")[0]}\\:${props.id.slice(0, -2).split(":")[1]}`)
                : document.querySelectorAll(`.${props.id.slice(0, -2)}`);
            const eventMaxWidth = document.querySelector(".days--info--hour").clientWidth + 1;
            sameStartEvents.forEach((event, index) => {
                let eventWidth = eventMaxWidth / sameStartEvents.length;
                event.style.width = eventWidth + "px";
                event.style.left = `calc(2.9rem + ${index * eventWidth}px)`;
            })
            if (props.eventNotRound !== undefined) {
                event.style.marginTop = `${oneMinuteLength * props.eventNotRound}px`;
            }
        }
    }, [props.serviceLength, props.id]);
    return (
        <span id={props.id} className={`event ${props.id.slice(0, -2)}`}>
            <label className="event-name">{props.eventName}</label>
        </span>
    )
}
