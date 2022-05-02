import React, { useEffect } from "react";

export default function Event(props) {    

    useEffect(() => {

        const eventLength = props.eventLength;
        let oneHourLength;
        switch (props.id.split("_")[3]) {
            case "60":
                oneHourLength = document.querySelector("#timeUnit_20_1_60").offsetTop - document.querySelector("#timeUnit_20_0_60").offsetTop;
                break;
            case "30":
                oneHourLength = document.querySelector("#timeUnit_20_1\\:0_30").offsetTop - document.querySelector("#timeUnit_20_0\\:0_30").offsetTop;
                break;
            case "5":
                oneHourLength = document.querySelector("#timeUnit_20_1\\:0_5").offsetTop - document.querySelector("#timeUnit_20_0\\:0_5").offsetTop;
                break;

            default:
                break;
        }        
        const oneMinuteLength = oneHourLength / 60;

        let event = props.id.includes(":") ? document.querySelector(`#${props.id.split(":")[0]}\\:${props.id.split(":")[1]}`) : document.querySelector(`#${props.id}`);

        if (event) {
            event.style.height = `${oneMinuteLength * eventLength}px`;
        }
    }, [props.eventLength, props.id]);
    return (
        <span key={props.id} id={props.id} className="event">
            <label>{props.eventName}</label>
        </span>
    )
}
