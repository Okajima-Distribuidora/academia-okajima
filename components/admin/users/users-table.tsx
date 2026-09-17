"use client";

import {
  columnVisibilityFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UsersTableItem = {
  id: number;
  name: string;
  rca: string;
  registeredAt: number;
  isActive: boolean;
  isAdmin: boolean;
};

interface UsersTableProps {
  users: UsersTableItem[];
}

const dataTableFeatures = tableFeatures({ columnVisibilityFeature });
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  UsersTableItem
>();

const registrationDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const columnWidths: Record<string, string> = {
  name: "w-[32%]",
  permission: "w-[18%]",
  rca: "w-[20%]",
  registeredAt: "w-[16%]",
  status: "w-[14%]",
};

function formatRegistrationDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Não informado";

  return registrationDateFormatter.format(new Date(timestamp * 1000));
}

const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    cell: ({ row }) => (
      <Link className="font-medium" href={`/admin/usuarios/${row.original.id}`}>
        {row.getValue("name")}
      </Link>
    ),
    header: "Nome",
  }),
  columnHelper.accessor("rca", {
    header: "RCA",
  }),
  columnHelper.display({
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "success" : "destructive"}>
        {row.original.isActive ? "Ativo" : "Inativo"}
      </Badge>
    ),
    header: "Status",
    id: "status",
  }),
  columnHelper.display({
    cell: ({ row }) => (
      <Badge variant={row.original.isAdmin ? "default" : "secondary"}>
        {row.original.isAdmin ? "Administrador" : "Usuário"}
      </Badge>
    ),
    header: "Permissão",
    id: "permission",
  }),
  columnHelper.accessor("registeredAt", {
    cell: ({ row }) => formatRegistrationDate(row.getValue("registeredAt")),
    header: "Cadastro",
  }),
]);

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter();
  const table = useTable({
    columns,
    data: users,
    features: dataTableFeatures,
    getRowId: (user) => String(user.id),
  });

  return (
    <Table className="table-fixed">
      <TableHeader className="bg-muted">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                className={columnWidths[header.column.id]}
                key={header.id}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            className="cursor-pointer hover:bg-accent"
            key={row.id}
            onClick={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("a")
              ) {
                return;
              }

              router.push(`/admin/usuarios/${row.original.id}`);
            }}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
