import { AdminTasksManager } from './AdminTasksManager';

export function AdminOverview() {
  return (
    <div className="space-y-6">
      {/* ... existing components ... */}
      
      {/* Add the tasks manager */}
      <AdminTasksManager />
    </div>
  );
}