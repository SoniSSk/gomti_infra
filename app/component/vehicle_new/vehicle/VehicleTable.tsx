
"use client";

import Test from "./Test";
import VehicleStats from "./VehicleStats";

const VehicleTable = () => {
    return (
        <section className="w-full">
            <div className="w-full space-y-4">
                <VehicleStats />

                <Test />
            </div>
        </section>
    );
};

export default VehicleTable;
