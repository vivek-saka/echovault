import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date relative to now (e.g. "3 minutes ago") */
export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Format a date as "Jan 15, 2025" */
export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/** Generate a random emoji for a new document */
export function randomDocumentEmoji(): string {
  const emojis = ["📄", "📝", "📋", "📊", "📈", "🗒️", "📓", "📔", "📃", "🗂️"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

/** Extract plain-text excerpt from Tiptap JSON content */
export function extractTextExcerpt(
  content: string | null,
  maxLength = 120
): string {
  if (!content) return "";
  try {
    // If content is JSON (Tiptap), extract text nodes
    const parsed = JSON.parse(content);
    const text: string[] = [];
    function walk(node: Record<string, unknown>) {
      if (node.type === "text" && typeof node.text === "string") {
        text.push(node.text);
      }
      if (Array.isArray(node.content)) {
        (node.content as Record<string, unknown>[]).forEach(walk);
      }
    }
    walk(parsed);
    return truncate(text.join(" "), maxLength);
  } catch {
    // Plain text fallback
    return truncate(content, maxLength);
  }
}

/** Debounce a function call */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
