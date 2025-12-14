import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/models/Stock";
import { validateStockAdd } from "@/validators/stock";

export async function GET() {
    try {
        await connectDB();
        const stocks = await Stock.find().sort({ purchaseDate: -1 });
        return NextResponse.json(stocks);
    } catch (error) {
        console.error("Error fetching stocks:", error);
        return NextResponse.json(
            { error: "Failed to fetch stocks" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input using Zod
        const validation = validateStockAdd(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.errors },
                { status: 400 }
            );
        }

        await connectDB();

        const stock = await Stock.create({
            ...body,
            quantity: Number(body.quantity),
            purchasePricePerLiter: Number(body.purchasePricePerLiter),
            salePricePerLiter: Number(body.salePricePerLiter),
            // purchaseDate is already validated as string, model will cast to Date, or we can explicit:
            purchaseDate: new Date(body.purchaseDate)
        });

        return NextResponse.json(stock, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating stock:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create stock" },
            { status: 500 }
        );
    }
}
