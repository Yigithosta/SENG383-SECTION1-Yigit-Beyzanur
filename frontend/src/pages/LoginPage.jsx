import { WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { homePathFor, useAuth } from '../auth/AuthContext.jsx';
import { BrandMark } from '../components/Sidebar.jsx';
import { PageLoading } from '../components/States.jsx';
import { TEST_IDS } from '../testIds.js';

// FR-M1-01, FR-M1-02. There is no role picker: the role comes from the account.
export default function LoginPage() {
  const { status, user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'loading') {
    return <PageLoading label="Oturum kontrol ediliyor" />;
  }
  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? homePathFor(user)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="centered-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand">
            <BrandMark />
            <span className="brand-name">Gelişim Takibi</span>
          </span>
          <div>
            <h1 id="login-title">Hesabınıza giriş yapın</h1>
            <p className="muted">Ebeveyn, uzman ve çocuk hesapları aynı ekrandan girer.</p>
          </div>
        </div>

        <form
          className="login-panel"
          onSubmit={handleSubmit}
          aria-labelledby="login-title"
          data-testid={TEST_IDS.loginForm}
          noValidate
        >
          {error && (
            <p className="form-error" role="alert" data-testid={TEST_IDS.loginError}>
              <WarningCircle size={18} weight="fill" aria-hidden="true" />
              {error}
            </p>
          )}

          <label className="field">
            <span>E-posta</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid={TEST_IDS.loginEmail}
            />
          </label>

          <label className="field">
            <span>Şifre</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid={TEST_IDS.loginPassword}
            />
          </label>

          <button
            type="submit"
            className="button button-primary button-block"
            disabled={submitting}
            data-testid={TEST_IDS.loginSubmit}
          >
            {submitting ? 'Giriş yapılıyor' : 'Giriş yap'}
          </button>
        </form>

        <p className="muted login-note">
          Demo hesapları README'deki "Demo Accounts" bölümünde. Tüm veriler sentetiktir.
        </p>
      </div>
    </main>
  );
}
