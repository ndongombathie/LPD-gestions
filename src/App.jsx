import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Connexion from './authentification/login/connexion.jsx'


import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Inscription from "./authentification/register/Inscription";


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Connexion />
      
    </>
  )


 /* return (
    <Router>
      <Routes>
        <Route path="/" element={<Connexion />} />
        <Route path="/register" element={<Inscription />} />
      </Routes>
    </Router>
  );*/
}

export default App
