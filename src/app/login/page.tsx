import { getFacilityName } from "@/lib/facility";
import LoginForm from "./LoginForm";

// Force per-request rendering: without this Next.js would prerender the
// login page once at build time and freeze in whichever hospital name
// existed then, never picking up later changes from Hospital Setup.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const hospitalName = await getFacilityName();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div
        aria-hidden
        className="grayscale absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.webp')" }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(32, 30, 29, 0.78) 0%, rgba(32, 30, 29, 0.58) 100%)",
        }}
      />
      <div className="card elev-lg relative w-full max-w-sm p-8 motion-safe:animate-[fade-in-up_400ms_ease-out_both]">
        <h1 className="mb-1">{hospitalName}</h1>
        <p className="eyebrow mb-6">Hospital Administration &amp; Management System</p>

        <LoginForm />
      </div>
    </div>
  );
}
