import EmployerEdit from "../../_components/editPage";

type PageProps = {
	params: Promise<{ id: string }>;
};



export default async function Page({ params }: PageProps) {
	const { id } = await params;
	return <EmployerEdit employerId={id} />;
}
