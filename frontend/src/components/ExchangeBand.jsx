import { Link } from 'react-router-dom';
import { Recycle, ArrowRight } from 'lucide-react';
import Container from './ui/Container';
import { formatPrice } from '../utils/format';
import { EXCHANGE_CREDIT, EXCHANGE_MIN_ORDER } from '../config/store';

// Old-clothes exchange, always visible on the home page right under the hero
export default function ExchangeBand() {
  return (
    <div className="border-b border-emerald-200 bg-emerald-50">
      <Container className="py-3">
        <Link to="/recycle" className="group flex items-center gap-3 sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
            <Recycle className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold leading-snug text-emerald-900 sm:text-base">
              Give your old clothes, get {formatPrice(EXCHANGE_CREDIT)} off
            </span>
            <span className="block text-xs leading-snug text-emerald-900/75 sm:text-sm">
              Panipat only · hand over 1 kg+ at delivery · {formatPrice(EXCHANGE_CREDIT)} off your next {formatPrice(EXCHANGE_MIN_ORDER)}+ order
            </span>
          </span>
          <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-emerald-800 group-hover:underline sm:inline-flex">
            How it works <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-emerald-800 sm:hidden" aria-hidden="true" />
        </Link>
      </Container>
    </div>
  );
}
