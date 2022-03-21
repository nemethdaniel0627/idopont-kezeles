import React from "react";
import Event from "./Event";

export default function IntervalList(props) {
    return (
        <div className="interval-list--container" id={props.id}>
            <div className="interval-list">
                <div className="days--info--hours-list">
                    {props.timeUnits.map((timeUnit) => {
                        if (timeUnit <= 9)
                            return (
                                <p
                                    onClick={props.setNewEvent}
                                    key={`timeUnit_${props.item}_${timeUnit}`}
                                    id={`timeUnit_${props.item}_${timeUnit}`}
                                >
                                    {"0" + timeUnit}
                                    <span className="days--info--hour"></span>
                                    {timeUnit === 0 ? <Event id={`event_${props.item}_${timeUnit}`} eventName="Próba" /> : <i />}
                                </p>
                            );
                        else if (typeof (timeUnit) === typeof (""))
                            return (
                                <p
                                    onClick={props.setNewEvent}
                                    key={`timeUnit_${props.item}_${timeUnit}`}
                                    id={`timeUnit_${props.item}_${timeUnit}`}
                                >
                                    {Number(timeUnit.split(":")[0]) < 10 ? "0" + timeUnit.split(":")[0] : timeUnit.split(":")[0]}:
                                    {Number(timeUnit.split(":")[1]) < 10 ? "0" + timeUnit.split(":")[1] : timeUnit.split(":")[1]}
                                    <span className="days--info--hour"></span>
                                    {/* <Event eventName="Próba"/> */}
                                </p>
                            );
                        else
                            return (
                                <p
                                    onClick={props.setNewEvent}
                                    key={`timeUnit_${props.item}_${timeUnit}`}
                                    id={`timeUnit_${props.item}_${timeUnit}`}
                                >
                                    {timeUnit}
                                    <span className="days--info--hour"></span>
                                    {/* <Event eventName="Próba"/> */}
                                </p>
                            );
                    })}
                </div>
            </div>
        </div>
    );
}