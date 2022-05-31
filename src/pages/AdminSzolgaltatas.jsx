import React from "react";
import Szolgaltatas from "../components/Szolgaltatas";

export default function AdminSzolgaltatas() {

    return (
        <div className="admin-szolg">
            <Szolgaltatas id="szolg_1" title="Tárgyaló foglalás" isAdmin={true} />
            <Szolgaltatas id="szolg_add" title="Erőforrás neve" isAdmin={true} addNew={true} />
        </div>
    )
}