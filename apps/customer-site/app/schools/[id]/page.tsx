import { redirect } from "next/navigation";

export default async function SchoolDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/login?redirect=${encodeURIComponent(`/customer/marketplace/${id}`)}`);
}
