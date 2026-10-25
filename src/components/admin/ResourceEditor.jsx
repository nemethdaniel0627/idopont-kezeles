import React, { useState } from "react";
import { Alert, Button, IconButton, InputAdornment, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceReservations from "./ResourceReservations";
import RemoveResourceDialog from "./RemoveResourceDialog";
import { errorMessage } from "../../modules/api";

const weekDays = [
    { value: "hétfő", label: "Hé" }, { value: "kedd", label: "Ke" }, { value: "szerda", label: "Sze" },
    { value: "csütörtök", label: "Csü" }, { value: "péntek", label: "Pé" }, { value: "szombat", label: "Szo" },
    { value: "vasárnap", label: "Va" },
];
const allDays = weekDays.map(day => day.value);

const asText = value => value === null || value === undefined ? "" : String(value);
const asLimit = value => value === "" ? null : Number(value);

function toForm(resource) {
    return {
        title: resource ? resource.title : "",
        customFields: resource ? resource.customFields.map(field => ({ ...field })) : [],
        minLengthMinutes: resource ? asText(resource.minLengthMinutes) : "",
        maxLengthMinutes: resource ? asText(resource.maxLengthMinutes) : "",
        openFrom: resource ? asText(resource.openFrom) : "",
        openTo: resource ? asText(resource.openTo) : "",
        // No day limit is shown as every day selected
        openDays: resource && resource.openDays ? resource.openDays : allDays,
        maxDaysAhead: resource ? asText(resource.maxDaysAhead) : "",
    };
}

// Edits a resource (or creates one when `resource` is null): name, custom fields, booking rules;
// an existing one also has its reservations and can be removed
export default function ResourceEditor({ resource, saveResource, removeResource, onSaved, onRemoved, showMessage }) {
    const [form, setForm] = useState(() => toForm(resource));
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const isNew = !resource;

    const set = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
    const change = field => event => set(field, event.target.value);
    const changeField = (index, key) => event => set("customFields",
        form.customFields.map((field, i) => i === index ? { ...field, [key]: event.target.value } : field));

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const saved = await saveResource({
                ...(isNew ? {} : { id: resource.id }),
                title: form.title,
                customFields: form.customFields,
                minLengthMinutes: asLimit(form.minLengthMinutes),
                maxLengthMinutes: asLimit(form.maxLengthMinutes),
                openFrom: form.openFrom || null,
                openTo: form.openTo || null,
                openDays: form.openDays,
                maxDaysAhead: asLimit(form.maxDaysAhead),
            });
            onSaved(saved, isNew);
        } catch (err) {
            setError(errorMessage(err, "Nem sikerült menteni az erőforrást!"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="resource-editor">
            <form className="admin-section" onSubmit={save}>
                <h2>{isNew ? "Új erőforrás" : "Alapadatok"}</h2>
                {error !== "" ? <Alert severity="error">{error}</Alert> : <></>}
                <TextField label="Név" required value={form.title} onChange={change("title")} autoFocus={isNew} />

                <h3>Egyedi mezők</h3>
                <p className="admin-section_hint">Például férőhely, helyszín vagy emelet. A felhasználók is látják.</p>
                {form.customFields.map((field, index) =>
                    <div className="custom-field" key={index}>
                        <TextField label="Mező neve" value={field.label} onChange={changeField(index, "label")} />
                        <TextField label="Érték" value={field.value} onChange={changeField(index, "value")} />
                        <IconButton aria-label="mező törlése"
                            onClick={() => set("customFields", form.customFields.filter((_, i) => i !== index))}>
                            <DeleteIcon />
                        </IconButton>
                    </div>
                )}
                <Button startIcon={<AddIcon />} onClick={() => set("customFields", [...form.customFields, { label: "", value: "" }])}
                    className="admin-section_add">
                    Mező hozzáadása
                </Button>

                <h3>Foglalási szabályok</h3>
                <p className="admin-section_hint">A felhasználók foglalásaira érvényesek. Üresen hagyva nincs korlát.</p>
                <div className="admin-section_row">
                    <TextField label="Legrövidebb foglalás" type="number" value={form.minLengthMinutes} onChange={change("minLengthMinutes")}
                        inputProps={{ min: 1 }} InputProps={{ endAdornment: <InputAdornment position="end">perc</InputAdornment> }} />
                    <TextField label="Leghosszabb foglalás" type="number" value={form.maxLengthMinutes} onChange={change("maxLengthMinutes")}
                        inputProps={{ min: 1 }} InputProps={{ endAdornment: <InputAdornment position="end">perc</InputAdornment> }} />
                </div>
                <div className="admin-section_row">
                    <TextField label="Nyitás" type="time" value={form.openFrom} onChange={change("openFrom")}
                        InputLabelProps={{ shrink: true }} />
                    <TextField label="Zárás" type="time" value={form.openTo} onChange={change("openTo")}
                        InputLabelProps={{ shrink: true }} />
                    <TextField label="Legfeljebb ennyi nappal előre" type="number" value={form.maxDaysAhead} onChange={change("maxDaysAhead")}
                        inputProps={{ min: 1 }} InputProps={{ endAdornment: <InputAdornment position="end">nap</InputAdornment> }} />
                </div>
                <div>
                    <p className="admin-section_label">Foglalható napok</p>
                    <ToggleButtonGroup color="primary" value={form.openDays} onChange={(event, days) => set("openDays", days)}
                        aria-label="Foglalható napok" className="day-toggles">
                        {weekDays.map(day => <ToggleButton key={day.value} value={day.value}>{day.label}</ToggleButton>)}
                    </ToggleButtonGroup>
                </div>

                <div className="admin-section_actions">
                    <Button type="submit" variant="contained" size="large" disabled={saving}>{isNew ? "Létrehozás" : "Mentés"}</Button>
                </div>
            </form>

            {isNew ? <></> :
                <>
                    <ResourceReservations resourceId={resource.id} showMessage={showMessage} />
                    <section className="admin-section admin-section_danger">
                        <h2>Erőforrás törlése</h2>
                        <p className="admin-section_hint">
                            Az erőforrás és a foglalásai nem vesznek el, csak elrejtjük őket. A közelgő foglalások gazdáit értesíthetjük.
                        </p>
                        <div>
                            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => setRemoveOpen(true)}>
                                Erőforrás törlése
                            </Button>
                        </div>
                    </section>
                    <RemoveResourceDialog resource={resource} open={removeOpen} onClose={() => setRemoveOpen(false)}
                        removeResource={removeResource} onRemoved={onRemoved} />
                </>
            }
        </div>
    );
}
