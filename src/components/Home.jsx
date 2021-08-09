import React from "react"
// import CalendarJS from "../modules/Calendar"
import Nav from "./Nav"
import Szolgaltatas from "./Szolgaltatas"
import Calendar from "./Calendar"

export default function Home(){
    return(
        <div>
            <Nav />
            <Szolgaltatas />
            <Calendar />
        </div>
    )
}