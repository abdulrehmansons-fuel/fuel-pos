import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import FuelPump from "@/models/FuelPump";
import User from "@/models/User";
import Stock from "@/models/Stock";
import { z } from "zod";

const updateSaleSchema = z.object({
    status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
    paymentStatus: z.enum(["Paid", "Partial", "Overpaid"]).optional(),
    amountPaid: z.number().min(0).optional(),
    notes: z.string().optional(),
    performedBy: z.string().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;

        const sale = (await Sale.findById(id).lean()) as unknown as Record<string, unknown>;

        if (!sale) {
            return NextResponse.json({ error: "Sale not found" }, { status: 404 });
        }

        // Manually fetch pump and employer details
        let pumpDetails = null;
        let employerDetails = null;

        if (sale.pumpId) {
            pumpDetails = await FuelPump.findById(sale.pumpId).select('pumpName location').lean();
        }

        if (sale.employerId) {
            employerDetails = await User.findById(sale.employerId).select('fullName email').lean();
        }

        // Include the details in the response
        const response = {
            ...sale,
            pumpId: pumpDetails || sale.pumpId,
            employerId: employerDetails || sale.employerId,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Error fetching sale:", error);
        return NextResponse.json(
            { error: "Failed to fetch sale details" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;
        const body = await req.json();

        const validation = updateSaleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validation.error.format() },
                { status: 400 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sale = await Sale.findById(id) as any;
        if (!sale) {
            return NextResponse.json({ error: "Sale not found" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = { ...validation.data };

        // If amountPaid is being updated, log it to payment history
        if (validation.data.amountPaid !== undefined && validation.data.amountPaid !== sale.amountPaid) {
            const additionalPayment = validation.data.amountPaid - sale.amountPaid;

            // Add to payment history
            if (!sale.paymentHistory) {
                sale.paymentHistory = [];
            }
            // Fetch employer name for logging if not provided
            let performer = validation.data.performedBy;
            if (!performer) {
                const employer = await User.findById(sale.employerId);
                performer = employer ? `Employer: ${employer.fullName}` : "Admin: Manager";
            }

            sale.paymentHistory.push({
                action: additionalPayment > 0 ? "Payment Added" : "Payment Adjusted",
                amount: additionalPayment,
                paymentMethod: sale.paymentMethod,
                performedBy: performer,
                notes: validation.data.notes || `Payment ${additionalPayment > 0 ? 'added' : 'adjusted'}: ₨${Math.abs(additionalPayment)}`,
                timestamp: new Date(),
            });

            // Recalculate payment status
            const balance = sale.grandTotal - validation.data.amountPaid;
            if (balance > 0) {
                updateData.paymentStatus = "Partial";
            } else if (balance < 0) {
                updateData.paymentStatus = "Overpaid";
                updateData.changeReturned = Math.abs(balance);
            } else {
                updateData.paymentStatus = "Paid";
                updateData.changeReturned = 0;
            }

            updateData.paymentHistory = sale.paymentHistory;
        }

        // --- STOCK DEDUCTION LOGIC ---
        // If status is being updated to "Approved"
        if (validation.data.status === "Approved" && sale.status !== "Approved") {
            // We need to deduct stock for each item in the sale
            for (const item of sale.items) {
                const quantityToDeduct = item.quantityInLiters || item.quantity;
                const fuelType = item.category; // Sale items use 'category' as fuel type

                // Find all available stock for this pump and fuel type, sorted by oldest first (FIFO)
                const stocks = await Stock.find({
                    pump: (await FuelPump.findById(sale.pumpId))?.pumpName, // Need name to match Stock schema
                    fuelType: fuelType,
                    quantity: { $gt: 0 }
                }).sort({ purchaseDate: 1 });

                let remainingToDeduct = quantityToDeduct;

                // Sum up total available stock
                const totalAvailable = stocks.reduce((sum, s) => sum + s.quantity, 0);

                if (totalAvailable < quantityToDeduct) {
                    return NextResponse.json(
                        { error: `Insufficient stock for ${fuelType}. Required: ${quantityToDeduct}L, Available: ${totalAvailable}L` },
                        { status: 400 }
                    );
                }

                // Deduct from batches FIFO style
                for (const stockInstance of stocks) {
                    if (remainingToDeduct <= 0) break;

                    if (stockInstance.quantity >= remainingToDeduct) {
                        // This batch has enough to cover the rest
                        await Stock.findByIdAndUpdate(stockInstance._id, {
                            $inc: { quantity: -remainingToDeduct }
                        });
                        remainingToDeduct = 0;
                    } else {
                        // This batch is partially enough, deplete it and move to next
                        remainingToDeduct -= stockInstance.quantity;
                        await Stock.findByIdAndUpdate(stockInstance._id, {
                            quantity: 0
                        });
                    }
                }
            }
        }
        // --- END STOCK DEDUCTION LOGIC ---

        const updatedSale = await Sale.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ) as unknown as Record<string, unknown>;

        if (!updatedSale) {
            return NextResponse.json({ error: "Sale not found" }, { status: 404 });
        }

        // Manually fetch pump and employer details
        let pumpDetails = null;
        let employerDetails = null;

        if (updatedSale.pumpId) {
            pumpDetails = await FuelPump.findById(updatedSale.pumpId).select('pumpName location').lean();
        }

        if (updatedSale.employerId) {
            employerDetails = await User.findById(updatedSale.employerId).select('fullName email').lean();
        }

        const response = {
            ...updatedSale,
            pumpId: pumpDetails || updatedSale.pumpId,
            employerId: employerDetails || updatedSale.employerId,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Error updating sale:", error);
        return NextResponse.json(
            { error: "Failed to update sale" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;

        const deletedSale = await Sale.findByIdAndDelete(id);

        if (!deletedSale) {
            return NextResponse.json({ error: "Sale not found" }, { status: 404 });
        }

        return NextResponse.json(
            { message: "Sale deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting sale:", error);
        return NextResponse.json(
            { error: "Failed to delete sale" },
            { status: 500 }
        );
    }
}
