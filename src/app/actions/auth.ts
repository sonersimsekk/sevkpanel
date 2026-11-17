"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, homeFor, type Role } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "E-posta ve şifre gerekli." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "E-posta veya şifre hatalı." };
  }
  const role = user.role as Role;
  await createSession({ userId: user.id, role, name: user.name });
  redirect(homeFor(role));
}

export async function register(_prev: FormState, fd: FormData): Promise<FormState> {
  const role: Role = str(fd, "role") === "COMPANY" ? "COMPANY" : "CUSTOMER";
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const phone = str(fd, "phone");
  const password = String(fd.get("password") ?? "");
  const companyName = str(fd, "companyName");
  const city = str(fd, "city");

  if (!name || !email || !phone) return { error: "Ad, e-posta ve telefon zorunludur." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Geçerli bir e-posta adresi girin." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };
  if (role === "COMPANY" && !companyName) return { error: "Firma adı zorunludur." };

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin." };

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      ...(role === "COMPANY" ? { company: { create: { name: companyName, city: city || null } } } : {}),
    },
  });

  await createSession({ userId: user.id, role, name: user.name });
  redirect(homeFor(role));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
