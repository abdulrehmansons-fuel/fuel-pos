import SaleView from "../../_components/viewPage";

type PageProps = {
    params: Promise<{ id: string }>;
};

const ViewSalePage = async () => {


    return <SaleView />;
};

export default ViewSalePage;
