export const normalizeHttpUrl = (value) => {
  if (typeof value !== 'string') return '';

  const trimmedValue = value.trim();
  if (!trimmedValue) return '';

  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return '';
    }
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

export const sanitizeLinksForState = (links) => {
  if (!Array.isArray(links)) return [];

  return links
    .filter((link) => link && typeof link === 'object' && !Array.isArray(link))
    .map((link) => ({
      ...link,
      url: normalizeHttpUrl(link.url),
    }));
};
