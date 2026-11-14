import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section className="state">
      <div>
        <h1>Sayfa bulunamadı</h1>
        <p>
          Aradığınız sayfa yok. <Link to="/">Ana sayfaya dönün</Link>.
        </p>
      </div>
    </section>
  );
}
