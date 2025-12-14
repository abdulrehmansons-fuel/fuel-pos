import mongoose, { Schema, Document } from 'mongoose';
import { EXPENSE_TYPES, PAYMENT_METHODS } from '@/validators/expense';

export interface IExpense extends Document {
    expenseTitle: string;
    expenseType: string;
    amount: number;
    date: Date;
    pump: string;
    paymentMethod: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema({
    expenseTitle: {
        type: String,
        required: [true, 'Expense title is required'],
        trim: true,
        minlength: [3, 'Expense title must be at least 3 characters'],
        maxlength: [200, 'Expense title must be less than 200 characters']
    },
    expenseType: {
        type: String,
        required: [true, 'Expense type is required'],
        enum: {
            values: EXPENSE_TYPES,
            message: 'Please select a valid expense type'
        }
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be a positive number']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    pump: {
        type: String,
        required: [true, 'Pump is required'],
        trim: true
    },
    paymentMethod: {
        type: String,
        required: [true, 'Payment method is required'],
        enum: {
            values: PAYMENT_METHODS,
            message: 'Please select a valid payment method'
        }
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Prevent model recompilation error in Next.js, but allow updates in dev
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.Expense) {
        delete mongoose.models.Expense;
    }
}

const Expense = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
