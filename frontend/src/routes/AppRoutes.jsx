import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import WeakVocabularyPage from '../pages/WeakVocabularyPage.jsx'
import FillBlankPracticePage from '../pages/FillBlankPracticePage.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import PracticeSetupPage from '../pages/PracticeSetupPage.jsx'

export default function AppRoutes() {
  return <BrowserRouter><AppLayout><Routes><Route path="/weak-vocabulary" element={<WeakVocabularyPage />} />
    <Route path="/weak-vocabulary/practice" element={<PracticeSetupPage />} />
    <Route path="/weak-vocabulary/practice/:sessionId" element={<FillBlankPracticePage />} />
    <Route path="*" element={<Navigate to="/weak-vocabulary" replace />} /></Routes></AppLayout></BrowserRouter>
}
