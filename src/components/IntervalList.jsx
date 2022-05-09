import React from "react";
import Event from "./Event";

export default function IntervalList(props) {

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
                                    id={`timeUnit_${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {"0" + timeUnit}
                                    <span key={`span_${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {props.events.map((event, index) => {
                                        return Number(event.eventStart.split(":")[0]) === timeUnit ?
                                            <Event
                                                key={`event_${index}`}
                                                id={`event_${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                                eventName="Esemény"
                                                eventLength={event.eventLength} />
                                            : <i key={`event_${index}`}></i>
                                    })}
                                    {/* {timeUnit === 3 ? <Event id={`event_${props.item}_${timeUnit}_${props.id.split("_")[3]}`} eventName="Próba" /> : <i />} */}
                                </p>
                            );
                        else if (typeof (timeUnit) === typeof (""))
                            return (
                                <p
                                    onClick={props.setNewEvent}
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {Number(timeUnit.split(":")[0]) < 10 ? "0" + timeUnit.split(":")[0] : timeUnit.split(":")[0]}:
                                    {Number(timeUnit.split(":")[1]) < 10 ? "0" + timeUnit.split(":")[1] : timeUnit.split(":")[1]}
                                    <span key={`span_${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {props.events.map((event, index) => {
                                        return event.eventStart === timeUnit ?
                                            <Event
                                                key={`event_${index}`}
                                                id={`event_${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                                eventName="Esemény"
                                                eventLength={event.eventLength} />
                                            : <i key={`event_${index}`}></i>
                                    })}
                                </p>
                            );
                        else
                            return (
                                <p
                                    onClick={props.setNewEvent}
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {timeUnit}
                                    <span key={`span_${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {/* <Event eventName="Próba"/> */}
                                </p>
                            );
                    })}
                </div>
            </div>
        </div>
    );
}