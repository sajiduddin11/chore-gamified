import { useState, useEffect } from 'react'  // hooks for managing state and side effects
import { useNavigate } from 'react-router-dom'  // navigation between pages
import '../App.css'

// returns today's date as a string e.g. "2026-04-15"
function getTodayDate() {
    return new Date().toISOString().split('T')[0]
}

function Home() {
    const navigate = useNavigate()
    const [currentTime, setCurrentTime] = useState(new Date())

    // initialise chores from localStorage, fall back to defaults if nothing saved
    const [chores, setChores] = useState(() => {
        const saved = localStorage.getItem('chores')
        return saved ? JSON.parse(saved) : [
            { id: 1, text: 'Wash dishes', done: false },
            { id: 2, text: 'Hoover living room', done: false },
            { id: 3, text: 'Take out bins', done: false },
        ]
    })

    const [newChore, setNewChore] = useState('')

    // initialise gamification state from localStorage so progress persists on refresh
    const [points, setPoints] = useState(() => parseInt(localStorage.getItem('points') || '0'))
    const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('streak') || '0'))
    const [badges, setBadges] = useState(() => JSON.parse(localStorage.getItem('badges') || '[]'))

    // compares current points against badge thresholds and unlocks any newly earned badges
    function checkBadges(currentPoints) {
        const allBadges = [
            { id: 1, label: '🌟 First Steps', requirement: 10, description: 'Earn 10 points' },
            { id: 2, label: '🔥 On Fire', requirement: 50, description: 'Earn 50 points' },
            { id: 3, label: '💪 Chore Champion', requirement: 100, description: 'Earn 100 points' },
        ]
        const earned = allBadges.filter(b => currentPoints >= b.requirement)
        setBadges(earned)
        localStorage.setItem('badges', JSON.stringify(earned))
    }

    // saves the day's progress to history, updates streak, then resets chores for the new day
    function resetForNewDay(dateToSave) {
        const done = chores.filter(c => c.done).length
        const total = chores.length

        // append today's entry to the top of the history array
        const history = JSON.parse(localStorage.getItem('history') || '[]')
        history.unshift({ date: dateToSave, done, total, chores, points })
        localStorage.setItem('history', JSON.stringify(history))

        // increment streak if at least one chore was completed, otherwise reset it
        const newStreak = done > 0 ? streak + 1 : 0
        setStreak(newStreak)
        localStorage.setItem('streak', newStreak.toString())

        // reset all chores to incomplete for the new day
        const resetChores = chores.map(c => ({ ...c, done: false }))
        setChores(resetChores)
        localStorage.setItem('chores', JSON.stringify(resetChores))
    }

    // on mount, check if the app was last opened on a previous day and trigger a reset if so
    useEffect(() => {
        const lastOpenedDate = localStorage.getItem('lastOpenedDate')
        const today = getTodayDate()
        if (lastOpenedDate && lastOpenedDate !== today) {
            resetForNewDay(lastOpenedDate)
        }
        localStorage.setItem('lastOpenedDate', today)
    }, [])

    // runs every second to keep the clock updated and trigger a reset at exactly midnight
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            setCurrentTime(now)
            if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                resetForNewDay(yesterday.toISOString().split('T')[0])
                localStorage.setItem('lastOpenedDate', getTodayDate())
            }
        }, 1000)
        return () => clearInterval(interval)  // cleanup interval on unmount
    }, [chores])

    // persist chores and points to localStorage whenever they change
    useEffect(() => { localStorage.setItem('chores', JSON.stringify(chores)) }, [chores])
    useEffect(() => { localStorage.setItem('points', points.toString()) }, [points])

    function addChore() {
        if (newChore.trim() === '') return
        setChores([...chores, { id: Date.now(), text: newChore, done: false }])
        setNewChore('')
    }

    // toggling a chore awards or deducts 10 points and re-evaluates badge eligibility
    function toggleDone(id) {
        const chore = chores.find(c => c.id === id)
        const newPoints = chore.done ? points - 10 : points + 10
        setPoints(newPoints)
        checkBadges(newPoints)
        setChores(chores.map(c => c.id === id ? { ...c, done: !c.done } : c))
    }

    function deleteChore(id) {
        setChores(chores.filter(c => c.id !== id))
    }

    return (
        <div className="app">
            <h1>🎮 My Chores</h1>

            {/* live clock, updates every second via the interval above */}
            <p className="datetime">
                {currentTime.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' — '}
                {currentTime.toLocaleTimeString('en-GB')}
            </p>

            {/* gamification stats separated by pipes for readability */}
            <div className="stats">
                <span>⭐ {points} points</span>
                <span> | </span>
                <span>🔥 {streak} day streak</span>
                <span> | </span>
                <span>{chores.filter(c => c.done).length} of {chores.length} done</span>
                <span> | </span>
                {/* level based on total points earned */}
                <span>
        {points >= 100 ? '🏆 Chore Master' : points >= 50 ? '⚡ Rising Star' : '🌱 Beginner'}
    </span>
            </div>

            {/* badge section only renders if at least one badge has been earned */}
            {badges.length > 0 && (
                <div className="badges">
                    <h3>🏅 Badges</h3>
                    {badges.map(badge => (
                        <span key={badge.id} className="badge">{badge.label}</span>
                    ))}
                </div>
            )}

            <button onClick={() => navigate('/history')}>📅 View History</button>

            <div className="add-chore">
                <input
                    value={newChore}
                    onChange={e => setNewChore(e.target.value)}
                    placeholder="Add a new chore..."
                />
                <button onClick={addChore}>Add</button>
            </div>

            <ul>
                {chores.length === 0 ? (
                    <p>No chores, you're all done! 🎉</p>
                ) : (
                    chores.map(chore => (
                        <li key={chore.id} className={chore.done ? 'done' : ''}>
                            <span>{chore.text}</span>
                            <button onClick={() => toggleDone(chore.id)}>
                                {chore.done ? 'Undo' : 'Done ⭐'}
                            </button>
                            <button onClick={() => deleteChore(chore.id)}>✕</button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    )
}

export default Home