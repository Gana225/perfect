// src/LandingPage.jsx
import React from 'react';
import Login from './Login'; // Import the Login component
import { Card } from './uiComponents'; // Import the Card component for consistent styling
import { Briefcase, Users, BellRing, Hourglass } from 'lucide-react'; // Example icons for features

const FeatureItem = ({ icon: Icon, title, description }) => (
    <div className="flex items-start space-x-3" style={{padding:"7px",borderRadius:"7px",border:"solid 1px black",maxWidth:"500px",}}>
        <Icon className="flex-shrink-0 h-6 w-6 text-blue-500 dark:text-blue-400 mt-1" />
        <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
        </div>
    </div>
);

const LandingPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Main Card Container */}
            <Card className="
                w-full max-w-6xl
                flex flex-col md:flex-row items-stretch justify-center
                gap-8 md:gap-12
                p-6 sm:p-8 md:p-12  /* Adjusted padding for smaller screens */
            ">

                <div className="md:w-1/2 w-full flex items-center justify-center">
                    <Login />
                </div>



                {/* Left Section: Portal Information */}
                <div className="md:w-1/2 text-center md:text-left flex flex-col justify-center">
                    <h1 className="text-4xl sm:text-3xl md:text-4xl font-extrabold text-blue-700 dark:text-blue-400 mb-6 leading-tight drop-shadow-md">
                        Your Gateway to <br className="hidden md:inline" /> Seamless Worklife
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
                        The Employee Portal is designed to empower you with quick access to essential resources, streamline operations, and foster collaboration.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                        <FeatureItem
                            icon={Briefcase}
                            title="Personalized Dashboard"
                            description="Access your key information at a glance."
                        />
                        <FeatureItem
                            icon={Users}
                            title="Team Collaboration"
                            description="Connect and work efficiently with colleagues."
                        />
                        <FeatureItem
                            icon={BellRing}
                            title="Instant Notifications"
                            description="Stay updated with company announcements."
                        />
                        <FeatureItem
                            icon={Hourglass}
                            title="Time & Leave Management"
                            description="Easily track work hours and manage leave."
                        />
                    </div>

                    <p className="text-base sm:text-lg text-gray-800 dark:text-gray-200 font-semibold mt-auto">
                        Ready to enhance your work experience? Login now!
                    </p>
                </div>

                {/* Right Section: Login Component */}

            </Card>
        </div>
    );
};

export default LandingPage;