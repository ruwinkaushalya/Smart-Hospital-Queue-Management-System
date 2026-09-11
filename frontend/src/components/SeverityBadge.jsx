export default function SeverityBadge({ severity }) {
  const colors = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-300',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
    MODERATE: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    LOW: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    ROUTINE: 'bg-slate-100 text-slate-600 border-slate-300',
  };
  return (
    <span className={`badge border text-[10px] uppercase tracking-wide ${colors[severity] || colors.ROUTINE}`}>
      {severity}
    </span>
  );
}
