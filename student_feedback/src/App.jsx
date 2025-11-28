import { StrictMode } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import StudentFeedback from './StudentFeedback'
import './StudentFeedback.css'

function App() {
  return (
    <StrictMode>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Course Feedback (React)</h1>
      <StudentFeedback />
    </StrictMode>
  )
}

export default App
