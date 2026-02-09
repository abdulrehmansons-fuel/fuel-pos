"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { createCashTransaction, updateCashTransaction } from "@/app/actions/cash-transactions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const formSchema = z.object({
    type: z.string().min(1, "Transaction type is required"),
    entityName: z.string().min(1, "Entity/Bank Name is required"),
    accountNumber: z.string().optional(),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Amount must be a positive number",
    }),
    date: z.date({
        required_error: "Date is required",
    }),
    notes: z.string().optional(),
});

import { ICashTransaction } from "@/models/CashTransaction";

interface CashTransactionFormProps {
    initialData?: Partial<ICashTransaction> & { _id?: string };
    isEdit?: boolean;
}

export default function CashTransactionForm({ initialData, isEdit = false }: CashTransactionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: initialData?.type || "",
            entityName: initialData?.entityName || "",
            accountNumber: initialData?.accountNumber || "",
            amount: initialData?.amount?.toString() || "",
            date: initialData?.date ? new Date(initialData.date) : new Date(),
            notes: initialData?.notes || "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const data = {
                ...values,
                amount: Number(values.amount),
            };

            let result;
            if (isEdit && initialData?._id) {
                result = await updateCashTransaction(initialData._id, data);
            } else {
                result = await createCashTransaction(data);
            }

            if (result.success) {
                toast.success(isEdit ? "Transaction updated successfully" : "Transaction created successfully");
                router.push("/admin/cash-flow");
                router.refresh();
            } else {
                toast.error(result.error || "Something went wrong");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction Type <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Cash into Bank">Cash into Bank</SelectItem>
                                        <SelectItem value="Bank Withdrawal">Bank Withdrawal</SelectItem>
                                        <SelectItem value="Expense">Expense</SelectItem>
                                        <SelectItem value="Income">Income</SelectItem>
                                        <SelectItem value="Transfer">Transfer</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="entityName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Entity / Bank Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. HBL, Meezan, John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const date = e.target.valueAsDate;
                                            if (date) {
                                                field.onChange(date);
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Number (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 1234-5678-90" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Additional details..." className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : isEdit ? "Update Transaction" : "Save Transaction"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
