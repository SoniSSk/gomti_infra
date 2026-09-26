"use client";

import React, { useCallback, useState } from "react";

import CommonHeader from "../../component/vehicle_new/common/CommonHeader";
import VehicleTables from "../../component/vehicle_new/vehicle/VehicleTable";

interface VehicleDashboardProps {
    userName: string;
    userRole: string;
}

const VehicleDashboard = ({
    userName,
    userRole,
}: VehicleDashboardProps) => {
    /*
     * Bumped after a vehicle is added so the stats and table
     * refetch without a page reload (and keep their filters).
     */
    const [refreshKey, setRefreshKey] = useState(0);

    const handleVehicleAdded = useCallback(() => {
        setRefreshKey((key) => key + 1);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <CommonHeader
                title="Vehicle Dispatch"
                subtitle="Track and manage vehicle movement"
                userName={userName}
                userRole={userRole}
                onVehicleAdded={handleVehicleAdded}
            />

            <main className="p-4">
                <VehicleTables
                    refreshKey={refreshKey}
                    userRole={userRole}
                />
            </main>
        </div>
    );
};

export default VehicleDashboard;
