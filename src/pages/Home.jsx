import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Szolgaltatas from "../components/Szolgaltatas";
import FullscreenCalendar from "../layouts/FullscreenCalendar";
import CalendarModule from "../modules/Calendar";
import { placeOccurrences, getGridRange, toOccurrence } from "../modules/occurrences";
import ServiceDetails from "../components/ServiceDetails.jsx";
import { Alert, AlertTitle, Snackbar, ThemeProvider } from "@mui/material";
import { appTheme } from "../components/AuthPage";
import BookingDialog from "../components/booking/BookingDialog";
import BookingConfirmation from "../components/booking/BookingConfirmation";
import ContactDialog from "../components/booking/ContactDialog";
import CancelDialog from "../components/booking/CancelDialog";
import { useAuth } from "../auth/AuthContext";
import { errorMessage } from "../modules/api";
import { suggestTimes } from "../modules/bookingTimes";

const MONTH_NAMES = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus",
    "Szeptember", "Október", "November", "December"];
const SHORT_DAY_NAMES = ["Hé", "Ke", "Sze", "Csü", "Pé", "Szo", "Va"];

export default function Home(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const [calendarOpen, setCalendarOpen] = useState(false);
    // The resource whose calendar is open
    const [selectedService, setSelectedService] = useState({});
    // Counts the openings of a calendar and the changes made in it, so its reservations are loaded again
    const [calendarOpenings, setCalendarOpenings] = useState(0);
    const [numberOfDaysArray, setNumberOfDaysArray] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());
    const [monthName, setMonthName] = useState(MONTH_NAMES[new Date().getMonth()]);
    const [serviceDetails, setServiceDetails] = useState();
    const { user } = useAuth();
    const isAdmin = Boolean(user && user.role === "admin");
    // The booking form: null, { initial } for a new reservation or { reservation, contact } for an edit
    const [booking, setBooking] = useState(null);
    // The summary after a new booking: null or { reservation, resource }
    const [confirmation, setConfirmation] = useState(null);
    // Asking for the contact before an edit or a cancel: null or { id, title, action }
    const [contactRequest, setContactRequest] = useState(null);
    // The cancel confirmation: null or { reservation, contact }
    const [cancelRequest, setCancelRequest] = useState(null);
    const [message, setMessage] = useState(null);
    // Shown once, right after registering
    const [welcome, setWelcome] = useState(Boolean(location.state && location.state.welcome));

    useEffect(() => {
        // The welcome is not shown again on reload or when coming back
        if (location.state && location.state.welcome) navigate(location.pathname, { replace: true, state: null });
    }, [location, navigate]);

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

    // Editing or cancelling the reservation shown in the details: admins and the booking's owner go on,
    // others give their contact first
    async function changeReservation(details, action) {
        if (!isAdmin && !details.mine) {
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

    function bookingSaved(saved) {
        if (booking.reservation) {
            setMessage({ severity: "success", text: "A foglalást módosítottuk." });
        } else {
            setConfirmation({ reservation: saved, resource: selectedService });
        }
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
        <ThemeProvider theme={appTheme}>
            <div className="home">
                <header className="home_intro">
                    <h1>Időpontfoglaló</h1>
                    <p>Válassz egy erőforrást, nézd meg a szabad időpontokat, és foglalj – regisztráció nélkül is.</p>
                </header>

                {welcome
                    ? <Alert severity="success" className="home_welcome" onClose={() => setWelcome(false)}>
                        <AlertTitle>Üdv{user && user.name ? `, ${user.name}` : ""}! Sikeres regisztráció.</AlertTitle>
                        <ul>
                            <li>Foglaláskor kitöltjük helyetted a nevedet, e-mail címedet és telefonszámodat.</li>
                            <li>A foglalásaidat a <Link to="/foglalasaim">Foglalásaim</Link> oldalon találod, és e-mail cím nélkül módosíthatod.</li>
                            <li>Az <Link to="/egyeztetesek">Egyeztetések</Link> oldalon közös időpontot kereshetsz másokkal: te megadod a napokat, ők bejelölik, mikor érnek rá.</li>
                        </ul>
                    </Alert>
                    : <></>}

                <div className="service-grid">
                    {props.resources.map(item =>
                        <Szolgaltatas key={`servicekey_${item.id}`} id={`service_${item.id}`} title={item.title} serviceDatas={item}
                            openCalendar={() => openCalendar(item)} />
                    )}
                </div>
                {props.resources.length === 0 ? <p className="home_empty">Még nincs foglalható erőforrás.</p> : <></>}
            </div>

            <FullscreenCalendar
                open={calendarOpen}
                numberOfDaysArray={numberOfDaysArray}
                selectedService={selectedService}
                year={year}
                monthName={monthName}
                month={month}
                monthNames={MONTH_NAMES}
                shortDayNames={SHORT_DAY_NAMES}
                isAdmin={isAdmin}
                reloadKey={calendarOpenings}
                newBooking={newBooking}
                setProps={setProps} />
            <ServiceDetails serviceDetails={serviceDetails} changeReservation={changeReservation} isAdmin={isAdmin} />
            <BookingDialog resource={selectedService} booking={booking} onClose={() => setBooking(null)} onSaved={bookingSaved} />
            <BookingConfirmation confirmation={confirmation} user={user} onClose={() => setConfirmation(null)} />
            <ContactDialog request={contactRequest} onClose={() => setContactRequest(null)} onAccess={openChange} />
            <CancelDialog request={cancelRequest} onClose={() => setCancelRequest(null)} onCancelled={reservationCancelled} />
            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </ThemeProvider>
    )
}
