const PointBadge = ({ points, showLabel = true, stacked = true }) => {
  const p = Number(points) || 0;
  let bgClass = '';
  let textClass = '';
  let borderClass = '';
  let label = '';

  if (p <= 10) {
    bgClass = 'bg-emerald-50';
    textClass = 'text-emerald-700';
    borderClass = 'border-emerald-200';
    label = 'Penyelesaian Langsung';
  } else if (p <= 20) {
    bgClass = 'bg-sky-50';
    textClass = 'text-sky-700';
    borderClass = 'border-sky-200';
    label = 'Pemberitahuan Ortu';
  } else if (p <= 25) {
    bgClass = 'bg-amber-50';
    textClass = 'text-amber-700';
    borderClass = 'border-amber-200';
    label = 'SP 1';
  } else if (p <= 50) {
    bgClass = 'bg-orange-50';
    textClass = 'text-orange-700';
    borderClass = 'border-orange-200';
    label = 'SP 2';
  } else if (p <= 75) {
    bgClass = 'bg-rose-50';
    textClass = 'text-rose-700';
    borderClass = 'border-rose-200';
    label = 'SP 3 (Bermaterai)';
  } else if (p <= 99) {
    bgClass = 'bg-red-100';
    textClass = 'text-red-800';
    borderClass = 'border-red-300';
    label = 'Skorsing';
  } else {
    bgClass = 'bg-red-800';
    textClass = 'text-white';
    borderClass = 'border-red-900';
    label = 'Ditarik Ortu';
  }

  if (stacked) {
    return (
      <div className="inline-flex flex-col items-center justify-center text-center leading-tight">
        <span 
          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-[11px] border ${bgClass} ${textClass} ${borderClass} whitespace-nowrap shadow-2xs`}
        >
          {p} Poin
        </span>
        {showLabel && (
          <span 
            className="text-[10px] text-gray-500 font-medium mt-0.5 leading-tight block whitespace-nowrap"
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
      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] border ${bgClass} ${textClass} ${borderClass} whitespace-nowrap`}
      title={`Akumulasi: ${p} Poin (${label})`}
    >
      <span>{p} Poin</span>
      {showLabel && <span className="ml-1 font-semibold opacity-90">({label})</span>}
    </span>
  );
};

export default PointBadge;

