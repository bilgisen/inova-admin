export function slugify(text: string): string {
  const map: Record<string, string> = {
    'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C', 'ı': 'i', 'İ': 'I',
  };
  return text
    .replace(/[şŞğĞüÜöÖçÇıİ]/g, c => map[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
