
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import { expenseEditSchema } from "@/validators/expense";

// Helper to validate Mongo ID
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

type Props = {
    params: Promise<{ id: string }>
}

// GET: Fetch single expense
export async function GET(req: NextRequest, { params }: Props) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectDB();

        const expense = await Expense.findById(id);

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json(expense, { status: 200 });
    } catch (error) {
        console.error("Error fetching expense:", error);
        return NextResponse.json(
            { error: "Failed to fetch expense" },
            { status: 500 }
        );
    }
}

// PUT: Update expense
export async function PUT(req: NextRequest, { params }: Props) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectDB();

        const body = await req.json();

        // 1. Validate Input
        const validationResult = expenseEditSchema.safeParse(body);

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

        // 2. Update Expense
        const updatedExpense = await Expense.findByIdAndUpdate(
            id,
            {
                expenseTitle: data.expenseTitle,
                expenseType: data.expenseType,
                amount: Number(data.amount),
                date: new Date(data.date),
                pump: data.pump,
                paymentMethod: data.paymentMethod,
                notes: data.notes
            },
            { new: true, runValidators: true }
        );

        if (!updatedExpense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Expense updated successfully",
            expense: updatedExpense
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Error updating expense:", error);
        return NextResponse.json(
            { error: "Failed to update expense" },
            { status: 500 }
        );
    }
}

// DELETE: Remove expense
export async function DELETE(req: NextRequest, { params }: Props) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectDB();

        const deletedExpense = await Expense.findByIdAndDelete(id);

        if (!deletedExpense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Expense deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting expense:", error);
        return NextResponse.json(
            { error: "Failed to delete expense" },
            { status: 500 }
        );
    }
}
