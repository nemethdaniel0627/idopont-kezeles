import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Snackbar, Switch } from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import GavelIcon from '@mui/icons-material/Gavel';
import AdminPage from "../../components/AdminPage";
import { useSettings } from "../../auth/SettingsContext";
import { errorMessage } from "../../modules/api";
import resourceImage from "../../images/resource.png";
import schedulingImage from "../../images/scheduling.svg";

const tiles = [
    {
        to: "/admin/eroforrasok",
        image: resourceImage,
        title: "Erőforrások kezelése",
        text: "Tárgyalók, parkolóhelyek és más foglalható erőforrások, a foglalásaikkal és szabályaikkal.",
        setting: "bookingEnabled",
        feature: "Foglalás",
        offText: "A felhasználók nem látják az erőforrásokat, és nem foglalhatnak, nem módosíthatnak és nem mondhatnak le. "
            + "A meglévő foglalások megmaradnak, és visszakapcsoláskor újra látszanak.",
    },
    {
        to: "/admin/egyeztetesek",
        image: schedulingImage,
        title: "Közös időpont-egyeztetés",
        text: "Szavazások a mindenkinek megfelelő időpontról.",
        setting: "pollsEnabled",
        feature: "Időpont-egyeztetés",
        offText: "A felhasználók nem hozhatnak létre egyeztetést, és a meglévők linkjei sem nyílnak meg. "
            + "Az egyeztetések és a válaszok megmaradnak, és visszakapcsoláskor újra elérhetők.",
    },
];

// The admin home: the two main areas in the middle, each with its on/off switch, and the user rights below
export default function AdminHome() {
    const { settings, saveSettings } = useSettings();
    // The tile whose feature is about to be turned off, asked first since users lose it at once
    const [turningOff, setTurningOff] = useState(null);
    const [message, setMessage] = useState(null);

    const save = async (tile, on) => {
        setTurningOff(null);
        try {
            await saveSettings({ [tile.setting]: on });
            setMessage({ severity: "success", text: `${tile.feature}: ${on ? "bekapcsolva" : "kikapcsolva"}.` });
        } catch (err) {
            setMessage({ severity: "error", text: errorMessage(err, "Nem sikerült menteni a beállítást!") });
        }
    };

    return (
        <AdminPage title="Adminisztráció">
            <div className="admin-home">
                <div className="admin-home_tiles">
                    {tiles.map(tile => {
                        const on = settings[tile.setting];
                        return (
                            <div key={tile.to} className={`admin-tile${on ? "" : " off"}`}>
                                <img src={tile.image} alt="" />
                                <div className="admin-tile_text">
                                    <div className="admin-tile_title-row">
                                        {/* The link covers the whole tile; the switch sits above it */}
                                        <h2><Link to={tile.to} className="admin-tile_link">{tile.title}</Link></h2>
                                        <FormControlLabel className="admin-tile_switch" labelPlacement="start"
                                            label={on ? "Be" : "Ki"}
                                            control={<Switch checked={on} onChange={event => event.target.checked ? save(tile, true) : setTurningOff(tile)}
                                                inputProps={{ "aria-label": `${tile.feature} bekapcsolva` }} />} />
                                    </div>
                                    <p>{tile.text}</p>
                                    {on ? <></> : <p className="admin-tile_off">Kikapcsolva: a felhasználók nem érik el. Adminként te továbbra is használhatod.</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="admin-home_links">
                    <Button component={Link} to="/admin/felhasznalok" startIcon={<ManageAccountsIcon />} size="large">
                        Felhasználók és jogosultságok
                    </Button>
                    <Button component={Link} to="/admin/jogi-szovegek" startIcon={<GavelIcon />} size="large">
                        Feltételek és adatkezelés
                    </Button>
                </div>
            </div>
            <Dialog open={turningOff !== null} onClose={() => setTurningOff(null)} maxWidth="xs">
                <DialogTitle>{turningOff ? `${turningOff.feature} kikapcsolása` : ""}</DialogTitle>
                <DialogContent>{turningOff ? turningOff.offText : ""}</DialogContent>
                <DialogActions>
                    <Button onClick={() => setTurningOff(null)}>Mégse</Button>
                    <Button variant="contained" color="error" onClick={() => save(turningOff, false)}>Kikapcsolom</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={message !== null} autoHideDuration={5000} onClose={() => setMessage(null)}>
                <Alert severity={message ? message.severity : "success"} onClose={() => setMessage(null)}>{message ? message.text : ""}</Alert>
            </Snackbar>
        </AdminPage>
    );
}
