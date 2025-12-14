import useSWR from "swr";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface User {
    id: string;
    username: string;
    role: 'admin' | 'employee';
    fullName: string;
}

type MeResponse = { user: User | null };

export function useAuth() {
    const router = useRouter();
    const { data, error, isLoading, mutate } = useSWR<MeResponse>("/api/auth/me", fetcher, {
        shouldRetryOnError: false,
        revalidateOnFocus: false,
    });

    const user = data?.user;
    const isAuthenticated = Boolean(user);
    const isAdmin = user?.role === 'admin';
    const isEmployee = user?.role === 'employee';

    const login = async (userData: any) => {
        // In SWR approach, we usually don't "set" user manually, we mutate to re-fetch or set cache.
        // But since my login page does the fetch call, we can just mutate.
        await mutate({ user: userData }, false);
    };

    // For compatibility with existing login page which passes user data
    // We can also fully implement the API call here like FlameTrack
    const loginApi = async (body: any) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Login failed');

        await mutate({ user: json.user }, false);
        return json.user;
    };

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        await mutate({ user: null }, false);
        router.push("/login");
        router.refresh();
    };

    return {
        user,
        isAuthenticated,
        isAdmin,
        isEmployee,
        isLoading,
        error,
        login, // Helper to update local state if needed
        loginApi, // Full API login
        logout
    };
}
