import React, { useEffect, useState } from "react";
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import ListItem from "../components/ListItem";
import FullscreenEvent from "../components/FullscreenEvent";
import ServiceDetails from "../components/ServiceDetails";
import Calendar from "../modules/Calendar";

export default function FullscreenCalendar(props) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthName, setMonthName] = useState("");
    const [month, setMonth] = useState(new Date().getMonth());
    const [day, setDay] = useState(0);
    const [dayName, setDayName] = useState("");
    const [years, setYears] = useState([]);
    const [numberOfDaysArray, setNumberOfDaysArray] = useState([]);
    const [serviceDetails, setServiceDetails] = useState();
    const [services, setServices] = useState([]);
    const monthNames = props.monthNames;
    const dayNames = props.dayNames;


    const exitFullScreen = () => {
        const fullscreen = document.querySelector(".fullscreen-calendar");
        const calendar = document.querySelector("#calendar");

        if (fullscreen && calendar) {
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

    const monthChange = (event) => {
        const calendarDays = document.querySelector(".fullscreen-calendar_days");

        if (calendarDays) {
            calendarDays.classList.add("days-change");
            calendarDays.addEventListener("animationend", () => {
                calendarDays.classList.remove("days-change");
            }, { once: true })
            calendarDays.addEventListener("animationstart", () => {
                let tmpMonthNumber;
                switch (event.target.id) {
                    case "prev":
                        tmpMonthNumber = month - 1;
                        break;

                    case "next":
                        tmpMonthNumber = month + 1;
                        break;

                    default:
                        break;
                }
                let pastMonth = new Date(year, month, day);
                let newMonth = new Date(
                    year,
                    Number(tmpMonthNumber),
                    1
                );
                let thisMonth = new Date();
                setMonthName(monthNames[newMonth.getMonth()]);
                props.setProps("monthName", monthNames[newMonth.getMonth()]);
                setMonth(newMonth.getMonth());
                props.setProps("month", newMonth.getMonth());
            }, { once: true })
        }

    }

    useEffect(() => {
        if (props.year && props.monthName && props.month && props.day && props.dayName && props.years) {
            setYear(props.year);
            setMonthName(props.monthName);
            setMonth(props.month);
            setDay(props.day);
            setDayName(props.dayName);
            setYears(props.years);

        }

    }, [props])

    useEffect(() => {
        setNumberOfDaysArray(props.numberOfDays());
        // eslint-disable-next-line
    }, [year, month])

    useEffect(() => {
        if (props.services) {
            let thisMonthServices = [];
            props.services.map(service => {
                let serviceStarted = false;
                let regularityNumber = service.regularity.repeatNumber;
                let regularityCycleChange = false;
                let tmpSerivceStart = service.date.start;
                let tmpSerivceEnd = service.date.end;
                const tmpSerivceStartTime = [service.date.start.getHours(), service.date.start.getMinutes()];
                const tmpSerivceEndTime = [service.date.end.getHours(), service.date.end.getMinutes()];
                const allDay = service.allDay;
                const regularityMeasure = service.regularity.measure;
                const regularityEndType = service.regularity.endsOn.type;
                const intervalLength = Math.abs((tmpSerivceStart.getDate() - tmpSerivceEnd.getDate()))
                let weekDayOccurred = false;
                let occurrenceCounter = 0;
                numberOfDaysArray.forEach(date => {
                    switch (regularityMeasure) {
                        case "day":
                            if (regularityCycleChange) {
                                if (regularityNumber === (intervalLength + 1) && Calendar.getPrefix(date) !== Calendar.getPrefix(service.regularity.endsOn.date)) {
                                    tmpSerivceStart = date;

                                    switch (regularityEndType) {
                                        case "onDate":
                                            tmpSerivceEnd = new Date(props.year, props.month, (tmpSerivceStart.getDate() + intervalLength), 0, 0, 0) >= service.regularity.endsOn.date
                                                ? service.regularity.endsOn.date
                                                : new Date(props.year, props.month, (tmpSerivceStart.getDate() + intervalLength), 0, 0, 0);
                                            break;

                                        case "never":
                                            tmpSerivceEnd = numberOfDaysArray[numberOfDaysArray.length - 1];
                                            break;

                                        default:
                                            break;
                                    }

                                    regularityCycleChange = false;
                                    regularityNumber = service.regularity.repeatNumber;
                                }
                                else if (date >= service.regularity.endsOn.date) {
                                    regularityCycleChange = false;
                                    if (Calendar.getPrefix(date) === Calendar.getPrefix(service.regularity.endsOn.date) && intervalLength > 0)
                                        if ((regularityEndType === "occurrence" && thisMonthServices.length < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                            thisMonthServices.push({
                                                serviceDate: new Date(date),
                                                name: service.title,
                                                type: intervalLength > 0 ? "start" : "not",
                                                serviceDefiner: occurrenceCounter,
                                                start: tmpSerivceStart,
                                                end: tmpSerivceEnd,
                                                allDay: allDay
                                            });
                                        }
                                }
                                else {
                                    regularityNumber--;
                                }
                            }

                            if (Calendar.getPrefix(date) === Calendar.getPrefix(tmpSerivceStart)) {
                                serviceStarted = true;
                                if ((regularityEndType === "occurrence" && thisMonthServices.length < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                    thisMonthServices.push({
                                        serviceDate: new Date(date),
                                        name: service.title,
                                        type: intervalLength > 0 ? "start" : "not",
                                        serviceDefiner: occurrenceCounter,
                                        start: tmpSerivceStart,
                                        end: tmpSerivceEnd,
                                        allDay: allDay
                                    })
                                }
                                if (intervalLength === 0) {
                                    serviceStarted = false;
                                    regularityCycleChange = true;
                                }
                            }
                            else if (serviceStarted && Calendar.getPrefix(date) === Calendar.getPrefix(tmpSerivceEnd)) {
                                serviceStarted = false;
                                regularityCycleChange = true;
                                if ((regularityEndType === "occurrence" && thisMonthServices.length < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                    thisMonthServices.push({
                                        serviceDate: new Date(date),
                                        name: service.title,
                                        type: "end",
                                        serviceDefiner: occurrenceCounter,
                                        start: tmpSerivceStart,
                                        end: tmpSerivceEnd,
                                        allDay: allDay
                                    })
                                }
                            }
                            else if (serviceStarted) {
                                if ((regularityEndType === "occurrence" && thisMonthServices.length < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                    thisMonthServices.push({
                                        serviceDate: new Date(date),
                                        name: service.title,
                                        type: "middle",
                                        serviceDefiner: occurrenceCounter,
                                        start: tmpSerivceStart,
                                        end: tmpSerivceEnd,
                                        allDay: allDay
                                    })
                                }
                            }
                            break;
                        case "week":
                            const tmpDayName = props.getDayName(date, "hu-HU");
                            const selectedDays = service.regularity.days;
                            let skipMiddleDay = false;
                            if (selectedDays.includes(tmpDayName) && date > tmpSerivceStart) {
                                if ((regularityEndType === "occurrence" && occurrenceCounter < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                    tmpSerivceStart = date;
                                    tmpSerivceStart.setHours(tmpSerivceStartTime[0], tmpSerivceStartTime[1]);
                                    const tmpCompareDate = new Date(date);
                                    const addedDate = tmpCompareDate.getDate() + intervalLength;
                                    const changedCompareDate = tmpCompareDate.setDate(addedDate);

                                    switch (regularityEndType) {
                                        case "onDate":
                                            tmpSerivceEnd = new Date(changedCompareDate) >= service.regularity.endsOn.date
                                                ? service.regularity.endsOn.date
                                                : new Date(changedCompareDate);
                                            break;

                                        case "occurrence":
                                            tmpSerivceEnd = new Date(changedCompareDate);
                                            break;

                                        case "never":
                                            tmpSerivceEnd = new Date(changedCompareDate) >= numberOfDaysArray[numberOfDaysArray.length - 1]
                                                ? numberOfDaysArray[numberOfDaysArray.length - 1]
                                                : new Date(changedCompareDate);
                                            break;

                                        default:
                                            break;
                                    }
                                    tmpSerivceEnd.setHours(tmpSerivceEndTime[0], tmpSerivceEndTime[1]);
                                    if (tmpSerivceEnd !== service.regularity.endsOn.date) {
                                        thisMonthServices.push({
                                            serviceDate: new Date(date),
                                            name: service.title,
                                            type: intervalLength > 0 ? "start" : "not",
                                            serviceDefiner: occurrenceCounter,
                                            start: tmpSerivceStart,
                                            end: tmpSerivceEnd,
                                            allDay: allDay
                                        })
                                        serviceStarted = true;
                                        skipMiddleDay = true;
                                        if (intervalLength === 0) weekDayOccurred = true;
                                    }
                                }
                            }
                            if (serviceStarted && Calendar.getPrefix(date) === Calendar.getPrefix(tmpSerivceEnd) && intervalLength > 0) {
                                serviceStarted = false;
                                regularityCycleChange = true;
                                if ((regularityEndType === "occurrence" && occurrenceCounter < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                    thisMonthServices.push({
                                        serviceDate: new Date(date),
                                        name: service.title,
                                        type: "end",
                                        serviceDefiner: occurrenceCounter,
                                        start: tmpSerivceStart,
                                        end: tmpSerivceEnd,
                                        allDay: allDay
                                    })
                                }
                                weekDayOccurred = true;
                            }
                            else if (serviceStarted && !skipMiddleDay && intervalLength > 0) {
                                if ((regularityEndType === "occurrence" && occurrenceCounter < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                    thisMonthServices.push({
                                        serviceDate: new Date(date),
                                        name: service.title,
                                        type: "middle",
                                        serviceDefiner: occurrenceCounter,
                                        start: tmpSerivceStart,
                                        end: tmpSerivceEnd,
                                        allDay: allDay
                                    })
                                }
                                skipMiddleDay = false;
                            }

                            if (weekDayOccurred) {
                                occurrenceCounter++;
                                weekDayOccurred = false;
                            }
                            break;
                        case "month":

                            break;
                        case "year":

                            break;

                        default:
                            break;
                    }
                });
            })
            console.log(thisMonthServices.sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate)));

            setServices(thisMonthServices.sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate)));
        }
        // eslint-disable-next-line
    }, [numberOfDaysArray, props.service])

    const openDetails = (props) => {
        const tmpEventDetails = document.querySelector(".event-details");

        if (tmpEventDetails) {
            tmpEventDetails.setAttribute("open", "");
            setServiceDetails(props);
        }
    }

    return (
        <div className="fullscreen-calendar hidden">
            <div className="fullscreen-calendar_right-col"></div>
            <div className="fullscreen-calendar_left-col">
                <h2 className="fullscreen-calendar_header">
                    <div>
                        <IconButton size="large" id="prev" className="fullscreen-calendar_month-switch" onClick={monthChange}>
                            <ArrowBackIosNew />
                        </IconButton>
                        <IconButton size="large" id="next" className="fullscreen-calendar_month-switch" onClick={monthChange}>
                            <ArrowForwardIos />
                        </IconButton>
                        {year}. {monthName}
                    </div>
                    <IconButton size="large" onClick={exitFullScreen} className="fullscreen-calendar_exit-fullscreen">
                        <FullscreenExitIcon />
                    </IconButton>
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
                                        services.map((service, index) => {
                                            return (
                                                Calendar.getPrefix(service.serviceDate) === Calendar.getPrefix(item) ?
                                                    <FullscreenEvent
                                                        key={`${service.name}_${index}`}
                                                        name={service.name}
                                                        date={service.serviceDate}
                                                        serviceStart={service.start}
                                                        serviceEnd={service.end}
                                                        openDetails={openDetails}
                                                        type={service.type}
                                                        serviceDefiner={service.serviceDefiner}
                                                        allDay={service.allDay}
                                                    />
                                                    : <React.Fragment key={`${service.name}_${index}`} />
                                            )
                                        })
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
            <ServiceDetails serviceDetails={serviceDetails} />
        </div>
    )
}