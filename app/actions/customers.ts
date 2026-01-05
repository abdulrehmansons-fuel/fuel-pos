"use server";

import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
import Sale from "@/models/Sale";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
    await connectDB();
    const customers = await Customer.find().sort({ updatedAt: -1 });
    return JSON.parse(JSON.stringify(customers));
}

export async function getCustomerById(id: string) {
    await connectDB();
    const customer = await Customer.findById(id);
    if (!customer) return null;
    return JSON.parse(JSON.stringify(customer));
}

export async function updateCustomerBalance(customerId: string, amountPaid: number, notes?: string) {
    await connectDB();
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error("Customer not found");

    customer.balance -= amountPaid;
    await customer.save();

    // Ideally, create a "Payment" record or a "Sale" with negative amount?
    // Or just a Payment History entry if we had a separate Payment model.
    // For now, we update balance. We can create a "zero value" sale to record payment history?
    // Let's keep it simple: Just update balance.

    revalidatePath(`/admin/customers`);
    revalidatePath(`/admin/customers/${customerId}`);
    return { success: true, message: "Balance updated successfully" };
}

export async function setCustomerBalance(customerId: string, newBalance: number) {
    await connectDB();
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error("Customer not found");

    customer.balance = newBalance;
    await customer.save();
    revalidatePath(`/admin/customers`);
    return { success: true, message: "Balance set successfully" };
}

export async function deleteCustomer(id: string) {
    await connectDB();
    await Customer.findByIdAndDelete(id);
    revalidatePath("/admin/customers");
    return { success: true };
}
