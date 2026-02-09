
import { getCashTransactionById } from "@/app/actions/cash-transactions";
import CashTransactionForm from "../../_components/CashTransactionForm";

interface PageProps {
    params: {
        id: string;
    }
}

export default async function EditCashTransactionPage({ params }: PageProps) {
    const { id } = params;
    const transaction = await getCashTransactionById(id);

    if (!transaction) {
        return <div className="p-6">Transaction not found</div>;
    }

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Edit Transaction</h1>
            <div className="bg-white rounded-xl shadow-sm border p-6 max-w-3xl mx-auto">
                <CashTransactionForm initialData={transaction} isEdit={true} />
            </div>
        </div>
    );
}
