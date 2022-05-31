import React from "react";
import Home from "./pages/Home";
import "./scss/styles.scss";
import { Routes, Route } from 'react-router-dom';
import AdminSzolgaltatas from "./pages/AdminSzolgaltatas";
import Nav from "./components/Nav"

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminSzolgaltatas />} />
      </Routes>
    </>
  );
}
