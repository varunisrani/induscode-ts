const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
export function previousGrapheme(text: string, at: number): number {
  let previous = 0;
  for (const part of segmenter.segment(text)) {
    if (part.index >= at) break;
    previous = part.index;
  }
  return previous;
}
export function nextGrapheme(text: string, at: number): number {
  for (const part of segmenter.segment(text)) if (part.index > at) return part.index;
  return text.length;
}
export function moveGrapheme(text: string, at: number, delta: number): number {
  let next = Math.max(0, Math.min(at, text.length));
  for (let i = 0; i < Math.abs(delta); i++) next = delta < 0 ? previousGrapheme(text, next) : nextGrapheme(text, next);
  return next;
}
export function snapGrapheme(text: string, at: number): number {
  const clamped = Math.max(0, Math.min(at, text.length));
  return clamped === text.length ? clamped : previousGrapheme(text, clamped + 1);
}
