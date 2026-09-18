export interface AdminUserListItem {
  id: number;
  isActive: boolean;
  isAdmin: boolean;
  name: string;
  rca: string;
  registeredAt: number;
}

export interface AdminUsersPage {
  items: AdminUserListItem[];
  page: number;
  pageSize: number;
  search: string;
  totalItems: number;
  totalPages: number;
}

export interface AdminUsersStats {
  active: number;
  inactive: number;
  total: number;
}

export interface AdminUsersListData {
  stats: AdminUsersStats;
  users: AdminUsersPage;
}

export interface AdminUserCreated {
  id: number;
  temporaryPassword: string | null;
}
