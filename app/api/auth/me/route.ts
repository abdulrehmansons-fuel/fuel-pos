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
