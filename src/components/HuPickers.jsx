import React from "react";
import { TextField, useMediaQuery } from "@mui/material";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/lab";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import hu from "date-fns/locale/hu";

// The date pickers in Hungarian: month and day names, weeks from Monday
export function HuLocalizationProvider({ children }) {
    return <LocalizationProvider dateAdapter={AdapterDateFns} locale={hu}>{children}</LocalizationProvider>;
}

// The pickers' own buttons, in Hungarian
export const pickerTexts = { cancelText: "Mégse", okText: "Kész", clearText: "Törlés", todayText: "Ma" };

const pad = number => String(number).padStart(2, "0");
const isValid = date => date instanceof Date && !isNaN(date);

// Date -> "2026-10-27T10:00" (or "2026-10-27"), the value of a native input
function toInputValue(date, withTime) {
    if (!isValid(date)) return "";
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return withTime ? `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

// A native input's value -> a local Date, or null when it is empty
function fromInputValue(value) {
    if (!value) return null;
    const [day, time = "00:00"] = value.split("T");
    const [year, month, date] = day.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(year, month - 1, date, hours, minutes);
}

// A date (with time, unless `withTime` is false) field. On touch screens it is the phone's own picker, which is
// easy to use there and in the phone's language; elsewhere MUI's picker. Inside HuLocalizationProvider.
export function DateTimeField({ label, value, onChange, withTime = true, error, helperText, shouldDisableDate, minDate, maxDate, disabled, size, disablePast }) {
    const touch = useMediaQuery("(pointer: coarse)");

    if (touch) {
        const min = minDate || (disablePast ? new Date() : null);
        return (
            <TextField type={withTime ? "datetime-local" : "date"} label={label} value={toInputValue(value, withTime)}
                onChange={event => onChange(fromInputValue(event.target.value))} InputLabelProps={{ shrink: true }}
                error={error} helperText={helperText} disabled={disabled} size={size}
                inputProps={{ min: min ? toInputValue(min, withTime) : undefined, max: maxDate ? toInputValue(maxDate, withTime) : undefined }} />
        );
    }

    const Picker = withTime ? DateTimePicker : DatePicker;
    return (
        <Picker label={label} value={value} onChange={onChange} ampm={false} inputFormat={withTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"}
            shouldDisableDate={shouldDisableDate} minDate={minDate} maxDate={maxDate} disabled={disabled} disablePast={disablePast}
            {...pickerTexts}
            renderInput={params => <TextField {...params} error={error} helperText={helperText} size={size} />} />
    );
}
