import React from "react";
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import resourceImage from "../images/resource.png";
import { describeRules } from "../modules/reservationText";

// A resource on the home page with its custom fields and booking rules; clicking it (or Enter on it) opens
// the resource's calendar
export default function Szolgaltatas(props) {
    const resource = props.serviceDatas || {};
    const customFields = resource.customFields || [];
    const rules = describeRules(resource);

    return (
        <button type="button" id={props.id} onClick={props.openCalendar} className="service"
            aria-label={`${props.title} – foglalás, naptár megnyitása`}>
            <img className="service_img" src={resourceImage} alt="" />
            <span className="service_caption">
                <span className="service_title">{props.title}</span>
                {customFields.length !== 0
                    ? <span className="service_fields">
                        {customFields.map((field, index) =>
                            <span key={index}><span className="service_label">{field.label}:</span> {field.value}</span>
                        )}
                    </span>
                    : <></>}
                <span className="service_rules">{rules !== "" ? rules : "Bármikor foglalható"}</span>
                <span className="service_cta"><EventAvailableIcon fontSize="small" /> Foglalás</span>
            </span>
        </button>
    )
}
