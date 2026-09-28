import { extractPages, pdfInfo } from "./extract.ts";

const PUBLISHER = /tuesday\s+knight\s+games/i;
const COPYRIGHT = /(?:copyright|©)\s*\d{4}(?:\s*[-\u2013]\s*\d{4})?,?\s*tuesday\s+knight\s+games/i;
const PRODUCT_CODE = /\bMRPG-[A-Z]*\d+\b/;

export function isFirstPartyText(author: string, text: string): boolean {
  const flat = text.replace(/\s+/g, " ");
  return PUBLISHER.test(author) || COPYRIGHT.test(flat) || PRODUCT_CODE.test(flat);
}

export function isFirstParty(pdfPath: string): boolean {
  try {
    return isFirstPartyText(pdfInfo(pdfPath).author, extractPages(pdfPath).join("\n"));
  } catch {
    return false;
  }
}
