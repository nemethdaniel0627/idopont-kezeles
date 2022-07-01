import React, { useEffect, useState } from "react"
// import CalendarJS from "../modules/Calendar"
import Szolgaltatas from "../components/Szolgaltatas"
import Calendar from "../layouts/Calendar"
import FullscreenCalendar from "../layouts/FullscreenCalendar"

export default function Home(props) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [selectedService, setSelectedService] = useState({});
    const [numberOfDaysArray, setNumberOfDaysArray] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthName, setMonthName] = useState("");
    const [month, setMonth] = useState(new Date().getMonth());
    const [day, setDay] = useState(0);
    const [dayName, setDayName] = useState("");
    const [years, setYears] = useState([]);
    const [services, setServices] = useState([]);
    //     { eventStart: "0:30", eventLength: 90, eventDate: new Date(), name: "Esemény 1" },
    //     { eventStart: "3:0", eventLength: 120, eventDate: new Date(), name: "Esemény 2" }
    // ])
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

    function numberOfDays() {
        let tmpMonth = month;


        let localdate = new Date(year, tmpMonth);
        let pastMonth = new Date(year, (tmpMonth - 1));
        let firstDay = new Date(Number(year), Number(month), 1).getDay() - 1;
        if (firstDay === -1) {
            firstDay = 6;
        }

        let numberOfdays;
        let numberOfdaysLastMonth;


        numberOfdays = setMonthLength(localdate);
        numberOfdaysLastMonth = setMonthLength(pastMonth);


        // let localDays = Array.from({ length: (numberOfdays - (1 - firstDay)) + 1 }, (_, i) => (1 - firstDay) + i);
        let localDays = [];

        for (let i = numberOfdaysLastMonth; i > numberOfdaysLastMonth - firstDay; i--) {
            localDays.push(new Date(year, (tmpMonth - 1), i));
        }

        localDays.reverse();

        for (var i = 1; i <= numberOfdays; i += 1) {
            localDays.push(new Date(year, tmpMonth, i));
        }
        let j = 1;
        while (localDays.length % 5 !== 0) {
            localDays.push(new Date(year, (tmpMonth + 1), j));
            j++;
        }


        return localDays;
    }

    function setMonthLength(month) {
        let numberOfdays;
        const BigMonths = [1, 3, 5, 7, 8, 10, 12];
        const SmallMonths = [4, 6, 9, 11];

        if (BigMonths.includes(month.getMonth() + 1)) numberOfdays = 31;
        else if (SmallMonths.includes(month.getMonth() + 1)) numberOfdays = 30;
        else if (leapyear(month.getFullYear())) numberOfdays = 29;
        else numberOfdays = 28;

        return numberOfdays;
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

            default:
                break;
        }
    }

    function openCalendar(service) {
        setCalendarOpen(true);
        setSelectedService(service);
    }

    useEffect(() => {
        // setNumberOfDaysArray(numberOfDays());
        if (numberOfDaysArray.length !== 0) {
            let dateArr = date.toString().split(" ");

            let setday = dateArr[2];

            setYear(Number(dateArr[3]));
            setMonthName(monthNames[date.getMonth()]);
            setMonth(date.getMonth());
            setDay(date.getDate());
            setDayName(dayNames[date.getDay() !== 0 ? date.getDay() - 1 : 6]);
            let months = document.getElementById("months");
            let days = document.getElementById("days");
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

            // nap beállitasa
            if (days) {
                days.childNodes.forEach((li, index) => {
                    if (index !== days.childNodes.length - 1 && li.firstChild.attributes[1].value === setday) {
                        li.firstChild.className = "selected";
                    }
                });
            }

        }
        // console.timeLog();
        //eslint-disable-next-line
    }, [calendar]);

    useEffect(() => {
        setNumberOfDaysArray(numberOfDays());
        setServices(props.services)
    }, [])

    return (
        <div className="service-grid">
            {
                props.services.map(item => {
                    return <Szolgaltatas key={`servicekey_${item.id}`} id={`service_${item.id}`} title={item.title} serviceDatas={item} openCalendar={() => openCalendar(item)} />
                })
            }
            <Szolgaltatas title="Tárgyaló foglalás" openCalendar={openCalendar} />
            <Calendar
                open={calendarOpen}
                numberOfDaysArray={numberOfDaysArray}
                numberOfDays={numberOfDays}
                service={selectedService}
                year={year}
                monthName={monthName}
                month={month}
                day={day}
                dayName={dayName}
                years={years}
                monthNames={monthNames}
                dayNames={dayNames}
                shortDayNames={shortDayNames}
                setProps={setProps}
                services={services} />
            <FullscreenCalendar
                numberOfDaysArray={numberOfDaysArray}
                numberOfDays={numberOfDays}
                service={selectedService}
                year={year}
                monthName={monthName}
                month={month}
                day={day}
                dayName={dayName}
                years={years}
                monthNames={monthNames}
                dayNames={dayNames}
                shortDayNames={shortDayNames}
                setProps={setProps}
                services={services} />
        </div>
    )
}

function leapyear(year) {
    return year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
}