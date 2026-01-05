"use client";

import AddBulkSales from "./addBulkSales";

interface Nozzle {
    _id: string;
    name: string;
    fuelType: string;
    openingReading: number;
}

interface NozzleManagementProps {
    pumpId: string;
    employerId: string;
    initialNozzles: Nozzle[];
}

export default function NozzleManagement({ pumpId, employerId, initialNozzles }: NozzleManagementProps) {
    return (
        <div>
            <AddBulkSales pumpId={pumpId} employerId={employerId} nozzles={initialNozzles} />
        </div>
    );
}
