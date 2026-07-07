import { Species, SPECIES_LABELS, SPECIES_COLORS } from '../types';

interface MetricsDisplayProps {
  accuracy: number;
  confusionMatrix: Record<Species, Record<Species, number>>;
  precision: Record<Species, number>;
  recall: Record<Species, number>;
  f1Score: Record<Species, number>;
  testSetSize: number;
}

export default function MetricsDisplay({
  accuracy,
  confusionMatrix,
  precision,
  recall,
  f1Score,
  testSetSize,
}: MetricsDisplayProps) {
  const classes: Species[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];

  // Calculate correct vs total count
  const correctCount = Math.round(accuracy * testSetSize);

  // Helper to calculate cell background colors for heat-mapped confusion matrix
  const getCellBgClass = (actual: Species, predicted: Species, count: number) => {
    if (count === 0) return 'bg-slate-50 text-slate-300 border border-slate-100';
    
    if (actual === predicted) {
      // Diagonal (correct predictions)
      if (count > 10) return 'bg-emerald-500/15 text-emerald-700 font-extrabold border border-emerald-500/30 shadow-xs';
      if (count > 5) return 'bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20';
      return 'bg-emerald-500/5 text-emerald-650 font-semibold border border-emerald-500/10';
    } else {
      // Off-diagonal (incorrect predictions/errors)
      return 'bg-rose-500/10 text-rose-600 font-bold border border-rose-500/25';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="metrics-display-panel">
      {/* 1. Accuracy Circular Gauge (Left 4 cols) */}
      <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Test Accuracy
        </h4>

        {/* Circular Ring Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-1">
          {/* Background circle */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="56" cy="56" r="48" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="transparent"
              stroke={accuracy > 0.85 ? '#10b981' : accuracy > 0.7 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 * (1 - accuracy)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Percentage */}
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-slate-850 tracking-tight">
              {(accuracy * 100).toFixed(1)}%
            </span>
            <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">
              Correct Rate
            </span>
          </div>
        </div>

        <div className="px-3 py-1 bg-slate-50 border border-slate-200/50 rounded-xl text-[11px] text-slate-500 font-semibold mt-4 flex items-center gap-1 shadow-2xs">
          <span className="text-emerald-600 font-bold">{correctCount}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-bold">{testSetSize}</span>
          <span className="text-slate-400 font-normal">classified correct</span>
        </div>
      </div>

      {/* 2. Confusion Matrix (Right 8 cols on small, center columns) */}
      <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Confusion Matrix
          </h4>
          <p className="text-[10px] text-slate-400 mb-4 leading-normal">
            Compares true values (rows) against prediction values (columns)
          </p>
        </div>

        {/* 3x3 Heatmap Grid */}
        <div className="relative pl-12 pt-6">
          {/* Header Label: Predicted Species */}
          <div className="absolute top-0 left-12 right-0 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Predicted Species
          </div>

          {/* Left Label: Actual Species */}
          <div className="absolute left-0 top-12 bottom-0 w-8 flex items-center justify-center">
            <span className="transform -rotate-90 origin-center whitespace-nowrap text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Actual Species
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            {/* Top-left empty cell */}
            <div />
            {/* Column Headers */}
            {classes.map((cls) => (
              <div
                key={`col-head-${cls}`}
                className="text-[10px] font-bold text-slate-500 py-1.5 flex flex-col items-center justify-center tracking-tight"
              >
                <span className="w-1.5 h-1.5 rounded-full mb-1 shadow-2xs" style={{ backgroundColor: SPECIES_COLORS[cls] }} />
                {SPECIES_LABELS[cls]}
              </div>
            ))}

            {/* Matrix Rows */}
            {classes.map((actual) => (
              <div key={`row-${actual}`} className="contents">
                {/* Row Header */}
                <div className="text-[10px] font-bold text-slate-500 flex items-center justify-end pr-2.5 h-10 tracking-tight">
                  {SPECIES_LABELS[actual]}
                </div>

                {/* Matrix Cells */}
                {classes.map((predicted) => {
                  const count = confusionMatrix[actual][predicted] || 0;
                  return (
                    <div
                      key={`cell-${actual}-${predicted}`}
                      className={`h-10 rounded-xl flex items-center justify-center text-xs font-mono transition-all duration-500 ${getCellBgClass(
                        actual,
                        predicted,
                        count
                      )}`}
                    >
                      {count}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Class-by-Class Classification Report (Full width below) */}
      <div className="md:col-span-12 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Detailed Species Metrics
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Species</th>
                <th className="pb-2.5 text-right font-bold uppercase tracking-wider text-[10px]">Precision</th>
                <th className="pb-2.5 text-right font-bold uppercase tracking-wider text-[10px]">Recall</th>
                <th className="pb-2.5 text-right font-bold uppercase tracking-wider text-[10px]">F1-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {classes.map((species) => (
                <tr key={`row-metrics-${species}`} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="py-3.5 flex items-center gap-2 font-bold text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-2xs border border-white"
                      style={{ backgroundColor: SPECIES_COLORS[species] }}
                    />
                    {SPECIES_LABELS[species]}
                  </td>
                  <td className="py-3.5 text-right font-mono text-slate-600 font-extrabold text-[12px]">
                    {(precision[species] * 100).toFixed(0)}%
                  </td>
                  <td className="py-3.5 text-right font-mono text-slate-600 font-extrabold text-[12px]">
                    {(recall[species] * 100).toFixed(0)}%
                  </td>
                  <td className="py-3.5 text-right font-mono text-slate-600 font-extrabold text-[12px]">
                    {(f1Score[species] * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
