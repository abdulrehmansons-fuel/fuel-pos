
import { getCustomerById } from "@/app/actions/customers";
import CustomerDetail from "./CustomerDetail";

interface PageProps {
    params: {
        id: string;
    }
}

export default async function Page({ params }: PageProps) {
    const { id } = params;
    const customer = await getCustomerById(id);

    if (!customer) {
        return <div className="p-6">Customer not found</div>;
    }

    return <CustomerDetail customer={customer} />;
}
