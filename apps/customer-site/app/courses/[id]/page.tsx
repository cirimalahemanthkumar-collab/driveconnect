import { redirect } from "next/navigation";

export default function CourseDetailsPage() {
  redirect(`/login?redirect=${encodeURIComponent("/customer/marketplace")}`);
}
