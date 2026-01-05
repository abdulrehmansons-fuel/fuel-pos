
import { getNozzleCreditCustomers } from "@/app/actions/reports";
import { getNozzles } from "@/app/actions/nozzles";
import NozzleCreditsList from "./_components/CreditList";

interface PageProps {
    params: Promise<{
        id: string;      // pumpId
        nozzleId: string; // nozzleId
    }>;
}

export default async function Page({ params }: PageProps) {
    const { id, nozzleId } = await params;

    // Fetch Data
    const customers = await getNozzleCreditCustomers(id, nozzleId);

    // Get Nozzle Name for display
    const nozzles = await getNozzles(id);
    const currentNozzle = nozzles.find((n: { _id: string; name: string }) => n._id === nozzleId);
    const nozzleName = currentNozzle ? currentNozzle.name : "Unknown Nozzle";

    return (
        <NozzleCreditsList
            customers={customers}
            nozzleName={nozzleName}
        />
    );
}
