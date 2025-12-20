import { z } from "zod";

export const saleItemSchema = z.object({
    productName: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    quantity: z.number().min(0, "Quantity must be positive"),
    unit: z.enum(["L", "mL", "pcs"]),
    quantityInLiters: z.number().optional(),
    rate: z.number().min(0, "Rate must be positive"),
    total: z.number().min(0, "Total must be positive"),
});

export const createSaleSchema = z.object({
    employerId: z.string().min(1, "Employer ID is required"),
    pumpId: z.string().min(1, "Pump ID is required"),
    items: z.array(saleItemSchema).min(1, "At least one item is required"),
    subtotal: z.number().min(0),
    tax: z.number().min(0),
    grandTotal: z.number().min(0),
    amountPaid: z.number().min(0, "Amount paid is required"),
    changeReturned: z.number().min(0),
    paymentStatus: z.enum(["Paid", "Partial", "Overpaid"]).default("Paid"),
    paymentMethod: z.enum(["Cash", "Card", "Mobile Payment", "Bank Transfer"]),
    notes: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
