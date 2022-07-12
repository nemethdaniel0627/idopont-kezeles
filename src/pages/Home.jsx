import React, { useEffect, useState } from "react"
import Szolgaltatas from "../components/Szolgaltatas"
import Calendar from "../layouts/Calendar"
import FullscreenCalendar from "../layouts/FullscreenCalendar"
import CalendarModule from "../modules/Calendar"
import { intervalToDuration } from "date-fns"

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

    function getDayName(date, locale) {
        return date.toLocaleDateString(locale, { weekday: 'long' });
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
            localDays.push({ date: new Date(year, (tmpMonth - 1), i) });
        }
        localDays.reverse();

        for (var i = 1; i <= numberOfdays; i += 1) {
            localDays.push({ date: new Date(year, tmpMonth, i) });
        }

        let j = 1;
        while ((localDays.length > 35 && localDays.length !== 42) || (localDays.length < 35)) {
            localDays.push({ date: new Date(year, (tmpMonth + 1), j) });
            j++;
        }

        let thisMonthServices = [];
        let thisMonthServicesFullscreen = [];
        props.services.map(service => {
            let serviceStarted = false;
            let regularityNumber = service.regularity.repeatNumber;
            let regularityCycleChange = false;
            let tmpSerivceStart = service.date.start;
            let tmpSerivceEnd = service.date.end;
            const tmpSerivceStartTime = [service.date.start.getHours(), service.date.start.getMinutes()];
            const tmpSerivceEndTime = [service.date.end.getHours(), service.date.end.getMinutes()];
            const allDay = service.allDay;
            let serviceDuration = intervalToDuration({
                start: tmpSerivceStart,
                end: tmpSerivceEnd
            })
            serviceDuration = CalendarModule.convertDuration(serviceDuration);
            serviceDuration += allDay ? 1440 : 0;
            let serviceDurationCounter = serviceDuration;
            const regularityMeasure = service.regularity.measure;
            const regularityEndType = service.regularity.endsOn.type;
            const intervalLength = Math.abs((tmpSerivceStart.getDate() - tmpSerivceEnd.getDate()))
            let weekDayOccurred = false;
            let occurrenceCounter = 0;
            localDays.forEach(date => {
                switch (regularityMeasure) {
                    case "day":
                        if (regularityCycleChange) {
                            if (regularityNumber === (intervalLength + 1) && Calendar.getPrefix(date.date) !== Calendar.getPrefix(service.regularity.endsOn.date)) {
                                tmpSerivceStart = date.date;
                                serviceDurationCounter = serviceDuration;

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
                            else if (date.date >= service.regularity.endsOn.date) {
                                regularityCycleChange = false;
                                if (Calendar.getPrefix(date.date) === Calendar.getPrefix(service.regularity.endsOn.date) && intervalLength > 0)
                                    if ((regularityEndType === "occurrence" && thisMonthServicesFullscreen.length < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                        thisMonthServicesFullscreen.push({
                                            serviceDate: new Date(date.date),
                                            name: service.title,
                                            type: intervalLength > 0 ? "start" : "not",
                                            serviceDefiner: occurrenceCounter,
                                            start: tmpSerivceStart,
                                            end: tmpSerivceEnd,
                                            allDay: allDay
                                        });

                                        thisMonthServices.push({
                                            serviceDate: new Date(date.date),
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

                        if (Calendar.getPrefix(date.date) === Calendar.getPrefix(tmpSerivceStart)) {
                            serviceStarted = true;
                            if ((regularityEndType === "occurrence" && thisMonthServicesFullscreen.length < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                //Fullscreen
                                thisMonthServicesFullscreen.push({
                                    serviceDate: new Date(date.date),
                                    name: service.title,
                                    type: intervalLength > 0 ? "start" : "not",
                                    serviceDefiner: occurrenceCounter,
                                    start: tmpSerivceStart,
                                    end: tmpSerivceEnd,
                                    allDay: allDay
                                })

                                //NotFullscreen
                                let dayDuration;
                                if (intervalLength > 0) {
                                    const tmpDayEnd = new Date(tmpSerivceStart);
                                    tmpDayEnd.setHours(23, 59, 59);
                                    dayDuration = CalendarModule.convertDuration(
                                        intervalToDuration({
                                            start: tmpSerivceStart,
                                            end: tmpDayEnd
                                        })
                                    );
                                }
                                else dayDuration = serviceDurationCounter;
                                console.log(serviceDurationCounter);
                                console.log(dayDuration);
                                serviceDurationCounter -= dayDuration;
                                console.log(serviceDurationCounter);
                                thisMonthServices.push({
                                    serviceDate: new Date(date.date),
                                    name: service.title,
                                    type: "start",
                                    serviceDefiner: occurrenceCounter,
                                    serviceStart: `${tmpSerivceStartTime[0]}:${tmpSerivceStartTime[1]}`,
                                    serviceLength: dayDuration,
                                    end: tmpSerivceEnd,
                                    allDay: allDay
                                })

                                if (intervalLength === 0) {
                                    serviceStarted = false;
                                    regularityCycleChange = true;
                                };
                            }

                        }
                        else if (serviceStarted && Calendar.getPrefix(date.date) === Calendar.getPrefix(tmpSerivceEnd)) {
                            serviceStarted = false;
                            regularityCycleChange = true;
                            if ((regularityEndType === "occurrence" && thisMonthServicesFullscreen.length < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                thisMonthServicesFullscreen.push({
                                    serviceDate: new Date(date.date),
                                    name: service.title,
                                    type: "end",
                                    serviceDefiner: occurrenceCounter,
                                    start: tmpSerivceStart,
                                    end: tmpSerivceEnd,
                                    allDay: allDay
                                })

                                thisMonthServices.push({
                                    serviceDate: new Date(date.date),
                                    name: service.title,
                                    type: "end",
                                    serviceDefiner: occurrenceCounter,
                                    serviceStart: `0:0`,
                                    serviceLength: serviceDurationCounter,
                                    end: tmpSerivceEnd,
                                    allDay: allDay
                                })
                            }
                        }
                        else if (serviceStarted) {
                            if ((regularityEndType === "occurrence" && thisMonthServicesFullscreen.length < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                //Fullscreen
                                thisMonthServicesFullscreen.push({
                                    serviceDate: new Date(date.date),
                                    name: service.title,
                                    type: "middle",
                                    serviceDefiner: occurrenceCounter,
                                    start: tmpSerivceStart,
                                    end: tmpSerivceEnd,
                                    allDay: allDay
                                })

                                //NotFullscreen
                                const tmpDayStart = new Date(date.date);
                                const tmpDayEnd = new Date(date.date);
                                tmpDayStart.setHours(0, 0, 0);
                                tmpDayEnd.setHours(23, 59, 59);
                                const dayDuration = CalendarModule.convertDuration(
                                    intervalToDuration({
                                        start: tmpDayStart,
                                        end: tmpDayEnd
                                    })
                                );
                                serviceDurationCounter -= dayDuration;
                                // console.log(serviceDurationCounter);

                                thisMonthServices.push({
                                    serviceDate: new Date(date.date),
                                    name: service.title,
                                    type: "middle",
                                    serviceDefiner: occurrenceCounter,
                                    serviceStart: `0:0`,
                                    serviceLength: dayDuration,
                                    end: tmpSerivceEnd,
                                    allDay: allDay
                                })
                            }
                        }
                        break;
                    case "week":
                        const tmpDayName = props.getDayName(date.date, "hu-HU");
                        const selectedDays = service.regularity.days;
                        let skipMiddleDay = false;
                        if (selectedDays.includes(tmpDayName) && date.date > tmpSerivceStart) {
                            if ((regularityEndType === "occurrence" && occurrenceCounter < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                tmpSerivceStart = date.date;
                                tmpSerivceStart.setHours(tmpSerivceStartTime[0], tmpSerivceStartTime[1]);
                                const tmpCompareDate = new Date(date.date);
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
                                    thisMonthServicesFullscreen.push({
                                        serviceDate: new Date(date.date),
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
                        if (serviceStarted && Calendar.getPrefix(date.date) === Calendar.getPrefix(tmpSerivceEnd) && intervalLength > 0) {
                            serviceStarted = false;
                            regularityCycleChange = true;
                            if ((regularityEndType === "occurrence" && occurrenceCounter < service.regularity.endsOn.occurrence) || regularityEndType !== "occurrence") {
                                thisMonthServicesFullscreen.push({
                                    serviceDate: new Date(date.date),
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
                                thisMonthServicesFullscreen.push({
                                    serviceDate: new Date(date.date),
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
        });

        console.log(thisMonthServices.sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate)));

        setServices(thisMonthServices.sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate)));

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
                services={services}
                getDayName={getDayName} />
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
                services={services}
                getDayName={getDayName} />
        </div>
    )
}

function leapyear(year) {
    return year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
}