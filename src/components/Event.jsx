import React, { useEffect } from "react";

export default function Event(props) {
    // id ends with "_<event index>", the rest is shared by the events starting in the same time unit
    const sameStartClass = props.id.slice(0, props.id.lastIndexOf("_"));
    const eventIndex = Number(props.id.slice(props.id.lastIndexOf("_") + 1));

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
            let eventColors = getComputedStyle(document.documentElement).getPropertyValue("--event-colors").toString().trim().split(",");
            // Same event, same color in every interval list and after every render
            event.style.backgroundColor = eventColors[eventIndex % eventColors.length].trim();
            const sameStartEvents = sameStartClass.includes(":")
                ? document.querySelectorAll(`.${sameStartClass.split(":")[0]}\\:${sameStartClass.split(":")[1]}`)
                : document.querySelectorAll(`.${sameStartClass}`);
            console.log(sameStartEvents);
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
    }, [props.eventLength, props.id, props.prefix, props.eventNotRound, sameStartClass, eventIndex]);
    return (
        <span id={props.id} className={`event ${sameStartClass}`}>
            <label className="event-name">{props.eventName}</label>
        </span>
    )
}
