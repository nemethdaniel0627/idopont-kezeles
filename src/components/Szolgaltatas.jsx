import React from "react";
import SzolgTitle from "./SzolgTitle";

export default function Szolgaltatas(){

    function openCalendar() {
        
    }

    return(
        <div onClick={openCalendar} className="szolg">
            <SzolgTitle title="Tárgyaló foglalás"/>
        </div>
    )
}
