import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AdminPage from "../../components/AdminPage";
import resourceImage from "../../images/resource.png";
import schedulingImage from "../../images/scheduling.svg";

const tiles = [
    {
        to: "/admin/eroforrasok",
        image: resourceImage,
        title: "Erőforrások kezelése",
        text: "Tárgyalók, parkolóhelyek és más foglalható erőforrások, a foglalásaikkal és szabályaikkal.",
    },
    {
        to: "/admin/egyeztetesek",
        image: schedulingImage,
        title: "Közös időpont-egyeztetés",
        text: "Szavazások a mindenkinek megfelelő időpontról.",
    },
];

// The admin home: the two main areas in the middle, and the user rights below
export default function AdminHome() {
    return (
        <AdminPage title="Adminisztráció">
            <div className="admin-home">
                <div className="admin-home_tiles">
                    {tiles.map(tile =>
                        <Link key={tile.to} to={tile.to} className="admin-tile">
                            <img src={tile.image} alt="" />
                            <div className="admin-tile_text">
                                <h2>{tile.title}</h2>
                                <p>{tile.text}</p>
                            </div>
                        </Link>
                    )}
                </div>
                <Button component={Link} to="/admin/felhasznalok" startIcon={<ManageAccountsIcon />} size="large">
                    Felhasználók és jogosultságok
                </Button>
            </div>
        </AdminPage>
    );
}
