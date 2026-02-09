import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICashTransaction extends Document {
    type: string; // "Cash to Bank", "Bank to Cash", etc.
    entityName: string; // Bank Name or other entity
    accountNumber?: string;
    amount: number;
    date: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CashTransactionSchema = new Schema<ICashTransaction>({
    type: {
        type: String,
        required: [true, 'Transaction type is required'],
        trim: true
    },
    entityName: {
        type: String,
        required: [true, 'Entity/Bank name is required'],
        trim: true
    },
    accountNumber: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Prevent model recompilation
const CashTransaction: Model<ICashTransaction> = mongoose.models.CashTransaction || mongoose.model<ICashTransaction>('CashTransaction', CashTransactionSchema);

export default CashTransaction;
