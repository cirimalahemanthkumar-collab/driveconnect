import { Button, Card, SidebarLayout, StatusBadge } from "../../../components/ui";
import { complaints } from "../../../lib/mock";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/school-verification", label: "School verification" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/complaints", label: "Complaints" }
];

export default function AdminComplaintsPage() {
  return (
    <SidebarLayout title="Complaints" role="Admin dashboard" links={links}>
      <div className="grid gap-4">
        {complaints.map((complaint) => (
          <Card key={complaint.id} className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <StatusBadge status={complaint.status} />
              <h2 className="mt-3 text-xl font-black">{complaint.subject}</h2>
              <p className="text-sm text-slate-500">{complaint.id} - {complaint.owner}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary">Resolve</Button>
              <Button variant="ghost">Refund review</Button>
            </div>
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
