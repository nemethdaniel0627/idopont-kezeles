import React from "react";
import Home from "./pages/Home";
import "./scss/styles.scss";
import { Routes, Route } from 'react-router-dom';
import AdminSzolgaltatas from "./pages/AdminSzolgaltatas";
import Nav from "./components/Nav"

export default function App() {

  const tempDatas = [
    {
      id: 1,
      date: {
        start: new Date("2022-06-01"),
        end: new Date("2022-06-04")
      },
      title: "Tárgyaló 1",
      regularity: {
        measure: "day",
        repeatNumber: 5,
        endsOn: {
          type: "onDate",
          date: new Date("2022-06-13 0:0:0")
        }
      }
    },
    {
      id: 2,
      date: {
        start: new Date(),
        end: new Date()
      },
      title: "Tárgyaló 2",
      regularity: {
        measure: "week",
        repeatNumber: 2,
        days: ["Hé", "Sze"],
        endsOn: {
          type: "occurrence",
          occurrence: 1,
        }
      }
    },
  ]

  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home services={tempDatas} />} />
        <Route path="/admin" element={<AdminSzolgaltatas services={tempDatas} />} />
      </Routes>
    </>
  );
}
