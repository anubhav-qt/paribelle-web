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
