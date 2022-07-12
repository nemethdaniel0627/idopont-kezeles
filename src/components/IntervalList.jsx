import React, { useEffect } from "react";
import Calendar from "../modules/Calendar";
import Event from "./Event";

export default function IntervalList(props) {

    // useEffect(() => {
    //     console.log("ujra");
    // }, [])

    return (
        <div className="interval-list--container" id={props.id}>
            <div className="interval-list">
                <div className="days--info--hours-list">
                    {props.timeUnits.map((timeUnit, index) => {
                        if (timeUnit <= 9)
                            return (
                                <p
                                    onClick={props.setNewEvent}
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {"0" + timeUnit}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {props.services.map((service, index) => {
                                        return Number(service.serviceStart.split(":")[0]) === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(service.serviceDate) ?
                                            <Event
                                                key={`event_${index}`}
                                                id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                eventName={service.name}
                                                serviceLength={service.serviceLength}
                                                prefix={`${props.prefix}-${props.item}`}
                                                eventNotRound={Number(service.serviceStart.split(":")[1]) !== 0 ? Number(service.serviceStart.split(":")[1]) : undefined} />
                                            : <i key={`event_${index}`}></i>
                                    })}
                                    {/* {timeUnit === 3 ? <Event id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} eventName="Próba" /> : <i />} */}
                                </p>
                            );
                        else if (typeof (timeUnit) === typeof (""))
                            return (
                                <p
                                    onClick={props.setNewEvent}
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {Number(timeUnit.split(":")[0]) < 10 ? "0" + timeUnit.split(":")[0] : timeUnit.split(":")[0]}:
                                    {Number(timeUnit.split(":")[1]) < 10 ? "0" + timeUnit.split(":")[1] : timeUnit.split(":")[1]}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {props.services.map((event, index) => {
                                        return event.serviceStart === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(event.serviceDate) ?
                                            <Event
                                                key={`event_${index}`}
                                                id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                eventName={event.name}
                                                prefix={`${props.prefix}-${props.item}`}
                                                serviceLength={event.serviceLength} />
                                            : <i key={`event_${index}`}></i>
                                    })}
                                </p>
                            );
                        else
                            return (
                                <p
                                    onClick={props.setNewEvent}
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {timeUnit}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {props.services.map((event, index) => {
                                        return Number(event.serviceStart.split(":")[0]) === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(event.serviceDate) ?
                                            <Event
                                                key={`event_${index}`}
                                                id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                eventName={event.name}
                                                serviceLength={event.serviceLength}
                                                prefix={`${props.prefix}-${props.item}`}
                                                eventNotRound={Number(event.serviceStart.split(":")[1]) !== 0 ? Number(event.serviceStart.split(":")[1]) : undefined} />
                                            : <i key={`event_${index}`}></i>
                                    })}
                                </p>
                            );
                    })}
                </div>
            </div>
        </div>
    );
}