// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx'; // Import the AuthProvider
import './App.css'; // This is where your Tailwind CSS output is imported (or App.css, etc.)

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* Wrap the entire application with AuthProvider */}
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>,
);