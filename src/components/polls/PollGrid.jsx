import React, { useEffect, useRef, useState } from "react";
import { dayHeader, slotId, toMinutes, toTime } from "../../modules/pollSlots";

// The availability grid: the poll's days as columns, its slots as rows.
// - editing: the slots in `selected` (a Set) are marked. With a mouse, dragging marks or clears the rectangle
//   between the first slot and the one under the pointer (as the first one turned), so no slot is missed
//   however fast the mouse moves; on a touch screen each tap toggles a slot. A day's header fills or clears
//   the whole day.
// - viewing: each slot is as blue as the share of respondents available then (`counts`, `total`);
//   clicking one shows who is available in `onSlotFocus`. When the answers are hidden from the viewer,
//   `ownSlots` (a Set) marks only the viewer's own answer instead.
export default function PollGrid({ days, times, slotMinutes, editing, selected, setSelected, counts, total, ownSlots, focusedSlot, onSlotFocus }) {
    // While dragging: { day, time } indexes of the first slot, the value it got, and the selection before the drag
    const [drag, setDrag] = useState(null);
    const lastPointer = useRef("mouse");

    // A drag ends wherever the button is let go
    useEffect(() => {
        const stop = () => setDrag(null);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        return () => {
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
        };
    }, []);

    const mark = (slot, value) => setSelected(previous => {
        if (previous.has(slot) === value) return previous;
        const next = new Set(previous);
        if (value) next.add(slot);
        else next.delete(slot);
        return next;
    });

    // The drag's rectangle from its first slot to (dayIndex, timeIndex) gets the drag's value
    const paintTo = (start, dayIndex, timeIndex) => {
        const next = new Set(start.before);
        for (let d = Math.min(start.day, dayIndex); d <= Math.max(start.day, dayIndex); d++) {
            for (let t = Math.min(start.time, timeIndex); t <= Math.max(start.time, timeIndex); t++) {
                const slot = slotId(days[d], times[t]);
                if (start.value) next.add(slot);
                else next.delete(slot);
            }
        }
        setSelected(next);
    };

    const pointerDown = (event, slot, dayIndex, timeIndex) => {
        lastPointer.current = event.pointerType;
        if (!editing || event.pointerType !== "mouse" || event.button !== 0) return;
        // No text selection while dragging
        event.preventDefault();
        const start = { day: dayIndex, time: timeIndex, value: !selected.has(slot), before: selected };
        setDrag(start);
        paintTo(start, dayIndex, timeIndex);
    };

    const pointerEnter = (dayIndex, timeIndex) => {
        if (editing && drag !== null) paintTo(drag, dayIndex, timeIndex);
    };

    const click = slot => {
        if (!editing) {
            onSlotFocus(slot === focusedSlot ? null : slot);
            return;
        }
        // A mouse click was already handled when the button went down
        if (lastPointer.current !== "mouse") mark(slot, !selected.has(slot));
    };

    const toggleDay = day => {
        if (!editing) return;
        const daySlots = times.map(time => slotId(day, time));
        const fill = !daySlots.every(slot => selected.has(slot));
        setSelected(previous => {
            const next = new Set(previous);
            daySlots.forEach(slot => fill ? next.add(slot) : next.delete(slot));
            return next;
        });
    };

    const keyDown = (event, slot) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (editing) mark(slot, !selected.has(slot));
            else click(slot);
        }
    };

    const cellStyle = slot => {
        if (editing) return undefined;
        const count = counts[slot] || 0;
        if (count === 0 || total === 0) return undefined;
        // The page's blue (--calendar-blue), from pale to full; full when everyone is available
        return { backgroundColor: `rgba(57, 162, 219, ${0.15 + 0.85 * (count / total)})` };
    };

    return (
        <div className={`poll-grid${editing ? " poll-grid_editing" : ""}`} role="grid"
            style={{ gridTemplateColumns: `5.6rem repeat(${days.length}, minmax(6.4rem, 1fr))` }}>
            <div className="poll-grid_corner" role="columnheader" />
            {days.map(day => {
                const header = dayHeader(day);
                return (
                    <button type="button" key={day} role="columnheader" className="poll-grid_day" onClick={() => toggleDay(day)}
                        disabled={!editing} title={editing ? "Az egész nap kijelölése vagy törlése" : undefined}>
                        <span className="poll-grid_day-top">{header.top}</span>
                        {header.bottom !== "" ? <span className="poll-grid_day-bottom">{header.bottom}</span> : <></>}
                    </button>
                );
            })}
            {times.map((time, timeIndex) => (
                <React.Fragment key={time}>
                    <div className="poll-grid_time" role="rowheader">{time}</div>
                    {days.map((day, dayIndex) => {
                        const slot = slotId(day, time);
                        const isSelected = editing ? selected.has(slot) : Boolean(ownSlots && ownSlots.has(slot));
                        const end = toTime(toMinutes(time) + slotMinutes);
                        const label = `${day} ${time}–${end}`;
                        return (
                            <div key={slot} role="gridcell" tabIndex={0} data-slot={slot}
                                aria-label={editing ? label : ownSlots ? `${label}: ${isSelected ? "ráérsz" : "nem jelölted be"}` : `${label}: ${counts[slot] || 0}/${total}`}
                                aria-selected={editing ? isSelected : slot === focusedSlot}
                                className={`poll-grid_cell${isSelected ? " marked" : ""}${!editing && slot === focusedSlot ? " focused" : ""}`}
                                style={cellStyle(slot)}
                                onPointerDown={event => pointerDown(event, slot, dayIndex, timeIndex)}
                                onPointerEnter={() => pointerEnter(dayIndex, timeIndex)}
                                onClick={() => click(slot)}
                                onKeyDown={event => keyDown(event, slot)} />
                        );
                    })}
                </React.Fragment>
            ))}
            {/* The end of the last slot, so the window's closing time can be read too */}
            {times.length !== 0
                ? <>
                    <div className="poll-grid_time poll-grid_end-time">{toTime(toMinutes(times[times.length - 1]) + slotMinutes)}</div>
                    {days.map(day => <div key={`end_${day}`} className="poll-grid_end" />)}
                </>
                : <></>}
        </div>
    );
}
