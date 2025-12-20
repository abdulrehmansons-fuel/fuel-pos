import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
    if (!JWT_SECRET) {
        return NextResponse.json({ error: 'JWT_SECRET not defined' }, { status: 500 });
    }

    const cookieStore = cookies();
    const token = cookieStore.get('token');

    if (!token) {
        return NextResponse.json({ user: null });
    }

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: string };
        await connectDB();

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({ user });
    } catch {
        // Token invalid or expired
        return NextResponse.json({ user: null });
    }
}

export async function PUT(request: Request) {
    if (!JWT_SECRET) {
        return NextResponse.json({ error: 'JWT_SECRET not defined' }, { status: 500 });
    }

    const cookieStore = cookies();
    const token = cookieStore.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: string };
        const { password } = await request.json();

        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.password = password;
        await user.save();

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
    }
}
