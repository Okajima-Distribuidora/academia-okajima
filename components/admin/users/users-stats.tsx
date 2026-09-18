import { IconUserOff, IconUsers, IconUsersGroup } from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function UsersStats({
  active,
  inactive,
  total,
}: {
  active: number;
  inactive: number;
  total: number;
}) {
  const number = new Intl.NumberFormat("pt-BR");

  return (
    <section
      aria-label="Resumo dos usuários"
      className="grid gap-3 sm:grid-cols-3"
    >
      <Card size="sm">
        <CardHeader>
          <CardDescription>Usuários</CardDescription>
          <div className="flex items-center gap-2 mt-1">
            <IconUsersGroup
              aria-hidden="true"
              className="size-6 shrink-0"
              stroke={1.8}
            />
            <CardTitle className="text-2xl! leading-none font-semibold">
              {number.format(total)}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardDescription>Ativos</CardDescription>
          <div className="flex items-center gap-2 mt-1">
            <IconUsers
              stroke={1.8}
              className="size-6 shrink-0"
              aria-hidden="true"
            />
            <CardTitle className="text-2xl! leading-none font-semibold">
              {number.format(active)}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardDescription>Inativos</CardDescription>
          <div className="flex items-center gap-2 mt-1">
            <IconUserOff
              stroke={1.8}
              className="size-6 shrink-0"
              aria-hidden="true"
            />
            <CardTitle className="text-2xl! leading-none font-semibold">
              {number.format(inactive)}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
    </section>
  );
}
