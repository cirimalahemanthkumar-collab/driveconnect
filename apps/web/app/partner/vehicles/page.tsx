import { Button, Card, Input, Select, SidebarLayout, StatusBadge } from "../../../components/ui";

const links = [
  { href: "/partner/dashboard", label: "Overview" },
  { href: "/partner/courses", label: "Courses" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/instructors", label: "Instructors" },
  { href: "/partner/vehicles", label: "Vehicles" },
  { href: "/partner/earnings", label: "Earnings" }
];

const vehicles = ["Maruti Swift KA10DC1001", "Hyundai i20 KA11DC1002", "Honda Activa KA12DC1003"];

export default function PartnerVehiclesPage() {
  return (
    <SidebarLayout title="Vehicles" role="Partner dashboard" links={links}>
      <Card className="mb-5 grid gap-3 md:grid-cols-5">
        <Select><option>FOUR_WHEELER</option><option>TWO_WHEELER</option></Select>
        <Input placeholder="Make" defaultValue="Tata" />
        <Input placeholder="Model" defaultValue="Punch" />
        <Input placeholder="Registration" defaultValue="KA15DC1009" />
        <Button>Add vehicle</Button>
      </Card>
      <div className="grid gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle} className="flex items-center justify-between">
            <h2 className="font-black">{vehicle}</h2>
            <StatusBadge status="ACTIVE" />
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
