import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/models/Stock";
import { validateStockEdit } from "@/validators/stock";

interface Props {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        await connectDB();
        const stock = await Stock.findById(id);

        if (!stock) {
            return NextResponse.json({ error: "Stock not found" }, { status: 404 });
        }

        return NextResponse.json(stock);
    } catch (error) {
        console.error("Error fetching stock:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        const body = await req.json();

        // Validate input
        const validation = validateStockEdit(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.errors },
                { status: 400 }
            );
        }

        await connectDB();

        const updatedStock = await Stock.findByIdAndUpdate(
            id,
            {
                ...body,
                quantity: Number(body.quantity),
                purchasePricePerLiter: Number(body.purchasePricePerLiter),
                salePricePerLiter: Number(body.salePricePerLiter),
                purchaseDate: new Date(body.purchaseDate)
            },
            { new: true, runValidators: true }
        );

        if (!updatedStock) {
            return NextResponse.json({ error: "Stock not found" }, { status: 404 });
        }

        return NextResponse.json(updatedStock);
    } catch (error: any) {
        console.error("Error updating stock:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update stock" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        await connectDB();
        const deletedStock = await Stock.findByIdAndDelete(id);

        if (!deletedStock) {
            return NextResponse.json({ error: "Stock not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Stock deleted successfully" });
    } catch (error) {
        console.error("Error deleting stock:", error);
        return NextResponse.json(
            { error: "Failed to delete stock" },
            { status: 500 }
        );
    }
}
