export default function Dashboard({ onNavigate }) {
  return (
    <section>
      <h1>Today</h1>
      <p className="lede">You haven't practiced yet today.</p>
      <button className="primary" onClick={() => onNavigate("practice")}>
        Start practice
      </button>
    </section>
  );
}
