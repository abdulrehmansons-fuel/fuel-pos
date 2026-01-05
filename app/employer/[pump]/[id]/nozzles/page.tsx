
import { getNozzles } from "@/app/actions/nozzles";
import NozzleManagement from "./_components/NozzleManagement";

interface PageProps {
    params: {
        pump: string;
        id: string;
    }
}

export default async function NozzlePage({ params }: PageProps) {
    const { pump, id } = params;
    const nozzles = await getNozzles(pump);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Daily Sales & Nozzle Management</h1>
            <NozzleManagement
                pumpId={pump}
                employerId={id}
                initialNozzles={nozzles}
            />
        </div>
    );
}
