import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
    name: string;
    phone: string;
    balance: number; // Positive means they owe money (Debt). Negative means they overpaid? Usually Positive = Debt.
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    balance: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Prevent model recompilation
const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
