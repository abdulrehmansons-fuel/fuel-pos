import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// We use 'jose' here because standard jsonwebtoken doesn't run on Edge Runtime (middleware)
// You might need to install jose: npm install jose
// If you don't want to use jose, you can run middleware on Node runtime but Edge is default.
// Let's stick to jose for middleware compatibility.

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public paths that don't need auth
    const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout', '/_next', '/favicon.ico', '/api/seed'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
        // If it's an API route, return 401
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Otherwise redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');

        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        const role = payload.role as string;

        // Admin Route Protection
        if (pathname.startsWith('/admin')) {
            if (role !== 'admin') {
                return NextResponse.redirect(new URL('/employer/dashboard', request.url));
            }
        }

        // Employer Route Protection
        if (pathname.startsWith('/employer')) {
            if (role !== 'employee') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
        }

        return NextResponse.next();

    } catch (error) {
        // Token invalid
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'session_expired');
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('token'); // Clear invalid token
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
