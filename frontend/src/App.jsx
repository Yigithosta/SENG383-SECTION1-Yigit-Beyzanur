import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { HomeRedirect, RequireAuth, RequireRole } from './auth/guards.jsx';
import { AppShell } from './components/AppShell.jsx';
import { ComingSoon } from './components/ComingSoon.jsx';
import ChildHome from './pages/ChildHome.jsx';
import ChildLayout from './pages/ChildLayout.jsx';
import ChildOverview from './pages/ChildOverview.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ParentHome from './pages/ParentHome.jsx';
import SpecialistHome from './pages/SpecialistHome.jsx';
import WeeklySchedule from './pages/WeeklySchedule.jsx';
import { useChild } from './pages/ChildLayout.jsx';

const ADULTS = ['parent', 'specialist'];
function AdultSchedule() {
  const { child } = useChild();
  return <WeeklySchedule childId={child.id} canCreate />;
}
function ChildSchedule() {
  const { user } = useAuth();
  return <WeeklySchedule childId={user.childId} canCreate={false} />;
}

// FR-M1-03: the same /children address shows the parent or specialist home.
function ChildrenHome() {
  const { user } = useAuth();
  return user.role === 'parent' ? <ParentHome /> : <SpecialistHome />;
}

// Routes:
//   /login                          LoginPage
//   /children                       ParentHome or SpecialistHome
//   /children/:childId              child profile, with tabs:
//     schedule                      M3 weekly schedule (SCRUM-34)
//     tasks                         M4 assign and list tasks (SCRUM-36)
//     specialists                   M2 linked specialists (SCRUM-44)
//   /my-tasks                       ChildHome, the child's tasks (SCRUM-37)
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
          <Route path="tasks" element={<ComingSoon title="Görevler" task="SCRUM-36" />} />
          <Route path="specialists" element={<ComingSoon title="Bağlı uzmanlar" task="SCRUM-44" />} />
        </Route>
         <Route
           path="my-schedule"
           element={
              <RequireRole roles={['child']}>
               <ChildSchedule />
             </RequireRole>
       }
/>
        <Route
          path="my-tasks"
          element={
            <RequireRole roles={['child']}>
              <ChildHome />
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
