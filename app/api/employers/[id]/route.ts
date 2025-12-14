
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { employerEditSchema } from "@/validators/employer";

interface MongoError extends Error {
    code?: number;
    keyPattern?: Record<string, unknown>;
}

// Helper to validate Mongo ID
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

// GET: Fetch single employer
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15
) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectDB();

        const employer = await User.findOne({ _id: id, role: "employee" }).select("-password");

        if (!employer) {
            return NextResponse.json({ error: "Employer not found" }, { status: 404 });
        }

        return NextResponse.json(employer, { status: 200 });
    } catch (error) {
        console.error("Error fetching employer:", error);
        return NextResponse.json(
            { error: "Failed to fetch employer" },
            { status: 500 }
        );
    }
}

// PUT: Update employer
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectDB();

        const body = await req.json();

        // 1. Validate Input
        const validationResult = employerEditSchema.safeParse(body);

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

        // 2. Check Existance
        const existingEmployer = await User.findOne({ _id: id, role: "employee" });
        if (!existingEmployer) {
            return NextResponse.json({ error: "Employer not found" }, { status: 404 });
        }

        // 3. Uniqueness Check (if changing username or email)
        if (data.username && data.username !== existingEmployer.username) {
            const taken = await User.findOne({ username: data.username });
            if (taken) {
                return NextResponse.json({ error: "Username already exists" }, { status: 409 });
            }
        }

        if (data.email && data.email !== existingEmployer.email) {
            const taken = await User.findOne({ email: data.email });
            if (taken) {
                return NextResponse.json({ error: "Email already exists" }, { status: 409 });
            }
        }

        // 4. Update Fields
        // If password provided and not empty, set it (hashing logic needed here since findOneAndUpdate bypasses pre hook unless manipulated)
        // Note: The User model pre-save hook handles hashing on .save(). 
        // If we use findOneAndUpdate, we must hash manually.
        // However, it's safer to use .save() pattern for updates if we want to use the hook, 
        // OR we just manually check password presence.

        // Let's use Object.assign + save() to trigger hooks naturally.
        existingEmployer.fullName = data.fullName;
        existingEmployer.email = data.email;
        existingEmployer.mobile = data.mobile;
        existingEmployer.status = data.status;
        existingEmployer.fuelPump = data.fuelPump;
        existingEmployer.monthlySalary = Number(data.monthlySalary);
        existingEmployer.advanceSalary = data.advanceSalary ? Number(data.advanceSalary) : 0;
        existingEmployer.joiningDate = new Date(data.joiningDate);

        if (data.username) existingEmployer.username = data.username;
        if (data.address) existingEmployer.address = data.address;
        if (data.notes) existingEmployer.notes = data.notes;

        // Handle Password (Hash it if it's a new password)
        if (data.password && data.password.trim() !== "") {
            // The pre-save hook in User.ts checks isModified('password')
            existingEmployer.password = data.password;
        }

        await existingEmployer.save();

        // Return updated user without password
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...updatedEmployer } = existingEmployer.toObject();

        return NextResponse.json({
            message: "Employer updated successfully",
            employer: updatedEmployer
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Error updating employer:", error);

        if (error instanceof Error && 'code' in error && (error as MongoError).code === 11000) {
            const field = Object.keys((error as MongoError).keyPattern || {})[0];
            return NextResponse.json(
                { error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update employer" },
            { status: 500 }
        );
    }
}

// DELETE: Remove employer
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectDB();

        const deletedEmployer = await User.findOneAndDelete({ _id: id, role: "employee" });

        if (!deletedEmployer) {
            return NextResponse.json({ error: "Employer not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Employer deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting employer:", error);
        return NextResponse.json(
            { error: "Failed to delete employer" },
            { status: 500 }
        );
    }
}
