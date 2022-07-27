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
                                    // onClick={props.setNewEvent}
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {"0" + timeUnit}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {props.services.map((date, index) => {
                                        if (date.services.length === 1 && (date.services[0].id === props.selectedService.id || props.showOthers === true)) {
                                            return Number(date.services[0].serviceStart.split(":")[0]) === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(date.services[0].serviceDate) ?
                                                <Event
                                                    key={`event_${index}`}
                                                    id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                    eventName={date.services[0].name}
                                                    serviceLength={date.services[0].serviceLength}
                                                    prefix={`${props.prefix}-${props.item}`}
                                                    eventNotRound={Number(date.services[0].serviceStart.split(":")[1]) !== 0 ? Number(date.services[0].serviceStart.split(":")[1]) : undefined}
                                                    serviceProps={date.services[0]}
                                                    openDetails={props.openDetails} />
                                                : <React.Fragment key={`event_${index}`}></React.Fragment>
                                        }
                                        else if (date.services.length > 1) {
                                            return date.services.map((sameDate, index) => {
                                                return (sameDate.id === props.selectedService.id || props.showOthers === true) && Number(sameDate.serviceStart.split(":")[0]) === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(sameDate.serviceDate) ?
                                                    <Event
                                                        key={`event_${index}`}
                                                        id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                        eventName={sameDate.name}
                                                        serviceLength={sameDate.serviceLength}
                                                        prefix={`${props.prefix}-${props.item}`}
                                                        eventNotRound={Number(sameDate.serviceStart.split(":")[1]) !== 0 ? Number(sameDate.serviceStart.split(":")[1]) : undefined}
                                                        serviceProps={sameDate}
                                                        openDetails={props.openDetails}
                                                        eventOverlap={{ id: index }} />
                                                    : <React.Fragment key={`event_${index}`}></React.Fragment>
                                            })
                                        }
                                    })}
                                    {/* {timeUnit === 3 ? <Event id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} eventName="Próba" /> : <React.Fragment />} */}
                                </p>
                            );
                        else if (typeof (timeUnit) === typeof (""))
                            return (
                                <p
                                    // onClick={props.setNewEvent}
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {Number(timeUnit.split(":")[0]) < 10 ? "0" + timeUnit.split(":")[0] : timeUnit.split(":")[0]}:
                                    {Number(timeUnit.split(":")[1]) < 10 ? "0" + timeUnit.split(":")[1] : timeUnit.split(":")[1]}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {props.services.map((date, index) => {
                                        if (date.services.length === 1 && (date.services[0].id === props.selectedService.id || props.showOthers === true)) {
                                            return date.services[0].serviceStart === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(date.services[0].serviceDate) ?
                                                <Event
                                                    key={`event_${index}`}
                                                    id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                    eventName={date.services[0].name}
                                                    prefix={`${props.prefix}-${props.item}`}
                                                    serviceLength={date.services[0].serviceLength}
                                                    serviceProps={date.services[0]}
                                                    openDetails={props.openDetails} />
                                                : <React.Fragment key={`event_${index}`}></React.Fragment>
                                        }
                                        else if (date.services.length > 1) {
                                            return date.services.map((sameDate, index) => {
                                                return (sameDate.id === props.selectedService.id || props.showOthers === true) && sameDate.serviceStart === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(sameDate.serviceDate) ?
                                                    <Event
                                                        key={`event_${index}`}
                                                        id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                        eventName={sameDate.name}
                                                        prefix={`${props.prefix}-${props.item}`}
                                                        serviceLength={sameDate.serviceLength}
                                                        serviceProps={sameDate}
                                                        openDetails={props.openDetails}
                                                        eventOverlap={{ id: index }} />
                                                    : <React.Fragment key={`event_${index}`}></React.Fragment>
                                            })
                                        }
                                    })}
                                </p>
                            );
                        else
                            return (
                                <p
                                    // onClick={props.setNewEvent}
                                    key={`${index}_p_key_${props.id}`}
                                    id={`timeUnit_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`}
                                >
                                    {timeUnit}
                                    <span key={`span_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}`} className="days--info--hour"></span>
                                    {props.services.map((date, index) => {
                                        if (date.services.length === 1 && (date.services[0].id === props.selectedService.id || props.showOthers === true)) {
                                            return Number(date.services[0].serviceStart.split(":")[0]) === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(date.services[0].serviceDate) ?
                                                <Event
                                                    key={`event_${index}`}
                                                    id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                    eventName={date.services[0].name}
                                                    serviceLength={date.services[0].serviceLength}
                                                    prefix={`${props.prefix}-${props.item}`}
                                                    eventNotRound={Number(date.services[0].serviceStart.split(":")[1]) !== 0 ? Number(date.services[0].serviceStart.split(":")[1]) : undefined}
                                                    serviceProps={date.services[0]}
                                                    openDetails={props.openDetails} />
                                                : <React.Fragment key={`event_${index}`}></React.Fragment>
                                        }
                                        else if (date.services.length > 1) {
                                            return date.services.map((sameDate, index) => {
                                                return (sameDate.id === props.selectedService.id || props.showOthers === true) && Number(sameDate.serviceStart.split(":")[0]) === timeUnit && `${props.prefix}-${props.item}` === Calendar.getPrefix(sameDate.serviceDate) ?
                                                    <Event
                                                        key={`event_${index}`}
                                                        id={`event_${props.prefix}-${props.item}_${timeUnit}_${props.id.split("_")[3]}_${index}`}
                                                        eventName={sameDate.name}
                                                        serviceLength={sameDate.serviceLength}
                                                        prefix={`${props.prefix}-${props.item}`}
                                                        eventNotRound={Number(sameDate.serviceStart.split(":")[1]) !== 0 ? Number(sameDate.serviceStart.split(":")[1]) : undefined}
                                                        serviceProps={sameDate}
                                                        openDetails={props.openDetails}
                                                        eventOverlap={{ id: index }} />
                                                    : <React.Fragment key={`event_${index}`}></React.Fragment>
                                            });
                                        }
                                    })}
                                </p>
                            );
                    })}
                </div>
            </div>
        </div>
    );
}