export type IdGenerator = () => string;

let counter = 0;

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}-${(counter++).toString(36)}`;
}

export function resetIdCounter(): void {
  counter = 0;
}
