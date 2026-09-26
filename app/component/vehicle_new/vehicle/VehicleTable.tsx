"use client";

import { useCallback, useState } from "react";

import Test from "./Test";
import VehicleStats from "./VehicleStats";

interface VehicleTableProps {
    refreshKey?: number;
    userRole?: string;
}

const VehicleTable = ({
    refreshKey = 0,
    userRole,
}: VehicleTableProps) => {
    // Bumped by the table's auto refresh so stats stay in sync
    const [pollKey, setPollKey] = useState(0);

    const handleAutoRefresh = useCallback(() => {
        setPollKey((key) => key + 1);
    }, []);

    return (
        <section className="w-full">
<div className="w-full space-y-6">
                <VehicleStats
                    refreshKey={refreshKey}
                    pollKey={pollKey}
                    userRole={userRole}
                />

                <Test
                    refreshKey={refreshKey}
                    onAutoRefresh={handleAutoRefresh}
                />
            </div>
        </section>
    );
};

export default VehicleTable;
