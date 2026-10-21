import { getCategoryMeta } from '../utils/categories';

export default function CategoryBadge({ category, onDark = false, full = false }) {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;
  return (
    <span
      className={`chip ${onDark ? 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur' : `${meta.soft} ${meta.text}`}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {full ? category : meta.short}
    </span>
  );
}
