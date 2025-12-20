"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";

export async function getEmployerDetails(id: string) {
    try {
        await connectDB();
        const user = await User.findById(id).select("fullName");
        if (!user) return null;
        return { fullName: user.fullName };
    } catch (error) {
        console.error("Error fetching employer details:", error);
        return null;
    }
}
