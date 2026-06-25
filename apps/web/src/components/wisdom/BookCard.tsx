'use client';

import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  pillar?: string;
  tags?: string[];
  avgRating?: number;
  totalReads?: number;
  readingTime?: number;
}

interface BookCardProps {
  book: Book;
  badge?: string;
}

const PILLAR_COLORS: Record<string, string> = {
  mindset: '#7B2D8B',
  leadership: '#F4A261',
  health: '#4CAF50',
  startup: '#2196F3',
  relationships: '#E91E63',
  productivity: '#FF9800',
  spirituality: '#9C27B0',
  finance: '#00BCD4',
};

export function BookCard({ book, badge }: BookCardProps) {
  const color = book.pillar ? PILLAR_COLORS[book.pillar] ?? '#F4A261' : '#F4A261';
  const initials = book.title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <Link href={`/wisdom/${book.id}`} className="group block">
      <div className="relative bg-[#1A2A3D] rounded-xl overflow-hidden border border-white/5 hover:border-[#F4A261]/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
        {/* Cover */}
        <div className="aspect-[2/3] relative" style={{ background: `linear-gradient(135deg, ${color}33, #0D1B2A)` }}>
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
              <div className="text-3xl font-black mb-2" style={{ color }}>{initials}</div>
              <p className="text-white text-xs font-bold leading-tight line-clamp-3">{book.title}</p>
            </div>
          )}
          {badge && (
            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4A261] text-white">
              {badge}
            </span>
          )}
          {book.pillar && (
            <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
              style={{ background: color + '33', color }}>
              {book.pillar}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-white text-xs font-semibold line-clamp-1 mb-0.5">{book.title}</p>
          <p className="text-[#8B9BB4] text-[11px] line-clamp-1">{book.author}</p>
          <div className="flex items-center gap-2 mt-2">
            {book.avgRating && (
              <span className="text-[10px] text-[#F4A261]">★ {book.avgRating.toFixed(1)}</span>
            )}
            {book.readingTime && (
              <span className="text-[10px] text-[#8B9BB4]">{book.readingTime}m</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
