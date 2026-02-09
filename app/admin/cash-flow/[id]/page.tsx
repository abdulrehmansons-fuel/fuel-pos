
import { getCashTransactionById } from "@/app/actions/cash-transactions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { DeleteTransactionButton } from "../_components/DeleteTransactionButton";

interface PageProps {
    params: {
        id: string;
    }
}

export default async function ViewCashTransactionPage({ params }: PageProps) {
    const { id } = params;
    const transaction = await getCashTransactionById(id);

    if (!transaction) {
        return <div className="p-6">Transaction not found</div>;
    }



    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/cash-flow">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Transaction Details</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-8 max-w-3xl mx-auto">
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">
                            Rs. {transaction.amount.toFixed(2)}
                        </h2>
                        <p className="text-gray-500 mt-1">{transaction.type}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/cash-flow/${id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                        <DeleteTransactionButton id={id} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Entity / Bank</h3>
                        <p className="text-lg font-medium">{transaction.entityName}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
                        <p className="text-lg font-medium">
                            {new Date(transaction.date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Account Number</h3>
                        <p className="text-lg font-medium">{transaction.accountNumber || "N/A"}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction ID</h3>
                        <p className="text-sm font-mono text-gray-600 bg-gray-100 p-1 rounded inline-block">
                            {transaction._id}
                        </p>
                    </div>

                    {transaction.notes && (
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap border">
                                {transaction.notes}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
