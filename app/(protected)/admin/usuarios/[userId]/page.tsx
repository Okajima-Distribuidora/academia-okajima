import { IconArrowLeft } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserCategoryProgressCharts } from "@/components/admin/users/user-category-progress-charts";
import { UserDetailsForm } from "@/components/admin/users/user-details-form";
import { UserLearningMetrics } from "@/components/admin/users/user-learning-metrics";
import { StudioPageFrame } from "@/components/studio/layout/studio-page-frame";
import { StudioPageHeader } from "@/components/studio/layout/studio-page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminUserDetails,
  getAdminUserLearningMetrics,
  listAdminUserCategoryProgress,
} from "@/lib/admin/users";

export const metadata: Metadata = { title: "Usuário | Painel administrativo" };

export default async function AdminUserDetailsPage({
  params,
}: PageProps<"/admin/usuarios/[userId]">) {
  const { userId } = await params;
  const user = await getAdminUserDetails(userId);
  if (!user) notFound();
  const [learningMetrics, categoryProgress] = await Promise.all([
    getAdminUserLearningMetrics(user.id),
    listAdminUserCategoryProgress(user.id),
  ]);

  return (
    <StudioPageFrame>
      <StudioPageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials(user.firstName, user.lastName, user.username)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate uppercase">{user.name}</span>
          </span>
        }
        description="Dados cadastrais e permissões do usuário."
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/usuarios" />}
          >
            <IconArrowLeft data-icon="inline-start" aria-hidden="true" />
            Voltar para usuários
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Editar usuário</CardTitle>
          <CardDescription>
            Informações disponíveis para a administração da Academia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserDetailsForm user={user} />
          <p className="mt-6 text-sm text-muted-foreground">
            Usuário cadastrado em:{" "}
            <strong>{formatAdminUserDate(user.registeredAt)}</strong>
          </p>
        </CardContent>
      </Card>
      <UserLearningMetrics metrics={learningMetrics} />
      <UserCategoryProgressCharts categories={categoryProgress} />
    </StudioPageFrame>
  );
}

function formatAdminUserDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(timestamp * 1000));
}

function getUserInitials(
  firstName: string,
  lastName: string,
  username: string,
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toLocaleUpperCase("pt-BR");
  }

  return username.slice(0, 2).toLocaleUpperCase("pt-BR") || "U";
}
