
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FuelPump from "@/models/FuelPump";
import { fuelPumpAddSchema } from "@/validators/fuelpump";

interface MongoError extends Error {
    code?: number;
}

// GET: List all fuel pumps
export async function GET() {
    try {
        await connectDB();

        const pumps = await FuelPump.find({})
            .sort({ createdAt: -1 });

        return NextResponse.json(pumps, { status: 200 });
    } catch (error) {
        console.error("Error fetching fuel pumps:", error);
        return NextResponse.json(
            { error: "Failed to fetch fuel pumps" },
            { status: 500 }
        );
    }
}

// POST: Create a new fuel pump
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        // 1. Validate Input
        const validationResult = fuelPumpAddSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validationResult.error.flatten().fieldErrors
                },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // 2. Check for Duplicate Pump Name
        const existingPump = await FuelPump.findOne({ pumpName: data.pumpName });
        if (existingPump) {
            return NextResponse.json(
                { error: "Pump name already exists" },
                { status: 409 }
            );
        }

        // 3. Create Pump
        const newPump = await FuelPump.create({
            pumpName: data.pumpName,
            location: data.location,
            status: data.status,
            totalNozzles: Number(data.totalNozzles),
            fuelProducts: data.selectedFuelTypes || [],
            assignedEmployees: data.selectedEmployees || [],
            notes: data.notes
        });

        return NextResponse.json(
            {
                message: "Fuel pump created successfully",
                pump: newPump
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Error creating fuel pump:", error);

        if (error instanceof Error && 'code' in error && (error as MongoError).code === 11000) {
            return NextResponse.json(
                { error: "Pump name already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create fuel pump" },
            { status: 500 }
        );
    }
}
