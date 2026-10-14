export const formatPrice = (price) => {
  const num = Number(price) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AIR-${timestamp}-${random}`;
};

/**
 * Authoritative, centralized helper to compute payable price for any course.
 * Correctly accounts for promotional discountPrice, ensuring students never pay
 * original full price when a discount price is active.
 *
 * @param {Object} course - The course object from Firestore
 * @returns {{
 *   effectivePrice: number,
 *   originalPrice: number,
 *   hasDiscount: boolean,
 *   discountAmount: number,
 *   discountPercent: number
 * }}
 */
export const getCourseEffectivePrice = (course) => {
  if (!course) {
    return {
      effectivePrice: 0,
      originalPrice: 0,
      hasDiscount: false,
      discountAmount: 0,
      discountPercent: 0
    };
  }

  const rawPrice = Number(course.price) || 0;
  const rawDiscount = course.discountPrice !== undefined && course.discountPrice !== null && course.discountPrice !== ''
    ? Number(course.discountPrice)
    : null;

  // Valid discount if defined, numeric, non-negative, and strictly less than regular price
  const hasDiscount = rawDiscount !== null && !isNaN(rawDiscount) && rawDiscount >= 0 && rawDiscount < rawPrice;
  const effectivePrice = hasDiscount ? rawDiscount : rawPrice;
  const discountAmount = hasDiscount ? Math.max(0, rawPrice - rawDiscount) : 0;
  const discountPercent = hasDiscount && rawPrice > 0 ? Math.round((discountAmount / rawPrice) * 100) : 0;

  return {
    effectivePrice,
    originalPrice: rawPrice,
    hasDiscount,
    discountAmount,
    discountPercent
  };
};