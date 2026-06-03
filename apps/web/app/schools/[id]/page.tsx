import { Badge, Button, Card, CourseCard, RatingStars, StatusBadge } from "../../../components/ui";
import { courses, schools } from "../../../lib/mock";

export default async function SchoolDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = schools.find((item) => item.id === id) ?? schools[0];
  const schoolCourses = courses.filter((course) => course.schoolId === school.id);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className={`rounded-lg bg-gradient-to-r ${school.gradient} p-8 text-white shadow-soft`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <StatusBadge status={school.status} />
            <h1 className="mt-4 text-4xl font-black">{school.name}</h1>
            <p className="mt-3 max-w-2xl leading-7 text-white/90">{school.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="amber">{school.city}</Badge>
              <Badge tone="green">{school.distance} km away</Badge>
              {school.femaleInstructor ? <Badge tone="indigo">Female instructor option</Badge> : null}
            </div>
          </div>
          <RatingStars rating={school.rating} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-2xl font-black">Courses and packages</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {schoolCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <Card>
            <h3 className="text-xl font-black">School profile</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Reviews</dt><dd className="font-bold">{school.reviews}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Pickup</dt><dd className="font-bold">{school.pickup ? "Available" : "Not available"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Starting price</dt><dd className="font-bold">Rs {school.priceFrom}</dd></div>
            </dl>
            <Button href="/checkout" className="mt-5 w-full">Start booking</Button>
          </Card>
          <Card>
            <h3 className="text-xl font-black">Licence support</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">This school can guide documents, practice, and test process. Licence approval is not guaranteed by the platform.</p>
          </Card>
        </aside>
      </section>
    </main>
  );
}
