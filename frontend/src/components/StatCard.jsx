import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
  const colorMap = {
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-violet-50 text-violet-700 border-violet-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    pink: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const iconBgMap = {
    red: 'bg-red-500',
    blue: 'bg-cyan-600',
    green: 'bg-emerald-600',
    amber: 'bg-amber-500',
    purple: 'bg-violet-500',
    teal: 'bg-teal-600',
    slate: 'bg-slate-500',
    pink: 'bg-rose-500',
  };

  return (
    <div className={`card ${colorMap[color] || colorMap.slate} border transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold mt-1 text-slate-800">{value}</p>
          {subtitle && <p className="text-xs mt-1 text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 ${iconBgMap[color] || iconBgMap.slate} rounded-lg flex items-center justify-center text-white shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3 text-xs">
          {trend >= 0 ? (
            <TrendingUp className="w-3 h-3 text-emerald-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={trend >= 0 ? 'text-emerald-600' : 'text-red-500'}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-slate-400 ml-1">vs last hour</span>
        </div>
      )}
    </div>
  );
}
