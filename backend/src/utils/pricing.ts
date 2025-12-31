interface BulkTier {
  min_qty: number;
  max_qty: number;
  price_per_unit: number;
}

export const calculateB2BPrice = (
  basePrice: number,
  quantity: number,
  bulkTiers?: BulkTier[]
): { unitPrice: number; appliedTier: string | null } => {
  if (!bulkTiers || bulkTiers.length === 0) {
    return { unitPrice: basePrice, appliedTier: null };
  }

  // Sort tiers by min_qty descending to check highest tier first
  const sortedTiers = [...bulkTiers].sort((a, b) => b.min_qty - a.min_qty);

  for (const tier of sortedTiers) {
    if (quantity >= tier.min_qty && (tier.max_qty === null || quantity <= tier.max_qty)) {
      return {
        unitPrice: tier.price_per_unit,
        appliedTier: `Tier: ${tier.min_qty}-${tier.max_qty || '∞'} units`
      };
    }
  }

  // If quantity doesn't match any tier, use base price
  return { unitPrice: basePrice, appliedTier: null };
};

export const getNextTierInfo = (
  quantity: number,
  bulkTiers?: BulkTier[]
): { quantityNeeded: number; pricePerUnit: number; savings: number } | null => {
  if (!bulkTiers || bulkTiers.length === 0) return null;

  const sortedTiers = [...bulkTiers].sort((a, b) => a.min_qty - b.min_qty);
  const currentTier = calculateB2BPrice(0, quantity, bulkTiers);

  for (const tier of sortedTiers) {
    if (quantity < tier.min_qty) {
      const quantityNeeded = tier.min_qty - quantity;
      const currentTotal = currentTier.unitPrice * quantity;
      const nextTierTotal = tier.price_per_unit * tier.min_qty;
      const savings = currentTotal - nextTierTotal;

      return {
        quantityNeeded,
        pricePerUnit: tier.price_per_unit,
        savings: savings > 0 ? savings : 0
      };
    }
  }

  return null;
};

