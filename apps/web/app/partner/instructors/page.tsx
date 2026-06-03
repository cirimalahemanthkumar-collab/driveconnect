import { Button, Card, Input, Select, SidebarLayout } from "../../../components/ui";

const links = [
  { href: "/partner/dashboard", label: "Overview" },
  { href: "/partner/courses", label: "Courses" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/instructors", label: "Instructors" },
  { href: "/partner/vehicles", label: "Vehicles" },
  { href: "/partner/earnings", label: "Earnings" }
];

const instructors = ["Ananya Sharma", "Ravi Rao", "Meera Sharma", "Arjun Rao"];

export default function PartnerInstructorsPage() {
  return (
    <SidebarLayout title="Instructors" role="Partner dashboard" links={links}>
      <Card className="mb-5 grid gap-3 md:grid-cols-5">
        <Input placeholder="Name" defaultValue="Sana Khan" />
        <Input placeholder="Phone" defaultValue="+917760000012" />
        <Select><option>FEMALE</option><option>MALE</option><option>OTHER</option></Select>
        <Input placeholder="Experience years" defaultValue="5" />
        <Button>Add instructor</Button>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {instructors.map((name, index) => (
          <Card key={name}>
            <h2 className="text-xl font-black">{name}</h2>
            <p className="mt-2 text-sm text-slate-500">{2 + index} years experience - English, Kannada</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-green-500" style={{ width: `${78 + index * 4}%` }} /></div>
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
