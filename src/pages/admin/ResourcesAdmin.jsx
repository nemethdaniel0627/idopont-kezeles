import React, { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, List, ListItemButton, ListItemText, Snackbar } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import AdminPage from "../../components/AdminPage";
import ResourceEditor from "../../components/admin/ResourceEditor";

// /admin/eroforrasok/:id — the resources on the left, the chosen one (or a new one: "uj") on the right
export default function ResourcesAdmin({ resources, resourcesLoaded, saveResource, removeResource }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState(null);
    const showMessage = useCallback(value => setMessage(value), []);

    const isNew = id === "uj";
    const selected = isNew ? null : resources.find(resource => String(resource.id) === id) || null;

    const saved = (resource, created) => {
        setMessage({ severity: "success", text: created ? "Az erőforrást létrehoztuk." : "Az erőforrást elmentettük." });
        if (created) navigate(`/admin/eroforrasok/${resource.id}`, { replace: true });
    };

    const removed = (notified) => {
        setMessage({ severity: "success", text: notified > 0 ? `Az erőforrást töröltük, ${notified} értesítést küldtünk.` : "Az erőforrást töröltük." });
        navigate("/admin/eroforrasok", { replace: true });
    };

    let detail;
    if (isNew || selected) {
        detail = <ResourceEditor key={isNew ? "new" : selected.id} resource={selected} saveResource={saveResource}
            removeResource={removeResource} onSaved={saved} onRemoved={removed} showMessage={showMessage} />;
    } else if (id && resourcesLoaded) {
        detail = <Alert severity="warning">Nincs ilyen erőforrás, vagy már törölték.</Alert>;
    } else {
        detail = <p className="resources-admin_empty">Válassz egy erőforrást a listából, vagy hozz létre újat!</p>;
    }

    return (
        <AdminPage title="Erőforrások" back={{ to: "/admin", label: "Adminisztráció" }}>
            <div className="resources-admin">
                <div className="resources-admin_list">
                    <Button component={Link} to="/admin/eroforrasok/uj" variant="contained" startIcon={<AddIcon />}>Új erőforrás</Button>
                    <List>
                        {resources.map(resource =>
                            <ListItemButton key={resource.id} component={Link} to={`/admin/eroforrasok/${resource.id}`}
                                selected={selected !== null && selected.id === resource.id}>
                                <ListItemText primary={resource.title}
                                    secondary={resource.customFields.map(field => `${field.label}: ${field.value}`).join(" · ")} />
                            </ListItemButton>
                        )}
                    </List>
                </div>
                <div className="resources-admin_detail">{detail}</div>
            </div>
            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
