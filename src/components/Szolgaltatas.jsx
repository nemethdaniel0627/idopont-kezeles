import React from "react";
import resourceImage from "../images/resource.png";

// A resource on the home page with its custom fields; clicking it opens the resource's calendar
export default function Szolgaltatas(props) {
    const customFields = props.serviceDatas && props.serviceDatas.customFields ? props.serviceDatas.customFields : [];

    return (
        <div id={props.id} onClick={props.openCalendar} className="service">
            <img className="service_img" src={resourceImage} alt="" />
            <div className="service_caption">
                <h3 className="service_title">{props.title}</h3>
                {customFields.length !== 0
                    ? <ul className="service_fields">
                        {customFields.map((field, index) =>
                            <li key={index}><span>{field.label}:</span> {field.value}</li>
                        )}
                    </ul>
                    : <></>
                }
            </div>
        </div>
    )
}
