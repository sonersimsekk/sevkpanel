import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export type Role = "CUSTOMER" | "COMPANY";
export type Session = { userId: string; role: Role; name: string };

const COOKIE = "session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Geçerli oturumu döndürür; kullanıcı veritabanında yoksa null. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, role: true, name: true },
    });
    if (!user) return null;
    return { userId: user.id, role: user.role as Role, name: user.name };
  } catch {
    return null;
  }
}

export function homeFor(role: Role) {
  return role === "COMPANY" ? "/firma" : "/musteri";
}

export async function requireRole(role: Role): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/giris" + (role === "COMPANY" ? "?tip=firma" : ""));
  if (session.role !== role) redirect(homeFor(session.role));
  return session;
}

export async function requireCompany() {
  const session = await requireRole("COMPANY");
  const company = await db.company.findUnique({ where: { ownerId: session.userId } });
  if (!company) redirect("/giris?tip=firma");
  return { session, company };
}
