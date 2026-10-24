import React, { useEffect, useState } from "react";
import axios from "axios";
import Szolgaltatas from "../components/Szolgaltatas";
import Calendar from "../layouts/Calendar";
import FullscreenCalendar from "../layouts/FullscreenCalendar";
import CalendarModule from "../modules/Calendar";
import { placeOccurrences, getGridRange, toOccurrence } from "../modules/occurrences";
import ServiceDetails from "../components/ServiceDetails.jsx";

export default function Home(props) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    // The resource whose calendar is open
    const [selectedService, setSelectedService] = useState({});
    const [occurrences, setOccurrences] = useState([]);
    const [numberOfDaysArray, setNumberOfDaysArray] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthName, setMonthName] = useState("");
    const [month, setMonth] = useState(new Date().getMonth());
    const [day, setDay] = useState(0);
    const [dayName, setDayName] = useState("");
    const [years, setYears] = useState([]);
    const [serviceDetails, setServiceDetails] = useState();
    const monthNames = [
        "Január",
        "Február",
        "Március",
        "Április",
        "Május",
        "Június",
        "Július",
        "Augusztus",
        "Szeptember",
        "Október",
        "November",
        "December",
    ];
    const shortDayNames = getWeekDays('hu-HU');
    const dayNames = [
        "Hétfő",
        "Kedd",
        "Szerda",
        "Csütörtök",
        "Péntek",
        "Szombat",
        "Vasárnap",
    ];
    let date = new Date();
    let calendar = document.querySelector("#calendar");

    function getWeekDays(locale) {
        var baseDate = new Date(Date.UTC(2017, 0, 2)); // just a Monday
        var weekDays = [];
        for (let i = 0; i < 7; i++) {
            let currentDay = baseDate.toLocaleDateString(locale, { weekday: 'long' });
            weekDays.push(
                currentDay[0] === "s" || currentDay[0] === "c"
                    ? capitalizeFirstLetter(currentDay.slice(0, 3))
                    : capitalizeFirstLetter(currentDay.slice(0, 2))
            );
            baseDate.setDate(baseDate.getDate() + 1);
        }
        return weekDays;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // The days of the shown month's grid: whole weeks from Monday, 35 or 42 days
    function getMonthDays() {
        const offset = CalendarModule.getWeekdayIndex(new Date(year, month, 1));
        const length = offset + CalendarModule.getDaysInMonth(year, month) <= 35 ? 35 : 42;
        return Array.from({ length }, (_, i) => ({
            date: new Date(year, month, 1 - offset + i),
            fullscreenServices: [],
            services: [],
        }));
    }

    function setProps(prop, value) {
        switch (prop) {
            case "year":
                setYear(value);
                break;
            case "monthName":
                setMonthName(value);
                break;
            case "month":
                setMonth(value);
                break;
            case "day":
                setDay(value);
                break;
            case "dayName":
                setDayName(value);
                break;
            case "years":
                setYears(value);
                break;
            case "open":
                setCalendarOpen(value);
                break;
            case "serviceDetails":
                setServiceDetails(value);
                break;

            default:
                break;
        }
    }

    function openCalendar(resource) {
        setOccurrences([]);
        setSelectedService(resource);
        setCalendarOpen(true);
    }

    useEffect(() => {
        if (numberOfDaysArray.length !== 0) {
            let dateArr = date.toString().split(" ");

            setYear(Number(dateArr[3]));
            setMonthName(monthNames[date.getMonth()]);
            setMonth(date.getMonth());
            setDay(date.getDate());
            setDayName(dayNames[CalendarModule.getWeekdayIndex(date)]);
            let months = document.getElementById("months");
            if (years.length === 0) {
                for (let i = Number(dateArr[3]); i <= Number(dateArr[3]) + 11; i++) {
                    setYears((prevState) => {
                        return [...prevState, i];
                    });
                }
            }

            // honap beallitas
            if (months) {
                months.childNodes.forEach((li) => {
                    if (li.firstChild.attributes[1].value === (date.getMonth() + 1).toString()) {
                        li.firstChild.className = "selected";
                    }
                });
            }
        }
        //eslint-disable-next-line
    }, [calendar]);

    // Load the open resource's reservations for the shown weeks
    useEffect(() => {
        if (selectedService.id === undefined) return;
        let current = true;
        const { from, to } = getGridRange(getMonthDays());
        axios.get(`/resources/${selectedService.id}/occurrences`, { params: { from: from.toISOString(), to: to.toISOString() } })
            .then(res => {
                if (current) setOccurrences(res.data.result.map(toOccurrence));
            })
            .catch(err => {
                console.error(err);
            });
        // A response for a month or resource that is no longer shown is dropped
        return () => { current = false; };
        // eslint-disable-next-line
    }, [selectedService.id, year, month])

    useEffect(() => {
        setNumberOfDaysArray(placeOccurrences(getMonthDays(), occurrences));
        // eslint-disable-next-line
    }, [occurrences, year, month])


    return (
        <div className="service-grid">
            {
                props.resources.map(item => {
                    return <Szolgaltatas key={`servicekey_${item.id}`} id={`service_${item.id}`} title={item.title} serviceDatas={item} openCalendar={() => openCalendar(item)} />
                })
            }
            <Calendar
                open={calendarOpen}
                numberOfDaysArray={numberOfDaysArray}
                selectedService={selectedService}
                year={year}
                monthName={monthName}
                month={month}
                day={day}
                dayName={dayName}
                years={years}
                monthNames={monthNames}
                dayNames={dayNames}
                shortDayNames={shortDayNames}
                setProps={setProps} />
            <FullscreenCalendar
                numberOfDaysArray={numberOfDaysArray}
                selectedService={selectedService}
                year={year}
                monthName={monthName}
                month={month}
                day={day}
                dayName={dayName}
                years={years}
                monthNames={monthNames}
                dayNames={dayNames}
                shortDayNames={shortDayNames}
                setProps={setProps} />
            <ServiceDetails serviceDetails={serviceDetails} />
        </div>
    )
}
