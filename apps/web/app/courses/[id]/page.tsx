import { Badge, Button, Card } from "../../../components/ui";
import { courses, schools } from "../../../lib/mock";

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = courses.find((item) => item.id === id) ?? courses[0];
  const school = schools.find((item) => item.id === course.schoolId) ?? schools[0];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section>
        <p className="text-sm font-bold uppercase text-blue-600">{school.name}</p>
        <h1 className="mt-2 text-4xl font-black">{course.title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">A structured course with instructor assignment, scheduled classes, progress notes, mock payment, and DriveConnect support.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Card><p className="text-sm text-slate-500">Vehicle</p><p className="mt-2 font-black">{course.vehicle}</p></Card>
          <Card><p className="text-sm text-slate-500">Type</p><p className="mt-2 font-black">{course.type}</p></Card>
          <Card><p className="text-sm text-slate-500">Sessions</p><p className="mt-2 font-black">{course.sessions}</p></Card>
          <Card><p className="text-sm text-slate-500">Days</p><p className="mt-2 font-black">{course.days}</p></Card>
        </div>
      </section>
      <Card className="h-fit space-y-4">
        <Badge tone={course.pickup ? "green" : "slate"}>{course.pickup ? "Pickup included" : "Pickup not included"}</Badge>
        <div>
          <p className="text-sm text-slate-500">Course fee</p>
          <p className="text-4xl font-black">Rs {course.price}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Payable advance</p>
          <p className="text-2xl font-black text-green-700">Rs {course.advance}</p>
        </div>
        <Button href="/checkout" className="w-full">Choose date and slot</Button>
      </Card>
    </main>
  );
}
