import FuelPumpEdit from "../../_components/editPage";

type PageProps = {
    params: { id: string };
};

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <FuelPumpEdit pumpId={id} />;
}
