const PointBadge = ({ points }) => {
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
    label = 'Peringatan I';
  } else if (p <= 50) {
    bgClass = 'bg-orange-50';
    textClass = 'text-orange-700';
    borderClass = 'border-orange-200';
    label = 'Peringatan II';
  } else if (p <= 75) {
    bgClass = 'bg-rose-50';
    textClass = 'text-rose-700';
    borderClass = 'border-rose-200';
    label = 'Peringatan III (Bermeterai)';
  } else if (p <= 99) {
    bgClass = 'bg-red-100';
    textClass = 'text-red-800';
    borderClass = 'border-red-300';
    label = 'Skorsing';
  } else {
    bgClass = 'bg-red-800';
    textClass = 'text-white';
    borderClass = 'border-red-900';
    label = 'Ditarik Kembali Ortu';
  }

  return (
    <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full font-semibold text-xs border ${bgClass} ${textClass} ${borderClass}`}>
      <span className="font-bold mr-1">{p} Poin</span>
      <span className="opacity-90">({label})</span>
    </span>
  );
};

export default PointBadge;
