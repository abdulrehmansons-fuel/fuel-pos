import EmployerView from "../../_components/viewPage";

type PageProps = {
	params: Promise<{ id: string }>;
};



export default async function Page({ params }: PageProps) {
	const { id } = await params;
	return <EmployerView employerId={id} />;
}
