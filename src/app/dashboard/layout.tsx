import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen print:h-auto print:block">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
        <header className="nav print:hidden h-14 shrink-0">
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted">
              {session.user.name}{" "}
              <span className="opacity-60">
                ({(session.user as { role?: string }).role})
              </span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="btn btn-ghost">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
