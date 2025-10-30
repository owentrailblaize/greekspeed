import { Badge } from '@/components/ui/badge';
import { getRoleDisplayName } from '@/lib/permissions';
import type { UsersTableColumn } from './UsersTable';

export const execColumns: UsersTableColumn[] = [
  { key: 'full_name', header: 'Full Name', render: (u: any) => u.full_name || 'N/A' },
  { key: 'role', header: 'Role', render: (u: any) => u.role || 'N/A' },
  { key: 'chapter_role', header: 'Chapter Role', render: (u: any) => u.chapter_role ? getRoleDisplayName(u.chapter_role as any) : 'N/A' },
  { key: 'email', header: 'Email', render: (u: any) => u.email },
  { key: 'actions', header: 'Actions', className: 'w-40' }
];

export function buildDeveloperColumns(options: {
  getRoleBadgeVariant: (role: string | null) => 'default' | 'outline' | 'secondary' | 'destructive';
  formatDate: (dateString: string) => string;
  showDeveloperColumn: boolean;
}): UsersTableColumn[] {
  const { getRoleBadgeVariant, formatDate, showDeveloperColumn } = options;

  const cols: UsersTableColumn[] = [
    {
      key: 'user_info',
      header: 'User Info',
      render: (u: any) => (
        <div>
          <p className="font-medium">{u.full_name || 'N/A'}</p>
          <p className="text-sm text-gray-600">{u.email}</p>
        </div>
      )
    },
    {
      key: 'role_status',
      header: 'Role & Status',
      render: (u: any) => (
        <div className="space-y-1">
          <Badge variant={getRoleBadgeVariant(u.role)}>{u.role || 'N/A'}</Badge>
          <Badge variant="outline" className="text-xs">{u.member_status || 'N/A'}</Badge>
          {u.chapter_role && (
            <p className="text-xs text-gray-600">{getRoleDisplayName(u.chapter_role as any)}</p>
          )}
        </div>
      )
    },
    { key: 'chapter', header: 'Chapter', render: (u: any) => <p className="text-sm">{u.chapter || 'N/A'}</p> },
    {
      key: 'contact',
      header: 'Contact',
      render: (u: any) => (
        <div className="space-y-1">
          {u.phone && <p className="text-sm">{u.phone}</p>}
          {u.location && <p className="text-sm">{u.location}</p>}
          {!u.phone && !u.location && <p className="text-xs text-gray-500">No contact info</p>}
        </div>
      )
    },
    {
      key: 'academic',
      header: 'Academic',
      render: (u: any) => (
        <div className="space-y-1">
          {u.major && <p className="text-sm">{u.major}</p>}
          {u.grad_year && <p className="text-sm">Class of {u.grad_year}</p>}
          {!u.major && !u.grad_year && <p className="text-xs text-gray-500">No academic info</p>}
        </div>
      )
    },
  ];

  if (showDeveloperColumn) {
    cols.push({
      key: 'developer',
      header: 'Developer',
      render: (u: any) => (
        u.is_developer ? (
          <div className="space-y-1">
            <Badge variant="secondary">Developer</Badge>
            <p className="text-xs text-gray-600">{u.developer_permissions?.length || 0} permissions</p>
            <p className="text-xs text-gray-500">{u.access_level || 'N/A'} access</p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Standard user</p>
        )
      )
    });
  }

  cols.push(
    { key: 'created', header: 'Created', render: (u: any) => (
      <div>
        <p className="text-sm">{formatDate(u.created_at)}</p>
        <p className="text-xs text-gray-500">Updated: {formatDate(u.updated_at)}</p>
      </div>
    ) },
    { key: 'actions', header: 'Actions', className: 'w-40' }
  );

  return cols;
}


