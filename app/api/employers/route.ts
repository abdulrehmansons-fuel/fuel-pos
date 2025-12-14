
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { employerAddSchema } from "@/validators/employer";

// GET: List all employers
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        // Fetch users with role 'employee', sorted by creation date (newest first)
        // Exclude password field
        const employers = await User.find({ role: "employee" })
            .select("-password")
            .sort({ createdAt: -1 });

        return NextResponse.json(employers, { status: 200 });
    } catch (error) {
        console.error("Error fetching employers:", error);
        return NextResponse.json(
            { error: "Failed to fetch employers" },
            { status: 500 }
        );
    }
}

// POST: Create a new employer
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();

        // 1. Validate Input
        const validationResult = employerAddSchema.safeParse(body);

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

        // 2. Check for Duplicates (Username/Email)
        const existingUsername = await User.findOne({ username: data.username });
        if (existingUsername) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 409 }
            );
        }

        const existingEmail = await User.findOne({ email: data.email });
        if (existingEmail) {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 409 }
            );
        }

        // 3. Generate Custom Employer ID (EMP-XXX)
        const lastEmployee = await User.findOne({ role: "employee", employerId: { $exists: true } })
            .sort({ employerId: -1 })
            .collation({ locale: "en_US", numericOrdering: true }); // Ensure numeric sort, or rely on format

        let newId = "EMP-001";
        if (lastEmployee && lastEmployee.employerId) {
            const lastIdNum = parseInt(lastEmployee.employerId.replace("EMP-", ""), 10);
            if (!isNaN(lastIdNum)) {
                newId = `EMP-${String(lastIdNum + 1).padStart(3, "0")}`;
            }
        }

        // 4. Transform Data & Create User
        // Note: 'password' is hashed by the User model's pre-save hook
        const newEmployer = await User.create({
            ...data,
            role: "employee",
            employerId: newId,
            // Convert numeric fields from string to number
            monthlySalary: Number(data.monthlySalary),
            advanceSalary: data.advanceSalary ? Number(data.advanceSalary) : 0,
            joiningDate: new Date(data.joiningDate),
        });

        // Remove password from response
        const { password, ...employerWithoutPassword } = newEmployer.toObject();

        return NextResponse.json(
            {
                message: "Employer created successfully",
                employer: employerWithoutPassword
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Error creating employer:", error);

        // Handle specific MongoDB Duplicate Key Errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return NextResponse.json(
                { error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create employer" },
            { status: 500 }
        );
    }
}
