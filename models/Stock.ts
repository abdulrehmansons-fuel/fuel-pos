import mongoose, { Schema, Document } from 'mongoose';
import { FUEL_TYPES, PAYMENT_TYPES } from '@/validators/stock';

export interface IStock extends Document {
    fuelType: string;
    quantity: number;
    purchasePricePerLiter: number;
    salePricePerLiter: number;
    purchaseDate: Date;
    supplier?: string;
    paymentType?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    lubeCategory?: string;
    unitVolume?: number;
    lubeName?: string;
    unitsQuantity?: number;
}

const StockSchema: Schema = new Schema({
    fuelType: {
        type: String,
        required: [true, 'Fuel type is required'],
        enum: {
            values: FUEL_TYPES,
            message: 'Please select a valid fuel type'
        }
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity must be a positive number']
    },
    purchasePricePerLiter: {
        type: Number,
        required: [true, 'Purchase price is required'],
        min: [0, 'Price must be a positive number']
    },
    salePricePerLiter: {
        type: Number,
        required: [true, 'Sale price is required'],
        min: [0, 'Price must be a positive number']
    },
    purchaseDate: {
        type: Date,
        required: [true, 'Purchase date is required']
    },
    supplier: {
        type: String,
        trim: true,
        maxlength: [200, 'Supplier name cannot exceed 200 characters']
    },
    paymentType: {
        type: String,
        enum: {
            values: PAYMENT_TYPES,
            message: 'Please select a valid payment type'
        }
    },
    pump: {
        type: String,
        required: [true, 'Pump is required'],
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    // New fields for Lubricants
    lubeCategory: {
        type: String, // 'Petrol' or 'Diesel'
        trim: true
    },
    unitVolume: {
        type: Number, // 0.7, 1, 3, 4, 10 etc.
    },
    lubeName: {
        type: String, // 'Blaze', 'Carrient Plus', etc.
        trim: true
    },
    unitsQuantity: {
        type: Number, // Quantity in packs/gallons
    }
}, {
    timestamps: true
});

// Prevent model recompilation in Next.js dev mode
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.Stock) {
        delete mongoose.models.Stock;
    }
}

const Stock = mongoose.models.Stock || mongoose.model<IStock>('Stock', StockSchema);

export default Stock;
