'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface UsersTableColumn<T = any> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export function UsersTable({
  title,
  users,
  loading,
  columns,
  renderActions,
  pagination,
}: {
  title: string;
  users: any[];
  loading: boolean;
  columns: UsersTableColumn[];
  renderActions?: (row: any) => React.ReactNode;
  pagination?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2">
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"
              aria-label="Loading"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="border-b">
                    {columns.map((col) => (
                      <th key={col.key} className={`text-left p-3 font-medium text-sm bg-gray-50 ${col.className || ''}`}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      {columns.map((col) => (
                        <td key={col.key} className={`p-3 ${col.className || ''}`}>
                          {col.key === 'actions'
                            ? (renderActions ? renderActions(u) : null)
                            : (col.render ? col.render(u) : (u as any)[col.key] ?? 'N/A')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


