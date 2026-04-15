import { useState, useEffect, useRef } from 'react'  // useRef tracks previous streak value
import { useNavigate } from 'react-router-dom'
import '../App.css'

function getTodayDate() {
    return new Date().toISOString().split('T')[0]
}

// confetti colours matching the RPG gold/purple theme
const CONFETTI_COLOURS = ['#f0c040', '#c9a84c', '#9b59b6', '#7d3c98', '#ffffff']

function Home() {
    const navigate = useNavigate()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [chores, setChores] = useState(() => {
        const saved = localStorage.getItem('chores')
        return saved ? JSON.parse(saved) : [
            { id: 1, text: 'Wash dishes', done: false },
            { id: 2, text: 'Hoover living room', done: false },
            { id: 3, text: 'Take out bins', done: false },
        ]
    })
    const [newChore, setNewChore] = useState('')
    const [points, setPoints] = useState(() => parseInt(localStorage.getItem('points') || '0'))
    const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('streak') || '0'))
    const [badges, setBadges] = useState(() => JSON.parse(localStorage.getItem('badges') || '[]'))
    const [popup, setPopup] = useState(null)  // floating +10/-10 popup
    const [confetti, setConfetti] = useState([])  // array of confetti pieces
    const [removingId, setRemovingId] = useState(null)  // id of chore being deleted
    const [streakShake, setStreakShake] = useState(false)  // triggers streak shake
    const prevStreakRef = useRef(streak)  // tracks previous streak to detect changes

    // badge thresholds used for both checking and progress bar
    const allBadges = [
        { id: 1, label: '🌟 First Steps', requirement: 10 },
        { id: 2, label: '🔥 On Fire', requirement: 50 },
        { id: 3, label: '💪 Chore Champion', requirement: 100 },
    ]

    // works out progress towards the next badge
    function getProgressToNextBadge(currentPoints) {
        const next = allBadges.find(b => currentPoints < b.requirement)
        if (!next) return { label: '🏆 Max level!', percent: 100, current: currentPoints, target: currentPoints }
        const prev = allBadges.filter(b => b.requirement <= currentPoints).pop()
        const from = prev ? prev.requirement : 0
        const percent = Math.round(((currentPoints - from) / (next.requirement - from)) * 100)
        return { label: next.label, percent, current: currentPoints - from, target: next.requirement - from }
    }

    function checkBadges(currentPoints) {
        const earned = allBadges.filter(b => currentPoints >= b.requirement)
        setBadges(earned)
        localStorage.setItem('badges', JSON.stringify(earned))
    }

    // launches confetti pieces at random positions across the screen
    function launchConfetti() {
        const pieces = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,  // random horizontal position as percentage
            colour: CONFETTI_COLOURS[Math.floor(Math.random() * CONFETTI_COLOURS.length)],
            delay: Math.random() * 0.8,  // staggered fall timing
            size: Math.random() * 8 + 6,  // random size between 6-14px
        }))
        setConfetti(pieces)
        // clear confetti after animation finishes
        setTimeout(() => setConfetti([]), 2500)
    }

    function resetForNewDay(dateToSave) {
        const done = chores.filter(c => c.done).length
        const total = chores.length
        const history = JSON.parse(localStorage.getItem('history') || '[]')
        history.unshift({ date: dateToSave, done, total, chores, points })
        localStorage.setItem('history', JSON.stringify(history))
        const newStreak = done > 0 ? streak + 1 : 0
        setStreak(newStreak)
        localStorage.setItem('streak', newStreak.toString())
        const resetChores = chores.map(c => ({ ...c, done: false }))
        setChores(resetChores)
        localStorage.setItem('chores', JSON.stringify(resetChores))
    }

    useEffect(() => {
        const lastOpenedDate = localStorage.getItem('lastOpenedDate')
        const today = getTodayDate()
        if (lastOpenedDate && lastOpenedDate !== today) {
            resetForNewDay(lastOpenedDate)
        }
        localStorage.setItem('lastOpenedDate', today)
    }, [])

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
        return () => clearInterval(interval)
    }, [chores])

    useEffect(() => { localStorage.setItem('chores', JSON.stringify(chores)) }, [chores])
    useEffect(() => { localStorage.setItem('points', points.toString()) }, [points])

    // shake the streak counter whenever the streak increases
    useEffect(() => {
        if (streak > prevStreakRef.current) {
            setStreakShake(true)
            setTimeout(() => setStreakShake(false), 400)
        }
        prevStreakRef.current = streak
    }, [streak])

    function addChore() {
        if (newChore.trim() === '') return
        setChores([...chores, { id: Date.now(), text: newChore, done: false }])
        setNewChore('')
    }

    function toggleDone(id, event) {
        const chore = chores.find(c => c.id === id)
        const newPoints = chore.done ? points - 10 : points + 10
        setPoints(newPoints)
        checkBadges(newPoints)
        const updatedChores = chores.map(c => c.id === id ? { ...c, done: !c.done } : c)
        setChores(updatedChores)

        // show floating popup at button position
        const rect = event.target.getBoundingClientRect()
        setPopup({ x: rect.left, y: rect.top, text: chore.done ? '-10' : '+10' })
        setTimeout(() => setPopup(null), 1000)

        // launch confetti if all chores are now done
        const allDone = updatedChores.every(c => c.done)
        if (allDone && !chore.done) launchConfetti()
    }

    // plays slide out animation then removes the chore after it finishes
    function deleteChore(id) {
        setRemovingId(id)
        setTimeout(() => {
            setChores(chores.filter(c => c.id !== id))
            setRemovingId(null)
        }, 300)  // matches the slideOut animation duration
    }

    const progress = getProgressToNextBadge(points)

    return (
        <div className="app">
            <h1>🎮 My Chores</h1>

            <p className="datetime">
                {currentTime.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' — '}
                {currentTime.toLocaleTimeString('en-GB')}
            </p>

            {/* stats bar with shake effect on streak */}
            <div className="stats">
                <span>⭐ {points} points</span>
                <span> | </span>
                <span className={streakShake ? 'streak-shake' : ''}>🔥 {streak} day streak</span>
                <span> | </span>
                <span>{chores.filter(c => c.done).length} of {chores.length} done</span>
                <span> | </span>
                <span>{points >= 100 ? '🏆 Chore Master' : points >= 50 ? '⚡ Rising Star' : '🌱 Beginner'}</span>
            </div>

            {/* progress bar showing how close to the next badge */}
            <div className="progress-bar-container">
                <p className="progress-bar-label">
                    Next badge: {progress.label} — {progress.current}/{progress.target} pts
                </p>
                <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
                </div>
            </div>

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
                        <li key={chore.id} className={`${chore.done ? 'done' : ''} ${removingId === chore.id ? 'chore-removing' : ''}`}>
                            <span>{chore.text}</span>
                            <button onClick={(e) => toggleDone(chore.id, e)}>
                                {chore.done ? 'Undo' : 'Done ⭐'}
                            </button>
                            <button onClick={() => deleteChore(chore.id)}>✕</button>
                        </li>
                    ))
                )}
            </ul>

            {/* floating points popup */}
            {popup && (
                <div className="points-popup" style={{ left: popup.x, top: popup.y }}>
                    {popup.text}
                </div>
            )}

            {/* confetti pieces rendered at random positions */}
            {confetti.map(piece => (
                <div
                    key={piece.id}
                    className="confetti-piece"
                    style={{
                        left: `${piece.x}%`,
                        top: '-10px',
                        backgroundColor: piece.colour,
                        width: piece.size,
                        height: piece.size,
                        animationDelay: `${piece.delay}s`
                    }}
                />
            ))}
        </div>
    )
}

export default Home