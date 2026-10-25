import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { placeOccurrences, toOccurrence } from "../modules/occurrences";
import { dragRange, layoutDay } from "../modules/weekLayout";
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
// clicking a reservation shows it. A free half hour starts a booking: clicked, with the suggested length; or with
// the mouse dragged down (or up) the day, from where the button went down to where it is let go, like marking
// times in a poll. The drag stops at closed hours and other bookings. On touch screens a tap starts a booking.
// onSlotClick(day, start, end) gets the end only after a drag.
// Without canBook the free times are shown but can't be clicked; the bookings still open their details
export default function WeekView({ resource, weekStart, reloadKey, isAdmin, canBook = true, onSlotClick, onEventClick }) {
    const [days, setDays] = useState(() => Array.from({ length: 7 }, (_, i) => ({ date: addDays(weekStart, i), services: [], fullscreenServices: [] })));
    const now = new Date();
    // While dragging: { dayIndex, anchor, current }, start minutes of the first slot and the one under the pointer
    const [drag, setDrag] = useState(null);
    const dragRef = useRef(null);
    dragRef.current = drag;
    const lastPointer = useRef("mouse");

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

    const timeOn = (date, minute) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minute / 60), minute % 60);
    // A half hour that can start a booking and that no reservation covers
    const isFree = (dayIndex, minute) => isBookableTime(resource, timeOn(days[dayIndex].date, minute), { isAdmin, now })
        && !layouts[dayIndex].timed.some(item => item.start < minute + SLOT_MINUTES && item.end > minute)
        && layouts[dayIndex].allDay.length === 0;
    const selected = drag ? dragRange(drag.anchor, drag.current, minute => isFree(drag.dayIndex, minute), SLOT_MINUTES) : null;

    // Letting go of the button ends the drag wherever the pointer is, and opens the form with the range
    useEffect(() => {
        const finish = () => {
            const current = dragRef.current;
            if (!current) return;
            setDrag(null);
            const date = days[current.dayIndex].date;
            const range = dragRange(current.anchor, current.current, minute => isFree(current.dayIndex, minute), SLOT_MINUTES);
            if (range.end - range.start === SLOT_MINUTES) onSlotClick(date, timeOn(date, range.start));
            else onSlotClick(date, timeOn(date, range.start), timeOn(date, range.end));
        };
        window.addEventListener("pointerup", finish);
        return () => window.removeEventListener("pointerup", finish);
    });

    const pointerDown = (event, dayIndex, minute) => {
        lastPointer.current = event.pointerType;
        if (!canBook || event.pointerType !== "mouse" || event.button !== 0 || !isFree(dayIndex, minute)) return;
        // No text selection while dragging
        event.preventDefault();
        setDrag({ dayIndex, anchor: minute, current: minute });
    };

    const pointerEnter = (dayIndex, minute) => {
        if (drag && drag.dayIndex === dayIndex) setDrag({ ...drag, current: minute });
    };

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
                                    <button type="button" key={minute} className={`week-view_slot${bookable ? "" : " closed"}${canBook ? "" : " view-only"}${minute % 60 === 0 ? " hour" : ""}`}
                                        disabled={!bookable || !canBook}
                                        onPointerDown={event => pointerDown(event, index, minute)}
                                        onPointerEnter={() => pointerEnter(index, minute)}
                                        // A mouse is handled when its button goes up; a tap or Enter books from here
                                        onClick={() => { if (lastPointer.current !== "mouse") onSlotClick(day.date, time); lastPointer.current = "keyboard"; }}
                                        aria-label={`${dayHeader(dayKey(day.date)).top} ${day.date.getDate()}. ${toTime(minute)} – foglalás`}
                                        title={bookable && canBook ? "Kattints, vagy húzd az egeret a foglalás végéig" : undefined} />
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
                            {selected && drag.dayIndex === index
                                ? <div className="week-view_selection" style={{
                                    top: `${(selected.start - from) * REM_PER_MINUTE}rem`,
                                    height: `${(selected.end - selected.start) * REM_PER_MINUTE}rem`,
                                }}>
                                    {toTime(selected.start)}–{toTime(selected.end)}
                                </div>
                                : <></>}
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
