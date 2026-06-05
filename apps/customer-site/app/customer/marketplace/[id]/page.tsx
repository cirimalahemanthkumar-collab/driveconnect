import SchoolDetailsClient from "../../../schools/[id]/school-details-client";

export default async function CustomerSchoolDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SchoolDetailsClient schoolId={id} />;
}
