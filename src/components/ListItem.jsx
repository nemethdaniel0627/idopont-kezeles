import React from "react";

export default function ListItem(props) {
    function monthSelected(event){
        props.onClick(event);
    }

    return (
        <li>
            {/* eslint-disable-next-line*/}
            <a onClick={props.isWeekDay ? () => {} : monthSelected} href="#" value={props.itemContent} datavalue={props.datavalue}>
                {props.itemContent}
            </a>
        </li>
    );
}