import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { HomeRedirect, RequireAuth, RequireRole } from './auth/guards.jsx';
import { AppShell } from './components/AppShell.jsx';
import AssignedTasksPage from './pages/AssignedTasksPage.jsx';
import ChildHome from './pages/ChildHome.jsx';
import ChildLayout, { useChild } from './pages/ChildLayout.jsx';
import ChildOverview from './pages/ChildOverview.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ParentHome from './pages/ParentHome.jsx';
import SpecialistHome from './pages/SpecialistHome.jsx';
import SpecialistsPage from './pages/SpecialistsPage.jsx';
import WeeklySchedule from './pages/WeeklySchedule.jsx';

const ADULTS = ['parent', 'specialist'];

// FR-M1-03: the same /children address shows the parent or specialist home.
function ChildrenHome() {
  const { user } = useAuth();
  return user.role === 'parent' ? <ParentHome /> : <SpecialistHome />;
}

// M3: parents and linked specialists add events; the child only reads them.
function AdultSchedule() {
  const { child } = useChild();
  return <WeeklySchedule childId={child.id} canCreate />;
}

function ChildSchedule() {
  const { user } = useAuth();
  return <WeeklySchedule childId={user.childId} canCreate={false} />;
}

// Routes:
//   /login                          LoginPage
//   /children                       ParentHome or SpecialistHome
//   /children/:childId              child profile, with tabs:
//     schedule                      M3 WeeklySchedule
//     tasks                         M4 AssignedTasksPage
//     specialists                   M2 SpecialistsPage
//   /my-tasks                       ChildHome with MyTasksPage (child only)
//   /my-schedule                    M3 WeeklySchedule, read only (child only)
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />

        <Route
          path="children"
          element={
            <RequireRole roles={ADULTS}>
              <ChildrenHome />
            </RequireRole>
          }
        />

        <Route
          path="children/:childId"
          element={
            <RequireRole roles={ADULTS}>
              <ChildLayout />
            </RequireRole>
          }
        >
          <Route index element={<ChildOverview />} />
          <Route path="schedule" element={<AdultSchedule />} />
          <Route path="tasks" element={<AssignedTasksPage />} />
          <Route path="specialists" element={<SpecialistsPage />} />
        </Route>

        <Route
          path="my-tasks"
          element={
            <RequireRole roles={['child']}>
              <ChildHome />
            </RequireRole>
          }
        />

        <Route
          path="my-schedule"
          element={
            <RequireRole roles={['child']}>
              <ChildSchedule />
            </RequireRole>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
