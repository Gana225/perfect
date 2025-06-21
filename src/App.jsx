// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Import router components
import { useAuth } from './AuthContext';
import LandingPage from './LandingPage';
import PortalLayout from './PortalLayout';
import { LoadingSpinner } from './uiComponents';

function App() {
    const { currentUser, isLoading} = useAuth(); // Also get isAdmin here if needed for top-level redirects

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <LoadingSpinner size={60} message="Loading application..." />
            </div>
        );
    }

    return (
        <Router> {/* Wrap your entire app with BrowserRouter */}
            <div className="App min-h-screen font-sans antialiased text-gray-900 dark:text-gray-100 flex flex-col">
                <Routes>
                    {/* Route for the Landing Page (Login/Signup) */}
                    <Route
                        path="/login"
                        element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />}
                    />
                    <Route
                        path="/signup" // Assuming you might have a separate signup route on the landing page
                        element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />}
                    />

                    {/* Authenticated Routes - all nested within PortalLayout */}
                    {/* This route renders PortalLayout, and PortalLayout will handle its own nested routes */}
                    <Route
                        path="/*" // Match any path if currentUser exists, then PortalLayout handles sub-routes
                        element={currentUser ? <PortalLayout /> : <Navigate to="/login" replace />}
                    />

                    {/* Default route: if not logged in, redirect to /login; if logged in, redirect to /dashboard */}
                    <Route
                        path="/"
                        element={currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
                    />

                    {/* Optional: A 404 Not Found route */}
                    <Route path="*" element={<NotFoundPage />} />


                </Routes>
            </div>
        </Router>
    );
}

// Simple 404 Page (you can make this more elaborate)
const NotFoundPage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300">
        <h2 className="text-4xl font-bold mb-4">404</h2>
        <p className="text-xl">Page Not Found</p>
        <Link to="/dashboard" className="mt-6 text-blue-600 hover:underline">Go to Dashboard</Link>
    </div>
);


export default App;