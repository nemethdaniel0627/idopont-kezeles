import React from "react";
import Szolgaltatas from "../components/Szolgaltatas";

export default function AdminSzolgaltatas(props) {

    return (
        <div className="admin-service service-grid">
            {
                props.resources.map(item => {
                    return <Szolgaltatas key={`servicekey_${item.id}`} id={`service_${item.id}`} title={item.title} isAdmin={true} serviceDatas={item} saveResource={props.saveResource} />
                })
            }
            <Szolgaltatas id="service_add" title="Erőforrás neve" isAdmin={true} addNew={true} saveResource={props.saveResource} />

        </div>
    )
}
