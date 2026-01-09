import { checkUser } from "@/lib/checkUser";
import DashboardGrid from "@/components/dashboard/DashboardGrid";

export default async function Home() {
  const user = await checkUser();

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-red-500">
          Not logged in or database error.
        </div>
      </main>
    );
  }

  return (
    <div className="h-full container mx-auto lg:p-4">
      <DashboardGrid />
    </div>
  );
}