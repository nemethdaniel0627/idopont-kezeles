import React from "react";
import Calendar from "../modules/Calendar";
import Event from "./Event";

export default function IntervalList(props) {

    const intervalLength = Number(props.id.split("_")[3]);

    // Events that start inside this time unit, shifted down by the minutes they start after it
    function eventsInTimeUnit(timeUnit) {
        return props.events.map((event, index) => {
            const slot = Calendar.getIntervalSlot(event.eventStart, intervalLength);
            return slot.timeUnit === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(event.eventDate) ?
                <Event
                    key={`event_${index}`}
                    id={`event_${props.prefix}-${props.item}_${timeUnit}_${intervalLength}_${index}`}
                    eventName="Esemény"
                    eventLength={event.eventLength}
                    prefix={`${props.prefix}-${props.item}`}
                    eventNotRound={slot.offset !== 0 ? slot.offset : undefined} />
                : <i key={`event_${index}`}></i>
        });
    }

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
                                    {eventsInTimeUnit(timeUnit)}
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
                                    {eventsInTimeUnit(timeUnit)}
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
                                    {eventsInTimeUnit(timeUnit)}
                                </p>
                            );
                    })}
                </div>
            </div>
        </div>
    );
}
