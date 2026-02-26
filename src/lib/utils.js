import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe =
  typeof window !== "undefined" && window.self !== window.top;

  export function createPageUrl(page) {
  if (!page) return "/";
  // Mantiene compatibilidad con tus rutas en PascalCase: /Dashboard, /Incomes, etc.
  return `/${String(page).replace(/^\/+/, "")}`;
}