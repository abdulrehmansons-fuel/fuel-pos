
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FuelPump from "@/models/FuelPump";
import { fuelPumpEditSchema } from "@/validators/fuelpump";

type Props = {
    params: Promise<{ id: string }>
}

// GET: Fetch single fuel pump
export async function GET(req: NextRequest, { params }: Props) {
    try {
        await connectDB();
        const { id } = await params;

        const mongoose = (await import("mongoose")).default;
        let pump;

        // 1. Try fetching by ID if it's a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            pump = await FuelPump.findById(id);
        }

        // 2. If not found by ID or ID is actually a Name, try fetching by Name
        if (!pump) {
            const decodedName = decodeURIComponent(id);
            pump = await FuelPump.findOne({ pumpName: decodedName });
        }

        if (!pump) {
            return NextResponse.json(
                { error: "Fuel pump not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(pump, { status: 200 });
    } catch (error) {
        console.error("Error fetching fuel pump:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// PUT: Update fuel pump
export async function PUT(req: NextRequest, { params }: Props) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();

        // 1. Validate Input
        const validationResult = fuelPumpEditSchema.safeParse(body);

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

        // 2. Check Duplicate Name (excluding current pump)
        const duplicateCheck = await FuelPump.findOne({
            pumpName: data.pumpName,
            _id: { $ne: id }
        });

        if (duplicateCheck) {
            return NextResponse.json(
                { error: "Pump name already exists" },
                { status: 409 }
            );
        }

        // 3. Update Pump
        const updatedPump = await FuelPump.findByIdAndUpdate(
            id,
            {
                pumpName: data.pumpName,
                location: data.location,
                status: data.status,
                totalNozzles: Number(data.totalNozzles),
                fuelProducts: data.selectedFuelTypes || [],
                nozzles: data.nozzles || [],
                assignedEmployees: data.selectedEmployees || [],
                notes: data.notes
            },
            { new: true, runValidators: true }
        );

        if (!updatedPump) {
            return NextResponse.json(
                { error: "Fuel pump not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                message: "Fuel pump updated successfully",
                pump: updatedPump
            },
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error("Error updating fuel pump:", error);
        return NextResponse.json(
            { error: "Failed to update fuel pump" },
            { status: 500 }
        );
    }
}

// DELETE: Remove fuel pump
export async function DELETE(req: NextRequest, { params }: Props) {
    try {
        await connectDB();
        const { id } = await params;

        const deletedPump = await FuelPump.findByIdAndDelete(id);

        if (!deletedPump) {
            return NextResponse.json(
                { error: "Fuel pump not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Fuel pump deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting fuel pump:", error);
        return NextResponse.json(
            { error: "Failed to delete fuel pump" },
            { status: 500 }
        );
    }
}
