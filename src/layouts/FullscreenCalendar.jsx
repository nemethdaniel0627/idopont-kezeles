import React, { useEffect, useRef, useState } from "react";
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { IconButton, TextField } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
import ListItem from "../components/ListItem";
import FullscreenEvent from "../components/FullscreenEvent";
import Calendar from "../modules/Calendar";
import DatePicker from "@mui/lab/DatePicker";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import AdapterDateFns from '@mui/lab/AdapterDateFns';

export default function FullscreenCalendar(props) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthName, setMonthName] = useState("");
    const [month, setMonth] = useState(new Date().getMonth());
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
    let isDialogClick = false;


    const exitFullScreen = () => {
        const fullscreen = document.querySelector(".fullscreen-calendar");
        const calendar = document.querySelector("#calendar");
        const body = document.querySelector("body");

        if (fullscreen && calendar && body) {
            body.style.overflow = "unset";
            fullscreen.setAttribute("closing", "");
            fullscreen.removeAttribute("open");
            calendar.setAttribute("closing", "");
            calendar.removeAttribute("open");
            fullscreen.classList.add("hidden");
            fullscreen.addEventListener("animationend", () => {
                fullscreen.removeAttribute("closing");
                calendar.removeAttribute("closing");
            }, { once: true });

        }
    }

    const closeCalendar = () => {
        const fullscreen = document.querySelector(".fullscreen-calendar");
        const calendar = document.querySelector("#calendar");
        const body = document.querySelector("body");

        if (fullscreen && calendar && body) {
            body.style.overflow = "unset";
            fullscreen.setAttribute("closing", "");
            fullscreen.removeAttribute("open");
            calendar.setAttribute("closing", "");
            calendar.removeAttribute("open");
            fullscreen.classList.add("hidden");
            props.setProps("open", false);
            fullscreen.addEventListener("animationend", () => {
                fullscreen.removeAttribute("closing");
                calendar.removeAttribute("closing");
            }, { once: true });

        }
    }

    const monthChange = (monthEvent) => {
        let tmpMonthNumber;
        switch (monthEvent.target.id) {
            case "prev":
                tmpMonthNumber = month - 1;
                break;

            case "next":
                tmpMonthNumber = month + 1;
                break;

            default:
                break;
        }
        let newMonth = new Date(
            year,
            Number(tmpMonthNumber),
            1
        );
        props.setProps("month", newMonth.getMonth());
        props.setProps("monthName", monthNames[newMonth.getMonth()]);



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

    useEffect(() => {
        const calendarDays = document.querySelector(".fullscreen-calendar_days");
        if (props) {
            setYear(props.year);
        }
        if (props.monthName && props.month && !calendarDays.classList.contains("days-change-out")) {
            setMonthName(props.monthName);
            setMonth(props.month);
            setMonthPickerValue(new Date(props.year, props.month));
        }
    }, [props])

    // useEffect(() => {
    //     console.log("full");
    //     setNumberOfDaysArray(props.numberOfDays());
    // }, [])

    const openDetails = (passedProps) => {
        const tmpEventDetails = document.querySelector(".event-details");

        if (tmpEventDetails) {
            tmpEventDetails.setAttribute("open", "");
            props.setProps("serviceDetails", passedProps);
            // setServiceDetails(passedProps);
        }
    }

    const checkClick = () => {
        if (isDialogClick === true) {
            isDialogClick = false;
        }
        else {
            setMonthPickerOpen(false);
        }
    }

    const openMonthPicker = () => {
        isDialogClick = true;
        if (monthPickerOpen === false)
            setMonthPickerOpen(true);
    }

    const monthPickerChange = (value) => {
        props.setProps('year', value.getFullYear());
        props.setProps('month', value.getMonth());
        props.setProps("monthName", monthNames[value.getMonth()]);
    }

    return (
        <div onClick={checkClick} className="fullscreen-calendar hidden">
            <div className="fullscreen-calendar_right-col">
                <h2 className="fullscreen-calendar_resource-title">{props.selectedService.title}</h2>
            </div>
            <div className="fullscreen-calendar_left-col">
                <h2 className="fullscreen-calendar_header">
                    <div>
                        <IconButton size="large" id="prev" className="fullscreen-calendar_month-switch" onClick={monthChange}>
                            <ArrowBackIosNew />
                        </IconButton>
                        <IconButton size="large" id="next" className="fullscreen-calendar_month-switch" onClick={monthChange}>
                            <ArrowForwardIos />
                        </IconButton>
                        <span className="fullscreen-calendar_header_month-picker" onClick={openMonthPicker}>
                            {year}. {monthName}
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    value={monthPickerValue}
                                    onChange={(newValue) => {
                                        monthPickerChange(newValue);
                                    }}
                                    views={['year', 'month']}
                                    openTo={'month'}
                                    minDate={new Date(year - 2, 1, 1)}
                                    maxDate={new Date(year + 12, 12, 31)}
                                    open={monthPickerOpen}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                        </span>

                    </div>
                    <div>
                        <IconButton size="large" onClick={exitFullScreen} className="fullscreen-calendar_exit-fullscreen">
                            <FullscreenExitIcon />
                        </IconButton>
                        <IconButton size="large" onClick={closeCalendar} className="fullscreen-calendar_exit-fullscreen">
                            <CloseIcon />
                        </IconButton>
                    </div>
                </h2>
                <div className="fullscreen-calendar_days">
                    {
                        numberOfDaysArray.map((item, index) => {

                            const tmpDate = month === new Date().getMonth() ? new Date().getDate() : undefined;

                            let notThisMonthDay = false;
                            if (index < 8 && item.date.getDate() > 8) notThisMonthDay = true;
                            if (index > 20 && item.date.getDate() < 8) notThisMonthDay = true;
                            return (
                                <div
                                    key={`fullscreen_${item.date.getDate()}_${index}`}
                                    id={`fullscreen_${item.date.getDate()}_${index}`}
                                    className="fullscreen-calendar_days_day"
                                >
                                    <h3>
                                        {
                                            index < 7
                                                ?
                                                props.shortDayNames.map((header, dayIndex) => {
                                                    return index === dayIndex
                                                        ? <ListItem key={`full_${header}_${index}`} itemContent={header} datavalue="1" isWeekDay={true} />
                                                        : <React.Fragment key={`full_${header}_${index}_${dayIndex}`}></React.Fragment>
                                                })
                                                : <React.Fragment key={`full_h3_${index}`}></React.Fragment>
                                        }
                                    </h3>
                                    <p className={
                                        `${tmpDate !== undefined && item.date.getDate().toString() === tmpDate.toString()
                                            ? "selected"
                                            : ""
                                        }${notThisMonthDay === true ? "greyDay" : ""} ${item.date.getDate() === 1 ? " no-ar" : ""}`
                                    }>
                                        {item.date.getDate() === 1 ? `${monthNames[item.date.getMonth()].slice(0, (item.date.getMonth() === 8 ? 5 : 3))}. ${item.date.getDate()}.` : item.date.getDate()}
                                    </p>
                                    {

                                        item.fullscreenServices.length !== 0 ?
                                            item.fullscreenServices.map((sameDate, sameIndex) => {
                                                return Calendar.getPrefix(sameDate.serviceDate) === Calendar.getPrefix(item.date) ?
                                                    <FullscreenEvent
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
                                                    />
                                                    : <React.Fragment key={`${item.date}_${index}__${sameIndex}`} />
                                            })
                                            : <React.Fragment key={`${item.date}_${index}`} />

                                    }
                                    {/* {item === 1
                                        ? <FullscreenEvent
                                            name={`Próba_${item}_${index}`}
                                            openDetails={openDetails} />
                                        : <></>} */}
                                </div>
                            )
                        })
                    }
                </div>
            </div>
            {/* <ServiceDetails serviceDetails={serviceDetails} /> */}
        </div>
    )
}