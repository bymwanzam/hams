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
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.35) 100%), url('/background.webp')",
      }}
    >
      <div className="card elev-lg w-full max-w-sm p-8 motion-safe:animate-[fade-in-up_400ms_ease-out_both]">
        <h1 className="mb-1">{hospitalName}</h1>
        <p className="text-sm text-muted mb-6">
          Hospital Administration &amp; Management System
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
