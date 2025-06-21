import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Alert, LoadingSpinner } from './uiComponents'; // Adjusted path
import {
    auth,
    db,    // Correctly importing the db instance
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged,
    collection,
    query,
    onSnapshot,
    updateDoc,
    doc,
    setDoc,
    createUserWithEmailAndPassword,
    secondaryAuth,
} from './firebaseConfig';



const ManageEmployees = () => {
    // Global variables provided by the Canvas environment.
    // ESLint might flag these as undefined, but they are injected at runtime.
    // The 'typeof ... !== 'undefined'' check safely handles their availability.
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    // State for Firebase and user authentication
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loading, setLoading] = useState(true);

    // State to manage the current view: 'list', 'add', or 'edit'
    const [view, setView] = useState('list');
    // State to store the list of employees
    const [employees, setEmployees] = useState([]);
    // State to hold the data of the employee being edited
    const [currentEmployee, setCurrentEmployee] = useState(null);
    // State for the search bar input
    const [searchTerm, setSearchTerm] = useState('');

    // State for the form data (used for both add and edit operations)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        dob: '', // Date of Birth
        address: '',
        aadharNumber: '', // Unique
        panCardNumber: '', // Unique
        bankName: '',
        bankAccountNumber: '',
        ifscCode: '',
        employeeId: '', // Unique
        role: 'employee', // Default role for new employees
    });
    // State for password when creating a new employee/user
    const [newEmployeePassword, setNewEmployeePassword] = useState('');

    // State for handling validation errors, especially for uniqueness checks
    const [errors, setErrors] = useState({});

    const [showaddData, setshowaddData] = useState(true);
    // State for modal messages and visibility
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => {},
        onCancel: () => {},
        confirmText: 'Ok',
        cancelText: 'Cancel',
    });
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('info');

    const [showaddData1, setshowaddData1] = useState(true);

    // 1. Initialize Firebase and listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        // If no custom token, sign in anonymously to get a UID for Firestore paths
                        await signInAnonymously(auth);
                    }
                    setUserId(auth.currentUser?.uid || crypto.randomUUID());
                } catch (error) {
                    console.error("Firebase Auth Error:", error);
                    setUserId(crypto.randomUUID()); // Fallback to random UUID if sign-in fails
                    showAppAlert('Authentication failed. Please refresh.', 'error');
                }
            }
            setIsAuthReady(true); // Auth state is ready
        });

        return () => unsubscribe(); // Cleanup auth listener when component unmounts
    }, [initialAuthToken]); // Depend on initialAuthToken if it can change

    // 2. Fetch Employees data from Firestore (real-time with onSnapshot)
    useEffect(() => {
        // Ensure authentication is ready and userId is set before attempting to fetch data
        if (!isAuthReady || !userId) {
            setLoading(true); // Keep loading true until data can be fetched
            return;
        }

        setLoading(true);
        // The collection path for employees, where each document ID is the employee's UID
        const employeesCollectionRef = collection(db, `apps/egty-c7097/users`);

        // Query to get all user/employee documents.
        const q = query(employeesCollectionRef);

        // Set up real-time listener for changes in the employees collection
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const employeesData = snapshot.docs.map(doc => ({
                id: doc.id, // The document ID is the user's UID
                ...doc.data()
            })).filter(emp => emp.role !== 'admin'); // Filter out Admin roles client-side
            setEmployees(employeesData);
            setLoading(false); // Data loaded, set loading to false
        }, (error) => {
            console.error("Error fetching employees:", error);
            setLoading(false); // Stop loading even if there's an error
            showAppAlert('Failed to load employees. Please try again.', 'error');
        });

        return () => unsubscribe(); // Cleanup snapshot listener when component unmounts or dependencies change
    }, [isAuthReady, userId, appId, db]); // Depend on auth readiness, userId, appId, and db instance

    // Function to show a temporary alert message
    const showAppAlert = (message, type = 'info') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlert(true);
        const timer = setTimeout(() => {
            setShowAlert(false);
            setAlertMessage('');
        }, 5000); // Alert disappears after 5 seconds
        return () => clearTimeout(timer);
    };

    // --- Handle Form Field Changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear existing error for the field as the user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Dynamic Uniqueness Check for Aadhar, PAN, Employee ID
        if (name === 'aadharNumber' || name === 'panCardNumber' || name === 'employeeId') {
            const isDuplicate = employees.some(emp =>
                // Check if the value matches an existing employee's unique field
                // AND ensure it's not the *current employee* themselves when in edit mode
                (emp[name] === value && (currentEmployee ? emp.id !== currentEmployee.id : true))
            );

            if (isDuplicate) {
                setErrors(prev => ({ ...prev, [name]: `${name.replace(/([A-Z])/g, ' $1').trim()} already exists` }));
            } else {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        }
    };

    // --- Validate Form Data Before Submission ---
    const validateForm = (isAdding = false) => {
        let newErrors = {};

        // Basic validation for required fields, now with .trim() for robustness
        // Checks if the trimmed string is empty. `|| ''` handles cases where a field might be null/undefined.
        if (!(formData.name || '').trim()) newErrors.name = 'Name is required.';
        if (!(formData.email || '').trim()) newErrors.email = 'Email is required.';
        if (!(formData.phoneNumber || '').trim()) newErrors.phoneNumber = 'Phone Number is required.';
        if (!(formData.dob || '').trim()) newErrors.dob = 'Date of Birth is required.';
        if (!(formData.address || '').trim()) newErrors.address = 'Address is required.';
        if (!(formData.aadharNumber || '').trim()) newErrors.aadharNumber = 'Aadhar Number is required.';
        if (!(formData.panCardNumber || '').trim()) newErrors.panCardNumber = 'PAN Card Number is required.';
        if (!(formData.bankName || '').trim()) newErrors.bankName = 'Bank Name is required.';
        if (!(formData.bankAccountNumber || '').trim()) newErrors.bankAccountNumber = 'Bank Account Number is required.';
        if (!(formData.ifscCode || '').trim()) newErrors.ifscCode = 'IFSC Code is required.';
        if (!(formData.employeeId || '').trim()) newErrors.employeeId = 'Employee ID is required.';
        if (!(formData.role || '').trim()) newErrors.role = 'Role is required.';

        // Password is required only when adding a new employee
        if (isAdding && !(newEmployeePassword || '').trim()) newErrors.password = 'Password is required for new employee.';

        // Email format validation (simple regex)
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format.';
        }

        // Final check for unique fields (in case dynamic check was missed or for new submission)
        // This checks against existing employees, excluding the current one if in edit mode.
        if (employees.some(emp => (emp.aadharNumber || '').trim() === (formData.aadharNumber || '').trim() && (currentEmployee ? emp.id !== currentEmployee.id : true))) {
            newErrors.aadharNumber = 'Aadhar Number already exists.';
        }
        if (employees.some(emp => (emp.panCardNumber || '').trim() === (formData.panCardNumber || '').trim() && (currentEmployee ? emp.id !== currentEmployee.id : true))) {
            newErrors.panCardNumber = 'PAN Card Number already exists.';
        }
        if (employees.some(emp => (emp.employeeId || '').trim() === (formData.employeeId || '').trim() && (currentEmployee ? emp.id !== currentEmployee.id : true))) {
            newErrors.employeeId = 'Employee ID already exists.';
        }
        // If adding a new employee, check if the email already exists among Firebase Auth users (not directly possible via client-side Firestore query alone without exposing all user emails).
        // For simplicity, we'll rely on Firebase Auth's `createUserWithEmailAndPassword` to handle email uniqueness for new users.

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Form is valid if no errors
    };

    // --- Handle Create User and Add Employee Data ---
    const handleAddEmployee = async () => {
        // Ensure auth is ready before attempting Firestore write
        if (!isAuthReady) {
            showAppAlert("Authentication not ready. Please try again.", "error");
            return;
        }

        if (!validateForm(true)) { // Pass true to indicate 'add' mode for password validation
            showAppAlert('Please correct the form errors.', 'warning');
            return;
        }

        // Show confirmation modal
        setModalConfig({
            title: 'Confirm Add Employee',
            message: 'Are you sure you want to add this new employee?',
            type: 'confirm',
            onConfirm: async () => {
                setShowModal(false); // Close modal
                setshowaddData(false)
                setshowaddData1(false)
                setLoading(true); // Show loading spinner during operation
                try {

                    // 1. Create Firebase Auth User
                    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, newEmployeePassword);
                    const newUserId = userCredential.user.uid;

                    await secondaryAuth.signOut();

                    // Prepare data for Firestore (exclude password, it's for auth only)
                    const employeeDataToSave = { ...formData };

                    // The password field is not part of formData for the employee document
                    // since it's used only for authentication.

                    // 2. Save Employee Data to Firestore using the new user's UID as document ID
                    // Path: `artifacts/{appId}/users/{newUserId}`
                    const employeeDocRef = doc(db, `apps/egty-c7097/users`, newUserId);
                    await setDoc(employeeDocRef, employeeDataToSave);

                    handleCancel(); // Reset form and go back to list view
                    setshowaddData1(true)
                    setshowaddData(true)
                    showAppAlert('Employee Added Successfully!', 'success');

                } catch (error) {
                    setshowaddData(true)
                    console.error("Error creating user or adding employee:", error);
                    let errorMessage = 'Failed to add employee. Please try again.';
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = 'The email address is already in use by another account.';
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = 'Password is too weak. Please choose a stronger password.';
                    }
                    showAppAlert(errorMessage, 'error');
                } finally {
                    setLoading(false); // Hide loading spinner
                }
            },
            onCancel: () => setShowModal(false), // Just close modal on cancel
            confirmText: 'Add',
        });
        setShowModal(true); // Show modal
    };


    // --- Handle Update Employee Submission ---
    const handleUpdateEmployee = async () => {
        // Ensure auth is ready, userId, and currentEmployee are available before attempting Firestore write
        if (!isAuthReady || !userId || !currentEmployee) {
            showAppAlert("Authentication not ready or employee not selected. Please try again.", "error");
            return;
        }

        if (!validateForm(false)) { // Pass false as it's not adding a new user (no password validation)
            showAppAlert('Please correct the form errors.', 'warning');
            return;
        }

        // Show confirmation modal
        setModalConfig({
            title: 'Confirm Update Employee',
            message: 'Are you sure you want to update this employee\'s details?',
            type: 'confirm',
            onConfirm: async () => {
                setShowModal(false); // Close modal
                setshowaddData1(false)
                setLoading(true); // Show loading spinner
                try {
                    // Update document at `artifacts/${appId}/users/{employee.id}`
                    const employeeDocRef = doc(db, `apps/egty-c7097/users`, currentEmployee.id);
                    await updateDoc(employeeDocRef, formData);
                    showAppAlert('Employee Updated Successfully!', 'success');
                    handleCancel(); // Reset form and go back to list view
                    setshowaddData1(true)
                } catch (error) {
                    setshowaddData1(true)
                    console.error("Error updating employee:", error);
                    showAppAlert('Failed to update employee. Please try again.', 'error');
                } finally {
                    setLoading(false); // Hide loading spinner
                }
            },
            onCancel: () => setShowModal(false), // Just close modal on cancel
            confirmText: 'Update',
        });
        setShowModal(true); // Show modal
    };

    // --- Start Edit Mode ---
    const startEditEmployee = (employee) => {
        setCurrentEmployee(employee);
        // Ensure all fields are explicitly set, even if they were previously undefined or null,
        // to prevent validation issues when fields are empty in the database but required by the form.
        setFormData({
            name: employee.name || '',
            email: employee.email || '',
            phoneNumber: employee.phoneNumber || '',
            dob: employee.dob || '',
            address: employee.address || '',
            aadharNumber: employee.aadharNumber || '',
            panCardNumber: employee.panCardNumber || '',
            bankName: employee.bankName || '',
            bankAccountNumber: employee.bankAccountNumber || '',
            ifscCode: employee.ifscCode || '',
            employeeId: employee.employeeId || '',
            role: employee.role || 'Employee', // Default to 'Employee' if role is missing
        });
        setErrors({}); // Clear any previous errors when starting edit
        setNewEmployeePassword(''); // Clear password field when editing
        setView('edit');
    };

    // --- Handle Cancel Button (for Add/Edit form) ---
    const handleCancel = () => {
        setView('list'); // Go back to the employee list view
        setFormData({ // Reset form fields to initial empty state
            name: '', email: '', phoneNumber: '', dob: '', address: '',
            aadharNumber: '', panCardNumber: '', bankName: '', bankAccountNumber: '',
            ifscCode: '', employeeId: '', role: 'Employee',
        });
        setCurrentEmployee(null); // Clear the current employee being edited
        setErrors({}); // Clear all validation errors
        setNewEmployeePassword(''); // Clear password field
    };

    // --- Filtered Employees for Display ---
    const filteredEmployees = employees.filter(employee =>
        (employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.aadharNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && isAuthReady) { // Show loading only when authentication is ready and data is being fetched
        return (
            <LoadingSpinner message="Loading employees..." className="h-64" />
        );
    }
    if (!isAuthReady) { // Show a message if auth is not ready
        return (
            <div className="flex justify-center items-center h-64 text-gray-700 dark:text-gray-300">
                Initializing application...
            </div>
        );
    }

    // Main component render
    return (
        <>
            {showaddData1===true && (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Manage Employees</h2>

        {/* Global Alert Message */}
        {showAlert && (
            <Alert
                message={alertMessage}
                type={alertType}
                onClose={() => setShowAlert(false)}
                className="mb-4"
            />
        )}

        {/* --- Employee List View --- */}
        {view === 'list' && (
            <>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
                    {/* Search Input */}
                    <Input
                        type="text"
                        placeholder="Search by (Name, ID, Email, Aadhar)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80"
                    />
                    <Button onClick={() => {
                        setView('add');
                        setshowaddData(true)
                    }} className="w-full md:w-auto">Add New Employee</Button>
                </div>

                {filteredEmployees.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">No employees found or matching your
                        search criteria.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Employee ID</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map(employee => (
                                <TableRow key={employee.id}>
                                    <TableCell className="font-medium">{employee.name}</TableCell>
                                    <TableCell>{employee.employeeId}</TableCell>
                                    <TableCell>{employee.email}</TableCell>
                                    <TableCell>{employee.role}</TableCell>
                                    <TableCell className="text-center">
                                        <Button onClick={() => startEditEmployee(employee)} variant="secondary"
                                                size="sm">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </>
        )}

        {/* --- Add/Edit Employee Form View --- */}
        {(showaddData === true && view === 'add' || view === 'edit') && (
            <form onSubmit={(e) => {
                e.preventDefault();
                view === 'add' ? handleAddEmployee() : handleUpdateEmployee();
            }} className="space-y-5 p-4 md:p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center mb-6">
                    {view === 'add' ? 'Add New Employee (Register User)' : 'Edit Employee Details'}
                </h3>

                {/* Personal Details Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Personal Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <Input
                                id="name"
                                name="name" // Important for handleChange
                                label="Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                label="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className={errors.email ? 'border-red-500' : ''}
                                disabled={view === 'edit'} // Disable email edit for existing users
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        {/* Password (only for Add mode) */}
                        {view === 'add' && (
                            <div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    label="Password"
                                    value={newEmployeePassword}
                                    onChange={(e) => setNewEmployeePassword(e.target.value)}
                                    required
                                    className={errors.password ? 'border-red-500' : ''}
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>
                        )}

                        {/* Phone Number */}
                        <div>
                            <Input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                label="Phone Number"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                required
                                className={errors.phoneNumber ? 'border-red-500' : ''}
                            />
                            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                        </div>

                        {/* DOB */}
                        <div>
                            <Input
                                id="dob"
                                name="dob"
                                type="date"
                                label="Date of Birth"
                                value={formData.dob}
                                onChange={handleChange}
                                required
                                className={errors.dob ? 'border-red-500' : ''}
                            />
                            {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                        </div>

                        {/* Aadhar Number (with dynamic check) */}
                        <div>
                            <Input
                                id="aadharNumber"
                                name="aadharNumber"
                                type="text"
                                label="Aadhar Number"
                                value={formData.aadharNumber}
                                onChange={handleChange}
                                required
                                className={errors.aadharNumber ? 'border-red-500' : ''}
                            />
                            {errors.aadharNumber && <p className="text-red-500 text-xs mt-1">{errors.aadharNumber}</p>}
                        </div>

                        {/* PAN Card Number (with dynamic check) */}
                        <div>
                            <Input
                                id="panCardNumber"
                                name="panCardNumber"
                                type="text"
                                label="PAN Card Number"
                                value={formData.panCardNumber}
                                onChange={handleChange}
                                required
                                className={errors.panCardNumber ? 'border-red-500' : ''}
                            />
                            {errors.panCardNumber &&
                                <p className="text-red-500 text-xs mt-1">{errors.panCardNumber}</p>}
                        </div>

                        {/* Employee ID (with dynamic check) */}
                        <div>
                            <Input
                                id="employeeId"
                                name="employeeId"
                                type="text"
                                label="Employee ID"
                                value={formData.employeeId}
                                onChange={handleChange}
                                required
                                className={errors.employeeId ? 'border-red-500' : ''}
                            />
                            {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                        </div>

                        {/* Role of the Employee */}
                        <div>
                            <Select
                                id="role"
                                name="role"
                                label="Role of the Employee"
                                value={formData.role}
                                onChange={handleChange}
                                options={[
                                    {value: 'Employee', label: 'Employee'},
                                    {value: 'Manager', label: 'Manager'},
                                    {value: 'HR', label: 'HR'},
                                    {value: 'Accounts', label: 'Accounts'},
                                ]}
                                required
                                className={errors.role ? 'border-red-500' : ''}
                            />
                            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                        </div>
                    </div>

                    {/* Address - Full width */}
                    <div className="mt-4">
                        <Textarea
                            id="address"
                            name="address"
                            label="Address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3"
                            required
                            className={errors.address ? 'border-red-500' : ''}
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>
                </div>

                {/* Bank Details Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Bank Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Bank Name */}
                        <div>
                            <Input
                                id="bankName"
                                name="bankName"
                                type="text"
                                label="Bank Name"
                                value={formData.bankName}
                                onChange={handleChange}
                                required
                                className={errors.bankName ? 'border-red-500' : ''}
                            />
                            {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                        </div>

                        {/* Bank Account Number */}
                        <div>
                            <Input
                                id="bankAccountNumber"
                                name="bankAccountNumber"
                                type="text"
                                label="Bank Account Number"
                                value={formData.bankAccountNumber}
                                onChange={handleChange}
                                required
                                className={errors.bankAccountNumber ? 'border-red-500' : ''}
                            />
                            {errors.bankAccountNumber &&
                                <p className="text-red-500 text-xs mt-1">{errors.bankAccountNumber}</p>}
                        </div>

                        {/* IFSC Code */}
                        <div>
                            <Input
                                id="ifscCode"
                                name="ifscCode"
                                type="text"
                                label="IFSC Code"
                                value={formData.ifscCode}
                                onChange={handleChange}
                                required
                                className={errors.ifscCode ? 'border-red-500' : ''}
                            />
                            {errors.ifscCode && <p className="text-red-500 text-xs mt-1">{errors.ifscCode}</p>}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                    <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
                    <Button type="submit" variant="primary">
                        {view === 'add' ? 'Authenticate & Add Employee' : 'Update Employee'}
                    </Button>
                </div>
            </form>
        )}

        {/* Confirmation Modal */}
        <Modal
            show={showModal}
            title={modalConfig.title}
            message={modalConfig.message}
            onConfirm={modalConfig.onConfirm}
            onCancel={modalConfig.onCancel}
            confirmText={modalConfig.confirmText}
            cancelText={modalConfig.cancelText}
            type={modalConfig.type}
        />
    </div>
                )}
        </>
);
};

export default ManageEmployees;
