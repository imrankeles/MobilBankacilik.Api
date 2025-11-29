/**
 * IBAN formatını temizler (boşluk, tire vb. kaldırır)
 */
function cleanIban(iban) {
    return iban.replace(/\s+/g, "").toUpperCase();
}

/**
 * IBAN geçerlilik kontrolü (MOD97-10)
 */
function isValidIban(iban) {
    iban = cleanIban(iban);

    // TR IBAN uzunluk kontrolü
    if (iban.length !== 20) return false;
    if (!iban.startsWith("TR")) return false;

    // IBAN'ı kontrol basamağı algoritmasına göre düzenle
    const rearranged = iban.substring(4) + iban.substring(0, 4);

    // Harfleri sayıya çevir: A = 10, B = 11, ...
    const numericIban = rearranged.replace(/[A-Z]/g, (ch) => ch.charCodeAt(0) - 55);

    // MOD97 kontrolü
    const remainder = bigIntMod97(numericIban);

    return remainder === 1;
}

/**
 * Büyük sayılar için MOD97 hesaplaması
 * (JavaScript normal int ile hesaplayamaz → algoritma gerekir)
 */
function bigIntMod97(str) {
    let checksum = 0;

    for (let i = 0; i < str.length; i++) {
        checksum = (checksum * 10 + Number(str[i])) % 97;
    }

    return checksum;
}

/**
 * Kontrol basamağını hesaplar (IBAN standardı)
 */
function generateCheckDigits(ibanWithoutCheckDigits) {
    // Örn: TR00 + kalan → kontrol hesaplanacak
    const rearranged = ibanWithoutCheckDigits.substring(4) + ibanWithoutCheckDigits.substring(0, 4);

    const numericIban = rearranged.replace(/[A-Z]/g, (ch) => ch.charCodeAt(0) - 55);

    const mod = bigIntMod97(numericIban);

    const checkDigits = String(98 - mod).padStart(2, "0");

    return checkDigits;
}

/**
 * Rastgele TR IBAN üretir
 * TR + 2 Basamak check-digit + 5 Haneli banka kodu + 16 haneli hesap numarası
 */
function generateRandomIban() {
    const country = "TR";
    const placeholderCheckDigits = "00";

    const bankCode = String(Math.floor(10000 + Math.random() * 90000)); // 5 hane
    const accountNumber = String(Math.floor(Math.random() * 1e16)).padStart(16, "0");

    const partialIban = country + placeholderCheckDigits + bankCode + accountNumber;

    const checkDigits = generateCheckDigits(partialIban);

    const finalIban = country + checkDigits + bankCode + accountNumber;

    return finalIban;
}

module.exports = {
    cleanIban,
    isValidIban,
    generateCheckDigits,
    generateRandomIban
};
