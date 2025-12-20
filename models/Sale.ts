import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISaleItem {
    productName: string;
    category: string;
    quantity: number;
    unit: "L" | "mL" | "pcs";
    quantityInLiters?: number;
    rate: number;
    total: number;
}

export interface IPaymentHistoryEntry {
    action: string; // e.g., "Initial Sale", "Payment Added"
    amount: number;
    paymentMethod: string;
    performedBy: string; // e.g., "Employer: Ali Khan", "Admin: Manager"
    notes?: string;
    timestamp: Date;
}

export interface ISale extends Document {
    employerId: mongoose.Types.ObjectId;
    pumpId: mongoose.Types.ObjectId;
    items: ISaleItem[];
    subtotal: number;
    tax: number;
    grandTotal: number;
    amountPaid: number;
    changeReturned: number;
    paymentStatus: "Paid" | "Partial" | "Overpaid";
    paymentMethod: "Cash" | "Card" | "Mobile Payment" | "Bank Transfer";
    notes?: string;
    status: "Pending" | "Approved" | "Rejected";
    paymentHistory: IPaymentHistoryEntry[];
    createdAt: Date;
    updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
    productName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ["L", "mL", "pcs"], required: true },
    quantityInLiters: { type: Number },
    rate: { type: Number, required: true },
    total: { type: Number, required: true },
}, { _id: false });

const PaymentHistorySchema = new Schema<IPaymentHistoryEntry>({
    action: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    performedBy: { type: String, required: true },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });

const SaleSchema = new Schema<ISale>(
    {
        employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        pumpId: { type: Schema.Types.ObjectId, ref: "FuelPump", required: true },
        items: { type: [SaleItemSchema], required: true },
        subtotal: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true },
        amountPaid: { type: Number, required: true },
        changeReturned: { type: Number, default: 0 },
        paymentStatus: {
            type: String,
            enum: ["Paid", "Partial", "Overpaid"],
            required: true,
            default: "Paid"
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "Card", "Mobile Payment", "Bank Transfer"],
            required: true,
        },
        notes: { type: String },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },
        paymentHistory: { type: [PaymentHistorySchema], default: [] },
    },
    {
        timestamps: true,
    }
);

// Prevent overwrite during hot reloads
const Sale: Model<ISale> = mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export default Sale;
