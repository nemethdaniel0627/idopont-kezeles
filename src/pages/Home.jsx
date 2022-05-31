import React, { useState } from "react"
// import CalendarJS from "../modules/Calendar"
import Szolgaltatas from "../components/Szolgaltatas"
import Calendar from "../layouts/Calendar"

export default function Home() {
    const [calendarOpen, setCalendarOpen] = useState(false)

    function openCalendar() {
        setCalendarOpen(true);
    }

    return (
        <div>
            <Szolgaltatas title="Tárgyaló foglalás" openCalendar={openCalendar} />
            <Calendar open={calendarOpen} />
        </div>
    )
}