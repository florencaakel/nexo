// Best-effort minimization of common identifiers, not a general PII detector.
// Original messages remain untouched; the request gets a separate projection.
export function minimizeText(text: string): string {
  return text
    .replace(/(?:meu\s+)?contato(?:\s+fict[ií]cio)?\s+(?:[ée]|:)[^\n;]*?(?:\.\s|[;\n]|$)/giu, ' ')
    .replace(/\b(?:CPF|conta\s+banc[aá]ria|endere[cç]o\s+completo)\s*:\s*(?:\[[^\]\n]*\]|[^;\n]*?(?=\.\s|[;\n]|$))\.?/giu, ' ')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, ' ')
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/gu, ' ')
    .replace(/\b\d{11}\b/gu, ' ')
    .replace(/(?:\+55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]\d{4}\b/gu, ' ')
    .replace(/(?:telefone|celular|whatsapp)\s*:\s*[+()\d\s-]{8,}/giu, ' ')
    .trim();
}

export function containsUnnecessaryIdentifier(text: string): boolean {
  return minimizeText(text) !== text.trim();
}
