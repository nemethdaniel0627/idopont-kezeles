import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { placeOccurrences, toOccurrence } from "../modules/occurrences";
import { layoutDay } from "../modules/weekLayout";
import { dayStatus, isBookableTime, visibleHours, DAY_STATUS_TEXT } from "../modules/bookingRules";
import { dayHeader, toTime } from "../modules/pollSlots";

const SLOT_MINUTES = 30;
// A minute's height; a half-hour row is 2.4rem
const REM_PER_MINUTE = 0.08;

const pad = number => String(number).padStart(2, "0");
const hoursAndMinutes = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// One color per reservation, like in the month view
function eventColor(id) {
    const colors = getComputedStyle(document.documentElement).getPropertyValue("--event-colors").split(",").map(color => color.trim());
    return colors[(id - 1) % colors.length] || "#007991";
}

// A week from Monday: days as columns, the hours as rows. Reservations are placed by their start and length;
// clicking a free half hour starts a booking there, clicking a reservation shows it.
export default function WeekView({ resource, weekStart, reloadKey, isAdmin, onSlotClick, onEventClick }) {
    const [days, setDays] = useState(() => Array.from({ length: 7 }, (_, i) => ({ date: addDays(weekStart, i), services: [], fullscreenServices: [] })));
    const now = new Date();

    useEffect(() => {
        const emptyWeek = () => Array.from({ length: 7 }, (_, i) => ({ date: addDays(weekStart, i), services: [], fullscreenServices: [] }));
        setDays(emptyWeek());
        if (resource.id === undefined) return;
        let current = true;
        axios.get(`/resources/${resource.id}/occurrences`, { params: { from: weekStart.toISOString(), to: addDays(weekStart, 7).toISOString() } })
            .then(res => {
                // placeOccurrences fills in the array it gets, so it gets a new one, not the one in the state
                if (current) setDays(placeOccurrences(emptyWeek(), res.data.result.map(toOccurrence)));
            })
            .catch(err => console.error(err));
        return () => { current = false; };
    }, [resource.id, weekStart, reloadKey]);

    const layouts = useMemo(() => days.map(day => layoutDay(day.services)), [days]);
    const { from, to } = visibleHours(resource, layouts.flatMap(layout => layout.timed));
    const times = [];
    for (let minute = from; minute < to; minute += SLOT_MINUTES) times.push(minute);
    const hasAllDay = layouts.some(layout => layout.allDay.length > 0);

    return (
        <div className="week-view">
            <div className="week-view_grid">
                <div className="week-view_corner" />
                {days.map(day => {
                    const header = dayHeader(dayKey(day.date));
                    const status = dayStatus(resource, day.date, { isAdmin, now });
                    return (
                        <div key={dayKey(day.date)} className={`week-view_day-head${sameDay(day.date, now) ? " today" : ""}${status !== "open" ? " unavailable" : ""}`}
                            title={DAY_STATUS_TEXT[status]}>
                            <span>{header.top}</span>
                            <strong>{day.date.getDate()}.</strong>
                        </div>
                    );
                })}

                {hasAllDay
                    ? <>
                        <div className="week-view_all-day-label">Egész nap</div>
                        {layouts.map((layout, index) =>
                            <div key={index} className="week-view_all-day">
                                {layout.allDay.map(service =>
                                    <button type="button" key={service.id} className={`week-view_event all-day${service.mine ? " mine" : ""}`}
                                        style={{ backgroundColor: eventColor(service.id) }} onClick={() => onEventClick(service)}>
                                        {service.name}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                    : <></>}

                <div className="week-view_times">
                    {times.filter(minute => minute % 60 === 0).map(minute =>
                        <span key={minute} style={{ top: `${(minute - from) * REM_PER_MINUTE}rem` }}>{toTime(minute)}</span>
                    )}
                </div>
                {days.map((day, index) => {
                    const status = dayStatus(resource, day.date, { isAdmin, now });
                    return (
                        <div key={dayKey(day.date)} className={`week-view_column${status !== "open" ? " unavailable" : ""}`}>
                            {times.map(minute => {
                                const time = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), Math.floor(minute / 60), minute % 60);
                                const bookable = isBookableTime(resource, time, { isAdmin, now });
                                return (
                                    <button type="button" key={minute} className={`week-view_slot${bookable ? "" : " closed"}${minute % 60 === 0 ? " hour" : ""}`}
                                        disabled={!bookable} onClick={() => onSlotClick(day.date, time)}
                                        aria-label={`${dayHeader(dayKey(day.date)).top} ${day.date.getDate()}. ${toTime(minute)} – foglalás`}
                                        title={bookable ? `Foglalás ${toTime(minute)}-tól` : undefined} />
                                );
                            })}
                            {layouts[index].timed.map(({ service, start, end, lane, lanes }) => {
                                const top = Math.max(start, from) - from;
                                const height = Math.min(end, to) - Math.max(start, from);
                                return (
                                    <button type="button" key={`${service.id}_${start}`} className={`week-view_event${service.mine ? " mine" : ""}`}
                                        onClick={() => onEventClick(service)}
                                        style={{
                                            top: `${top * REM_PER_MINUTE}rem`,
                                            height: `${Math.max(height * REM_PER_MINUTE, 1.8)}rem`,
                                            left: `calc(${(lane / lanes) * 100}% + 0.2rem)`,
                                            width: `calc(${100 / lanes}% - 0.4rem)`,
                                            backgroundColor: eventColor(service.id),
                                        }}
                                        title={`${service.name}, ${hoursAndMinutes(service.start)}–${hoursAndMinutes(service.end)}`}>
                                        <strong>{service.name}</strong>
                                        {height >= 45 ? <span>{toTime(start)}–{toTime(Math.min(end, 1440))}</span> : <></>}
                                    </button>
                                );
                            })}
                            {sameDay(day.date, now) && now.getHours() * 60 + now.getMinutes() >= from && now.getHours() * 60 + now.getMinutes() < to
                                ? <div className="week-view_now" style={{ top: `${(now.getHours() * 60 + now.getMinutes() - from) * REM_PER_MINUTE}rem` }} />
                                : <></>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
