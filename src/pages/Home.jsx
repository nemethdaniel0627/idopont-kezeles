import React from "react"
// import CalendarJS from "../modules/Calendar"
import Nav from "../components/Nav"
import Szolgaltatas from "../components/Szolgaltatas"
import Calendar from "../layouts/Calendar"

export default function Home(){
    return(
        <div>
            <Nav />
            <Szolgaltatas />
            <Calendar />
        </div>
    )
}