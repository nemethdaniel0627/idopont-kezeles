import React from "react";

export default function IntervalButton(props) {
    return (
        <div className="int-btn">

            <input className="int-btn--radio" type="radio" name="intBtn" id={props.id}/>
            <label htmlFor={props.id}>
                {props.text}
            </label>
        </div>
    )
}
