import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';

export function normalizePhoneNumber(
  input: string,
  countryCode: CountryCode
): string | null {
  try {
    const phone = parsePhoneNumberWithError(input, countryCode);
    return phone.number;
  } catch {
    return null;
  }
}

export function isValidCountryCode(code: string): code is CountryCode {
  return (code as CountryCode) in metadata.countries; // requires importing internal metadata
}


