import React, { useEffect, useState } from "react";
import { START_HOUR_OF_EVENTS, END_HOUR_OF_EVENTS } from "../constants.js";
import IntervalButton from "../components/IntervalButton.jsx";
import Loader from "../components/Loader.jsx";
import ListItem from "../components/ListItem.jsx";
import IntervalList from "../components/IntervalList.jsx";
import { Fullscreen } from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from "@mui/material";
import CalendarModule from "../modules/Calendar";


export default function Calendar(props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthName, setMonthName] = useState("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [day, setDay] = useState(0);
  const [dayName, setDayName] = useState("");
  const monthNames = props.monthNames;
  const dayNames = props.dayNames;
  const [years, setYears] = useState([]);
  const [hours, setHours] = useState([]);
  const [halfHours, setHalfHours] = useState([]);
  const [minutes, setMinutes] = useState([]);
  const [daysWindowItem, setDaysWindowItem] = useState(-1);
  // "year-month" of the day open in the day window, which can be a greyed day of a neighbouring month
  const [daysWindowMonth, setDaysWindowMonth] = useState("");
  // The days of the shown month with the open resource's reservations, built by Home
  const numberOfDaysArray = props.numberOfDaysArray;

  useEffect(() => {
    if (props) {
      setYear(props.year);
      setMonthName(props.monthName);
      setMonth(props.month);
      setDay(props.day);
      setYears(props.years);
    }
    setInterval();
    // eslint-disable-next-line
  }, [props])

  // The day name always follows the selected date, whichever of year, month or day changed
  useEffect(() => {
    if (day > 0) {
      setDayName(dayNames[CalendarModule.getWeekdayIndex(new Date(year, month, day))]);
    }
    // eslint-disable-next-line
  }, [year, month, day])

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

    setMonthName(monthNames[newMonth.getMonth()]);
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
    daysAnimate(false);
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
    // eslint-disable-next-line
  }, [year, month])

  useEffect(() => {
    daysAnimate(true);
  }, [numberOfDaysArray])

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
            {dayName},
            <span>
              {monthName} {day}
            </span>
          </h1>
          <div className="notes">
            <p className="addNote--wrapper">
              <label className="addNote--text">Add note</label>
              {/* eslint-disable-next-line*/}
              <a href="#" title="Add note" className="addNote animate">
                +
              </a>
            </p>
            <ul className="noteList">
              <li>
                Headbutt a lion
                {/* eslint-disable-next-line*/}
                <a href="#" title="Remove note" className="removeNote animate">
                  x
                </a>
                <Loader />
              </li>
            </ul>
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
            {numberOfDaysArray.map((item, index) => {
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
                      `${addClass} ${!notThisMonthDay && item.date.getDate() === day
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
                    services={numberOfDaysArray}
                    timeUnits={minutes}
                    item={daysWindowItem}
                    openDetails={openDetails}
                  />
                  <IntervalList
                    key={`hour_list_${daysWindowItem}_30`}
                    id={`hour_list_${daysWindowItem}_30`}
                    prefix={daysWindowMonth}
                    services={numberOfDaysArray}
                    timeUnits={halfHours}
                    item={daysWindowItem}
                    openDetails={openDetails}
                  />
                  <IntervalList
                    key={`hour_list_${daysWindowItem}_60`}
                    id={`hour_list_${daysWindowItem}_60`}
                    prefix={daysWindowMonth}
                    services={numberOfDaysArray}
                    timeUnits={hours}
                    item={daysWindowItem}
                    openDetails={openDetails}
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
