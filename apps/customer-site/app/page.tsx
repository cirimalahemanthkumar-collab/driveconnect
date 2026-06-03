import { Button, CourseCard, DashboardStatCard, SchoolCard, TrustBadges } from "@/components/ui";
import { courses, schools } from "../../web/lib/mock";

const learnerStats = [
  { label: "Verified schools nearby", value: "72", tone: "blue", delta: "8 featured" },
  { label: "Average rating", value: "4.7", tone: "green", delta: "2k reviews" },
  { label: "Flexible slots", value: "6 AM", tone: "amber", delta: "to 9 PM" },
  { label: "Connected accounts", value: "2 roles", tone: "indigo", delta: "One site" }
] as const;

export default function LandingPage() {
  return (
    <main>
      <section className="relative min-h-[78vh] overflow-hidden">
        <img src="/images/hero-driveconnect.png" alt="Driving instructor and learner using DriveConnect" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 py-16">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-bold uppercase text-amber-300">Verified driving school marketplace</p>
            <h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">DriveConnect</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-blue-50">Discover nearby driving schools, compare courses, book flexible slots, and keep daily operations moving from one colorful marketplace.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/schools" variant="secondary">Find schools</Button>
              <Button href="/login" variant="ghost">Customer or partner login</Button>
            </div>
            <div className="mt-8"><TrustBadges /></div>
            <p className="mt-6 max-w-xl text-sm leading-6 text-blue-100">DriveConnect offers discovery, booking, class tracking, support, ratings, and licence process guidance. It does not guarantee licence outcomes.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:grid-cols-4">
        {learnerStats.map((stat) => <DashboardStatCard key={stat.label} {...stat} />)}
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase text-blue-600">Top ranked nearby</p>
              <h2 className="mt-1 text-3xl font-black">Schools ready for booking</h2>
            </div>
            <Button href="/schools" variant="dark">Browse all</Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2">{schools.slice(0, 2).map((school) => <SchoolCard key={school.id} school={school} />)}</div>
        </div>
        <div>
          <div className="mb-5">
            <p className="text-sm font-bold uppercase text-green-700">Popular courses</p>
            <h2 className="mt-1 text-3xl font-black">Transparent packages</h2>
          </div>
          <div className="grid gap-5">{courses.slice(0, 2).map((course) => <CourseCard key={course.id} course={course} />)}</div>
        </div>
      </section>
    </main>
  );
}

