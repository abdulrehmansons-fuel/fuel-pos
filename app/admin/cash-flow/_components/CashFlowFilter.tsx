"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CashFlowFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentType = searchParams.get("type") || "all";

    const handleTypeChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete("type");
        } else {
            params.set("type", value);
        }
        router.push(`/admin/cash-flow?${params.toString()}`);
        router.refresh();
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Filter by Type:</span>
            <Select value={currentType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[200px] bg-white">
                    <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Cash into Bank">Cash into Bank</SelectItem>
                    <SelectItem value="Bank Withdrawal">Bank Withdrawal</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
