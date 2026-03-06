import { getPublicPath } from './public-path';

/**
 * Resolve logo path for account/card institution.
 * Logo can be: full URL (http/https/data), path starting with /, or filename (served from /logos/).
 */
export function resolveLogoPath(logo: string | null | undefined): string | null {
  if (!logo) return null;
  if (
    logo.startsWith("http://") ||
    logo.startsWith("https://") ||
    logo.startsWith("data:")
  ) {
    return logo;
  }
  const base = getPublicPath();
  const filename = normalizeLogo(logo) || logo.split('/').filter(Boolean).pop() || logo;
  const path = `${base}/logos/${filename}`.replace(/\/+/g, '/');
  return path;
}

/**
 * Normalizes logo path to get just the filename.
 */
export function normalizeLogo(logo?: string | null): string {
  return logo?.split("/").filter(Boolean).pop() ?? "";
}

/**
 * Derives a display name from a logo filename.
 * @example deriveNameFromLogo("my-company-logo.png") // "My Company Logo"
 */
export function deriveNameFromLogo(logo?: string | null): string {
  if (!logo) return "";
  const fileName = normalizeLogo(logo);
  if (!fileName) return "";
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  return withoutExtension
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Bandeira (card brand) asset paths - SVGs in public/bandeiras */
export function getBrandAssetPaths(): Record<string, string> {
  const base = getPublicPath();
  return {
    visa: `${base}/bandeiras/visa.svg`,
    mastercard: `${base}/bandeiras/mastercard.svg`,
    amex: `${base}/bandeiras/amex.svg`,
    american: `${base}/bandeiras/amex.svg`,
    elo: `${base}/bandeiras/elo.svg`,
    hipercard: `${base}/bandeiras/hipercard.svg`,
    hiper: `${base}/bandeiras/hipercard.svg`,
  };
}

/** @deprecated Use getBrandAssetPaths() for base-path aware paths */
export const BRAND_ASSETS: Record<string, string> = {
  visa: "/bandeiras/visa.svg",
  mastercard: "/bandeiras/mastercard.svg",
  amex: "/bandeiras/amex.svg",
  american: "/bandeiras/amex.svg",
  elo: "/bandeiras/elo.svg",
  hipercard: "/bandeiras/hipercard.svg",
  hiper: "/bandeiras/hipercard.svg",
};

/**
 * Resolve bandeira (card brand) logo path from brand name.
 */
export function resolveBrandAsset(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const normalized = brand.trim().toLowerCase();
  const assets = getBrandAssetPaths();
  const match = (Object.keys(assets) as Array<keyof typeof assets>).find((entry) =>
    normalized.includes(entry)
  );
  return match ? assets[match].replace(/\/+/g, '/') : null;
}
