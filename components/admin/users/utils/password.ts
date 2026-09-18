export function generateRandomPassword() {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);

  return String(randomValues[0] % 1_000_000).padStart(6, "0");
}
