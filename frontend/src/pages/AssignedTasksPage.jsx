import { useState } from 'react';
import AssignTaskForm from '../components/AssignTaskForm.jsx';
import AssignedTasksList from '../components/AssignedTasksList.jsx';
import { useChild } from './ChildLayout.jsx';

export default function AssignedTasksPage() {
  const { child } = useChild();
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="content-stack">
      <AssignTaskForm
        childId={child.id}
        onCreated={() => setReloadKey((value) => value + 1)}
      />

      <AssignedTasksList
        childId={child.id}
        reloadKey={reloadKey}
      />
    </div>
  );
}