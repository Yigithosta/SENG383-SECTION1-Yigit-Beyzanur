import { Navigate, useLocation } from 'react-router';
import { ErrorState, PageLoading } from '../components/States.jsx';
import { homePathFor, useAuth } from './AuthContext.jsx';

// Screens behind login (FR-M1-04). Hiding a screen is not the protection:
// the API checks the token and the child relation on every request.
export function RequireAuth({ children }) {
  const { status, loggedOut, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <PageLoading />;
  }
  if (status === 'error') {
    return (
      <main className="centered-page">
        <ErrorState onRetry={retry} />
      </main>
    );
  }
  if (status === 'anonymous') {
    const from = loggedOut ? undefined : location.pathname + location.search;
    return <Navigate to="/login" replace state={from && { from }} />;
  }
  return children;
}

// Sends a user who opens another role's screen back to their own home.
export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) {
    return <Navigate to={homePathFor(user)} replace />;
  }
  return children;
}

export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathFor(user)} replace />;
}
