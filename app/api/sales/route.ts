import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import FuelPump from "@/models/FuelPump"; // Import for populate
import User from "@/models/User"; // Import for populate
import { z } from "zod";

const saleItemSchema = z.object({
    productName: z.string().min(1),
    category: z.string().min(1),
    quantity: z.number().min(0),
    unit: z.enum(["L", "mL", "pcs"]),
    quantityInLiters: z.number().optional(),
    rate: z.number().min(0),
    total: z.number().min(0),
});

const createSaleSchema = z.object({
    employerId: z.string().min(1),
    pumpId: z.string().min(1),
    items: z.array(saleItemSchema).min(1),
    subtotal: z.number().min(0),
    tax: z.number().min(0),
    grandTotal: z.number().min(0),
    amountPaid: z.number().min(0),
    changeReturned: z.number().min(0),
    paymentMethod: z.enum(["Cash", "Card", "Mobile Payment", "Bank Transfer"]),
    notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        const validation = createSaleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validation.error.format() },
                { status: 400 }
            );
        }

        const {
            employerId,
            pumpId,
            items,
            subtotal,
            tax,
            grandTotal,
            amountPaid,
            changeReturned,
            paymentMethod,
            notes,
        } = validation.data;

        // Calculate Payment Status
        let paymentStatus = "Paid";
        const balance = grandTotal - amountPaid;
        if (balance > 0) {
            paymentStatus = "Partial";
        } else if (balance < 0) {
            paymentStatus = "Overpaid";
        }

        // Fetch employer details to get name for payment history
        const User = (await import("@/models/User")).default;
        const employer = await User.findById(employerId);
        const employerName = employer ? employer.fullName : "Unknown";

        // Create initial payment history entry
        const initialPaymentHistory = [{
            action: "Initial Sale",
            amount: amountPaid,
            paymentMethod,
            performedBy: `Employer: ${employerName}`,
            notes: `Initial payment of ₨${amountPaid}`,
            timestamp: new Date(),
        }];

        const newSale = await Sale.create({
            employerId,
            pumpId,
            items,
            subtotal,
            tax,
            grandTotal,
            amountPaid,
            changeReturned,
            paymentStatus,
            paymentMethod,
            notes,
            status: "Pending",
            paymentHistory: initialPaymentHistory,
        });

        return NextResponse.json(newSale, { status: 201 });
    } catch (error: any) {
        console.error("Error creating sale:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create sale" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const pumpId = searchParams.get("pumpId");
        const employerId = searchParams.get("employerId");
        const status = searchParams.get("status");
        const paymentStatus = searchParams.get("paymentStatus");

        const query: any = {};

        // Mongoose will automatically convert string IDs to ObjectId
        if (pumpId && pumpId !== 'undefined') {
            query.pumpId = pumpId;
        }
        if (employerId && employerId !== 'undefined') {
            query.employerId = employerId;
        }
        if (status && status !== 'all') query.status = status;
        if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;

        console.log("Sales Query:", query); // Debug log

        const sales = await Sale.find(query)
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for better performance

        // Manually fetch and attach pump and employer details to avoid populate schema issues
        const pumpIds = [...new Set(sales.map(s => s.pumpId?.toString()).filter(Boolean))];
        const employerIds = [...new Set(sales.map(s => s.employerId?.toString()).filter(Boolean))];

        const [pumps, users] = await Promise.all([
            FuelPump.find({ _id: { $in: pumpIds } }).select("pumpName location").lean(),
            User.find({ _id: { $in: employerIds } }).select("fullName email").lean(),
        ]);

        const pumpMap = Object.fromEntries(pumps.map(p => [p._id.toString(), p]));
        const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

        const populatedSales = sales.map(sale => ({
            ...sale,
            pumpId: sale.pumpId ? (pumpMap[sale.pumpId.toString()] || sale.pumpId) : null,
            employerId: sale.employerId ? (userMap[sale.employerId.toString()] || sale.employerId) : null,
        }));

        console.log(`Found ${populatedSales.length} sales`); // Debug log

        return NextResponse.json(populatedSales, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching sales:", error);
        return NextResponse.json(
            { error: "Failed to fetch sales" },
            { status: 500 }
        );
    }
}
