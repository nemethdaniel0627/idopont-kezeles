import React from "react";

export default function IntervalButton(props) {
    return (
        <div className="int-btn--wrapper">

            <input className="int-btn--radio" type="radio" name="intBtn" id={props.id}/>
            <label onClick={props.intChange} htmlFor={props.id} className="int-btn">
                {props.text}
            </label>
        </div>
    )
}
