import React, { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ThemeProvider } from "@mui/material";
import { appTheme } from "../AuthPage";
import CloseIcon from '@mui/icons-material/Close';
import LegalText from "./LegalText";
import { errorMessage } from "../../modules/api";

export const LEGAL_TITLES = { terms: "Felhasználási feltételek", privacy: "Adatkezelési tájékoztató" };

// The text of the terms or the privacy notice in a pop-up, loaded when it opens
export function LegalDialog({ kind, open, onClose }) {
    const [doc, setDoc] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setError("");
        axios.get(`/legal/${kind}`)
            .then(res => setDoc(res.data.result))
            .catch(err => setError(errorMessage(err, "Nem sikerült betölteni a szöveget!")));
    }, [kind, open]);

    return (
        <ThemeProvider theme={appTheme}>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper" aria-labelledby={`legal-${kind}-title`}>
                <DialogTitle id={`legal-${kind}-title`} className="legal-dialog_title">
                    {LEGAL_TITLES[kind]}
                    <IconButton onClick={onClose} aria-label="Bezárás"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {error !== "" ? <Alert severity="error">{error}</Alert> : <></>}
                    {doc
                        ? <>
                            <p className="legal-dialog_version">
                                {doc.version}. verzió{doc.createdAt ? `, hatályos: ${new Date(doc.createdAt).toLocaleDateString("hu-HU")}` : ""}
                            </p>
                            <LegalText body={doc.body} />
                        </>
                        : <></>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Bezárás</Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}

// A link-like button that opens the text. It can sit in a checkbox's label: opening it does not tick the box.
export default function LegalLink({ kind, children }) {
    const [open, setOpen] = useState(false);
    const openText = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
    };
    return (
        <>
            <button type="button" className="legal-link" onClick={openText}>{children || LEGAL_TITLES[kind]}</button>
            <LegalDialog kind={kind} open={open} onClose={() => setOpen(false)} />
        </>
    );
}
