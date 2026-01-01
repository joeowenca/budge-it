import { checkUser } from "@/lib/checkUser";

export default async function Home() {
  // This runs the sync logic we just wrote
  const user = await checkUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Auth Test</h1>
      
      {user ? (
        <div className="p-6 border rounded-lg shadow bg-green-50">
          <h2 className="text-xl text-green-700 font-semibold">✅ Success!</h2>
          <p className="mt-2">
            <strong>Hello, {user.name}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Your data is synced to Neon.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Database ID: {user.id}
          </p>
        </div>
      ) : (
        <div className="text-red-500">
          Not logged in or database error.
        </div>
      )}
    </main>
  );
}