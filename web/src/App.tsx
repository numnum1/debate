import { Route, Routes } from 'react-router'

import { HomePage } from '@/pages/home/HomePage'
import { LandingPage } from '@/pages/LandingPage'
import { ProfilePage } from '@/pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/home/:debateId" element={<HomePage />} />
      <Route path="/profil" element={<ProfilePage />} />
    </Routes>
  )
}

export default App
