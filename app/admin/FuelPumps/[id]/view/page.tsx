import FuelPumpView from "../../_components/viewPage";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <FuelPumpView pumpId={id} />;
}
