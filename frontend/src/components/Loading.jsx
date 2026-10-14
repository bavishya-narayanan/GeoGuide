export default function Loading({ label = 'Loading...' }) {
  return <div className="status-panel loading-panel"><span className="spinner" />{label}</div>;
}