import React, { useEffect, useState } from "react";
import { START_HOUR_OF_EVENTS, END_HOUR_OF_EVENTS } from "../constants.js"
import IntervalButton from "./IntervalButton.jsx";

export default function Calendar() {
    const [year, setYear] = useState(0);
    const [monthName, setMonthName] = useState('');
    const [month, setMonth] = useState(0);
    const [day, setDay] = useState(0);
    const [dayName, setDayName] = useState('');
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Fryday", "Saturday", "Sunday"];
    const [years, setYears] = useState([]);
    const [hours, setHours] = useState([]);
    const [eventTime, setEventTime] = useState({
        hour: 8,
        minute: "00"
    })

    let calendar = document.getElementById("calendar");
    let date = new Date();

    let numberOfDaysArray = numberOfDays();

    useEffect(() => {
        let dateArr = date.toString().split(" ");


        let setmonth = dateArr[1];
        let setday = dateArr[2];

        setYear(Number(dateArr[3]));
        setMonthName(monthNames[date.getMonth()]);
        setMonth(date.getMonth());
        setDay(date.getDate());
        setDayName(dayNames[date.getDay() - 1]);
        let months = document.getElementById("months");
        let days = document.getElementById("days");
        if (years.length === 0) {
            for (let i = Number(dateArr[3]); i <= (Number(dateArr[3]) + 11); i++) {
                setYears(prevState => {
                    return [...prevState, i];
                })
            }
        }
        if (hours.length === 0) {
            for (let i = START_HOUR_OF_EVENTS; i <= END_HOUR_OF_EVENTS; i++) {
                setHours(prevState => {
                    return [...prevState, i];
                })
            }
        }


        // honap beallitas
        if (months) {
            months.childNodes.forEach(li => {
                if (li.firstChild.attributes[1].value === setmonth) {
                    li.firstChild.className = "selected";
                }
            });
        }

        // nap beállitasa
        if (days) {
            days.childNodes.forEach(li => {
                if (li.firstChild.attributes[1].value === setday) {
                    li.firstChild.className = "selected";
                }
            });
        }
        //eslint-disable-next-line
    }, [calendar])

    function daySelected(event) {
        setDayName(dayNames[new Date(year, month, event.target.attributes[1].value - 1).getDay()])
        setDay(event.target.attributes[1].value);
    }

    function monthSelected(event) {
        let months = document.getElementById("months");
        let days = document.getElementById("days");

        let pastMonth = new Date(year, month, day);
        let newMonth = new Date(year, (Number(event.target.attributes[2].value) - 1), 1)
        let thisMonth = new Date();

        let newMonthShort = newMonth.toString().split(" ")[1];
        let pastMonthShort = pastMonth.toString().split(" ")[1];
        let pastDayShort = pastMonth.toString().split(" ")[2];
        let newDayShort = newMonth.toString().split(" ")[2];

        if (months) {
            months.childNodes.forEach(li => {
                if (li.firstChild.attributes[1].value === newMonthShort) {
                    li.firstChild.className = "selected";
                }
                else if (li.firstChild.attributes[1].value === pastMonthShort) {
                    li.firstChild.className = "";
                }
            });
        }
        if (days) {
            days.childNodes.forEach(li => {
                if (newMonth.getMonth() === thisMonth.getMonth() && li.firstChild.attributes[1].value === thisMonth.getDate().toString()) {
                    li.firstChild.className = "selected";
                    setDay(thisMonth.getDate());
                    setDayName(thisMonth.getDay() === 0 ? "Sunday" : dayNames[thisMonth.getDay() - 1]);
                }
                else if (newMonth.getMonth() !== thisMonth.getMonth() && li.firstChild.attributes[1].value === newDayShort) {
                    li.firstChild.className = "selected";
                    setDay(newMonth.getDate());
                    setDayName(newMonth.getDay() === 0 ? "Sunday" : dayNames[newMonth.getDay() - 1]);
                }
                else if (li.firstChild.attributes[1].value === pastDayShort) {
                    li.firstChild.className = "";
                }
            });
        }

        setMonthName(monthNames[newMonth.getMonth()]);
        setMonth(newMonth.getMonth());
        numberOfDays();
    }

    function yearSelected(event) {
        console.log(event.target.attributes[0].value);
        let selectedYear = Number(event.target.attributes[0].value);
        setYear(selectedYear);
        numberOfDays();
    }

    function numberOfDays() {
        const BigMonths = [1, 3, 5, 7, 8, 10, 12];
        const SmallMonths = [4, 6, 9, 11];
        let localdate = new Date(year, month);
        let firstDay = new Date(Number(year), Number(month), 1).getDay() - 1;
        if (firstDay === -1) {
            firstDay = 6;
        }

        let localDays = [];

        let numberOfdays;

        if (BigMonths.includes(localdate.getMonth() + 1)) numberOfdays = 31;
        else if (SmallMonths.includes(localdate.getMonth() + 1)) numberOfdays = 30;
        else if (leapyear(localdate.getFullYear())) numberOfdays = 29;
        else numberOfdays = 28;

        for (var i = 1 - firstDay; i <= numberOfdays; i += 1) {
            localDays.push(i);
        }

        return localDays;
    }

    function daysInfoClose(event) {
        const radioId = event.target.attributes[0].value;
        document.getElementById(radioId).checked = false;
    }

    function newEventInputChange(event) {
        const { value, name } = event.target;


        setEventTime(prevTime => {
            if (value.length !== 3) {
                return {
                    ...prevTime,
                    [name]: value
                }
            }
            else {
                return { ...prevTime }
            }
        })
    }

    function newEventClose(event) {
        const item = event.target.attributes[0].value.split("_")[0];
        document.getElementById(item + "newEvent").style.animation = "newEventOut .6s ease-out forwards"
    }

    function setNewEvent(event) {
        const selectedHour = Number(event.target.attributes[0].value);
        const item = event.target.parentNode.parentNode.parentNode.children[1].id.split("_")[0];
        document.getElementById(item + "newEvent").style.animation = "newEventIn .6s ease-out forwards";

        setEventTime(() => {
            return {
                hour: selectedHour,
                minute: "00"
            }
        })
    }

    return (
        <div id="calendar" className="calendar">

            <div className="col leftCol">
                <div className="content">
                    <h1 className="date">{dayName}<span>{monthName} {day}</span></h1>
                    <div className="notes">
                        <p>
                            <input type="text" placeholder="new note" />
                            {/* eslint-disable-next-line*/}
                            <a href="#" title="Add note" className="addNote animate">+</a>
                        </p>
                        <ul className="noteList">
                            {/* eslint-disable-next-line*/}
                            <li>Headbutt a lion<a href="#" title="Remove note" className="removeNote animate">x</a></li>
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
                            {
                                years.map((year, index) => {
                                    return <label htmlFor="year--check" key={index}><div value={year} onClick={yearSelected}>{year}</div></label>
                                })
                            }
                        </div>
                    </div>
                    <ul id="months" className="months">
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Jan" datavalue="1">Jan</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Feb" datavalue="2">Feb</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Mar" datavalue="3">Mar</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Apr" datavalue="4">Apr</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="May" datavalue="5">May</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Jun" datavalue="6">Jun</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Jul" datavalue="7">Jul</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Aug" datavalue="8">Aug</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Sep" datavalue="9">Sep</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Oct" datavalue="10">Oct</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Nov" datavalue="11">Nov</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a onClick={monthSelected} href="#" value="Dec" datavalue="12">Dec</a></li>
                    </ul>
                    <div className="clearfix"></div>
                    <ul className="weekday">
                        {/* eslint-disable-next-line*/}
                        <li><a href="#" title="Mon" datavalue="1">Mon</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a href="#" title="Tue" datavalue="2">Tue</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a href="#" title="Wed" datavalue="3">Wed</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a href="#" title="Thu" datavalue="4">Thu</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a href="#" title="Fri" datavalue="5">Fri</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a href="#" title="Say" datavalue="6">Sat</a></li>
                        {/* eslint-disable-next-line*/}
                        <li><a href="#" title="Sun" datavalue="7">Sun</a></li>
                    </ul>
                    <div className="clearfix"></div>
                    <ul className="days" id="days">
                        {
                            numberOfDaysArray.map((item) => {
                                let addClass = '';
                                switch (item) {
                                    case 8:
                                    case 10:
                                    case 27:
                                        addClass = "full";
                                        break;
                                    default: break;
                                }

                                switch (item) {
                                    case 3:
                                    case 17:
                                    case 23:
                                        addClass = "notfull";
                                        break;
                                    default: break;
                                }

                                if (item < 1)
                                    return <li key={item}><span className="empty" value={item} datavalue={item}></span></li>
                                // eslint-disable-next-line
                                return (
                                    <li key={item}>
                                        {/* eslint-disable-next-line */}
                                        <label htmlFor={item + "_radio"} onClick={daySelected} value={item < 10 ? "0" + item : item} className={addClass} datavalue={item}>{item}</label>
                                        <input type="radio" name="days" id={item + "_radio"} />
                                        <div className="days-window">
                                            <div className="days-window-style days--info">
                                                <div className="int-btn--container">
                                                    <IntervalButton text="5p"/>
                                                    <IntervalButton text="30p"/>
                                                    <IntervalButton text="1ó"/>                                                    
                                                </div>
                                                <span onClick={daysInfoClose} datavalue={item + "_radio"} className="days--info--close">X</span>
                                                {
                                                    hours.map(hour => {
                                                        if (hour <= 9)
                                                            return <p onClick={setNewEvent} key={hour} datavalue={hour}>{"0" + hour}<span className="days--info--hour"></span></p>
                                                        else
                                                            return <p onClick={setNewEvent} key={hour} datavalue={hour}>{hour}<span className="days--info--hour"></span></p>
                                                    })
                                                }
                                            </div>

                                            <div id={item + "newEvent"} className="days-window-style days--new-event">
                                                {/* <input type="number" name="" id="" /> */}
                                                <span onClick={newEventClose} datavalue={item + "_newEventClose"} className="days--info--close">X</span>
                                                <div>
                                                    <input max="24" type="number" id={item + " hour"} name="hour" onChange={newEventInputChange} size="1" maxLength="1" className="days--new-event--input days--new-event--hour" value={eventTime.hour} />
                                                    <input type="number" id={item + " minute"} name="minute" onChange={newEventInputChange} size="2" maxLength="2" className="days--new-event--input days--new-event--minute" value={eventTime.minute} />
                                                </div>
                                            </div>
                                        </div>

                                    </li>
                                )
                            })
                        }
                    </ul>
                    <div className="clearfix"></div>
                </div>
            </div>
            <div className="clearfix"></div>
        </div >


    )
}



function leapyear(year) {
    return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
}