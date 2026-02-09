
import CashTransactionForm from "../_components/CashTransactionForm";

export default function NewCashTransactionPage() {
    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Add New Transaction</h1>
            <div className="bg-white rounded-xl shadow-sm border p-6 max-w-3xl mx-auto">
                <CashTransactionForm />
            </div>
        </div>
    );
}
