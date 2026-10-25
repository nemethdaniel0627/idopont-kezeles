import React from "react";
import Calendar from "../modules/Calendar";
import Event from "./Event";

export default function IntervalList(props) {

    const intervalLength = Number(props.id.split("_")[3]);

    // Services that start inside this time unit, shifted down by the minutes they start after it
    function servicesInTimeUnit(timeUnit) {
        return props.services.map((date, index) => {
            const overlapping = date.services.length > 1;
            return date.services.map((service, serviceIndex) => {
                const slot = Calendar.getIntervalSlot(service.serviceStart, intervalLength);
                return slot.timeUnit === timeUnit
                    && `${props.prefix}-${props.item}` === Calendar.getPrefix(service.serviceDate) ?
                    <Event
                        key={`event_${index}-${serviceIndex}`}
                        id={`event_${props.prefix}-${props.item}_${timeUnit}_${intervalLength}_${index}-${serviceIndex}`}
                        eventName={service.name}
                        serviceLength={service.serviceLength}
                        prefix={`${props.prefix}-${props.item}`}
                        eventNotRound={slot.offset !== 0 ? slot.offset : undefined}
                        serviceProps={service}
                        openDetails={props.openDetails}
                        eventOverlap={overlapping ? { id: serviceIndex } : undefined} />
                    : <React.Fragment key={`event_${index}-${serviceIndex}`}></React.Fragment>
            });
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
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {"0" + timeUnit}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {servicesInTimeUnit(timeUnit)}
                                </p>
                            );
                        else if (typeof (timeUnit) === typeof (""))
                            return (
                                <p
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {Number(timeUnit.split(":")[0]) < 10 ? "0" + timeUnit.split(":")[0] : timeUnit.split(":")[0]}:
                                    {Number(timeUnit.split(":")[1]) < 10 ? "0" + timeUnit.split(":")[1] : timeUnit.split(":")[1]}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {servicesInTimeUnit(timeUnit)}
                                </p>
                            );
                        else
                            return (
                                <p
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {timeUnit}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {servicesInTimeUnit(timeUnit)}
                                </p>
                            );
                    })}
                </div>
            </div>
        </div>
    );
}
