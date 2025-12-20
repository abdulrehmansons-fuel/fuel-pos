import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
    if (!JWT_SECRET) {
        return NextResponse.json({ error: 'JWT_SECRET not defined in environment' }, { status: 500 });
    }

    try {
        await connectDB();
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        // Find user and select password for comparison
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (user.status !== 'Active') {
            return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: '1d' } // Token valid for 1 day
        );

        // Set cookie
        const serialized = serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                fuelPump: user.fuelPump,
                employerId: user.employerId
            }
        });

        response.headers.set('Set-Cookie', serialized);

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
