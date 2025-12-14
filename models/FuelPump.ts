
import mongoose, { Schema, Document } from 'mongoose';

export interface IFuelPump extends Document {
    pumpName: string;
    location?: string;
    status: 'active' | 'inactive';
    totalNozzles: number;
    fuelProducts: string[];
    assignedEmployees: string[]; // Storing employee IDs or Names
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FuelPumpSchema: Schema = new Schema({
    pumpName: {
        type: String,
        required: [true, 'Pump name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Pump name must be at least 2 characters'],
        maxlength: [100, 'Pump name must be less than 100 characters']
    },
    location: {
        type: String,
        trim: true,
        maxlength: [200, 'Location must be less than 200 characters']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    totalNozzles: {
        type: Number,
        required: [true, 'Total nozzles is required'],
        min: [1, 'Total nozzles must be at least 1']
    },
    fuelProducts: {
        type: [String],
        default: []
    },
    // We can store Employee Strings. 
    // If strict relation is needed we would use Schema.Types.ObjectId ref 'User'.
    // Given current validator just takes strings, we'll store strings for now.
    assignedEmployees: {
        type: [String],
        default: []
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Prevent model recompilation error in Next.js
const FuelPump = mongoose.models.FuelPump || mongoose.model<IFuelPump>('FuelPump', FuelPumpSchema);

export default FuelPump;
