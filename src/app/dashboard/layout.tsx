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
    <div className="flex h-screen bg-slate-50 print:h-auto print:block">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
        <header className="print:hidden h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {session.user.name}{" "}
              <span className="text-slate-400">
                ({(session.user as { role?: string }).role})
              </span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-slate-500 hover:text-slate-800"
              >
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
