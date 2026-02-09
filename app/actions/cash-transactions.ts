"use server";

import connectDB from "@/lib/db";
import CashTransaction, { ICashTransaction } from "@/models/CashTransaction";
import { revalidatePath } from "next/cache";

export async function getCashTransactions(filterType?: string) {
    await connectDB();
    const query = filterType && filterType !== "all" ? { type: filterType } : {};
    const transactions = await CashTransaction.find(query).sort({ date: -1, createdAt: -1 });
    return JSON.parse(JSON.stringify(transactions));
}

export async function getCashTransactionById(id: string) {
    await connectDB();
    const transaction = await CashTransaction.findById(id);
    if (!transaction) return null;
    return JSON.parse(JSON.stringify(transaction));
}

export async function createCashTransaction(data: Partial<ICashTransaction>) {
    await connectDB();
    try {
        const newTransaction = await CashTransaction.create(data);
        revalidatePath("/admin/cash-flow");
        return { success: true, data: JSON.parse(JSON.stringify(newTransaction)) };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
    }
}

export async function updateCashTransaction(id: string, data: Partial<ICashTransaction>) {
    await connectDB();
    try {
        const transaction = await CashTransaction.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!transaction) throw new Error("Transaction not found");

        revalidatePath("/admin/cash-flow");
        revalidatePath(`/admin/cash-flow/${id}`);
        return { success: true, data: JSON.parse(JSON.stringify(transaction)) };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
    }
}

export async function deleteCashTransaction(id: string) {
    await connectDB();
    try {
        await CashTransaction.findByIdAndDelete(id);
        revalidatePath("/admin/cash-flow");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
    }
}
