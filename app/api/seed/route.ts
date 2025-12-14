import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return NextResponse.json({ message: 'Admin already exists', user: existingAdmin.username });
        }

        // Create Admin
        const admin = await User.create({
            username: 'admin',
            password: 'password123', // Force change on first login in real app
            role: 'admin',
            fullName: 'System Administrator',
            email: 'admin@flametrack.com',
            mobile: '03001234567',
            status: 'Active'
        });

        return NextResponse.json({ success: true, message: 'Admin created successfully', user: admin });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
    }
}
