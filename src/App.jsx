import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { LoginPage } from './authentification/login/LoginPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <LoginPage darkMode={false}/>
    </>
  )
}

export default App
