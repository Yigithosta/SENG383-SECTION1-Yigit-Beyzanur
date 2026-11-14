// Placeholder for a screen another task builds. Replace the route element
// in App.jsx with the real component when that task lands.
export function ComingSoon({ title, task }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
      </div>
      <p className="card-body muted">Bu ekran {task} ile eklenecek.</p>
    </section>
  );
}
