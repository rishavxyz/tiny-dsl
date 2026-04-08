export function isLower(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 97 && code <= 122);
}

export function isUpper(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 65 && code <= 90);
}

export function isAlpha(ch: string) {
  return isLower(ch) || isUpper(ch);
}

export function isNum(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 48 && code <= 57);
}

export function isSpace(ch: string) {
  return ch == " " || ch == "\t";
}

