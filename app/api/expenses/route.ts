
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import { expenseAddSchema } from "@/validators/expense";

// GET: List all expenses
export async function GET() {
    try {
        await connectDB();

        // Fetch expenses sorted by date (newest first)
        const expenses = await Expense.find({})
            .sort({ date: -1, createdAt: -1 });

        return NextResponse.json(expenses, { status: 200 });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json(
            { error: "Failed to fetch expenses" },
            { status: 500 }
        );
    }
}

// POST: Create a new expense
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        // 1. Validate Input
        const validationResult = expenseAddSchema.safeParse(body);

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

        // 2. Create Expense
        const newExpense = await Expense.create({
            expenseTitle: data.expenseTitle,
            expenseType: data.expenseType,
            amount: Number(data.amount),
            date: new Date(data.date),
            pump: data.pump,
            paymentMethod: data.paymentMethod,
            notes: data.notes
        });

        return NextResponse.json(
            {
                message: "Expense created successfully",
                expense: newExpense
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Error creating expense:", error);

        return NextResponse.json(
            { error: "Failed to create expense" },
            { status: 500 }
        );
    }
}
