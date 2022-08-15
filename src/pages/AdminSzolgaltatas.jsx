import React from "react";
import Szolgaltatas from "../components/Szolgaltatas";

export default function AdminSzolgaltatas(props) {

    return (
        <div className="admin-service service-grid">
            {
                props.services.map(item => {
                    return <Szolgaltatas key={`servicekey_${item.id}`} id={`service_${item.id}`} title={item.title} isAdmin={true} serviceDatas={item} saveService={props.saveService} />
                })
            }
            <Szolgaltatas id="service_add" title="Erőforrás neve" isAdmin={true} addNew={true} saveService={props.saveService} />

        </div>
    )
}