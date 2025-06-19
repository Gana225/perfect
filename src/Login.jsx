// src/Login.jsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card, Input, Button, Alert, LoadingSpinner, Modal } from './uiComponents';
import { LogIn } from 'lucide-react';

const Login = () => {
    const { login, forgotPassword, authError, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [resetMessage, setResetMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalLoading(true);
        setResetMessage(null); // Clear any previous reset messages before a login attempt

        await login(email, password);
        setLocalLoading(false);
    };

    const handleForgotPassword = async () => {
        console.log("Login: Attempting to reset password for email:", resetEmail); // Debug log
        setLocalLoading(true);
        setResetMessage(null);
        const result = await forgotPassword(resetEmail); // <--- Ensure resetEmail is passed correctly
        if (result.success) {
            setResetMessage({ type: 'success', message: result.message });
            // Optionally close modal on success or keep it open with message
            // setShowForgotPasswordModal(false);
        } else {
            setResetMessage({ type: 'error', message: result.error });
        }
        setLocalLoading(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <LoadingSpinner size={48} message="Initializing authentication..." />
            </div>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">

            <h2 className="p-2">Under development use below details to login</h2>

            <h3 className="p-2">For admin email : admin@gmail.com  password : admin@123</h3>

            <h3 className="p-2">For Employee   email : gana@gmail.com  password : gana@123</h3>

            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
                Welcome Back!
            </h2>

            {authError && <Alert type="error" message={authError} className="mb-4" />}
            {/* Display reset message if applicable */}
            {resetMessage && <Alert type={resetMessage.type} message={resetMessage.message} className="mb-4" onClose={() => setResetMessage(null)} />}


            <form onSubmit={handleSubmit}>
                <Input
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <div className="flex justify-end text-sm mb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setShowForgotPasswordModal(true);
                            setResetEmail(email); // Pre-fill reset email with current login email
                            setResetMessage(null); // Clear previous messages
                            console.log("Login: Forgot Password button clicked. Modal showing."); // Debug log
                        }}
                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
                    >
                        Forgot Password?
                    </button>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    disabled={localLoading}
                    icon={LogIn}
                >
                    {localLoading ? <LoadingSpinner size={20} /> : 'Login'}
                </Button>
            </form>

            {/* Forgot Password Modal */}
            <Modal
                show={showForgotPasswordModal}
                title="Reset Password"
                onConfirm={handleForgotPassword} // <--- Ensure this calls the handler
                onCancel={() => {
                    setShowForgotPasswordModal(false);
                    setResetMessage(null); // Clear message when modal is closed
                }}
                confirmText={localLoading ? <LoadingSpinner size={20} /> : "Send Reset Link"}
                cancelText="Cancel"
            >
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail} // <--- Ensure value is bound
                    onChange={(e) => setResetEmail(e.target.value)} // <--- Ensure onChange updates state
                    required
                    label="Email"
                />
                {resetMessage && <Alert type={resetMessage.type} message={resetMessage.message} className="mt-4" />}
            </Modal>
        </Card>
    );
};

export default Login;