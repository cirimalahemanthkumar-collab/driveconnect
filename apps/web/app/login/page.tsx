import { Button, Card, Input } from "../../components/ui";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.1fr]">
      <section>
        <p className="text-sm font-bold uppercase text-blue-600">Mock OTP login</p>
        <h1 className="mt-2 text-4xl font-black">One mobile number for learners, partners, and admins</h1>
        <p className="mt-4 text-slate-600">For MVP testing, enter any mobile number and use OTP 123456.</p>
      </section>
      <Card className="space-y-4">
        <Input placeholder="Mobile number" defaultValue="+919880000001" />
        <Input placeholder="OTP" defaultValue="123456" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Button href="/home">Customer</Button>
          <Button href="/partner/dashboard" variant="secondary">Partner</Button>
          <Button href="/admin/dashboard" variant="dark">Admin</Button>
        </div>
      </Card>
    </main>
  );
}
