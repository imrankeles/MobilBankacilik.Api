export function generateRandomIban() {
  let iban = "TR";
  for (let i = 0; i < 24; i++) {
    iban += Math.floor(Math.random() * 10);
  }
  return iban;
}
