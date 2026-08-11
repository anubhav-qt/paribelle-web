// Organic `border-radius` blob shapes for the hero's photo trio: the centre
// frame plus a smaller card riding behind it on each side. Every OUTER is an
// irregular four-corner curve in the same family — corner percentages vary
// enough to feel hand-drawn rather than a rounded rectangle, but never so far
// that the shape reads as a teardrop or a plain ellipse. Each INNER is its
// OUTER pulled in a few points per corner (the same +/-3-4 pattern used
// across all three pairs), so the mat shows as an even ring rather than a
// rectangular border once the inner clip sits inside the outer frame.

// Centre frame — the original single-photo blob.
export const BLOB_OUTER = '62% 38% 55% 45% / 48% 62% 38% 52%';
export const BLOB_INNER = '58% 42% 51% 49% / 45% 58% 42% 55%';

// Left card — corners on its left (outer) edge run sharper/fuller than the
// centre's, giving it a touch more mass toward the outside of the trio.
export const BLOB_LEFT_OUTER = '50% 48% 65% 37% / 40% 66% 46% 48%';
export const BLOB_LEFT_INNER = '46% 52% 61% 41% / 37% 62% 50% 51%';

// Right card — mirrors the left card's bias to its own outer (right) edge,
// so the pair visually frames the centre photo without matching each other.
export const BLOB_RIGHT_OUTER = '66% 34% 45% 55% / 56% 50% 34% 60%';
export const BLOB_RIGHT_INNER = '62% 38% 41% 59% / 53% 46% 38% 63%';

// "Open" radii — used while a card is expanded on hover. Each keeps the two
// corners on its anchored (non-expanding) edge in the original organic
// curve, and flattens the two corners on the edge that is growing toward a
// small fixed radius, so the blob reads as melting into a straight-edged
// panel on the side that now holds the order details, without the fixed
// side's shape changing at all.
export const BLOB_LEFT_OUTER_OPEN = '50% 20px 20px 37% / 40% 20px 20px 48%';
export const BLOB_RIGHT_OUTER_OPEN = '20px 34% 45% 20px / 20px 50% 34% 20px';
export const BLOB_CENTER_OUTER_OPEN = '20px 38% 55% 20px / 20px 62% 38% 20px';
