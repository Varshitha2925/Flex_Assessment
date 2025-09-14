import React from 'react';
import './styles.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage.jsx';
import PropertyPage from './pages/PropertyPage.jsx';
import PropertiesPage from './pages/PropertiesPage.jsx';
import ReviewsPage from './pages/ReviewsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<DashboardPage/>} />
          <Route path="/properties" element={<PropertiesPage/>} />
          <Route path="/reviews" element={<ReviewsPage/>} />
          <Route path="/analytics" element={<AnalyticsPage/>} />
          <Route path="/property/:name" element={<PropertyPage/>} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
