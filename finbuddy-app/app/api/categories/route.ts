import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const key = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev_secret_change_me"
);

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return (payload as any)?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(categories).where(eq(categories.userId, userId));
  return NextResponse.json({ categories: rows });
}

export async function POST(req: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = body.type === "expense" || body.type === "income" ? body.type : null;
  const color = typeof body.color === "string" && body.color.trim() ? body.color.trim() : "#2563EB";
  const monthlyLimitCents =
    body.monthlyLimitCents === null || body.monthlyLimitCents === undefined
      ? null
      : (typeof body.monthlyLimitCents === "number" ? body.monthlyLimitCents : null);

  if (!name || !type) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await db.insert(categories).values({
    id: createId(),
    userId,
    name,
    type,
    color,
    monthlyLimitCents,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = body.type === "expense" || body.type === "income" ? body.type : null;
  const color = typeof body.color === "string" && body.color.trim() ? body.color.trim() : "#2563EB";
  const monthlyLimitCents =
    body.monthlyLimitCents === null || body.monthlyLimitCents === undefined
      ? null
      : (typeof body.monthlyLimitCents === "number" ? body.monthlyLimitCents : null);

  if (!name || !type) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await db
    .update(categories)
    .set({ name, type, color, monthlyLimitCents })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  return NextResponse.json({ ok: true });
}
