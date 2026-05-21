import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import Home from './pages/Home';
import FireInspectionFormPage from './pages/FireInspectionFormPage';
import FireCodesPage from './pages/FireCodesPage';
import FireFormsPage from './pages/FireFormsPage';
import EmsFormsPage from './pages/EmsFormsPage';
import EmsProtocolsPage from './pages/EmsProtocolsPage';
import ImportantNumbers from './pages/ImportantNumbers';
import InspectionDivision from './pages/InspectionDivision';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ems-forms" element={<EmsFormsPage />} />
            <Route path="/ems-forms/protocols" element={<EmsProtocolsPage />} />
            <Route path="/fire-forms" element={<FireFormsPage />} />
            <Route path="/inspection-division" element={<InspectionDivision />} />
            <Route path="/inspection-division/fire-inspection-form" element={<FireInspectionFormPage />} />
            <Route path="/inspection-division/burn-permit" element={<PlaceholderPage title="Burn Permit" backTo="/inspection-division" />} />
            <Route path="/inspection-division/codes" element={<FireCodesPage />} />
            <Route path="/investigation-division" element={<PlaceholderPage title="Investigation Division" />} />
            <Route path="/important-numbers" element={<ImportantNumbers />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
