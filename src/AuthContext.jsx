// src/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    auth,
    db,
    appId,
    initialAuthToken,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    signInAnonymously,
    signInWithCustomToken,
    doc,
    getDoc,
    setDoc
} from './firebaseConfig';


import { sendPasswordResetEmail } from 'firebase/auth';


const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setUserId(user ? user.uid : null);
            setIsAdmin(false);

            if (user) {
                const userDocRef = doc(db, 'apps', appId, 'users', user.uid);
                try {
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        const profile = docSnap.data();
                        setUserProfile(profile);
                        setIsAdmin(profile.role === 'admin');
                        console.log("AuthContext: User profile loaded:", profile);
                    } else {
                        console.warn("AuthContext: User profile not found in Firestore for UID:", user.uid, "Creating default profile.");
                        const newProfile = {
                            email: user.email,
                            role: 'employee',
                            createdAt: new Date().toISOString()
                        };
                        await setDoc(userDocRef, newProfile);
                        setUserProfile(newProfile);
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("AuthContext: Error fetching or creating user profile:", error);
                    setAuthError("Failed to load user profile. Please try again.");
                }
            } else {
                setUserProfile(null);
                setIsAdmin(false);
            }
            setIsLoading(false);
        });

        const handleInitialTokenLogin = async () => {
            if (initialAuthToken && !currentUser) {
                try {
                    setIsLoading(true);
                    await signInWithCustomToken(auth, initialAuthToken);
                    console.log("AuthContext: Signed in with initial custom token.");
                } catch (error) {
                    console.error("AuthContext: Error signing in with initial custom token:", error);
                    setAuthError("Automatic login failed with provided token.");
                    setIsLoading(false);
                }
            } else if (!initialAuthToken && !currentUser) {
                setIsLoading(false);
            }
        };

        handleInitialTokenLogin();
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        setAuthError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            console.error("AuthContext: Login error:", error.code, error.message);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const forgotPassword = async (email) => {
        setAuthError(null);
        console.log("AuthContext: Attempting to send password reset email to:", email);
        try {
            await sendPasswordResetEmail(auth, email); // <--- Usage remains the same
            console.log("AuthContext: Password reset email sent successfully.");
            return { success: true, message: "Password reset email sent! Check your inbox." };
        } catch (error) {
            console.error("AuthContext: Forgot password error:", error.code, error.message);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const guestLogin = async () => {
        setAuthError(null);
        try {
            await signInAnonymously(auth);
            return { success: true };
        } catch (error) {
            console.error("AuthContext: Anonymous login error:", error.code, error.message);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        setAuthError(null);
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error("AuthContext: Logout error:", error.code, error.message);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const value = {
        currentUser,
        userId,
        isAdmin,
        userProfile,
        isLoading,
        authError,
        login,
        forgotPassword,
        guestLogin,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};