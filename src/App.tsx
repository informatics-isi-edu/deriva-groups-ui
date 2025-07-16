import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast, ToastBar } from 'react-hot-toast';
import { AuthProvider } from './shared/contexts/AuthContext';
import Layout from './shared/components/Layout';
import Dashboard from './apps/groups/pages/Dashboard';
import Groups from './apps/groups/pages/Groups';
import GroupDetail from './apps/groups/pages/GroupDetail';
import Invitations from './apps/groups/pages/Invitations';
import AcceptInvitation from './apps/groups/pages/AcceptInvitation';
import RequestToJoin from './apps/groups/pages/RequestToJoin';
import ProtectedRoute from './shared/components/ProtectedRoute';

function App() {
  // Get the base path for React Router from environment variables
  const getBasename = () => {
    // Use environment variable for UI base path
    if (import.meta.env.VITE_UI_BASE_PATH) {
      return import.meta.env.VITE_UI_BASE_PATH;
    }
    // Fallback for development
    return '/deriva/apps/groups';
  };

  console.log("=== ENV VAR TEST ===");
  console.log("import.meta.env:", import.meta.env);

  const basename = getBasename();

  return (
    <AuthProvider>
      <Router basename={basename}>
        <div className="min-h-screen bg-gray-50">
          <Toaster
            position="top-right"
            toastOptions={{
              // Global settings for all toasts
              duration: 4000, // Default for success/info toasts
              error: {
                duration: 20000, // Keep 20s for errors
                style: {
                  border: '1px solid #ef4444',
                },
              },
              success: {
                duration: 4000, // Shorter for success messages
              },
            }}
          >
            {(t) => (
              <div
                className="cursor-pointer"
                onClick={() => toast.dismiss(t.id)}
              >
                <ToastBar toast={t} />
              </div>
            )}
          </Toaster>
          <Routes>
            {/* Public routes */}
            <Route path="/invitation/:token" element={<AcceptInvitation />} />
            <Route path="/join/:token" element={<RequestToJoin />} />
            <Route path="/join-group/:groupId" element={<RequestToJoin />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="detail" element={<Groups />} />
              <Route path="detail/:groupId" element={<GroupDetail />} />
              <Route path="invitations" element={<Invitations />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;