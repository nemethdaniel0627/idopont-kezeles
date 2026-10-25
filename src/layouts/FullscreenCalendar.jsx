import React, { useEffect, useRef, useState } from "react";
import { Button, IconButton, TextField, ThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { ArrowBackIosNew, ArrowForwardIos, ArrowDropDown } from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
import FullscreenEvent from "../components/FullscreenEvent";
import WeekView from "../components/WeekView";
import Calendar from "../modules/Calendar";
import DatePicker from "@mui/lab/DatePicker";
import { HuLocalizationProvider, pickerTexts } from "../components/HuPickers";
import { appTheme } from "../components/AuthPage";
import { dayStatus, DAY_STATUS_TEXT } from "../modules/bookingRules";
import { rulesParts } from "../modules/reservationText";

const SHORT_MONTHS = ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."];

// The Monday of the date's week
function mondayOf(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - Calendar.getWeekdayIndex(date));
}

// "okt. 26. – nov. 1."
function weekLabel(monday) {
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return `${monday.getFullYear()}. ${SHORT_MONTHS[monday.getMonth()]} ${monday.getDate()}. – ${SHORT_MONTHS[sunday.getMonth()]} ${sunday.getDate()}.`;
}

// The open resource's calendar, over the whole screen: a month view, and a week view where reservations are
// placed within the hours. Days and times that can't be booked are greyed out and can't be clicked.
export default function FullscreenCalendar(props) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthName, setMonthName] = useState(props.monthName);
    const [month, setMonth] = useState(new Date().getMonth());
    const [view, setView] = useState("month");
    const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
    // The shown days with the open resource's reservations (built by Home). During a month change the old
    // month stays until it has faded out and the new month's days have arrived, then both swap together.
    const [numberOfDaysArray, setNumberOfDaysArray] = useState(props.numberOfDaysArray);
    const latest = useRef({});
    latest.current = { days: props.numberOfDaysArray, year: props.year, month: props.month, monthName: props.monthName };
    // True from the end of a fade-out until the new month is shown
    const waitingForMonth = useRef(false);
    const [monthPickerOpen, setMonthPickerOpen] = useState(false);
    const [monthPickerValue, setMonthPickerValue] = useState(new Date(year, month));
    const monthNames = props.monthNames;
    const resource = props.selectedService;
    const rules = resource.id !== undefined ? rulesParts(resource) : [];
    const now = new Date();

    // Opens when a resource is chosen; starts from the month view of today
    useEffect(() => {
        const fullscreen = document.querySelector(".fullscreen-calendar");
        if (!props.open || !fullscreen) return;
        setView("month");
        setWeekStart(mondayOf(new Date()));
        document.body.style.overflow = "hidden";
        fullscreen.setAttribute("open", "");
        fullscreen.classList.remove("hidden");
    }, [props.open]);

    const closeCalendar = () => {
        const fullscreen = document.querySelector(".fullscreen-calendar");
        if (!fullscreen) return;
        document.body.style.overflow = "unset";
        fullscreen.setAttribute("closing", "");
        fullscreen.removeAttribute("open");
        fullscreen.classList.add("hidden");
        props.setProps("open", false);
        fullscreen.addEventListener("animationend", () => fullscreen.removeAttribute("closing"), { once: true });
    }

    const showMonthOf = (date) => {
        props.setProps("year", date.getFullYear());
        props.setProps("month", date.getMonth());
        props.setProps("monthName", monthNames[date.getMonth()]);
    }

    // ‹ and ›: a month in the month view, a week in the week view
    const step = (direction) => {
        if (view === "week") {
            setWeekStart(previous => new Date(previous.getFullYear(), previous.getMonth(), previous.getDate() + 7 * direction));
        } else {
            showMonthOf(new Date(year, month + direction, 1));
        }
    }

    const goToToday = () => {
        if (view === "week") setWeekStart(mondayOf(new Date()));
        else showMonthOf(new Date());
    }

    const changeView = (event, value) => {
        if (value === null) return;
        if (value === "week") {
            // The current week when it is in the shown month, otherwise the month's first week
            const today = new Date();
            setWeekStart(mondayOf(today.getFullYear() === year && today.getMonth() === month ? today : new Date(year, month, 1)));
        } else {
            showMonthOf(weekStart);
        }
        setView(value);
    }

    // A day of the month view opens its week, where the free hours are seen and booked
    const openWeekOf = (date) => {
        setWeekStart(mondayOf(date));
        setView("week");
    }

    // Calls handler when the days' own animation `name` ends (children's animation ends bubble up too)
    const onDaysAnimationEnd = (calendarDays, name, handler) => {
        const listener = (event) => {
            if (event.target === calendarDays && event.animationName === name) {
                calendarDays.removeEventListener("animationend", listener);
                handler();
            }
        };
        calendarDays.addEventListener("animationend", listener);
    };

    // After the fade-out, shows the new month as soon as its days are there
    const showNewMonth = () => {
        const { days, year: newYear, month: newMonth, monthName: newMonthName } = latest.current;
        // The 15th day of the grid is always in the month the grid is for
        const daysAreForNewMonth = days.length > 15
            && days[15].date.getFullYear() === newYear && days[15].date.getMonth() === newMonth;
        if (!waitingForMonth.current || !daysAreForNewMonth) return;

        waitingForMonth.current = false;
        setYear(newYear);
        setMonthName(newMonthName);
        setMonth(newMonth);
        setNumberOfDaysArray(days);
        const calendarDays = document.querySelector(".fullscreen-calendar_days");
        if (calendarDays) {
            calendarDays.classList.add("days-change-in");
            onDaysAnimationEnd(calendarDays, "fullDaysChangeIn", () => {
                calendarDays.classList.remove("days-change-in");
                calendarDays.classList.remove("days-change-out");
            });
        }
    };

    useEffect(() => {
        const calendarDays = document.querySelector(".fullscreen-calendar_days");

        if (calendarDays) {
            calendarDays.classList.remove("days-change-in");
            calendarDays.classList.add("days-change-out");
            onDaysAnimationEnd(calendarDays, "fullDaysChangeOut", () => {
                waitingForMonth.current = true;
                showNewMonth();
            });
        } else {
            // The week view is shown: nothing to fade
            setYear(props.year);
            setMonth(props.month);
            setMonthName(props.monthName);
        }

        setMonthPickerValue(new Date(props.year, props.month));

        // eslint-disable-next-line
    }, [props.year, props.month])

    useEffect(() => {
        const calendarDays = document.querySelector(".fullscreen-calendar_days");
        const fadingOut = calendarDays
            && calendarDays.classList.contains("days-change-out") && !calendarDays.classList.contains("days-change-in");
        if (waitingForMonth.current) {
            showNewMonth();
        } else if (!fadingOut) {
            // Not during a month change (e.g. a resource was opened): show right away
            setNumberOfDaysArray(props.numberOfDaysArray);
        }
        // While fading out the old month stays; the new one is shown when the fade-out ends
        // eslint-disable-next-line
    }, [props.numberOfDaysArray])

    const openDetails = (details) => {
        const eventDetails = document.querySelector(".event-details");
        if (eventDetails) {
            eventDetails.setAttribute("open", "");
            props.setProps("serviceDetails", details);
        }
    }

    // "+ Új foglalás": the first bookable day from what is shown (or from today, if that is later), so the form
    // doesn't open on a closed day
    const bookShown = () => {
        const today = new Date();
        const shownFirst = view === "week" ? weekStart : new Date(year, month, 1);
        let day = shownFirst < today ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : shownFirst;
        for (let i = 0; i < 31 && dayStatus(resource, day, { isAdmin: props.isAdmin }) !== "open"; i++) {
            day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
        }
        props.newBooking(day);
    }

    const monthPickerChange = (value) => {
        setMonthPickerOpen(false);
        showMonthOf(value);
    }

    return (
        <div className="fullscreen-calendar hidden" role="dialog" aria-label={`${resource.title || ""} naptára`}>
            <div className="fullscreen-calendar_right-col">
                <div className="fullscreen-calendar_title-row">
                    <h2 className="fullscreen-calendar_resource-title">{resource.title}</h2>
                    {/* Phones: the close button sits in the panel's corner, where people look for it */}
                    <IconButton onClick={closeCalendar} className="fullscreen-calendar_close-top" aria-label="Bezárás">
                        <CloseIcon />
                    </IconButton>
                </div>
                {resource.customFields && resource.customFields.length !== 0
                    ? <ul className="fullscreen-calendar_resource-fields">
                        {resource.customFields.map((field, index) =>
                            <li key={index}><span>{field.label}</span>{field.value}</li>
                        )}
                    </ul>
                    : <></>}
                <section className="fullscreen-calendar_rules" aria-label="Foglalási szabályok">
                    <h3>Foglalási szabályok</h3>
                    {rules.length !== 0
                        ? <dl>
                            {rules.map(rule => <div key={rule.label}><dt>{rule.label}</dt><dd>{rule.value}</dd></div>)}
                        </dl>
                        : <p>Bármikor foglalható.</p>}
                </section>
                <p className="fullscreen-calendar_hint-short">
                    {view === "month" ? "Koppints egy napra a hetéért." : "Koppints egy szabad időpontra a foglaláshoz."}
                </p>
                <p className="fullscreen-calendar_hint">
                    {view === "month"
                        ? "Kattints egy napra: megnyílik a hete, ahol egy szabad időpontra kattintva foglalhatsz."
                        : "Kattints egy szabad időpontra, vagy húzd végig rajta az egeret a foglalás teljes idején. Egy foglalásra kattintva látod a részleteit."}
                </p>
            </div>
            <div className="fullscreen-calendar_left-col">
                <div className="fullscreen-calendar_header">
                    <div className="fullscreen-calendar_header_nav">
                        <Tooltip title={view === "week" ? "Előző hét" : "Előző hónap"}>
                            <IconButton size="large" className="fullscreen-calendar_month-switch" onClick={() => step(-1)}
                                aria-label={view === "week" ? "Előző hét" : "Előző hónap"}>
                                <ArrowBackIosNew />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={view === "week" ? "Következő hét" : "Következő hónap"}>
                            <IconButton size="large" className="fullscreen-calendar_month-switch" onClick={() => step(1)}
                                aria-label={view === "week" ? "Következő hét" : "Következő hónap"}>
                                <ArrowForwardIos />
                            </IconButton>
                        </Tooltip>
                        {view === "month"
                            ? <span className="fullscreen-calendar_header_month-picker">
                                <button type="button" onClick={() => setMonthPickerOpen(true)} aria-label={`${year}. ${monthName} – hónap választása`}>
                                    {year}. {monthName}
                                    <ArrowDropDown />
                                </button>
                                <HuLocalizationProvider>
                                    <DatePicker
                                        {...pickerTexts}
                                        toolbarTitle="Hónap választása"
                                        value={monthPickerValue}
                                        onChange={monthPickerChange}
                                        onClose={() => setMonthPickerOpen(false)}
                                        views={['year', 'month']}
                                        openTo={'month'}
                                        minDate={new Date(year - 2, 1, 1)}
                                        maxDate={new Date(year + 12, 12, 31)}
                                        open={monthPickerOpen}
                                        renderInput={(params) => <TextField {...params} />}
                                    />
                                </HuLocalizationProvider>
                            </span>
                            : <span className="fullscreen-calendar_header_week">{weekLabel(weekStart)}</span>}
                    </div>
                    <ThemeProvider theme={appTheme}>
                        <div className="fullscreen-calendar_header_actions">
                            <Button size="small" onClick={goToToday} className="fullscreen-calendar_today">Ma</Button>
                            <ToggleButtonGroup exclusive size="small" value={view} onChange={changeView} aria-label="Nézet">
                                <ToggleButton value="month">Hónap</ToggleButton>
                                <ToggleButton value="week">Hét</ToggleButton>
                            </ToggleButtonGroup>
                            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={bookShown}
                                className="fullscreen-calendar_new-booking" aria-label="Új foglalás">
                                <span className="fullscreen-calendar_new-booking_text">Új foglalás</span>
                            </Button>
                            <Tooltip title="Bezárás">
                                <IconButton size="large" onClick={closeCalendar} className="fullscreen-calendar_close" aria-label="Bezárás">
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </ThemeProvider>
                </div>
                <div className="fullscreen-calendar_body">
                {view === "week"
                    ? <WeekView resource={resource} weekStart={weekStart} reloadKey={props.reloadKey} isAdmin={props.isAdmin}
                        onSlotClick={props.newBooking} onEventClick={openDetails} />
                    : <div className="fullscreen-calendar_days">
                        {numberOfDaysArray.map((item, index) => {
                            const notThisMonthDay = item.date.getMonth() !== month;
                            const isToday = Calendar.getPrefix(item.date) === Calendar.getPrefix(now);
                            // Days that can't be booked are greyed out; the others open their week
                            const status = resource.id !== undefined ? dayStatus(resource, item.date, { isAdmin: props.isAdmin, now }) : "open";
                            const open = status === "open";
                            return (
                                <div
                                    key={`fullscreen_${item.date.getDate()}_${index}`}
                                    className={`fullscreen-calendar_days_day${open ? " bookable" : ` unavailable ${status}`}`}
                                    onClick={() => openWeekOf(item.date)}
                                    title={open ? "A hét megnyitása" : DAY_STATUS_TEXT[status]}
                                >
                                    {index < 7 ? <h3>{props.shortDayNames[index]}</h3> : <></>}
                                    <p className={`fullscreen-calendar_date${isToday ? " today" : ""}${notThisMonthDay ? " other-month" : ""}${item.date.getDate() === 1 ? " no-ar" : ""}`}>
                                        {item.date.getDate() === 1 ? `${monthNames[item.date.getMonth()].slice(0, (item.date.getMonth() === 8 ? 5 : 3))}. ${item.date.getDate()}.` : item.date.getDate()}
                                    </p>
                                    {item.fullscreenServices.map((sameDate, sameIndex) =>
                                        Calendar.getPrefix(sameDate.serviceDate) === Calendar.getPrefix(item.date)
                                            ? <FullscreenEvent
                                                key={`${sameDate.name}_${index}_${sameIndex}`}
                                                name={sameDate.name}
                                                serviceId={sameDate.id}
                                                serviceDate={sameDate.serviceDate}
                                                start={sameDate.start}
                                                end={sameDate.end}
                                                openDetails={openDetails}
                                                type={sameDate.type}
                                                allDay={sameDate.allDay}
                                                description={sameDate.description}
                                                repeating={sameDate.repeating}
                                                mine={sameDate.mine}
                                            />
                                            : <React.Fragment key={`${item.date}_${index}__${sameIndex}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>}
                </div>
            </div>
        </div>
    )
}
