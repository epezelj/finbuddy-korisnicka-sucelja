import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromToken } from "@/lib/auth-node";
import PasswordForm from "./passwordForm";


type SearchParams = Record<string, string | string[] | undefined>;

function getOne(sp: SearchParams, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) redirect("/signin");

  const payload = await getSessionFromToken(token);
  const user = (payload as any)?.user as { id: string; email: string; name?: string | null } | undefined;

  if (!user?.id) redirect("/signin");

  const sp = (await searchParams) ?? {};

  const ok = getOne(sp, "ok");
  const err = getOne(sp, "err");

  async function changePassword(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) redirect("/signin");

    const payload = await getSessionFromToken(token);
    const user = (payload as any)?.user as { id: string } | undefined;
    if (!user?.id) redirect("/signin");

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      redirect("/settings?err=" + encodeURIComponent("Fill in all password fields."));
    }

    if (newPassword.length < 6) {
      redirect("/settings?err=" + encodeURIComponent("New password must be at least 6 characters."));
    }

    if (newPassword !== confirmPassword) {
      redirect("/settings?err=" + encodeURIComponent("New password and confirmation do not match."));
    }

    const [row] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!row?.passwordHash) {
      redirect("/settings?err=" + encodeURIComponent("User record is missing a password hash."));
    }

    const matches = await bcrypt.compare(currentPassword, row.passwordHash);
    if (!matches) {
      redirect("/settings?err=" + encodeURIComponent("Current password is incorrect."));
    }

    const nextHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: nextHash }).where(eq(users.id, user.id));

    redirect("/settings?ok=1");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your profile and security.</p>
      </div>

      {ok ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Password updated successfully.
        </div>
      ) : null}

      {err ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {safeDecode(err)}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            <p className="text-sm text-gray-600">Your account info (read-only).</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-gray-600">Name</div>
              <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {user.name ?? "—"}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-600">Email</div>
              <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {user.email}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-600">Change your password.</p>
          </div>

          <PasswordForm action={changePassword} />
        </section>
      </div>
    </main>
  );
}
