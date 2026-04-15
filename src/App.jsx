import { BrowserRouter, Routes, Route } from 'react-router-dom'  // handles routing between pages
import Home from './pages/Home'
import History from './pages/History'

function App() {
  return (
      <BrowserRouter>  {/* wraps the app to enable URL-based navigation */}
        <Routes>
          <Route path="/" element={<Home />} />           {/* main page */}
          <Route path="/history" element={<History />} />  {/* history page */}
        </Routes>
      </BrowserRouter>
  )
}

export default App