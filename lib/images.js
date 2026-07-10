export function imageUrl(value, fallback = "") {
  if (!value) return fallback;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/uploads/${value}`;
}
