import { useState } from 'react'
import './App.css'

function App() {
  const [result, setResult] = useState('')
  const [playerList, setPlayerList] = useState('')

  const handleCalculate = () => {
    // Add your calculation logic here
    console.log('Calculate button clicked')
  }

  return (
    <>
      <div className="app-container">
        <h1>VTTC Mon/Fri</h1>
        
        <div className="form-section">
          <div className="input-group">
            <label htmlFor="result">Result:</label>
            <textarea
              id="result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Result will appear here..."
              rows={10}
            />
          </div>

          <div className="input-group">
            <label htmlFor="playerList">Player List:</label>
            <textarea
              id="playerList"
              value={playerList}
              onChange={(e) => setPlayerList(e.target.value)}
              placeholder="Enter player list..."
              rows={10}
            />
          </div>

          <button onClick={handleCalculate} className="calculate-btn">
            Calculate
          </button>
        </div>
      </div>
    </>
  )
}

export default App
