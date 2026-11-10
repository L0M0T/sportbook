import { redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/auth";
import { STAFF_ROLES, ROLES, type Role } from "@/lib/constants";

export async function requireSession(next = "/login"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(next);
  return session;
}

export async function requireStaff(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!STAFF_ROLES.includes(session.role as Role)) redirect("/");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== ROLES.ADMIN) redirect("/admin");
  return session;
}

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role as Role);
}
