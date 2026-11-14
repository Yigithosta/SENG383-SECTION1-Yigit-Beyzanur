import { render } from '@testing-library/react';
import App from '../App.jsx';

// Renders the whole app (router, auth, screens) at the given address.
export function renderApp(path = '/') {
  window.history.pushState({}, '', path);
  return render(<App />);
}
