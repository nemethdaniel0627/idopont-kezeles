import React from "react";
import Szolgaltatas from "../components/Szolgaltatas";

export default function AdminSzolgaltatas(props) {

    return (
        <div className="admin-service">
            {
                props.services.map((item, index) => {
                    return <Szolgaltatas key={""} id={`service_${index}`} title={item.title} isAdmin={true} serviceDatas={item} />
                })
            }
            <Szolgaltatas id="service_add" title="Erőforrás neve" isAdmin={true} addNew={true} />
        </div>
    )
}