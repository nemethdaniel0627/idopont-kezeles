import React, { useEffect, useState } from "react";
import axios from "axios";
import Szolgaltatas from "../components/Szolgaltatas";
import Calendar from "../layouts/Calendar";
import FullscreenCalendar from "../layouts/FullscreenCalendar";
import CalendarModule from "../modules/Calendar";
import { placeOccurrences, getGridRange, toOccurrence } from "../modules/occurrences";
import ServiceDetails from "../components/ServiceDetails.jsx";
import { Alert, Snackbar, ThemeProvider } from "@mui/material";
import { appTheme } from "../components/AuthPage";
import BookingDialog from "../components/booking/BookingDialog";
import ContactDialog from "../components/booking/ContactDialog";
import CancelDialog from "../components/booking/CancelDialog";
import { useAuth } from "../auth/AuthContext";
import { errorMessage } from "../modules/api";
import { suggestTimes } from "../modules/bookingTimes";

export default function Home(props) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    // The resource whose calendar is open
    const [selectedService, setSelectedService] = useState({});
    // Counts the openings of a calendar, so opening the same resource again loads its reservations again
    const [calendarOpenings, setCalendarOpenings] = useState(0);
    const [numberOfDaysArray, setNumberOfDaysArray] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthName, setMonthName] = useState("");
    const [month, setMonth] = useState(new Date().getMonth());
    const [day, setDay] = useState(0);
    const [dayName, setDayName] = useState("");
    const [years, setYears] = useState([]);
    const [serviceDetails, setServiceDetails] = useState();
    const { user } = useAuth();
    const isAdmin = Boolean(user && user.role === "admin");
    // The booking form: null, { initial } for a new reservation or { reservation, contact } for an edit
    const [booking, setBooking] = useState(null);
    // Asking for the contact before an edit or a cancel: null or { id, title, action }
    const [contactRequest, setContactRequest] = useState(null);
    // The cancel confirmation: null or { reservation, contact }
    const [cancelRequest, setCancelRequest] = useState(null);
    const [message, setMessage] = useState(null);
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

    // Shows the open resource's reservations again, after a booking, an edit or a cancel
    const reloadReservations = () => setCalendarOpenings(openings => openings + 1);

    // A new booking on `day`, or at `time` when a time slot was clicked; prefilled from the profile
    function newBooking(day, time = null) {
        const { start, end } = suggestTimes(selectedService, day, time);
        const profile = user ? { title: user.name, contactEmail: user.email, contactPhone: user.phone } : {};
        setBooking({ initial: { start, end, ...profile } });
    }

    // Editing or cancelling the reservation shown in the details: admins go on, others give their contact first
    async function changeReservation(details, action) {
        if (!isAdmin) {
            setContactRequest({ id: details.id, title: details.name, action });
            return;
        }
        try {
            const res = await axios.post(`/reservations/${details.id}/access`, {});
            openChange(res.data.result, "", action);
        } catch (err) {
            setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült megnyitni a foglalást!") });
        }
    }

    function openChange(reservation, contact, action) {
        setContactRequest(null);
        if (action === "cancel") setCancelRequest({ reservation, contact });
        else setBooking({ reservation, contact });
    }

    function bookingSaved() {
        setMessage({ severity: "success", text: booking.reservation ? "A foglalást módosítottuk." : "A foglalást rögzítettük." });
        setBooking(null);
        reloadReservations();
    }

    function reservationCancelled(reservation) {
        setMessage({ severity: "success", text: `A(z) „${reservation.title}” foglalást lemondtuk.` });
        setCancelRequest(null);
        reloadReservations();
    }

    function openCalendar(resource) {
        // Never the previous resource's reservations while this one's are loading
        setNumberOfDaysArray(getMonthDays());
        setSelectedService(resource);
        setCalendarOpenings(openings => openings + 1);
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

    // The shown month's days with the open resource's reservations. They change only once the reservations are
    // loaded, so a new month never shows up first without them.
    useEffect(() => {
        const days = getMonthDays();
        if (selectedService.id === undefined) {
            setNumberOfDaysArray(days);
            return;
        }
        let current = true;
        const { from, to } = getGridRange(days);
        axios.get(`/resources/${selectedService.id}/occurrences`, { params: { from: from.toISOString(), to: to.toISOString() } })
            .then(res => {
                if (current) setNumberOfDaysArray(placeOccurrences(days, res.data.result.map(toOccurrence)));
            })
            .catch(err => {
                console.error(err);
                // The month is still shown, so the calendar can be used
                if (current) setNumberOfDaysArray(days);
            });
        // A response for a month or resource that is no longer shown is dropped
        return () => { current = false; };
        // eslint-disable-next-line
    }, [selectedService.id, year, month, calendarOpenings])


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
                newBooking={newBooking}
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
                newBooking={newBooking}
                setProps={setProps} />
            <ServiceDetails serviceDetails={serviceDetails} changeReservation={changeReservation} />
            <BookingDialog resource={selectedService} booking={booking} onClose={() => setBooking(null)} onSaved={bookingSaved} />
            <ContactDialog request={contactRequest} onClose={() => setContactRequest(null)} onAccess={openChange} />
            <CancelDialog request={cancelRequest} onClose={() => setCancelRequest(null)} onCancelled={reservationCancelled} />
            <ThemeProvider theme={appTheme}>
                <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                    <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
                </Snackbar>
            </ThemeProvider>
        </div>
    )
}
