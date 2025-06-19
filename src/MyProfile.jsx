// src/MyProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // To get currentUser, isAdmin, and logout
import { db, storage} from './firebaseConfig'; // CORRECTED: Import db, storage, AND app
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    Card,
    Button,
    Input,
    LoadingSpinner,
    Alert,
    Avatar, // Assuming you have an Avatar component
    Badge // Assuming you have a Badge component
} from './uiComponents';

import { Edit, Save, XCircle, UploadCloud, UserCircle } from 'lucide-react'; // Icons

const MyProfile = () => {
    const { currentUser, isAdmin, isLoading: authLoading } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [uploading, setUploading] = useState(false);
    // const [uploadProgress, setUploadProgress] = useState(0); // Optional: for showing upload progress
    const [photoFile, setPhotoFile] = useState(null); // State to hold the selected photo file

    const userId = currentUser?.uid;
    const appId = "egty-c7097"; // CORRECTED: Get appId dynamically from your Firebase config

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) {
                setLoadingProfile(false);
                setError("User not authenticated.");
                return;
            }

            setLoadingProfile(true);
            setError(null);
            try {
                const userDocRef = doc(db, `apps/${appId}/users`, userId);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Merge auth data (like photoURL from currentUser) with Firestore data
                    const mergedData = {
                        ...data,
                        email: currentUser.email, // Ensure email from auth is primary
                        photoURL: currentUser.photoURL || data.photoURL || null, // Prioritize currentUser photoURL
                        // Convert Firestore Timestamp to Date object for DOB if it exists
                        dob: data.dob?.toDate ? data.dob.toDate().toISOString().split('T')[0] : data.dob || ''
                    };
                    setProfileData(mergedData);
                    setFormData(mergedData); // Initialize form data with fetched data
                } else {
                    // If no Firestore document, use basic currentUser data
                    const basicData = {
                        name: currentUser.displayName || 'N/A',
                        email: currentUser.email || 'N/A',
                        photoURL: currentUser.photoURL || null,
                        address: '',
                        phoneNumber: '',
                        panCard: '',
                        bankAccountNo: '',
                        ifscCode: '',
                        bankName: '',
                        dob: ''
                    };
                    setProfileData(basicData);
                    setFormData(basicData);
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Failed to load profile data.");
            } finally {
                setLoadingProfile(false);
            }
        };

        if (!authLoading) { // Only fetch when auth state is resolved
            fetchProfile();
        }
    }, [userId, authLoading, currentUser, appId]); // Re-fetch if userId, authLoading, currentUser, or appId changes

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
            // Also update the preview in formData immediately
            setFormData(prev => ({ ...prev, photoURL: URL.createObjectURL(e.target.files[0]) }));
        }
    };

    const handleSave = async () => {
        if (!userId) {
            setError("User not authenticated for saving.");
            return;
        }

        setUploading(true);
        setError(null);
        let newPhotoURL = formData.photoURL;

        try {
            // 1. Upload new profile picture if selected
            if (photoFile) {
                const storageRef = ref(storage, `profile_pictures/${userId}/${photoFile.name}`);
                // You can add .on('state_changed', ...) here to get upload progress
                const uploadResult = await uploadBytes(storageRef, photoFile);
                newPhotoURL = await getDownloadURL(uploadResult.ref);
                // Update photoURL in Firebase Auth profile (if it's the primary source)
                await currentUser.updateProfile({ photoURL: newPhotoURL });
            }

            // 2. Prepare data for Firestore update based on role
            const userDocRef = doc(db, `apps/${appId}/users`, userId);
            const dataToUpdate = {
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                photoURL: newPhotoURL // Always update photoURL in Firestore
            };

            if (isAdmin) {
                // Admin can update name on their own profile
                dataToUpdate.name = formData.name;
                // Note: Email updates typically require re-authentication and are a more complex flow.
                // We are not including direct email updates here for security simplicity.
            }

            // 3. Update Firestore document
            await updateDoc(userDocRef, dataToUpdate);

            // 4. Update local state and exit edit mode
            setProfileData(prev => ({ ...prev, ...dataToUpdate }));
            setIsEditing(false);
            setPhotoFile(null); // Clear selected file after successful upload
        } catch (err) {
            console.error("Error saving profile:", err);
            setError("Failed to save profile. " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setFormData(profileData); // Revert to original data
        setIsEditing(false);
        setPhotoFile(null); // Clear any selected file
        setError(null); // Clear any previous errors
    };

    if (loadingProfile || authLoading) { // Check both profile data loading and auth loading
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
                <LoadingSpinner size={48} message="Loading profile..." />
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

    if (!profileData) {
        // This case should ideally not be hit if authLoading is false and currentUser exists
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
                <Alert type="info" message="No profile data available. Please ensure you are logged in." />
            </div>
        );
    }

    return (
        <Card className="max-w-4xl mx-auto p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <UserCircle className="mr-3 text-blue-600" size={32} /> My Profile
                </h2>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} icon={Edit} disabled={uploading}>
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex space-x-2">
                        <Button onClick={handleSave} icon={Save} disabled={uploading}>
                            {uploading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={handleCancel} icon={XCircle} disabled={uploading}>
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center md:w-1/3">
                    <Avatar
                        src={formData.photoURL || currentUser?.photoURL} // Use formData.photoURL for preview
                        alt={formData.name || 'User'}
                        fallback={formData.name ? formData.name.charAt(0).toUpperCase() : (currentUser?.email?.charAt(0).toUpperCase() || 'U')}
                        size="xl"
                        className="mb-4 shadow-md border-2 border-blue-400 dark:border-blue-600"
                    />
                    {isEditing && (
                        <label htmlFor="profile-pic-upload" className="w-full">
                            <Input
                                id="profile-pic-upload"
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <Button
                                as="span" // Render as span so label can wrap it
                                variant="secondary"
                                icon={UploadCloud}
                                className="w-full justify-center"
                                disabled={uploading}
                            >
                                {photoFile ? 'Change Selected' : 'Upload New Photo'}
                            </Button>
                            {photoFile && <p className="text-xs text-gray-500 mt-1 text-center">{photoFile.name}</p>}
                        </label>
                    )}
                    <Badge variant={isAdmin ? "info" : "primary"} className="mt-4 px-3 py-1 text-sm font-semibold">
                        Role: {isAdmin ? 'Admin' : 'Employee'}
                    </Badge>
                </div>

                <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        id="name"
                        label="Full Name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        readOnly={!isEditing || !isAdmin} // Admin can edit name, Employee cannot
                        disabled={uploading}
                        className={(!isEditing || !isAdmin) ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                    />
                    <Input
                        id="email"
                        label="Email"
                        value={formData.email || ''}
                        readOnly={true} // Email is almost never directly editable via profile UI
                        disabled={true}
                        className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    />
                    <Input
                        id="phoneNumber"
                        label="Phone Number"
                        value={formData.phoneNumber || ''}
                        onChange={handleChange}
                        readOnly={!isEditing} // Both Admin and Employee can edit phone
                        disabled={uploading}
                    />
                    <Input
                        id="address"
                        label="Address"
                        value={formData.address || ''}
                        onChange={handleChange}
                        readOnly={!isEditing} // Both Admin and Employee can edit address
                        disabled={uploading}
                    />

                    {!isAdmin && (
                        <>
                            <Input
                                id="dob"
                                label="Date of Birth"
                                type="date" // Use type="date" for DOB
                                value={formData.dob || ''}
                                readOnly={true}
                                disabled={true}
                                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                            <Input
                                id="panCard"
                                label="PAN Card Details"
                                value={formData.panCardNumber || ''}
                                readOnly={true}
                                disabled={true}
                                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                            <Input
                                id="bankAccountNo"
                                label="Bank Account No."
                                value={formData.bankAccountNumber || ''}
                                readOnly={true}
                                disabled={true}
                                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                            <Input
                                id="ifscCode"
                                label="IFSC Code"
                                value={formData.ifscCode || ''}
                                readOnly={true}
                                disabled={true}
                                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                            <Input
                                id="bankName"
                                label="Bank Name"
                                value={formData.bankName || ''}
                                readOnly={true}
                                disabled={true}
                                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default MyProfile;