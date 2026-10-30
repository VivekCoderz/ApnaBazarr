import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { categoryTiles, categoryHref, notifyMeUrl } from '../config/store';
import CategoryGlyph from './ui/CategoryGlyph';

const LG_COLS = { 1: 'lg:grid-cols-6', 2: 'lg:grid-cols-6', 3: 'lg:grid-cols-6', 4: 'lg:grid-cols-6', 5: 'lg:grid-cols-6', 6: 'lg:grid-cols-6', 7: 'lg:grid-cols-7', 8: 'lg:grid-cols-8' };

const thumb = (url) =>
  url && url.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', '/upload/w_320,h_320,c_fill,g_auto,q_auto,f_auto/')
    : url;

function TileBody({ tile, image, loading }) {
  const live = tile.count > 0;
  return (
    <>
      <span className="relative block aspect-square overflow-hidden rounded-lg border border-line bg-brand-cream">
        {live && image ? (
          <img
            src={thumb(image)}
            alt=""
            loading="lazy"
            width="320"
            height="320"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <CategoryGlyph name={tile.name} className="h-8 w-8 sm:h-9 sm:w-9" />
            {!loading && !live && (
              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-line sm:text-[11px]">
                Coming soon
              </span>
            )}
          </span>
        )}
      </span>
      <span className="mt-2 block text-center text-[13px] font-medium leading-tight text-ink group-hover:text-brand-navy sm:text-sm">
        {tile.label}
      </span>
      {!loading && (
        <span className="mt-0.5 flex items-center justify-center gap-1 text-center text-[11px] text-slate-500 sm:text-xs">
          {live ? `${tile.count} ${tile.count === 1 ? 'product' : 'products'}` : <><Bell className="h-3 w-3" aria-hidden="true" /> Notify me</>}
        </span>
      )}
    </>
  );
}

// Category row (marketplace style): photo tile when the category has live products,
// a neutral line-icon tile marked "Coming soon" (opens WhatsApp notify) when it has none.
export default function CategoryShowcase({ products = [], loading = false }) {
  const tiles = categoryTiles(products);
  const firstImage = {};
  products.forEach(p => {
    const cat = p.category?.trim();
    if (cat && p.image && !firstImage[cat] && p.inStock !== false) firstImage[cat] = p.image;
  });
  const tileClass = 'group block w-[88px] shrink-0 snap-start sm:w-auto';

  return (
    <div className={`-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-5 sm:overflow-visible sm:px-0 md:grid-cols-6 ${LG_COLS[tiles.length] || 'lg:grid-cols-8'}`}>
      {tiles.map(tile =>
        tile.count > 0 || loading ? (
          <Link key={tile.name} to={categoryHref(tile.name)} className={tileClass}>
            <TileBody tile={tile} image={firstImage[tile.name]} loading={loading} />
          </Link>
        ) : (
          <a
            key={tile.name}
            href={notifyMeUrl(tile.label.toLowerCase())}
            target="_blank"
            rel="noreferrer"
            className={tileClass}
            aria-label={`${tile.label}: coming soon. Get notified on WhatsApp`}
          >
            <TileBody tile={tile} loading={loading} />
          </a>
        )
      )}
    </div>
  );
}
