import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { currentIdentity } from "./credentials";
import { createUsersRepository } from "./users";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    return await currentIdentity(
      session.user.id,
      createUsersRepository(getDb()),
    );
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStudioUser() {
  const user = await requireUser();
  if (!user.isStudioAdmin) redirect("/");
  return user;
}

export async function authorizeStudioRequest() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  }
  if (!user.isStudioAdmin) {
    return Response.json(
      { message: "Você não tem permissão para acessar o Studio." },
      { status: 403 },
    );
  }
  if (user.mustChangePassword) {
    return Response.json(
      { message: "Defina uma nova senha antes de continuar." },
      { status: 403 },
    );
  }
  return null;
}
