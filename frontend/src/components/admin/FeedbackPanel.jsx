import { Star } from 'lucide-react';
import { Card, PanelHeader, Pill, EmptyState } from './AdminUi';

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[0, 1, 2, 3, 4].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
      ))}
    </span>
  );
}

const shortDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently');

function Media({ photoUrl, videoUrl }) {
  if (!photoUrl && !videoUrl) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {photoUrl && (
        <a href={photoUrl} target="_blank" rel="noreferrer">
          <img src={photoUrl} alt="Customer photo" className="h-20 w-20 rounded border border-line object-cover" />
        </a>
      )}
      {videoUrl && <video src={videoUrl} controls className="h-20 w-32 rounded border border-line object-cover" />}
    </div>
  );
}

// Site feedback (mode "feedback") or product reviews (mode "reviews")
export default function FeedbackPanel({ mode, items, loading }) {
  const isReviews = mode === 'reviews';
  return (
    <div className="space-y-4">
      <PanelHeader title={isReviews ? 'Product reviews' : 'Customer feedback'} note={`${items.length} total`} />
      {loading ? (
        <Card><EmptyState>Loading...</EmptyState></Card>
      ) : items.length === 0 ? (
        <Card><EmptyState>{isReviews ? 'No product reviews yet.' : 'No feedback yet.'}</EmptyState></Card>
      ) : (
        <div className="space-y-3">
          {items.map(it => (
            <Card key={it._id || it.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{isReviews ? (it.userName || it.name) : it.name}</p>
                  {(isReviews ? it.userEmail : it.email) && <p className="truncate text-xs text-slate-500">{isReviews ? it.userEmail : it.email}</p>}
                </div>
                <Stars rating={it.rating} />
              </div>
              {isReviews ? (
                <Pill tone="navy">{it.productName || `Product #${it.productId}`}</Pill>
              ) : (
                it.category && <Pill tone="neutral">{it.category}</Pill>
              )}
              <p className="text-sm leading-relaxed text-slate-700">"{isReviews ? it.comment : it.message}"</p>
              <Media photoUrl={it.photoUrl} videoUrl={it.videoUrl} />
              <p className="text-xs text-slate-400">{shortDate(it.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
