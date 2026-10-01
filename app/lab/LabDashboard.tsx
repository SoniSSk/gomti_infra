"use client";

import React, { useCallback, useState } from "react";
import { Plus } from "lucide-react";

import CommonHeader from "../component/vehicle_new/common/CommonHeader";
import CommonButton from "../component/vehicle_new/common/CommonButton";
import CommonModal from "../component/vehicle_new/common/CommonModal";
import LabTable from "../component/lab/LabTable";
import AddLab from "../component/lab/AddLab";
import { canAccessLab } from "@/app/utils/vehiclePermissions";

interface LabDashboardProps {
    userName: string;
    userRole: string;
}

const LabDashboard = ({
    userName,
    userRole,
}: LabDashboardProps) => {
    const showAddLab = canAccessLab(userRole);

    const [isAddLabOpen, setIsAddLabOpen] = useState(false);

    /*
     * Bumped after a report is added so the table refetches
     * without a page reload (and keeps its filters).
     */
    const [refreshKey, setRefreshKey] = useState(0);

    const handleLabAdded = useCallback(() => {
        setIsAddLabOpen(false);
        setRefreshKey((key) => key + 1);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <CommonHeader
                title="Lab"
                subtitle="Track samples and lab reports"
                userName={userName}
                userRole={userRole}
                actions={
                    showAddLab && (
                        <CommonButton
                            icon={Plus}
                            onClick={() => setIsAddLabOpen(true)}
                            aria-label="Add lab report"
                            title="Add lab report"
                            className="max-sm:w-10 max-sm:px-0"
                        >
                            <span className="hidden sm:inline">
                                Add Lab Report
                            </span>
                        </CommonButton>
                    )
                }
            />

            <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
                <LabTable refreshKey={refreshKey} />
            </main>

            <CommonModal
                isOpen={showAddLab && isAddLabOpen}
                onClose={() => setIsAddLabOpen(false)}
                title="Add lab report"
                description="Register a new sample for lab testing."
                size="xl"
                closeOnOutsideClick={false}
            >
                <div className="bg-gray-50 px-3 pt-3 sm:p-6">
                    <AddLab
                        userName={userName}
                        userRole={userRole}
                        onSuccess={handleLabAdded}
                    />
                </div>
            </CommonModal>
        </div>
    );
};

export default LabDashboard;
