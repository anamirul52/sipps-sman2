const PointBadge = ({ points, showLabel = true, stacked = true }) => {
  const p = Number(points) || 0;
  let bgClass = 'bg-zinc-50';
  let textClass = 'text-zinc-700';
  let borderClass = 'border-zinc-200/80';
  let label = '';
  let dotColor = 'bg-zinc-300';

  if (p <= 10) {
    label = 'Penyelesaian Langsung';
    dotColor = 'bg-emerald-400';
  } else if (p <= 20) {
    label = 'Pemberitahuan Ortu';
    dotColor = 'bg-sky-400';
  } else if (p <= 25) {
    label = 'SP 1';
    dotColor = 'bg-amber-400';
  } else if (p <= 50) {
    label = 'SP 2';
    dotColor = 'bg-orange-400';
  } else if (p <= 75) {
    label = 'SP 3 (Bermaterai)';
    dotColor = 'bg-red-500';
    textClass = 'text-red-700';
    borderClass = 'border-red-200';
  } else if (p <= 99) {
    label = 'Skorsing';
    dotColor = 'bg-red-600';
    bgClass = 'bg-red-50/50';
    textClass = 'text-red-700';
    borderClass = 'border-red-200';
  } else {
    label = 'Ditarik Ortu';
    dotColor = 'bg-red-700';
    bgClass = 'bg-red-50';
    textClass = 'text-red-700';
    borderClass = 'border-red-300';
  }

  if (stacked) {
    return (
      <div className="inline-flex flex-col items-center justify-center text-center leading-tight">
        <span 
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-[11px] border ${bgClass} ${textClass} ${borderClass} whitespace-nowrap`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
          {p} Poin
        </span>
        {showLabel && (
          <span 
            className="text-[10px] text-zinc-500 font-medium mt-0.5 leading-tight block whitespace-nowrap"
            title={label}
          >
            ({label})
          </span>
        )}
      </div>
    );
  }

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-[11px] border ${bgClass} ${textClass} ${borderClass} whitespace-nowrap`}
      title={`Akumulasi: ${p} Poin (${label})`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{p} Poin</span>
      {showLabel && <span className="ml-1 opacity-90 font-normal">({label})</span>}
    </span>
  );
};

export default PointBadge;
