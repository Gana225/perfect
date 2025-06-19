import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {db, payrolldata} from './firebaseConfig'; // Adjusted path

import { Card, Button, Badge, LoadingSpinner, Alert, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Modal } from './uiComponents'; // Adjusted path
import { DollarSign, Search, History, Banknote } from 'lucide-react'; // Icons for payments

// --- ManagePayments Component ---
const ManagePayments = () => {
    // Application ID (hardcoded as per previous code, ensure consistency with __app_id if dynamic)
    const appId = "egty-c7097";

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // State for payment detail modal
    const [showPaymentDetailModal, setShowPaymentDetailModal] = useState(false);
    const [selectedPaymentDetails, setSelectedPaymentDetails] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // Firestore collection reference for payments
        // Path: artifacts/{appId}/payments
        const paymentsCollectionRef = collection(db, payrolldata);

        // Order payments by transactionDate in descending order (latest first)
        const q = query(paymentsCollectionRef, orderBy('transactionDate', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPayments = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to Date object if it exists
                    transactionDate: data.transactionDate?.toDate ? data.transactionDate.toDate() : (data.transactionDate ? new Date(data.transactionDate) : null)
                };
            });
            setPayments(fetchedPayments);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching payments:", err);
            setError("Failed to load payment data. Please check console for details.");
            setLoading(false);
        });

        return () => unsubscribe(); // Clean up listener on component unmount
    }, [appId, db]);

    // Filter payments based on search term
    const filteredPayments = useMemo(() => {
        return payments.filter(payment =>
            (payment.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.month || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [payments, searchTerm]);

    // Handle row click to show payment details modal
    const handlePaymentRowClick = (payment) => {
        setSelectedPaymentDetails(payment);
        setShowPaymentDetailModal(true);
    };

    // Handle closing the payment details modal
    const handleClosePaymentDetailModal = () => {
        setShowPaymentDetailModal(false);
        setSelectedPaymentDetails(null);
    };

    // Determine badge variant based on payment status
    const getBadgeVariant = (status) => {
        switch (status) {
            case 'Paid':
                return 'success'; // Green
            case 'Pending':
                return 'warning'; // Yellow
            case 'Failed':
                return 'destructive'; // Red
            default:
                return 'secondary'; // Default color
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-180px)] bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg p-6">
                <LoadingSpinner size={48} message="Loading payment data..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
                <Alert type="error" message={error} />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                <Banknote className="mr-3 text-green-600" size={30} /> Manage Payments
            </h2>

            <div className="flex flex-col md:flex-row items-center mb-4 gap-8 md:gap-3">
                <Input
                    type="text"
                    placeholder="Search payments (Employee Name, ID, Status, Month)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-[450px]"
                    icon={<Search size={20} className="text-gray-400" />}
                />
            </div>


            {filteredPayments.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No payment records found or matching your search criteria.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Employee ID</TableHead>
                                <TableHead>Month</TableHead>
                                <TableHead>Amount Paid</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Transaction Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map(payment => (
                                <TableRow
                                    key={payment.id}
                                    onClick={() => handlePaymentRowClick(payment)}
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <TableCell className="font-medium">{payment.employeeName || 'N/A'}</TableCell>
                                    <TableCell>{payment.employeeId || 'N/A'}</TableCell>
                                    <TableCell>{payment.month || 'N/A'}</TableCell>
                                    <TableCell>{payment.amountPaid !== undefined ? `₹${payment.amountPaid.toLocaleString('en-IN')}` : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getBadgeVariant(payment.status)}>
                                            {payment.status || 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {payment.transactionDate ? payment.transactionDate.toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Payment Details Modal */}
            <Modal
                show={showPaymentDetailModal}
                title="Payment Transaction Details"
                onConfirm={handleClosePaymentDetailModal}
                confirmText="Close"
                onCancel={undefined} // No cancel button
            >
                {selectedPaymentDetails && (
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium">Employee Name:</p>
                                <p className="font-semibold">{selectedPaymentDetails.employeeName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Employee ID:</p>
                                <p>{selectedPaymentDetails.employeeId || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Month:</p>
                                <p>{selectedPaymentDetails.month || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Amount Paid:</p>
                                <p className="font-semibold text-lg">{selectedPaymentDetails.amountPaid !== undefined ? `₹${selectedPaymentDetails.amountPaid.toLocaleString('en-IN')}` : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Status:</p>
                                <Badge variant={getBadgeVariant(selectedPaymentDetails.status)}>
                                    {selectedPaymentDetails.status || 'Unknown'}
                                </Badge>
                            </div>
                            <div>
                                <p className="font-medium">Transaction Date:</p>
                                <p>{selectedPaymentDetails.transactionDate ? selectedPaymentDetails.transactionDate.toLocaleString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">UTR Number:</p>
                                <p>{selectedPaymentDetails.utrNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Account Number Transferred To:</p>
                                <p>{selectedPaymentDetails.bankAccountNumber || 'N/A'}</p>
                            </div>
                        </div>
                        {selectedPaymentDetails.message && (
                            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                                <p className="font-medium">Message:</p>
                                <p className="text-sm italic">{selectedPaymentDetails.message}</p>
                            </div>
                        )}
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            Payment Record ID: {selectedPaymentDetails.id || 'N/A'}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ManagePayments;
