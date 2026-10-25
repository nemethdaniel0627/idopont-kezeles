import React from "react";
import { Alert } from "@mui/material";
import AdminPage from "../../components/AdminPage";

// Polls come in MVP step 5; until then this is where the admin home's second tile leads
export default function SchedulingAdmin() {
    return (
        <AdminPage title="Közös időpont-egyeztetés" back={{ to: "/admin", label: "Adminisztráció" }}>
            <Alert severity="info">
                Az időpont-egyeztető szavazások kezelése hamarosan itt lesz elérhető.
            </Alert>
        </AdminPage>
    );
}
