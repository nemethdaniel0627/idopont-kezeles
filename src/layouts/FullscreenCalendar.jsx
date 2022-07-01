import React, { useEffect, useState } from "react";
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import ListItem from "../components/ListItem";
import FullscreenEvent from "../components/FullscreenEvent";
import EventDetails from "../components/EventDetails";
import Calendar from "../modules/Calendar";

export default function FullscreenCalendar(props) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthName, setMonthName] = useState("");
    const [month, setMonth] = useState(new Date().getMonth());
    const [day, setDay] = useState(0);
    const [dayName, setDayName] = useState("");
    const [years, setYears] = useState([]);
    const [numberOfDaysArray, setNumberOfDaysArray] = useState([]);
    const [eventDetails, setEventDetails] = useState();
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

        if (props.services) {
            let thisMonthServices = [];
            console.log(props.services);
            props.services.map(service => {
                let serviceStarted = false;
                let regularityNumber = service.regularity.repeatNumber;
                let regularityCycleChange = false;
                let tmpSerivceStart = service.date.start;
                let tmpSerivceEnd = service.date.end;
                const regularityMeasure = service.regularity.measure;
                const intervalLength = Math.abs((tmpSerivceStart.getDate() - tmpSerivceEnd.getDate()))
                numberOfDaysArray.forEach(date => {
                    switch (regularityMeasure) {
                        case "day":
                            if (regularityCycleChange) {
                                if (regularityNumber === (intervalLength + 1) && Calendar.getPrefix(date) !== Calendar.getPrefix(service.regularity.endsOn.date)) {
                                    tmpSerivceStart = date;

                                    tmpSerivceEnd = new Date(year, month, (tmpSerivceStart.getDate() + intervalLength), 0, 0, 0) >= service.regularity.endsOn.date
                                        ? service.regularity.endsOn.date
                                        : new Date(year, month, (tmpSerivceStart.getDate() + intervalLength), 0, 0, 0);

                                    regularityCycleChange = false;
                                    regularityNumber = service.regularity.repeatNumber;
                                }
                                else if (date >= service.regularity.endsOn.date) {
                                    regularityCycleChange = false;
                                    if (Calendar.getPrefix(date) === Calendar.getPrefix(service.regularity.endsOn.date))
                                        thisMonthServices.push({
                                            serviceDate: new Date(date),
                                            name: service.title
                                        })
                                }
                                else {
                                    regularityNumber--;
                                }
                            }
                            if (Calendar.getPrefix(date) === Calendar.getPrefix(tmpSerivceStart)) {
                                serviceStarted = true;
                                thisMonthServices.push({
                                    serviceDate: new Date(date),
                                    name: service.title,
                                    type: "start"
                                })
                            }
                            else if (serviceStarted && Calendar.getPrefix(date) === Calendar.getPrefix(tmpSerivceEnd)) {
                                serviceStarted = false;
                                regularityCycleChange = true;
                                thisMonthServices.push({
                                    serviceDate: new Date(date),
                                    name: service.title,
                                    type: "end"
                                })
                            }
                            else if (serviceStarted) {
                                thisMonthServices.push({
                                    serviceDate: new Date(date),
                                    name: service.title,
                                    type: "middle"
                                })
                            }
                            break;
                        case "week":

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
    }, [props])

    useEffect(() => {
        setNumberOfDaysArray(props.numberOfDays());
    }, [year, month])

    const openDetails = (props) => {
        const tmpEventDetails = document.querySelector(".event-details");

        if (tmpEventDetails) {
            tmpEventDetails.setAttribute("open", "");
            setEventDetails(props);
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
                            if (index < 8 && item.getDate() > 8) notThisMonthDay = true;
                            if (index > 20 && item.getDate() < 8) notThisMonthDay = true;
                            return (
                                <div
                                    key={`fullscreen_${item.getDate()}_${index}`}
                                    id={`fullscreen_${item.getDate()}_${index}`}
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
                                        `${tmpDate !== undefined && item.getDate().toString() === tmpDate.toString()
                                            ? "selected"
                                            : ""
                                        }${notThisMonthDay === true ? "greyDay" : ""}`
                                    }>
                                        {item.getDate()}
                                    </p>
                                    {
                                        services.map((service, index) => {
                                            return (
                                                Calendar.getPrefix(service.serviceDate) === Calendar.getPrefix(item) ?
                                                    <FullscreenEvent
                                                        name={service.name}
                                                        date={service.serviceDate}
                                                        eventStart={service.eventStart}
                                                        eventLength={service.eventLength}
                                                        openDetails={openDetails}
                                                        type={service.type}
                                                    />
                                                    : <React.Fragment />
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
            <EventDetails eventDetails={eventDetails} />
        </div>
    )
}