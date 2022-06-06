import React from "react";
import Home from "./pages/Home";
import "./scss/styles.scss";
import { Routes, Route } from 'react-router-dom';
import AdminSzolgaltatas from "./pages/AdminSzolgaltatas";
import Nav from "./components/Nav"

export default function App() {

  const tempDatas = [
    {
      date: {
        start: new Date("2022-06-01"),
        end: new Date("2022-06-03")
      },
      title: "Tárgyaló 1",
      regularity: "never"
    },
    {
      date: {
        start: new Date(),
        end: new Date()
      },
      title: "Tárgyaló 2",
      regularity: {
        measre: "week",
        repeatNumber: 2,
        days: []
      }
    },
  ]

  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminSzolgaltatas services={tempDatas} />} />
      </Routes>
    </>
  );
}
