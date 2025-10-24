import { useState } from 'react'
import './App.css'

const rdiff = [
  [3, 0],
  [5, -2],
  [8, -5],
  [10, -7],
  [13, -9],
  [15, -11],
  [18, -14],
  [20, -16],
  [25, -21],
  [30, -26],
  [35, -31],
  [40, -36],
  [45, -41],
  [50, -45],
  [55, -50],
]
const rdelta = [
  401, 301, 201, 151, 101, 51, 26, -24, -49, -99, -149, -199, -299, -399,
]

function App() {
  const [result, setResult] = useState('')
  const [playerList, setPlayerList] = useState('')
  const [updatedPlayerList, setUpdatedPlayerList] = useState('')


  // Function to parse a single match result line
  const parseMatchResult = (line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return null
    
    // Ignore rows containing ",Bye,0"
    if (trimmedLine.includes(',Bye,0')) {
      return null
    }

    try {
      // Split by comma to get the 4 parts
      const parts = trimmedLine.split(',')
      if (parts.length !== 4) {
        throw new Error('Invalid format: expected 4 comma-separated values')
      }

      // Parse player 1: name(bracket)
      const player1Match = parts[0].match(/^(.+)\((\d+)\)$/)
      if (!player1Match) {
        throw new Error('Invalid player 1 format: expected "Name(bracket)"')
      }
      const player1Name = player1Match[1].trim()
      const player1Bracket = parseInt(player1Match[2])

      // Parse player 1 games won
      const player1Games = parseInt(parts[1].trim())
      if (isNaN(player1Games)) {
        throw new Error('Invalid player 1 games: must be a number')
      }

      // Parse player 2: name(bracket)
      const player2Match = parts[2].match(/^(.+)\((\d+)\)$/)
      if (!player2Match) {
        throw new Error('Invalid player 2 format: expected "Name(bracket)"')
      }
      const player2Name = player2Match[1].trim()
      const player2Bracket = parseInt(player2Match[2])

      // Parse player 2 games won
      const player2Games = parseInt(parts[3].trim())
      if (isNaN(player2Games)) {
        throw new Error('Invalid player 2 games: must be a number')
      }

      return {
        player1: {
          name: player1Name,
          bracket: player1Bracket,
          gamesWon: player1Games
        },
        player2: {
          name: player2Name,
          bracket: player2Bracket,
          gamesWon: player2Games
        },
        winner: player1Games > player2Games ? 'player1' : player2Games > player1Games ? 'player2' : 'tie'
      }
    } catch (error) {
      console.error(`Error parsing line "${line}":`, error.message)
      return { error: error.message, line: line }
    }
  }

  // Function to parse all match results
  const parseAllResults = (resultText) => {
    const lines = resultText.split('\n')
    const parsedResults = []
    const errors = []

    lines.forEach((line, index) => {
      const parsed = parseMatchResult(line)
      if (parsed) {
        if (parsed.error) {
          errors.push({ lineNumber: index + 1, ...parsed })
        } else {
          parsedResults.push({ lineNumber: index + 1, ...parsed })
        }
      }
    })

    return { results: parsedResults, errors }
  }

  // Function to parse a single player line
  const parsePlayer = (line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return null

    try {
      // Split by comma to get the 4 parts
      const parts = trimmedLine.split(',')
      if (parts.length !== 4) {
        throw new Error('Invalid format: expected 4 comma-separated values')
      }

      // Parse player ID
      const id = parseInt(parts[0].trim())
      if (isNaN(id)) {
        throw new Error('Invalid player ID: must be a number')
      }

      // Parse player name and bracket: name(bracket)
      const nameMatch = parts[1].match(/^(.+)\((\d+)\)$/)
      if (!nameMatch) {
        throw new Error('Invalid name format: expected "Name(bracket)"')
      }
      const name = nameMatch[1].trim()
      const bracket = parseInt(nameMatch[2])

      // Parse rating
      const rating = parseInt(parts[2].trim())
      if (isNaN(rating)) {
        throw new Error('Invalid rating: must be a number')
      }

      // Parse memo (can be any string)
      const memo = parts[3].trim()

      return {
        id,
        name,
        bracket,
        rating,
        memo
      }
    } catch (error) {
      console.error(`Error parsing player line "${line}":`, error.message)
      return { error: error.message, line: line }
    }
  }

  // Function to parse all players
  const parseAllPlayers = (playerText) => {
    const lines = playerText.split('\n')
    const parsedPlayers = []
    const errors = []

    lines.forEach((line, index) => {
      const parsed = parsePlayer(line)
      if (parsed) {
        if (parsed.error) {
          errors.push({ lineNumber: index + 1, ...parsed })
        } else {
          parsedPlayers.push({ lineNumber: index + 1, ...parsed })
        }
      }
    })

    return { players: parsedPlayers, errors }
  }

  // Function to find the rating delta index
  const findRatingDeltaIndex = (d) => {
    for (let i = 0; i < rdelta.length; i++) {
      if (d >= rdelta[i]) {
        return i
      }
    }
    return rdelta.length - 1 // Return last index if d is smaller than all values
  }

  // Function to determine bracket/division based on rating
  const getBracketFromRating = (rating) => {
    if (rating >= 1900) return 1
    if (rating >= 1600) return 2
    if (rating >= 1300) return 3
    if (rating >= 1000) return 4
    if (rating >= 700) return 5
    if (rating >= 400) return 6
    return 7 // rating < 400
  }

  // Function to calculate new ratings based on match results
  const calculateNewRatings = (players, matchResults) => {
    // Create a map of player ratings by name for quick lookup
    const playerRatings = new Map()
    players.forEach(player => {
      playerRatings.set(player.name, player.rating)
    })

    // Process each match result
    matchResults.forEach(match => {
      if (match.winner === 'tie') {
        // Skip tie matches as no rating change occurs
        return
      }

      const player1Name = match.player1.name
      const player2Name = match.player2.name
      
      const player1Rating = playerRatings.get(player1Name)
      const player2Rating = playerRatings.get(player2Name)

      if (player1Rating === undefined || player2Rating === undefined) {
        console.warn(`Player not found in player list: ${player1Name} or ${player2Name}`)
        return
      }

      let winnerRating, loserRating, winnerName, loserName
      
      if (match.winner === 'player1') {
        winnerRating = player1Rating
        loserRating = player2Rating
        winnerName = player1Name
        loserName = player2Name
      } else {
        winnerRating = player2Rating
        loserRating = player1Rating
        winnerName = player2Name
        loserName = player1Name
      }

      // Calculate rating delta
      const d = winnerRating - loserRating
      
      // Find the index in rdelta array
      const index = findRatingDeltaIndex(d)
      
      // Apply rating changes
      const winnerGain = rdiff[index][0]
      const loserLoss = rdiff[index][1]
      
      const newWinnerRating = winnerRating + winnerGain
      const newLoserRating = loserRating + loserLoss
      
      playerRatings.set(winnerName, newWinnerRating)
      playerRatings.set(loserName, newLoserRating)

      // Get current brackets
      const winnerOldBracket = getBracketFromRating(winnerRating)
      const loserOldBracket = getBracketFromRating(loserRating)
      const winnerNewBracket = getBracketFromRating(newWinnerRating)
      const loserNewBracket = getBracketFromRating(newLoserRating)

      console.log(`Match: ${winnerName} (${winnerRating}) beat ${loserName} (${loserRating})`)
      console.log(`Rating delta: ${d}, Index: ${index}, Winner +${winnerGain}, Loser -${loserLoss}`)
      console.log(`New ratings: ${winnerName}: ${newWinnerRating}, ${loserName}: ${newLoserRating}`)
      
      // Log bracket changes if they occurred
      if (winnerOldBracket !== winnerNewBracket) {
        console.log(`${winnerName} bracket change: ${winnerOldBracket} → ${winnerNewBracket}`)
      }
      if (loserOldBracket !== loserNewBracket) {
        console.log(`${loserName} bracket change: ${loserOldBracket} → ${loserNewBracket}`)
      }
    })

    // Return updated player list with new ratings and brackets
    return players.map(player => {
      const newRating = playerRatings.get(player.name)
      const newBracket = getBracketFromRating(newRating)
      return {
        ...player,
        oldRating: player.rating,
        oldBracket: player.bracket,
        rating: newRating,
        bracket: newBracket
      }
    })
  }

  // Function to format updated players back to input format (without memo)
  const formatUpdatedPlayerList = (updatedPlayers) => {
    return updatedPlayers
      .map(player => `${player.id},${player.name}(${player.bracket}),${player.rating}`)
      .join('\n')
  }

  // Function to copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Copied to clipboard!')
    }
  }

  const handleCalculate = () => {
    const { results, errors: resultErrors } = parseAllResults(result)
    const { players, errors: playerErrors } = parseAllPlayers(playerList)
    
    console.log('Parsed Results:', results)
    console.log('Parsed Players:', players)
    
    if (resultErrors.length > 0) {
      console.log('Result Parsing Errors:', resultErrors)
      setUpdatedPlayerList('')
      return
    }
    if (playerErrors.length > 0) {
      console.log('Player Parsing Errors:', playerErrors)
      setUpdatedPlayerList('')
      return
    }

    if (results.length === 0 || players.length === 0) {
      console.log('No valid results or players to process')
      setUpdatedPlayerList('')
      return
    }

    // Calculate new ratings
    const updatedPlayers = calculateNewRatings(players, results)
    console.log('Updated Player Ratings:', updatedPlayers)
    
    // Format and set the updated player list output
    const formattedOutput = formatUpdatedPlayerList(updatedPlayers)
    setUpdatedPlayerList(formattedOutput)
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
              rows={20}
            />
          </div>

          <div className="input-group">
            <label htmlFor="playerList">Player List:</label>
            <textarea
              id="playerList"
              value={playerList}
              onChange={(e) => setPlayerList(e.target.value)}
              placeholder="Enter player list..."
              rows={20}
            />
          </div>

          <button onClick={handleCalculate} className="calculate-btn">
            Calculate
          </button>

          {updatedPlayerList && (
            <div className="output-section">
              <div className="output-header">
                <label>Updated Player List:</label>
                <button
                  onClick={() => copyToClipboard(updatedPlayerList)}
                  className="copy-btn"
                  title="Copy to clipboard"
                >
                  📋 Copy
                </button>
              </div>
              <textarea
                value={updatedPlayerList}
                readOnly
                rows={20}
                className="output-textarea"
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App
