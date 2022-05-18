import React, { useEffect, useState } from "react";
import { START_HOUR_OF_EVENTS, END_HOUR_OF_EVENTS } from "../constants.js";
import IntervalButton from "../components/IntervalButton.jsx";
import Loader from "../components/Loader.jsx";
import ListItem from "../components/ListItem.jsx";
import Event from "../components/Event.jsx";
import IntervalList from "../components/IntervalList.jsx";
import NewEvent from "../components/NewEvent.jsx";

export default function Calendar(props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthName, setMonthName] = useState("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [day, setDay] = useState(0);
  const [dayName, setDayName] = useState("");
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
  const dayNames = [
    "Hétfő",
    "Kedd",
    "Szerda",
    "Csütörtök",
    "Péntek",
    "Szombat",
    "Vasárnap",
  ];
  const [events, setEvents] = useState([
    { eventStart: "0:30", eventLength: 90, eventDate: new Date() },
    { eventStart: "3:0", eventLength: 120, eventDate: new Date() }
  ])
  const [years, setYears] = useState([]);
  const [hours, setHours] = useState([]);
  const [halfHours, setHalfHours] = useState([]);
  const [minutes, setMinutes] = useState([]);
  const [whichInterval, setWhichInterval] = useState(60);
  const [eventTime, setEventTime] = useState({});
  const [numberOfDaysArray, setNumberOfDaysArray] = useState([]);
  const [daysWindowItem, setDaysWindowItem] = useState(-1);

  let calendar = document.getElementById("calendar");
  let date = new Date();

  // let numberOfDaysArray = numberOfDays();

  useEffect(() => {
    // setNumberOfDaysArray(numberOfDays());
    if (numberOfDaysArray.length !== 0) {
      console.time();
      let dateArr = date.toString().split(" ");

      let setmonth = dateArr[1];
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
        console.log(setday);
        days.childNodes.forEach((li, index) => {
          if (index !== days.childNodes.length - 1 && li.firstChild.attributes[1].value === setday) {
            li.firstChild.className = "selected";
          }
        });
      }


      setInterval();
      console.timeEnd();
    }
    // console.timeLog();
    //eslint-disable-next-line
  }, [calendar]);

  useEffect(() => {
    console.log("egész");
    setNumberOfDaysArray(numberOfDays());
  }, [])

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
    // for (let i = START_HOUR_OF_EVENTS; i < END_HOUR_OF_EVENTS; i++) {
    //   for (let j = 0; j < 60; j += 5) {
    //     let tmp = i + ":" + j;
    //     setMinutes((prevState) => {
    //       return [...prevState, tmp];
    //     });
    //   }
    // }
    if (halfHours.length === 0) {
      // for (let i = START_HOUR_OF_EVENTS; i < END_HOUR_OF_EVENTS; i++) {
      //   for (let j = 0; j < 60; j += 30) {
      //     let tmp = i + ":" + j;
      //     setHalfHours((prevState) => {
      //       return [...prevState, tmp];
      //     });
      //   }
      // }
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
      //   let i = START_HOUR_OF_EVENTS;
      //   while (i < END_HOUR_OF_EVENTS) {
      //     // eslint-disable-next-line no-loop-func
      //     setHours((prevState) => {
      //        return [...prevState, i];
      //     });
      //     i++;
      //   }

      for (let i = START_HOUR_OF_EVENTS; i < END_HOUR_OF_EVENTS; i++) {
        setHours((prevState) => {
          return [...prevState, i];
        });
      }
    }
  }

  function daySelected(event) {
    setDayName(
      dayNames[
      new Date(year, month, event.target.attributes[1].value - 1).getDay()
      ]
    );
    setDay(event.target.attributes[1].value);
    // setEventHeight();
  }

  function monthSelected(event) {
    let months = document.getElementById("months");
    let days = document.getElementById("days");
    console.log(event.target.attributes);

    let pastMonth = new Date(year, month, day);
    let newMonth = new Date(
      year,
      Number(event.target.attributes[1].value) - 1,
      1
    );
    let thisMonth = new Date();

    let newMonthShort = newMonth.toString().split(" ")[1];
    let pastMonthShort = pastMonth.toString().split(" ")[1];
    let pastDayShort = pastMonth.toString().split(" ")[2];
    let newDayShort = newMonth.toString().split(" ")[2];

    if (months) {
      months.childNodes.forEach((li) => {
        if (li.firstChild.attributes[1].value === (newMonth.getMonth() + 1).toString()) {
          li.firstChild.className = "selected";
        } else if (li.firstChild.attributes[1].value === (pastMonth.getMonth() + 1).toString()) {
          li.firstChild.className = "";
        }
      });
    }
    if (days) {
      days.childNodes.forEach((li, index) => {
        if (index !== days.childNodes.length - 1) {
          if (
            newMonth.getMonth() === thisMonth.getMonth() &&
            li.firstChild.attributes[1].value === thisMonth.getDate().toString()
          ) {
            li.firstChild.className = "selected";
            setDay(thisMonth.getDate());
            setDayName(
              thisMonth.getDay() === 0
                ? "Sunday"
                : dayNames[thisMonth.getDay() - 1]
            );
          } else if (
            newMonth.getMonth() !== thisMonth.getMonth() &&
            li.firstChild.attributes[1].value === newDayShort
          ) {
            li.firstChild.className = "selected";
            setDay(newMonth.getDate());
            setDayName(
              newMonth.getDay() === 0 ? "Sunday" : dayNames[newMonth.getDay() - 1]
            );
          } else if (
            (newMonth.getMonth() === thisMonth.getMonth() && index === 0)
            || li.firstChild.attributes[1].value === pastDayShort) {
            li.firstChild.className = "";
          }
        }
      });
    }

    setMonthName(monthNames[newMonth.getMonth()]);
    setMonth(newMonth.getMonth());
    // setNumberOfDaysArray(numberOfDays());
  }

  function yearSelected(event) {
    console.log(event.target.attributes[0].value);
    let selectedYear = Number(event.target.attributes[0].value);
    setYear(selectedYear);
    // numberOfDays();
  }

  function numberOfDays() {

    console.log("numberOfDays");
    console.time();

    const BigMonths = [1, 3, 5, 7, 8, 10, 12];
    const SmallMonths = [4, 6, 9, 11];
    let localdate = new Date(year, month);
    let firstDay = new Date(Number(year), Number(month), 1).getDay() - 1;
    if (firstDay === -1) {
      firstDay = 6;
    }

    let numberOfdays;

    if (BigMonths.includes(localdate.getMonth() + 1)) numberOfdays = 31;
    else if (SmallMonths.includes(localdate.getMonth() + 1)) numberOfdays = 30;
    else if (leapyear(localdate.getFullYear())) numberOfdays = 29;
    else numberOfdays = 28;

    // let localDays = Array.from({ length: (numberOfdays - (1 - firstDay)) + 1 }, (_, i) => (1 - firstDay) + i);
    let localDays = [];

    for (var i = 1 - firstDay; i <= numberOfdays; i += 1) {
      localDays.push(i);
    }

    console.timeEnd();

    console.log(localDays);

    return localDays;

  }

  function daysAnimate(animateIn) {
    let days = document.getElementById("days");
    console.log("animate" + animateIn);
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
    setTimeout(() => {
      setNumberOfDaysArray(numberOfDays());
    }, 200);
  }, [year, month])

  useEffect(() => {
    daysAnimate(true);
    console.log(numberOfDaysArray);

  }, [numberOfDaysArray])

  function radioChange(event) {
    const daysWindow = document.querySelector(".days-window");
    if (daysWindow) {
      daysWindow.style.transform = "scale(1) translateX(-50%)";
    }
    setDaysWindowItem(event.target.attributes[2].value.split("_")[0].split("-")[2]);
  }


  function setNewEvent(event) {
    let item = event.target.attributes[0].value;
    let selectedTime;
    selectedTime = event.target.attributes[0].value.split("_")[2];
    console.log(item);
    // if (item === "days--info--hour") {
    //   item = event.target.parentNode.parentNode.parentNode.parentNode.childNodes[1].id;
    //   selectedTime = event.target.parentNode.attributes[0].value;
    // }
    // else item = event.target.parentNode.parentNode.parentNode.childNodes[1]
    console.log(item);
    item = item.split("_")[1];
    console.log(item);

    document.getElementById(item + "_newEvent").style.animation =
      "slideInRight .6s ease-out forwards";

    console.log(`item ${selectedTime}`);

    let selectedHour = selectedTime.split(":")[0];
    let selectedMinutes = selectedTime.split(":")[1] ? Number(selectedTime.split(":")[1]) < 10 ? `0${selectedTime.split(":")[1]}` : selectedTime.split(":")[1] : "00";
    selectedHour = Number(selectedHour) < 10 ? `0${selectedHour}` : selectedHour
    setEventTime(() => {
      return {
        startHour: selectedHour,
        startMinute: selectedMinutes,
        endHour: Number(selectedHour) < 10 ? `0${Number(selectedHour) + 1}` : (Number(selectedHour) + 1),
        endMinute: selectedMinutes
      };
    });
  }

  function addNewEvent(startTime, endTime) {
    const eventStart = `${startTime.getHours()}:${startTime.getMinutes()}`;
    const eventLength = Math.abs(endTime - startTime) / 60000;
    setEvents(prevEvents => {
      return [...prevEvents, { eventStart: eventStart, eventLength: eventLength, eventDate: startTime }]
    })
    console.log(eventStart);

  }

  function intervalChange(event) {
    const item = Number(event.target.attributes[0].value.split("_")[1]);
    const whichButton = Number(event.target.attributes[0].value.split("_")[2]);
    console.log(`btn ${whichButton}`);
    switch (whichButton) {
      case 5:
        document.getElementById(`hour_list_${item}_5`).style.transform = "translateX(0)";
        document.getElementById(`hour_list_${item}_30`).style.transform = "translateX(0)";
        document.getElementById(`hour_list_${item}_60`).style.transform = "translateX(0)";
        break;
      case 30:
        document.getElementById(`hour_list_${item}_5`).style.transform = "translateX(-27rem)";
        document.getElementById(`hour_list_${item}_30`).style.transform = "translateX(-27rem)";
        document.getElementById(`hour_list_${item}_60`).style.transform = "translateX(-27rem)";
        break;
      case 60:
        document.getElementById(`hour_list_${item}_5`).style.transform = "translateX(-54rem)";
        document.getElementById(`hour_list_${item}_30`).style.transform = "translateX(-54rem)";
        document.getElementById(`hour_list_${item}_60`).style.transform = "translateX(-54rem)";
        break;

      default:
        break;
    }
  }

  function setEventHeight() {
    const eventLength = 180;
    const oneHourLength = 300;
    const oneMinuteLength = oneHourLength / 60;

    let event = document.querySelector(`#event_23_0`);
    if (event) {
      event.style.height = `${oneMinuteLength * eventLength}%`;
    }
  }

  // useEffect(() => {


  // }, [numberOfDays])

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
            <ListItem itemContent="Hé" datavalue="1" isWeekDay={true} />
            <ListItem itemContent="Ke" datavalue="2" isWeekDay={true} />
            <ListItem itemContent="Sze" datavalue="3" isWeekDay={true} />
            <ListItem itemContent="Csü" datavalue="4" isWeekDay={true} />
            <ListItem itemContent="Pé" datavalue="5" isWeekDay={true} />
            <ListItem itemContent="Szo" datavalue="6" isWeekDay={true} />
            <ListItem itemContent="Va" datavalue="7" isWeekDay={true} />
          </ul>
          <div className="clearfix"></div>
          <ul className="days" id="days">
            {numberOfDaysArray.map((item) => {
              let addClass = "";
              // switch (item) {
              //   case 8:
              //   case 10:
              //   case 27:
              //     addClass = "full";
              //     break;
              //   default:
              //     break;
              // }

              // switch (item) {
              //   case 3:
              //   case 17:
              //   case 23:
              //     addClass = "notfull";
              //     break;
              //   default:
              //     break;
              // }

              if (item < 1)
                return (
                  <li key={item}>
                    <span
                      className="empty"
                      value={item}
                      datavalue={item}
                    ></span>
                  </li>
                );
              // eslint-disable-next-line
              return (
                <li key={item}>
                  {/* eslint-disable-next-line */}
                  <label
                    htmlFor={`${year}-${month + 1}-${item}_radio`}
                    onClick={daySelected}
                    value={item < 10 ? "0" + item : item}
                    className={addClass}
                    datavalue={item}
                  >
                    {item}
                  </label>
                  <input onClick={radioChange} type="radio" name="days" id={`${year}-${month + 1}-${item}_radio`} />
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
                  <IntervalList key={`hour_list_${daysWindowItem}_5`} id={`hour_list_${daysWindowItem}_5`} prefix={`${year}-${month + 1}`} events={events} timeUnits={minutes} item={daysWindowItem} setNewEvent={setNewEvent} />
                  <IntervalList key={`hour_list_${daysWindowItem}_30`} id={`hour_list_${daysWindowItem}_30`} prefix={`${year}-${month + 1}`} events={events} timeUnits={halfHours} item={daysWindowItem} setNewEvent={setNewEvent} />
                  <IntervalList key={`hour_list_${daysWindowItem}_60`} id={`hour_list_${daysWindowItem}_60`} prefix={`${year}-${month + 1}`} events={events} timeUnits={hours} item={daysWindowItem} setNewEvent={setNewEvent} />
                </div>
              </div>

              <NewEvent item={`${year}-${month + 1}-${daysWindowItem}`} eventTime={eventTime} addNewEvent={addNewEvent} />
            </div>
          </ul>
          <div className="clearfix"></div>
        </div>
      </div>
      <div className="clearfix"></div>
    </div>
  );
}

function leapyear(year) {
  return year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
}
