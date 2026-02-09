
import { getCashTransactions } from "@/app/actions/cash-transactions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import CashFlowFilter from "./_components/CashFlowFilter";

export const dynamic = 'force-dynamic';

export default async function CashFlowPage({
    searchParams,
}: {
    searchParams: { type?: string };
}) {
    const filterType = searchParams.type;
    const transactions = await getCashTransactions(filterType);

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Cash Management</h1>
                <div className="flex items-center gap-4">
                    <CashFlowFilter />
                    <Link href="/admin/cash-flow/add">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Transaction
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Entity / Bank</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Account No.</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No transactions found
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((t: any) => (
                                <TableRow key={t._id}>
                                    <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{t.entityName}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {t.type}
                                        </span>
                                    </TableCell>
                                    <TableCell>{t.accountNumber || "-"}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        Rs. {t.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <Link href={`/admin/cash-flow/${t._id}`}>
                                                <Button variant="outline" size="sm">View</Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
