"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { recordAudit } from "@/lib/audit/audit";
import { signupSchema } from "@/schemas/auth";

const TRIAL_DAYS = 3;

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function loginAction(email: string, password: string): Promise<ActionResult> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: "E-mail ou senha inválidos" };
    }
    throw err;
  }
}

export async function registerCompanyAction(input: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const [existingCnpj, existingEmail, plan] = await Promise.all([
    prisma.company.findUnique({ where: { cnpj: data.cnpj } }),
    prisma.user.findUnique({ where: { email: data.adminEmail.toLowerCase().trim() } }),
    prisma.plan.findUnique({ where: { id: data.planId } }),
  ]);

  if (existingCnpj) return { success: false, error: "Já existe uma empresa cadastrada com este CNPJ" };
  if (existingEmail) return { success: false, error: "Já existe uma conta com este e-mail" };
  if (!plan || !plan.active) return { success: false, error: "Plano inválido" };

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const passwordHash = await bcrypt.hash(data.password, 10);

  const company = await prisma.company.create({
    data: {
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      cnpj: data.cnpj,
      email: data.companyEmail,
      phone: data.phone,
      status: "TRIAL",
      trialStartsAt: now,
      trialEndsAt,
      settings: { create: {} },
      subscription: {
        create: {
          planId: plan.id,
          status: "TRIALING",
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          paymentProvider: "manual",
        },
      },
      users: {
        create: {
          userType: "COMPANY_USER",
          name: data.adminName,
          email: data.adminEmail.toLowerCase().trim(),
          passwordHash,
          role: "ADMINISTRADOR",
        },
      },
    },
    include: { users: true },
  });

  await recordAudit({
    companyId: company.id,
    userId: company.users[0]?.id ?? null,
    action: "company.signup",
    entity: "Company",
    entityId: company.id,
    newData: { nomeFantasia: company.nomeFantasia, plan: plan.name },
  });

  try {
    await signIn("credentials", { email: data.adminEmail, password: data.password, redirect: false });
  } catch {
    // Account was created successfully even if auto-login fails; user can log in manually.
  }

  return { success: true };
}
