import React, { useEffect, useState } from "react";
import { START_HOUR_OF_EVENTS, END_HOUR_OF_EVENTS } from "../constants.js";
import IntervalButton from "../components/IntervalButton.jsx";
import ListItem from "../components/ListItem.jsx";
import IntervalList from "../components/IntervalList.jsx";
import { Fullscreen } from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
import { Button, IconButton, ThemeProvider } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import CalendarModule from "../modules/Calendar";
import { appTheme } from "../components/AuthPage";
import { isPastDay } from "../modules/bookingTimes";

const pad = number => String(number).padStart(2, "0");
const hoursAndMinutes = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// "09:00–10:30" of a reservation on `day`, "00:00"/"24:00" where it reaches over the day's start or end
function timeOnDay(reservation, day) {
  if (reservation.allDay) return "Egész nap";
  const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  const from = reservation.start < day ? "00:00" : hoursAndMinutes(reservation.start);
  const to = reservation.end >= nextDay ? "24:00" : hoursAndMinutes(reservation.end);
  return `${from}–${to}`;
}


export default function Calendar(props) {
  // The chosen date; what is on screen is `shown` below
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [day, setDay] = useState(0);
  const monthNames = props.monthNames;
  const dayNames = props.dayNames;
  const [years, setYears] = useState([]);
  const [hours, setHours] = useState([]);
  const [halfHours, setHalfHours] = useState([]);
  const [minutes, setMinutes] = useState([]);
  const [daysWindowItem, setDaysWindowItem] = useState(-1);
  // "year-month" of the day open in the day window, which can be a greyed day of a neighbouring month
  const [daysWindowMonth, setDaysWindowMonth] = useState("");
  // The days of the chosen month with the open resource's reservations, built by Home
  const numberOfDaysArray = props.numberOfDaysArray;
  // What is on screen. During a month change the old month (days, header, highlight) stays until it has
  // faded out and the new month's days have arrived, then all of it changes together.
  const [shown, setShown] = useState({ days: props.numberOfDaysArray, year: props.year, month: props.month, day: props.day });
  const [fadedOut, setFadedOut] = useState(false);
  const monthChanging = shown.year !== year || shown.month !== month;
  const shownDayName = shown.day > 0 ? dayNames[CalendarModule.getWeekdayIndex(new Date(shown.year, shown.month, shown.day))] : "";
  // The chosen day and its reservations, listed in the left column
  const shownDate = shown.day > 0 ? new Date(shown.year, shown.month, shown.day) : null;
  const shownDay = shownDate ? shown.days.find(item => CalendarModule.getPrefix(item.date) === CalendarModule.getPrefix(shownDate)) : undefined;
  const shownDayReservations = shownDay ? shownDay.services : [];
  // The 15th day of a grid is always in the month the grid is for
  const daysAreFor = (days, forYear, forMonth) => days.length > 15
    && days[15].date.getFullYear() === forYear && days[15].date.getMonth() === forMonth;

  useEffect(() => {
    if (props) {
      setYear(props.year);
      setMonth(props.month);
      setYears(props.years);
    }
    setInterval();
    // eslint-disable-next-line
  }, [props])

  // Home's day is only taken when it changes, so a re-render of Home does not reset the chosen day
  useEffect(() => {
    setDay(props.day);
  }, [props.day])

  useEffect(() => {
    if (monthChanging) {
      if (fadedOut && daysAreFor(numberOfDaysArray, year, month)) {
        setShown({ days: numberOfDaysArray, year, month, day });
        daysAnimate(true);
      }
    } else {
      setShown({ days: numberOfDaysArray, year, month, day });
      daysAnimate(true);
    }
    // eslint-disable-next-line
  }, [numberOfDaysArray, fadedOut, year, month, day])

  async function setInterval() {

    if (minutes.length === 0) {
      let i = START_HOUR_OF_EVENTS;
      while (i < END_HOUR_OF_EVENTS) {
        let j = 0;
        while (j < 60) {
          let tmp = i + ":" + j;
          setMinutes((prevState) => {
            return [...prevState, tmp];
          });
          j += 5;
        }
        ++i;
      }
    }
    if (halfHours.length === 0) {
      let i = START_HOUR_OF_EVENTS;
      while (i < END_HOUR_OF_EVENTS) {
        let j = 0;
        while (j < 60) {
          let tmp = i + ":" + j;
          setHalfHours((prevState) => {
            return [...prevState, tmp];
          });
          j += 30;
        }
        ++i;
      }
    }

    if (hours.length === 0) {
      for (let i = START_HOUR_OF_EVENTS; i < END_HOUR_OF_EVENTS; i++) {
        setHours((prevState) => {
          return [...prevState, i];
        });
      }
    }
  }

  function daySelected(event) {
    setDay(Number(event.target.attributes[1].value));
  }

  function monthSelected(event) {
    let newMonth = new Date(
      year,
      Number(event.target.attributes[1].value) - 1,
      1
    );

    props.setProps("monthName", monthNames[newMonth.getMonth()]);
    setMonth(newMonth.getMonth());
    props.setProps("month", newMonth.getMonth());
  }

  function yearSelected(event) {
    let selectedYear = Number(event.target.attributes[0].value);
    setYear(selectedYear);
    props.setProps("year", selectedYear);
    // numberOfDays();
  }

  function daysAnimate(animateIn) {
    let days = document.getElementById("days");
    if (days) {
      days.style.opacity = animateIn === true ? "1" : "0";
    }
  }

  function daysInfoClose() {
    const daysWindow = document.querySelector(".days-window");
    if (daysWindow) {
      daysWindow.style.transform = "scale(0) translateX(-50%)";
    }
  }

  useEffect(() => {
    let fadeTimer;
    if (monthChanging) {
      setFadedOut(false);
      daysAnimate(false);
      // The length of the opacity transition of #days
      fadeTimer = setTimeout(() => setFadedOut(true), 500);
    }
    let months = document.getElementById("months");
    if (months) {
      months.childNodes.forEach((li) => {
        if (li.firstChild.attributes[1].value === (month + 1).toString()) {
          li.firstChild.className = "selected";
        } else {
          li.firstChild.className = "";
        }
      });
    }
    // Today when it is in the shown month of the shown year, the first day otherwise
    const today = new Date();
    setDay(year === today.getFullYear() && month === today.getMonth() ? today.getDate() : 1);
    return () => clearTimeout(fadeTimer);
    // eslint-disable-next-line
  }, [year, month])

  useEffect(() => {
    // const days = document.querySelector("#days");
    // if (days) {
    //   const tmpEvent = {
    //     target: {
    //       attributes: [
    //         -1,
    //         { value: 6 }
    //       ]
    //     }
    //   }
    //   monthSelected(tmpEvent)
    // }
    if (props.open === true) {
      openFullScreen();
    }
    // eslint-disable-next-line
  }, [props.open])

  function radioChange(event) {
    const daysWindow = document.querySelector(".days-window");
    if (daysWindow) {
      daysWindow.style.transform = "scale(1) translateX(-50%)";
    }
    const [dayYear, dayMonth, dayOfMonth] = event.target.attributes[2].value.split("_")[0].split("-");
    setDaysWindowMonth(`${dayYear}-${dayMonth}`);
    setDaysWindowItem(dayOfMonth);
  }


  function intervalChange(event) {
    const item = Number(event.target.attributes[0].value.split("_")[1]);
    const whichButton = Number(event.target.attributes[0].value.split("_")[2]);
    switch (whichButton) {
      case 5:
        document.getElementById(`hour_list_${item}_5`).style.transform = "translateX(0)";
        document.getElementById(`hour_list_${item}_30`).style.transform = "translateX(0)";
        document.getElementById(`hour_list_${item}_60`).style.transform = "translateX(0)";
        break;
      case 30:
        document.getElementById(`hour_list_${item}_5`).style.transform = "translateX(calc(var(--intervallistWidth) / 2))";
        document.getElementById(`hour_list_${item}_30`).style.transform = "translateX(calc(var(--intervallistWidth) / 2))";
        document.getElementById(`hour_list_${item}_60`).style.transform = "translateX(calc(var(--intervallistWidth) / 2))";
        break;
      case 60:
        document.getElementById(`hour_list_${item}_5`).style.transform = "translateX(var(--intervallistWidth))";
        document.getElementById(`hour_list_${item}_30`).style.transform = "translateX(var(--intervallistWidth))";
        document.getElementById(`hour_list_${item}_60`).style.transform = "translateX(var(--intervallistWidth))";
        break;

      default:
        break;
    }
  }

  function openFullScreen() {
    const fullscreen = document.querySelector(".fullscreen-calendar");
    const calendar = document.querySelector("#calendar");
    const body = document.querySelector("body");

    if (fullscreen && calendar && body) {
      body.style.overflow = "hidden";
      fullscreen.setAttribute("open", "");
      fullscreen.classList.remove("hidden");
      calendar.setAttribute("open", "");
    }
  }

  function closeCalendar() {
    props.setProps("open", false);
  }

  const openDetails = (passedProps) => {
    const tmpEventDetails = document.querySelector(".event-details");
    if (tmpEventDetails) {
      tmpEventDetails.setAttribute("open", "");
      props.setProps("serviceDetails", passedProps);
    }
  }

  return (
    <div id="calendar" className={`calendar ${props.open ? '' : 'hidden'}`}>
      <div className="col leftCol">
        <div className="content">
          <h1 className="date">
            {shownDayName},
            <span>
              {monthNames[shown.month]} {shown.day}
            </span>
          </h1>
          <div className="day-bookings">
            {shownDayReservations.length === 0
              ? <p className="day-bookings_empty">Erre a napra nincs foglalás.</p>
              : <ul className="day-bookings_list">
                {shownDayReservations.map((reservation, index) =>
                  <li key={`${reservation.id}_${index}`}>
                    <button type="button" onClick={() => openDetails(reservation)}>
                      <span className="day-bookings_time">{timeOnDay(reservation, shownDate)}</span>
                      {reservation.name}
                    </button>
                  </li>
                )}
              </ul>}
            {shownDate && !isPastDay(shownDate)
              ? <ThemeProvider theme={appTheme}>
                <Button variant="contained" color="inherit" startIcon={<AddIcon />} className="day-bookings_new"
                  onClick={() => props.newBooking(shownDate)}>
                  Foglalás erre a napra
                </Button>
              </ThemeProvider>
              : <></>}
          </div>
        </div>
      </div>

      <div className="col rightCol">
        <div className="content">
          <input type="checkbox" id="year--check" />
          <h2>
            <label htmlFor="year--check">
              <span className="year">{year}</span>
            </label>
            <div>
              <IconButton className="calendar_fullscreen" size="large" onClick={openFullScreen}>
                <Fullscreen />
              </IconButton>
              <IconButton className="calendar_fullscreen" size="large" onClick={closeCalendar}>
                <CloseIcon />
              </IconButton>
            </div>
          </h2>

          <div className="year--block">
            <label htmlFor="year--check">
              <span className="year--block--close">X</span>
            </label>
            <div className="year--block--years">
              {years.map((year, index) => {
                return (
                  <label htmlFor="year--check" key={index}>
                    <div value={year} onClick={yearSelected}>
                      {year}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <ul id="months" className="months">
            <ListItem onClick={monthSelected} itemContent="Jan" datavalue="1" />
            <ListItem onClick={monthSelected} itemContent="Feb" datavalue="2" />
            <ListItem onClick={monthSelected} itemContent="Márc" datavalue="3" />
            <ListItem onClick={monthSelected} itemContent="Ápr" datavalue="4" />
            <ListItem onClick={monthSelected} itemContent="Máj" datavalue="5" />
            <ListItem onClick={monthSelected} itemContent="Jún" datavalue="6" />
            <ListItem onClick={monthSelected} itemContent="Júl" datavalue="7" />
            <ListItem onClick={monthSelected} itemContent="Aug" datavalue="8" />
            <ListItem onClick={monthSelected} itemContent="Szep" datavalue="9" />
            <ListItem onClick={monthSelected} itemContent="Okt" datavalue="10" />
            <ListItem onClick={monthSelected} itemContent="Nov" datavalue="11" />
            <ListItem onClick={monthSelected} itemContent="Dec" datavalue="12" />
          </ul>
          <div className="clearfix"></div>
          <ul className="weekday">
            {
              props.shortDayNames.map((item, index) => {
                return <ListItem key={`${item}_${index}`} itemContent={item} datavalue="1" isWeekDay={true} />
              })
            }
          </ul>
          <div className="clearfix"></div>
          <ul className="days" id="days">
            {shown.days.map((item, index) => {
              // A day with an all-day reservation is "full", one with other reservations "notfull"
              let addClass = "";
              if (item.services.some(reservation => reservation.allDay)) addClass = "full";
              else if (item.services.length !== 0) addClass = "notfull";
              let notThisMonthDay = false;
              if (index < 8 && item.date.getDate() > 8) notThisMonthDay = true;
              if (index > 20 && item.date.getDate() < 8) notThisMonthDay = true;
              // The day's own year and month, so the greyed days of the next and previous month differ
              const dayPrefix = CalendarModule.getPrefix(item.date);
              return (
                <li key={`calendar_${item.date.getDate()}_${index}`}>
                  {/* eslint-disable-next-line */}
                  <label
                    htmlFor={`${dayPrefix}_radio`}
                    onClick={daySelected}
                    value={item.date.getDate() < 10 ? "0" + item.date.getDate() : item.date.getDate()}
                    datavalue={item.date.getDate()}
                    className={
                      `${addClass} ${!notThisMonthDay && item.date.getDate() === shown.day
                        ? "selected"
                        : ""
                      } ${notThisMonthDay === true ? "greyDay" : ""}`
                    }
                  >
                    {item.date.getDate()}
                  </label>
                  <input onClick={radioChange} type="radio" name="days" id={`${dayPrefix}_radio`} />
                </li>
              );
            })}
            <div className="days-window">
              <div className="days-window-style days--info">
                <div className="days-window--header">
                  <div className="int-btn--container">
                    <IntervalButton
                      intChange={intervalChange}
                      text="5p"
                      id={`int_${daysWindowItem}_5`}
                    />
                    <IntervalButton
                      intChange={intervalChange}
                      text="30p"
                      id={`int_${daysWindowItem}_30`}
                    />
                    <IntervalButton
                      intChange={intervalChange}
                      text="1ó"
                      id={`int_${daysWindowItem}_60`}
                    />
                  </div>
                  <span
                    onClick={daysInfoClose}
                    datavalue={1 + "_radio"}
                    className="days--info--close"
                  >
                    X
                  </span>
                </div>
                <div className="interval-list--wrapper">
                  <IntervalList
                    key={`hour_list_${daysWindowItem}_5`}
                    id={`hour_list_${daysWindowItem}_5`}
                    prefix={daysWindowMonth}
                    services={shown.days}
                    timeUnits={minutes}
                    item={daysWindowItem}
                    openDetails={openDetails}
                    newBooking={props.newBooking}
                  />
                  <IntervalList
                    key={`hour_list_${daysWindowItem}_30`}
                    id={`hour_list_${daysWindowItem}_30`}
                    prefix={daysWindowMonth}
                    services={shown.days}
                    timeUnits={halfHours}
                    item={daysWindowItem}
                    openDetails={openDetails}
                    newBooking={props.newBooking}
                  />
                  <IntervalList
                    key={`hour_list_${daysWindowItem}_60`}
                    id={`hour_list_${daysWindowItem}_60`}
                    prefix={daysWindowMonth}
                    services={shown.days}
                    timeUnits={hours}
                    item={daysWindowItem}
                    openDetails={openDetails}
                    newBooking={props.newBooking}
                  />
                </div>
              </div>
            </div>
          </ul>
          <div className="clearfix"></div>
        </div>
      </div>
      <div className="clearfix"></div>
    </div>
  );
}
