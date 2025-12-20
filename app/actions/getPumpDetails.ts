"use server";

import connectDB from "@/lib/db";
import FuelPump from "@/models/FuelPump";

export async function getPumpDetails(pumpName: string) {
    try {
        await connectDB();
        // Decode in case it's URL encoded
        const decodedName = decodeURIComponent(pumpName);

        const pump = await FuelPump.findOne({ pumpName: decodedName } as any);

        if (!pump) return null;

        return {
            _id: pump._id.toString(),
            pumpName: pump.pumpName,
            location: pump.location,
            address: pump.location // Alias for compatibility if needed
        };
    } catch (error) {
        console.error("Error fetching pump details:", error);
        return null;
    }
}
