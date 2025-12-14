import StockEdit from "../../_components/editPage";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <StockEdit id={id} />;
}
