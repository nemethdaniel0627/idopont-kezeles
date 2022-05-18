import React, { useState } from "react"
// import CalendarJS from "../modules/Calendar"
import Nav from "../components/Nav"
import Szolgaltatas from "../components/Szolgaltatas"
import Calendar from "../layouts/Calendar"

export default function Home() {
    const [calendarOpen, setCalendarOpen] = useState(false)

    function openCalendar() {
        setCalendarOpen(true);
    }

    return (
        <div>
            <Nav />
            <Szolgaltatas openCalendar={openCalendar} />
            <Calendar open={calendarOpen} />
        </div>
    )
}