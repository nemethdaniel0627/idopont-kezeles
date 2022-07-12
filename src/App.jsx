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
        start: new Date("2022-07-01 9:0:0"),
        end: new Date("2022-07-01 16:30:0")
      },
      allDay: false,
      title: "Tárgyaló 1",
      regularity: {
        measure: "day",
        repeatNumber: 5,
        endsOn: {
          type: "onDate",
          date: new Date("2022-07-13 0:0:0")
        }
      }
    },
    // {
    //   id: 2,
    //   date: {
    //     start: new Date("2022-07-01 8:0:0"),
    //     end: new Date("2022-07-02 9:0:0")
    //   },
    //   allDay: false,
    //   title: "Tárgyaló 2",
    //   regularity: {
    //     measure: "week",
    //     repeatNumber: 2,
    //     days: ["hétfő", "szerda"],
    //     endsOn: {
    //       // type: "occurrence",
    //       // occurrence: 3,
    //       // type: "onDate",
    //       // date: new Date("2022-07-15 0:0:0")
    //       type: "never"
    //     }
    //   }
    // },
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
