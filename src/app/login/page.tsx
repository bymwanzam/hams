import { getFacilityName } from "@/lib/facility";
import LoginForm from "./LoginForm";

// Force per-request rendering: without this Next.js would prerender the
// login page once at build time and freeze in whichever hospital name
// existed then, never picking up later changes from Hospital Setup.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const hospitalName = await getFacilityName();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #e0f2fe 0%, #f8fafc 50%, #d1fae5 100%)",
      }}
    >
      <div className="w-full max-w-sm bg-white shadow-xl ring-1 ring-slate-900/5 rounded-xl p-8 motion-safe:animate-[fade-in-up_400ms_ease-out_both]">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          {hospitalName}
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Hospital Administration &amp; Management System
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
