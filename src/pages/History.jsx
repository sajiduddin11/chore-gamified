import { useNavigate } from 'react-router-dom'  // lets us navigate between pages
import '../App.css'  // our styling file

function History() {
    // loads all saved history from localStorage - if nothing saved yet, uses empty array
    const history = JSON.parse(localStorage.getItem('history') || '[]')

    const navigate = useNavigate()  // used to go back to the main chore page

    // removes all history from localStorage and refreshes the page
    function clearHistory() {
        localStorage.removeItem('history')  // deletes the history key from browser storage
        window.location.reload()  // refreshes the page so it shows the empty state message
    }

    // everything below is the UI - what shows up on screen
    return (
        <div className="app">
            <h1>📅 History</h1>

            {/* button that takes you back to the main chore page */}
            <button onClick={() => navigate('/')}>← Back to Chores</button>

            {/* button that wipes all history entries */}
            <button onClick={clearHistory}>🗑️ Clear History</button>

            {/* if history array is empty show a message, otherwise show the entries */}
            {history.length === 0 ? (
                <p>No history yet — come back tomorrow!</p>
            ) : (
                // loop through each saved day
                history.map((day, index) => (
                    <div key={index} className="history-day">

                        {/* show the date for that day */}
                        <h2>{day.date}</h2>

                        {/* show the overall score for that day */}
                        <p>{day.done} of {day.total} chores completed</p>
                        <p>⭐ {day.points} points earned</p>  {/* shows points for that day */}

                        {/* loop through each individual chore for that day */}
                        <ul>
                            {day.chores && day.chores.map(chore => (
                                <li key={chore.id}>
                                    {chore.done ? '✅' : '❌'} {chore.text}  {/* tick if done, cross if not */}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            )}
        </div>
    )
}

export default History  // makes this available to App.jsx