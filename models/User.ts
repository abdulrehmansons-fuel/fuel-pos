import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the User interface extending mongoose.Document
export interface IUser extends Document {
    username: string;
    password?: string; // Optional because we might not query it always, but required for creation
    role: 'admin' | 'employee';
    fullName: string;
    email?: string;
    mobile?: string;
    status: 'Active' | 'Inactive';

    // Employee specific fields
    address?: string;
    fuelPump?: string;
    monthlySalary?: number;
    advanceSalary?: number;
    joiningDate?: Date;
    notes?: string;

    // Methods
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
    // Common fields
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['admin', 'employee'],
        default: 'employee'
    },
    fullName: {
        type: String,
        required: [true, 'Please provide full name']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true, // Allow null/undefined to be unique if multiple users have no email (though we might enforce it)
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    mobile: {
        type: String,
        match: [/^03\d{9}$/, 'Mobile number must be in format 03xxxxxxxxx']
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },

    // Employee Specific Fields
    address: { type: String },
    fuelPump: { type: String },
    monthlySalary: { type: Number },
    advanceSalary: { type: Number, default: 0 },
    joiningDate: { type: Date },
    notes: { type: String }

}, {
    timestamps: true
});

// Pre-save hook to hash password
// Pre-save hook to hash password
// Pre-save hook to hash password
UserSchema.pre('save', async function (this: IUser) {
    if (!this.isModified('password')) {
        return;
    }

    if (!this.password) {
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Method to check password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password || '');
};

// Check if model already exists to prevent overwrite warning in dev hot reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
