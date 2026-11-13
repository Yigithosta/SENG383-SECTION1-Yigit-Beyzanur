import { useAuth } from '../auth/AuthContext.jsx';
import { ComingSoon } from '../components/ComingSoon.jsx';
import { TEST_IDS } from '../testIds.js';

// The child's home. SCRUM-37 adds MyTasksPage here: the child's tasks from
// GET /api/children/${user.childId}/tasks and marking a task done.
export default function ChildHome() {
  const { user } = useAuth();
  const firstName = user.name.split(' ')[0];

  return (
    <div className="content-stack" data-testid={TEST_IDS.childHome}>
      <div className="page-head">
        <h1>Görevlerim</h1>
        <p className="muted">Merhaba {firstName}, bu hafta yapman gerekenler burada.</p>
      </div>
      <ComingSoon title="Görev listesi" task="SCRUM-37" />
    </div>
  );
}
