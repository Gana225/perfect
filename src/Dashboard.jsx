// src/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext'; // Re-adjusted path to './AuthContext'

import { Card, Button, Badge, LoadingSpinner, Alert, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Avatar, Modal } from './uiComponents'; // Re-adjusted path to './uiComponents'
import { Bell, User, LayoutDashboard, Search, ChevronDown, ChevronUp, X } from 'lucide-react'; // Import X for close icon

import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {announcemenstdata, db, usersdata} from './firebaseConfig'; // Re-adjusted path to './firebaseConfig'

// --- Sub-Component: AnnouncementCard (for Employee View) ---
const AnnouncementCard = ({ announcement }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Determine content to display based on expansion state and length
    const displayContent = isExpanded ? announcement.content : `${announcement.content.substring(0, 150)}${announcement.content.length > 150 ? '...' : ''}`;
    // Check if content is long enough to warrant an expand/collapse button
    const showExpandButton = announcement.content.length > 150;

    return (
        <Card className="flex flex-col relative">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {announcement.title}
                </h3>
                {/* Display 'NEW' badge if announcement is recent */}
                {announcement.isNew && (
                    <Badge variant="warning" className="ml-3 px-2 py-1 text-sm animate-pulse">NEW</Badge>
                )}
            </div>
            {/* Display announcement content */}
            <p className="break-words overflow-hidden w-full text-gray-700 dark:text-gray-300">
                {displayContent}
            </p>
            {/* Expand/Collapse button for long announcements */}
            {showExpandButton && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="self-end text-blue-500 hover:underline px-2 py-1"
                >
                    {isExpanded ? 'Show less' : 'Expand'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
            )}
            {/* Announcement timestamp */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                Announced: {announcement.createdAt.toLocaleDateString()} at {announcement.createdAt.toLocaleTimeString()}
            </p>
        </Card>
    );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
    // Access authentication context
    const { isAdmin, isLoading: authLoading } = useAuth();
    // State for announcements data
    const [announcements, setAnnouncements] = useState([]);
    // State for all employee data (including admins initially, then filtered)
    const [allEmployees, setAllEmployees] = useState([]);
    // State for overall data loading status
    const [loadingData, setLoadingData] = useState(true);
    // State for dashboard-specific errors
    const [dashboardError, setDashboardError] = useState(null);
    // State for search term in employee table
    const [searchTerm, setSearchTerm] = useState('');

    // State for displaying employee details in a modal
    const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);

    // Application ID (hardcoded as per previous code, ensure consistency with __app_id if dynamic)
    const appId = "egty-c7097"

    // Log app ID for debugging
    console.log("Dashboard: Current app.options.appId =", appId);

    // Function to get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) {
            return 'Good Morning';
        } else if (hour < 18) {
            return 'Good Afternoon';
        } else {
            return 'Good Evening';
        }
    };

    // Effect hook to fetch data based on user role and authentication status
    useEffect(() => {
        // Do not proceed if authentication is still loading
        if (authLoading) return;

        setLoadingData(true);
        setDashboardError(null);

        // Function to fetch announcements for non-admin users
        const fetchAnnouncements = () => {
            const announcementsCollectionRef = collection(db, announcemenstdata);
            const q = query(announcementsCollectionRef, orderBy('createdAt', 'desc'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

                const fetchedAnnouncements = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Convert Firestore Timestamp to Date object, or use existing Date string
                    const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);

                    // Normalize announcement date to start of day for comparison
                    const announcementDateOnly = new Date(createdAtDate);
                    announcementDateOnly.setHours(0, 0, 0, 0);

                    // Check if announcement date is today or a future date
                    const isNew = announcementDateOnly.getTime() >= today.getTime();

                    console.log(`Announcement: ${data.title}, CreatedAt: ${createdAtDate}, IsNew: ${isNew}`);

                    return {
                        id: doc.id,
                        ...data,
                        createdAt: createdAtDate,
                        isNew: isNew
                    };
                });
                setAnnouncements(fetchedAnnouncements);
                setLoadingData(false); // Data loaded
            }, (error) => {
                console.error("Dashboard: Error fetching announcements:", error);
                setDashboardError("Failed to load announcements. Please check console for details.");
                setLoadingData(false); // Stop loading even if error
            });
            return unsubscribe; // Return unsubscribe function for cleanup
        };

        // Function to fetch all employees for admin users
        const fetchAllEmployees = () => {
            // Collection path for user profiles (where employees are stored)
            const usersCollectionRef = collection(db, usersdata);
            const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
                const fetchedEmployees = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                    // Filter out Admin roles (using capital 'A' for consistency with common Firestore role naming)
                    .filter(employee => employee.role !== 'admin');
                setAllEmployees(fetchedEmployees); // Set the filtered list of employees
                setLoadingData(false); // Data loaded
            }, (error) => {
                console.error("Dashboard: Error fetching employees:", error);
                setDashboardError("Failed to load employee data. Please check console for details.");
                setLoadingData(false); // Stop loading even if error
            });
            return unsubscribe; // Return unsubscribe function for cleanup
        };

        let unsubscribeAnnouncements;
        let unsubscribeEmployees;

        // Fetch data based on user's admin status
        if (isAdmin) {
            unsubscribeEmployees = fetchAllEmployees();
        } else {
            unsubscribeAnnouncements = fetchAnnouncements();
        }

        // Cleanup function for Firestore listeners
        return () => {
            if (unsubscribeAnnouncements) unsubscribeAnnouncements();
            if (unsubscribeEmployees) unsubscribeEmployees();
        };
    }, [isAdmin, authLoading, appId]); // Dependencies for useEffect

    // Memoized computation for filtered and sorted employees based on search term
    const employees = useMemo(() => {
        return allEmployees
            .filter(employee =>
                (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (employee.department || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Sort by name
    }, [allEmployees, searchTerm]);

    // Calculate total employees for the badge, now directly from the filtered `allEmployees`
    const totalEmployeesCount = allEmployees.length;

    // --- Employee Detail Modal Handlers ---
    const handleEmployeeRowClick = (employee) => {
        setSelectedEmployeeDetails(employee);
        setShowEmployeeDetailModal(true);
    };

    const handleCloseEmployeeDetailModal = () => {
        setShowEmployeeDetailModal(false);
        setSelectedEmployeeDetails(null);
    };

    // --- Loading and Error States ---
    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-180px)] bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg p-6">
                <LoadingSpinner size={48} message="Loading dashboard data..." />
            </div>
        );
    }

    if (dashboardError) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
                <Alert type="error" message={dashboardError} />
            </div>
        );
    }

    // --- Main Dashboard Render ---
    return (
        <div className="container mx-auto p-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6"> {/* Added flex container */}
                    <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <LayoutDashboard className="mr-3 text-blue-600" size={30} /> Dashboard
                    </h2>
                    <span className="flex items-center gap-2 text-base sm:text-lg font-medium text-white bg-gradient-to-r from-green-400 to-emerald-500
                    dark:from-green-600 dark:to-emerald-600 px-4 py-2 rounded-bl-2xl shadow-sm hover:shadow-amber-700 transition-shadow duration-200">
                 👋 {getGreeting()}
                    </span>

                </div>

                {isAdmin ? (
                    // Admin View: Employee Details
                    <div>
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-y-2">
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                                <User className="mr-2" size={24} /> Employee Details
                            </h3>
                            {/* Total Employees Badge */}
                            <div className="ml-auto">
                                <Badge variant="secondary" className="px-3 py-1 text-base">
                                    Total Employees: {totalEmployeesCount}
                                </Badge>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full max-w-sm">
                                <Input
                                    id="employee-search"
                                    type="text"
                                    placeholder="Search by name, email, department..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10 mb-0" // Add padding right for search icon, remove default margin-bottom
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-4 text-gray-400" size={20} />
                            </div>
                        </div>

                        {employees.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <Table className="w-full "> {/* Ensure table has a minimum width for scrolling */}
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Profile</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Leave Balance</TableHead>
                                            <TableHead className="text-right">UID</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employees.map(employee => (
                                            <TableRow
                                                key={employee.id}
                                                onClick={() => handleEmployeeRowClick(employee)} // Add click handler to row
                                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" // Add hover effect and cursor
                                            >
                                                <TableCell>
                                                    {/* Avatar component: uses a hardcoded image for now,
                                                        or a fallback with first letter of name if no src */}
                                                    <Avatar
                                                        src="https://wilang.org/wp-content/uploads/2016/04/lion-1-150x150.jpg" // Corrected URL
                                                        alt={employee.name || 'User'}
                                                        fallback={employee.name ? employee.name.charAt(0).toUpperCase() : 'U'}
                                                        size="sm"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{employee.name || 'N/A'}</TableCell>
                                                <TableCell>{employee.email || 'N/A'}</TableCell>
                                                <TableCell className="capitalize">{employee.role || 'employee'}</TableCell>
                                                <TableCell>{employee.department || 'N/A'}</TableCell>
                                                <TableCell>{employee.leaveBalance !== undefined ? employee.leaveBalance : 'N/A'}</TableCell>
                                                <TableCell className="text-right text-xs text-gray-500 dark:text-gray-400">{employee.id ? `${employee.id.substring(0, 8)}...` : 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-600 dark:text-gray-400 py-8">No employees found matching your search.</p>
                        )}
                    </div>
                ) : (
                    // Employee View: Announcements
                    <div>
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                            <Bell className="mr-2" size={24} /> Latest Announcements
                        </h3>
                        {announcements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {announcements.map(announcement => (
                                    <AnnouncementCard
                                        key={announcement.id}
                                        announcement={announcement}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-600 dark:text-gray-400 py-8">No announcements available.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Employee Details Modal */}
            <Modal
                show={showEmployeeDetailModal}
                title="Employee Details"
                onConfirm={handleCloseEmployeeDetailModal} // Close button is the "Confirm" action
                confirmText="Close"
                // No cancel button needed for a simple view modal
                onCancel={undefined} // Explicitly set to undefined to hide cancel button
            >
                {selectedEmployeeDetails && (
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-x-0 sm:space-x-4 mb-4">
                            <Avatar
                                src="https://wilang.org/wp-content/uploads/2016/04/lion-1-150x150.jpg" // Corrected URL
                                alt={selectedEmployeeDetails.name || 'User'}
                                fallback={selectedEmployeeDetails.name ? selectedEmployeeDetails.name.charAt(0).toUpperCase() : 'U'}
                                size="xl"
                                className="mb-4 sm:mb-0" // Add margin-bottom for mobile, remove for sm+
                            />
                            <div className="text-center sm:text-left">
                                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedEmployeeDetails.name || 'N/A'}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEmployeeDetails.role || 'Employee'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-6 gap-y-3">
                            {/* Each detail item is now a flex container for responsiveness */}
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Email:</p>
                                <p className="flex-1">{selectedEmployeeDetails.email || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Phone Number:</p>
                                <p className="flex-1">{selectedEmployeeDetails.phoneNumber || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Date of Birth:</p>
                                <p className="flex-1">{selectedEmployeeDetails.dob || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Employee ID:</p>
                                <p className="flex-1">{selectedEmployeeDetails.employeeId || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Aadhar Number:</p>
                                <p className="flex-1">{selectedEmployeeDetails.aadharNumber || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">PAN Card Number:</p>
                                <p className="flex-1">{selectedEmployeeDetails.panCardNumber || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Department:</p>
                                <p className="flex-1">{selectedEmployeeDetails.department || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Leave Balance:</p>
                                <p className="flex-1">{selectedEmployeeDetails.leaveBalance !== undefined ? selectedEmployeeDetails.leaveBalance : 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Bank Name:</p>
                                <p className="flex-1">{selectedEmployeeDetails.bankName || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">Bank Account No.:</p>
                                <p className="flex-1">{selectedEmployeeDetails.bankAccountNumber || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 sm:min-w-[120px]">IFSC Code:</p>
                                <p className="flex-1">{selectedEmployeeDetails.ifscCode || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="font-medium text-gray-800 dark:text-gray-200">Address:</p>
                            <p>{selectedEmployeeDetails.address || 'N/A'}</p>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            User ID (UID): {selectedEmployeeDetails.id || 'N/A'}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Dashboard;
