import React from "react";

export default function ListItem(props) {
    function monthSelected(event) {
        props.onClick(event);
    }

    return (
        <li>
            {/* eslint-disable-next-line*/}
            <div onClick={props.isWeekDay ? () => { } : monthSelected} value={props.itemContent} datavalue={props.datavalue}>
                {props.itemContent}
            </div>
        </li>
    );
}