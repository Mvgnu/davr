import { MaterialPriceStats } from '@/lib/hooks/useMaterialPrices';

/**
 * Format a price with currency symbol and decimal places
 */
export function formatPrice(price: number | null | undefined, currency = 'USD'): string {
  if (price === null || price === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format a price range from min to max price
 */
export function formatPriceRange(
  minPrice: number | null | undefined, 
  maxPrice: number | null | undefined, 
  currency = 'USD'
): string {
  if ((minPrice === null || minPrice === undefined) && 
      (maxPrice === null || maxPrice === undefined)) {
    return 'No price data available';
  }

  if (minPrice === maxPrice) {
    return formatPrice(minPrice, currency);
  }

  if (minPrice === null || minPrice === undefined) {
    return `Up to ${formatPrice(maxPrice, currency)}`;
  }

  if (maxPrice === null || maxPrice === undefined) {
    return `From ${formatPrice(minPrice, currency)}`;
  }

  return `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`;
}

/**
 * Get formatted price statistics text for a material
 */
export function getMaterialPriceText(priceStats: MaterialPriceStats | undefined): string {
  if (!priceStats) {
    return 'Price data unavailable';
  }

  if (priceStats.offerCount === 0) {
    return 'No current offers';
  }

  return formatPriceRange(priceStats.minPrice, priceStats.maxPrice);
}

/**
 * Get price trend text with up/down indicator
 */
export function getPriceTrendText(priceStats: MaterialPriceStats | undefined): string {
  if (!priceStats || priceStats.priceTrend === null) {
    return '';
  }

  const trend = priceStats.priceTrend;
  
  if (trend > 0) {
    return `↑ ${trend.toFixed(1)}%`;
  } else if (trend < 0) {
    return `↓ ${Math.abs(trend).toFixed(1)}%`;
  } else {
    return 'Stable';
  }
} 