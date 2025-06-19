// src/PortalLayout.jsx
import React, { useState } from 'react';
import { Routes, Route,Link, Navigate } from 'react-router-dom'; // Import Outlet, Link, Navigate
import { useAuth } from './AuthContext'; // To get isAdmin for navigation links and route protection
import { Button } from './uiComponents'; // Assuming Button is imported for header
import { Menu, X } from 'lucide-react'; // Icons for mobile menu

// Import your page components
import Dashboard from './Dashboard';
import MyProfile from './MyProfile';
import ManageEmployees from "./ManageEmployees.jsx";
import ManagePayments from "./ManagePayments.jsx";
import {navLinkClasses} from './styles.js';

const PortalLayout = () => {
    const { isAdmin, currentUser, logout } = useAuth(); // Assuming logout function is available
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // This PrivateRoute is specific to PortalLayout's nested routes
    const PrivateRouteForPortal = ({ children, requiredAdmin = false }) => {
        if (!currentUser) { // Should technically be caught by App.jsx, but good for safety
            return <Navigate to="/login" replace />;
        }
        if (requiredAdmin && !isAdmin) {
            return <Navigate to="/dashboard" replace />; // Redirect if not admin and admin is required
        }
        return children;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Mobile Menu Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } transition-transform duration-300 ease-in-out md:hidden`}
            >
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">Menu</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} icon={X} />
                </div>
                <nav className="flex flex-col p-4 space-y-2">
                    <Link to="/dashboard" className={navLinkClasses} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                    <Link to="/profile" className={navLinkClasses} onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
                    {isAdmin && (
                        <Link to="/manage-employees" className={navLinkClasses} onClick={() => setIsMobileMenuOpen(false)}>Manage Employees</Link>
                    )}
                    <Button onClick={logout} className="mt-4 hover:bg-red-500" variant="danger">Logout</Button>
                </nav>
            </aside>

            {/* Header / Nav Bar (Top) */}
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-30">
                <div className="flex items-center">
                    {/* Mobile Menu Button (Hamburger) */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden mr-2 sm:mr-3"
                        icon={Menu}
                    />
                    <h1 className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                        Employee Portal
                    </h1>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center mx-auto space-x-2 sm:space-x-4">
                    {/* The navLinks from your snippet, now using Link */}
                    <Link to="/dashboard" className={navLinkClasses}>Dashboard</Link>
                    <Link to="/profile" className={navLinkClasses}>My Profile</Link>
                    {isAdmin && (
                        <>
                        <Link to="/manage-employees" className={navLinkClasses}>Manage Employees</Link>
                        <Link to="/Payments" className={navLinkClasses}>Manage Payments</Link></>
                    )}
                </nav>

                {/* User/Logout button for desktop */}
                <div className="hidden md:flex items-center space-x-4">
                     <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Hello, {currentUser?.displayName || currentUser?.email || 'User'}!
                    </span>
                    <Button onClick={logout} variant="secondary" size="sm" className="hover:bg-red-500">Logout</Button>
                </div>
            </header>

            {/* Main content area where nested routes will be rendered */}
            <main className="flex-1 p-6 sm:p-8">
                <Routes>
                    {/* Define nested routes here. These paths are relative to the parent path (i.e., /* in App.jsx) */}
                    <Route
                        path="dashboard"
                        element={
                            <PrivateRouteForPortal>
                                <Dashboard />
                            </PrivateRouteForPortal>
                        }
                    />
                    <Route
                        path="profile"
                        element={
                            <PrivateRouteForPortal>
                                <MyProfile />
                            </PrivateRouteForPortal>
                        }
                    />
                    <Route
                        path="manage-employees"
                        element={
                            <PrivateRouteForPortal requiredAdmin={true}>
                                <ManageEmployees />
                            </PrivateRouteForPortal>
                        }
                    />

                    <Route
                        path="Payments"
                        element={
                            <PrivateRouteForPortal>
                                <ManagePayments />
                            </PrivateRouteForPortal>
                        }
                    />

                    {/* Default route within PortalLayout (e.g., if user navigates to / or /auth-path) */}
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default PortalLayout;