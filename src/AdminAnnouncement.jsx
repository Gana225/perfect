import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';
import { db, announcemenstdata } from './firebaseConfig'; // Adjusted path to use '../'
import { useAuth } from './AuthContext'; // Adjusted path to use '../'
import {
    Card,
    Button,
    Badge,
    LoadingSpinner,
    Alert,
    Input,
    Modal,
    Textarea
} from './uiComponents'; // Adjusted path to use '../'
import {
    PlusCircle,
    Edit,
    Trash2,
    Bell,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const AnnouncementCard = ({ announcement, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayContent = isExpanded
        ? announcement.content
        : `${announcement.content.substring(0, 150)}${announcement.content.length > 150 ? '...' : ''}`;
    const showExpandButton = announcement.content.length > 150;

    return (
        <Card className="flex flex-col relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 break-words pr-2">
                    {announcement.title}
                </h3>
                {announcement.isNew && (
                    <Badge variant="warning" className="ml-3 px-2 py-1 text-sm animate-pulse flex-shrink-0">NEW</Badge>
                )}
            </div>
            <p className="break-words overflow-hidden w-full text-gray-700 dark:text-gray-300 text-sm mb-3">
                {displayContent}
            </p>
            {showExpandButton && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="self-end text-blue-500 hover:underline px-2 py-1 flex items-center gap-1 text-xs"
                >
                    {isExpanded ? 'Show less' : 'Expand'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                Announced: {new Date(announcement.createdAt).toLocaleDateString('en-GB')} at {new Date(announcement.createdAt).toLocaleTimeString()}
                <br />
                Last updated: {new Date(announcement.lastModifiedAt).toLocaleDateString('en-GB')} at {new Date(announcement.lastModifiedAt).toLocaleTimeString()}
            </p>

            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(announcement)}
                    className="flex items-center gap-1 text-sm px-3 py-1"
                >
                    <Edit size={16} /> Edit
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(announcement)}
                    className="flex items-center gap-1 text-sm px-3 py-1"
                >
                    <Trash2 size={16} /> Delete
                </Button>
            </div>
        </Card>
    );
};

const AdminManageAnnouncements = () => {
    const { currentUser } = useAuth();
    console.log(currentUser);
    const currentUserUid = currentUser?.uid;
    const currentUserDisplayName = currentUser?.displayName || 'Unknown User';

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [formError, setFormError] = useState('');

    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        setLoading(true); // Always set loading to true when starting to fetch data
        setError(null);

        if (!db) {
            console.error("Firestore 'db' instance is not available. Check firebaseConfig.js setup.");
            setError("Firebase is not initialized. Please check your Firebase configuration.");
            setLoading(false); // Turn off loading if Firebase isn't initialized
            return;
        }

        const q = query(collection(db, announcemenstdata), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const fetched = snapshot.docs.map(doc => {
                const data = doc.data();
                // Ensure createdAt is a Date object, fallback to new Date() if missing or invalid
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : new Date());
                // Ensure lastModifiedAt is a Date object or null
                const lastModifiedAt = data.lastModifiedAt?.toDate ? data.lastModifiedAt.toDate() : (data.lastModifiedAt instanceof Date ? data.lastModifiedAt : null);

                const announcementDateOnly = new Date(createdAt);
                announcementDateOnly.setHours(0, 0, 0, 0);

                const isNew = announcementDateOnly.getTime() >= today.getTime();

                return {
                    id: doc.id,
                    ...data,
                    createdAt,
                    lastModifiedAt,
                    isNew
                };
            });
            setAnnouncements(fetched);
            setLoading(false); // Turn off loading only after data is successfully fetched
        }, err => {
            console.error("Error fetching announcements:", err);
            setError("Failed to load announcements. Please check console for details.");
            setLoading(false); // Turn off loading on error too
        });

        return () => unsubscribe();
    }, []); // Dependencies are stable references

    const resetModalStates = () => {
        setEditingAnnouncement(null);
        setAnnouncementTitle('');
        setAnnouncementContent('');
        setFormError('');
    };

    const handleAddAnnouncementClick = () => {
        resetModalStates();
        setShowAddEditModal(true);
    };

    const handleEditAnnouncement = (a) => {
        setEditingAnnouncement(a);
        setAnnouncementTitle(a.title);
        setAnnouncementContent(a.content);
        setFormError('');
        setShowAddEditModal(true);
    };

    const handleSaveAnnouncement = async () => {
        setFormError('');
        if (!announcementTitle.trim() || !announcementContent.trim()) {
            setFormError('Title and Content cannot be empty.');
            return;
        }

        if (!db) {
            setFormError("Firebase is not initialized. Cannot save announcement.");
            return;
        }

        setLoading(true); // Start loading spinner immediately
        try {
            const commonData = {
                title: announcementTitle.trim(),
                content: announcementContent.trim(),
                lastModifiedAt: Timestamp.now(), // Always update on save
                lastModifiedByUid: currentUserUid || 'unknown',
                lastModifiedByName: currentUserDisplayName || 'Unknown'
            };

            if (editingAnnouncement) {
                await updateDoc(doc(db, announcemenstdata, editingAnnouncement.id), commonData);
                setSuccessMessage("Announcement updated successfully!");
                console.log("Announcement updated successfully!");
            } else {
                await addDoc(collection(db, announcemenstdata), {
                    ...commonData,
                    createdAt: Timestamp.now() // Set createdAt only for new announcements
                });
                setSuccessMessage("New announcement added successfully!");
                console.log("New announcement added successfully!");
            }
            setShowAddEditModal(false);
            resetModalStates(); // Clear form fields immediately
        } catch (e) {
            console.error("Error saving announcement:", e);
            setFormError(`Failed to save announcement: ${e.message}`);
            setLoading(false); // Only stop loading on error here, otherwise it's handled by onSnapshot
        }
        // Removed setLoading(false) from finally block here.
        // The onSnapshot listener in useEffect will handle turning off loading once new data arrives.
    };

    const handleCloseAddEditModal = () => {
        setShowAddEditModal(false);
        resetModalStates();
    };

    const handleDeleteConfirmation = (a) => {
        setAnnouncementToDelete(a);
        setShowDeleteConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!announcementToDelete) return;

        if (!db) {
            setFormError("Firebase is not initialized. Cannot delete announcement.");
            return;
        }

        setLoading(true); // Start loading spinner immediately
        try {
            await deleteDoc(doc(db, announcemenstdata, announcementToDelete.id));
            setSuccessMessage("Announcement deleted successfully!");
            console.log("Announcement deleted successfully!");
            setShowDeleteConfirmModal(false);
            setAnnouncementToDelete(null);
        } catch (e) {
            console.error("Error deleting announcement:", e);
            setFormError(`Failed to delete announcement: ${e.message}`);
            setLoading(false); // Only stop loading on error here, otherwise it's handled by onSnapshot
        }
        // Removed setLoading(false) from finally block here.
        // The onSnapshot listener in useEffect will handle turning off loading once new data arrives.
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirmModal(false);
        setAnnouncementToDelete(null);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[calc(100vh-180px)] bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg p-6"><LoadingSpinner size={48} message="Loading announcements..." /></div>;
    if (error) return <div className="flex items-center justify-center min-h-[calc(100vh-180px)]"><Alert type="error" message={error} /></div>;

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <Bell className="mr-3 text-purple-600" size={30} /> Manage Announcements
                    </h2>
                    <Button variant="primary" onClick={handleAddAnnouncementClick} className="flex items-center gap-2 px-4 py-2">
                        <PlusCircle size={20} /> Add Announcement
                    </Button>
                </div>

                {successMessage && <Alert type="success" message={successMessage} className="mb-4" />}
                {announcements.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-8">No announcements available. Click "Add Announcement" to create one.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {announcements.map(a => (
                            <AnnouncementCard
                                key={a.id}
                                announcement={a}
                                onEdit={handleEditAnnouncement}
                                onDelete={handleDeleteConfirmation}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Modal
                show={showAddEditModal}
                title={editingAnnouncement ? "Edit Announcement" : "Add New Announcement"}
                onConfirm={handleSaveAnnouncement}
                confirmText={editingAnnouncement ? "Save Changes" : "Add Announcement"}
                onCancel={handleCloseAddEditModal}
                cancelText="Cancel"
            >
                <div className="space-y-4">
                    {formError && <Alert type="error" message={formError} />}
                    <Input
                        label="Title"
                        placeholder="Enter announcement title"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        required
                    />
                    <Textarea
                        label="Content"
                        placeholder="Enter announcement content"
                        value={announcementContent}
                        onChange={(e) => setAnnouncementContent(e.target.value)}
                        rows={6}
                        required
                    />
                </div>
            </Modal>

            <Modal
                show={showDeleteConfirmModal}
                title="Confirm Deletion"
                onConfirm={handleConfirmDelete}
                confirmText="Delete"
                confirmVariant="destructive"
                onCancel={handleCancelDelete}
                cancelText="Cancel"
            >
                <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the announcement titled:
                    <br />
                    <span className="font-semibold text-red-600 dark:text-red-400">
                        "{announcementToDelete?.title}"
                    </span>? This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
};

export default AdminManageAnnouncements;
