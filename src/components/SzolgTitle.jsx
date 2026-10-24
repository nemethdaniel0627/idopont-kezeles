import { Button, IconButton } from "@mui/material"
import React from "react"
import EditIcon from '@mui/icons-material/Edit';

export default function SzolgTitle(props) {
    return (
        <h3 className="service_title">
            {props.title}
            {props.edit ?
                <Button onClick={props.onClick} size="large" variant="contained" startIcon={<EditIcon />}>
                    Szerkesztés
                </Button>
                : <></>
            }
        </h3>
    )
}