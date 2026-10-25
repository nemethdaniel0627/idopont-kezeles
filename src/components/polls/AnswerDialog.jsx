import React, { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ThemeProvider } from "@mui/material";
import { appTheme } from "../AuthPage";

// Before marking the times: the respondent's name, and optionally an email or phone for the organizer.
// `initial` is { name, contactEmail, contactPhone }; onContinue gets the same shape. `existingNames` are the names
// that already answered (when answers are visible), so typing one of them is pointed out before it is overwritten.
export default function AnswerDialog({ open, initial, existingNames = [], onClose, onContinue }) {
    const [values, setValues] = useState(initial);
    // Filled in again each time the dialog opens, not while typing
    useEffect(() => {
        if (open) setValues(initial);
        // eslint-disable-next-line
    }, [open]);
    const change = field => event => setValues(previous => ({ ...previous, [field]: event.target.value }));
    const key = name => name.trim().replace(/s+/g, " ").toLowerCase();
    const taken = values.name.trim() !== "" && existingNames.some(name => key(name) === key(values.name));

    const submit = (event) => {
        event.preventDefault();
        onContinue({ ...values, name: values.name.trim() });
    };

    return (
        <ThemeProvider theme={appTheme}>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
                <form onSubmit={submit}>
                    <DialogTitle>Időpontjaid megadása</DialogTitle>
                    <DialogContent className="contact-dialog">
                        <TextField label="Neved" required autoFocus fullWidth value={values.name} onChange={change("name")}
                            inputProps={{ maxLength: 50 }} helperText="Ezen a néven látják a válaszodat." />
                        {taken
                            ? <Alert severity="warning">
                                Ezzel a névvel már válaszolt valaki. Ha te vagy, most a válaszodat módosítod; ha nem, adj meg más nevet
                                (pl. a vezetékneveddel együtt), különben felülírod az övét.
                            </Alert>
                            : <></>}
                        <TextField label="E-mail (nem kötelező)" type="email" fullWidth value={values.contactEmail} onChange={change("contactEmail")} />
                        <TextField label="Telefonszám (nem kötelező)" type="tel" fullWidth value={values.contactPhone} onChange={change("contactPhone")}
                            helperText="Az e-mail címet és a telefonszámot csak a szervező és az adminok látják." />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>Mégse</Button>
                        <Button type="submit" variant="contained">Tovább</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </ThemeProvider>
    );
}
