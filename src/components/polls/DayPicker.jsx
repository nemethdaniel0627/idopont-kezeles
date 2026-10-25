import React, { useState } from "react";
import { IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import { formatDay, monthWeeks } from "../../modules/pollSlots";

const MONTH_NAMES = ["január", "február", "március", "április", "május", "június", "július", "augusztus",
    "szeptember", "október", "november", "december"];
const HEADERS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

// A month calendar from Monday where days are picked by clicking them; days before today can't be picked.
// `selected` is a Set of "2026-11-03" strings.
export default function DayPicker({ selected, onToggle }) {
    const today = new Date();
    const todayKey = formatDay(today);
    const [shown, setShown] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const isCurrentMonth = shown.year === today.getFullYear() && shown.month === today.getMonth();

    const move = step => setShown(({ year, month }) => {
        const date = new Date(year, month + step, 1);
        return { year: date.getFullYear(), month: date.getMonth() };
    });

    return (
        <div className="day-picker">
            <div className="day-picker_header">
                <IconButton onClick={() => move(-1)} disabled={isCurrentMonth} aria-label="Előző hónap"><ArrowBackIosNew /></IconButton>
                <span className="day-picker_month">{shown.year}. {MONTH_NAMES[shown.month]}</span>
                <IconButton onClick={() => move(1)} aria-label="Következő hónap"><ArrowForwardIos /></IconButton>
            </div>
            <div className="day-picker_grid" role="grid">
                {HEADERS.map(header => <span key={header} className="day-picker_weekday" role="columnheader">{header}</span>)}
                {monthWeeks(shown.year, shown.month).flat().map((date, index) => {
                    if (date === null) return <span key={`empty_${index}`} />;
                    const key = formatDay(date);
                    const isSelected = selected.has(key);
                    return (
                        <button type="button" key={key} disabled={key < todayKey} onClick={() => onToggle(key)}
                            className={`day-picker_day${isSelected ? " marked" : ""}${key === todayKey ? " today" : ""}`}
                            aria-pressed={isSelected} aria-label={key}>
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
