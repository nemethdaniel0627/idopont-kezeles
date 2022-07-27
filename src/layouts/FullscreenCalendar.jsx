import React, { useEffect, useState } from "react";
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { Checkbox, FormControlLabel, FormGroup, IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos, Visibility, VisibilityOff } from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
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
    const [selectedService, setSelectedService] = useState({});
    const [showOthers, setShowOthers] = useState();
    const monthNames = props.monthNames;
    const dayNames = props.dayNames;


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
        let pastMonth = new Date(year, month, day);
        let newMonth = new Date(
            year,
            Number(tmpMonthNumber),
            1
        );
        props.setProps("month", newMonth.getMonth());
        props.setProps("monthName", monthNames[newMonth.getMonth()]);



    }

    useEffect(() => {
        const calendarDays = document.querySelector(".fullscreen-calendar_days");

        if (calendarDays) {
            calendarDays.classList.add("days-change-out");
            calendarDays.addEventListener("animationend", (event) => {
                if (event.animationName === "fullDaysChangeOut") {
                    setMonthName(props.monthName);
                    setMonth(props.month);
                    setNumberOfDaysArray(props.numberOfDays());
                    calendarDays.classList.add("days-change-in");
                }
            }, { once: true })
            calendarDays.addEventListener("animationend", (event) => {
                if (event.animationName === "fullDaysChangeIn") {
                    calendarDays.classList.remove("days-change-in");
                    calendarDays.classList.remove("days-change-out");
                }
            })
        }

        // eslint-disable-next-line
    }, [props.year, props.month])

    useEffect(() => {
        const calendarDays = document.querySelector(".fullscreen-calendar_days");
        if (props) {
            setYear(props.year);
            setDay(props.day);
            setDayName(props.dayName);
            setYears(props.years);
            setSelectedService(props.selectedService);
            setShowOthers(props.showOtherss);
        }
        if (props.monthName && props.month && !calendarDays.classList.contains("days-change-out")) {
            setMonthName(props.monthName);
            setMonth(props.month);
        }
    }, [props])



    useEffect(() => {
        // eslint-disable-next-line
    }, [numberOfDaysArray, props.service])

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

    const changeServiceVisibility = () => {
        props.setProps("showOthers", !props.showOthers);
    }

    return (
        <div className="fullscreen-calendar hidden">
            <div className="fullscreen-calendar_right-col">
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Checkbox icon={<VisibilityOff />} checkedIcon={<Visibility />} checked={props.showOthers} onChange={changeServiceVisibility} />
                        }
                        label="Összes szolgáltatás látszódjon?"
                    />
                </FormGroup>
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
                        {year}. {monthName}
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
                                                return (sameDate.id === selectedService.id || props.showOthers === true) && Calendar.getPrefix(sameDate.serviceDate) === Calendar.getPrefix(item.date) ?
                                                    <FullscreenEvent
                                                        key={`${sameDate.name}_${index}_${sameIndex}`}
                                                        name={sameDate.name}
                                                        serviceId={sameDate.id}
                                                        serviceDate={sameDate.serviceDate}
                                                        start={sameDate.start}
                                                        end={sameDate.end}
                                                        openDetails={openDetails}
                                                        type={sameDate.type}
                                                        serviceDefiner={sameDate.serviceDefiner}
                                                        allDay={sameDate.allDay}
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