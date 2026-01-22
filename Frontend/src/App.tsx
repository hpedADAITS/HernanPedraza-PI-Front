import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Layouts
import { PublicLayout } from './components/layouts/PublicLayout';
import { PrivateLayout } from './components/layouts/PrivateLayout';

// Pages
import { RoleSelection } from './components/pages/RoleSelection';
import { AttendeeLogin } from './components/pages/AttendeeLogin';
import { DjLogin } from './components/pages/DjLogin';
import { AttendeeDashboard } from './components/pages/AttendeeDashboard';
import { DjDashboard } from './components/pages/DjDashboard';
import { SongSelection } from './components/pages/SongSelection';
import { NotFound } from './components/pages/NotFound';
import { Unauthorized } from './components/pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/role" element={<RoleSelection />} />
          <Route path="/login/attendee" element={<AttendeeLogin />} />
          <Route path="/login/dj" element={<DjLogin />} />
        </Route>

        {/* Protected Attendee Routes */}
        <Route
          element={
            <ProtectedRoute requiredRole="attendee">
              <PrivateLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/attendee/dashboard" element={<AttendeeDashboard />} />
          <Route path="/attendee/songs" element={<SongSelection />} />
        </Route>

        {/* Protected DJ Routes */}
        <Route
          element={
            <ProtectedRoute requiredRole="dj">
              <PrivateLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dj/dashboard" element={<DjDashboard />} />
          <Route path="/dj/songs" element={<SongSelection />} />
        </Route>

        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
