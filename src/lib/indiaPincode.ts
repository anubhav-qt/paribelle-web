/**
 * Deterministic address autofill for Indian addresses.
 *
 * A 6-digit PIN code maps to exactly one district and state, so entering one
 * can fill City and State. Backed by India Post's public API
 * (api.postalpincode.in) with a small offline map of major cities as a
 * secondary hint when only a city has been typed.
 */

export interface PincodeMatch {
  city: string;
  state: string;
  /** Post office names under this PIN, for a disambiguation hint if wanted. */
  areas: string[];
}

const PIN_ENDPOINT = 'https://api.postalpincode.in/pincode/';

/** In-memory cache — the same PIN is often re-validated as the user edits. */
const pinCache = new Map<string, PincodeMatch | null>();

export function isIndianPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value.trim());
}

/**
 * Resolve a 6-digit Indian PIN to its district and state. Returns null for an
 * unknown PIN or any network/parsing failure — callers fall back to manual
 * entry. `signal` lets a newer lookup abort an in-flight one.
 */
export async function lookupPincode(
  pincode: string,
  signal?: AbortSignal,
): Promise<PincodeMatch | null> {
  const pin = pincode.trim();
  if (!isIndianPincode(pin)) return null;
  if (pinCache.has(pin)) return pinCache.get(pin) ?? null;

  try {
    const res = await fetch(`${PIN_ENDPOINT}${pin}`, { signal });
    if (!res.ok) return null;

    const body = await res.json();
    const entry = Array.isArray(body) ? body[0] : null;
    if (!entry || entry.Status !== 'Success' || !Array.isArray(entry.PostOffice) || entry.PostOffice.length === 0) {
      pinCache.set(pin, null);
      return null;
    }

    const offices = entry.PostOffice as Array<{ Name?: string; District?: string; State?: string }>;
    const first = offices[0];
    const match: PincodeMatch = {
      city: (first.District ?? '').trim(),
      state: (first.State ?? '').trim(),
      areas: [...new Set(offices.map((o) => (o.Name ?? '').trim()).filter(Boolean))],
    };
    if (!match.city || !match.state) {
      pinCache.set(pin, null);
      return null;
    }
    pinCache.set(pin, match);
    return match;
  } catch {
    return null; // includes AbortError — a newer lookup has taken over
  }
}

/**
 * State for a well-known Indian city, when no PIN is available yet. Only cities
 * with an unambiguous state are listed; anything not here is left for the
 * user or a later PIN lookup.
 */
const CITY_STATE: Record<string, string> = {
  mumbai: 'Maharashtra', pune: 'Maharashtra', nagpur: 'Maharashtra', nashik: 'Maharashtra', thane: 'Maharashtra',
  delhi: 'Delhi', 'new delhi': 'Delhi',
  bengaluru: 'Karnataka', bangalore: 'Karnataka', mysuru: 'Karnataka', mysore: 'Karnataka', mangaluru: 'Karnataka', hubli: 'Karnataka',
  chennai: 'Tamil Nadu', coimbatore: 'Tamil Nadu', madurai: 'Tamil Nadu', tiruchirappalli: 'Tamil Nadu', salem: 'Tamil Nadu',
  hyderabad: 'Telangana', warangal: 'Telangana',
  kolkata: 'West Bengal', howrah: 'West Bengal', siliguri: 'West Bengal', durgapur: 'West Bengal',
  ahmedabad: 'Gujarat', surat: 'Gujarat', vadodara: 'Gujarat', rajkot: 'Gujarat', bhavnagar: 'Gujarat',
  jaipur: 'Rajasthan', jodhpur: 'Rajasthan', udaipur: 'Rajasthan', kota: 'Rajasthan', ajmer: 'Rajasthan', bikaner: 'Rajasthan',
  lucknow: 'Uttar Pradesh', kanpur: 'Uttar Pradesh', agra: 'Uttar Pradesh', varanasi: 'Uttar Pradesh',
  meerut: 'Uttar Pradesh', prayagraj: 'Uttar Pradesh', allahabad: 'Uttar Pradesh', noida: 'Uttar Pradesh', ghaziabad: 'Uttar Pradesh',
  patna: 'Bihar', gaya: 'Bihar', bhagalpur: 'Bihar', muzaffarpur: 'Bihar',
  bhopal: 'Madhya Pradesh', indore: 'Madhya Pradesh', jabalpur: 'Madhya Pradesh', gwalior: 'Madhya Pradesh', ujjain: 'Madhya Pradesh',
  chandigarh: 'Chandigarh',
  gurugram: 'Haryana', gurgaon: 'Haryana', faridabad: 'Haryana', panipat: 'Haryana', ambala: 'Haryana',
  ludhiana: 'Punjab', amritsar: 'Punjab', jalandhar: 'Punjab', patiala: 'Punjab',
  kochi: 'Kerala', cochin: 'Kerala', thiruvananthapuram: 'Kerala', trivandrum: 'Kerala', kozhikode: 'Kerala', calicut: 'Kerala', thrissur: 'Kerala',
  bhubaneswar: 'Odisha', cuttack: 'Odisha', rourkela: 'Odisha',
  guwahati: 'Assam', dibrugarh: 'Assam',
  ranchi: 'Jharkhand', jamshedpur: 'Jharkhand', dhanbad: 'Jharkhand',
  raipur: 'Chhattisgarh', bhilai: 'Chhattisgarh',
  dehradun: 'Uttarakhand', haridwar: 'Uttarakhand',
  panaji: 'Goa', 'panjim': 'Goa', 'margao': 'Goa',
  shimla: 'Himachal Pradesh', srinagar: 'Jammu and Kashmir', jammu: 'Jammu and Kashmir',
  visakhapatnam: 'Andhra Pradesh', vijayawada: 'Andhra Pradesh', guntur: 'Andhra Pradesh', tirupati: 'Andhra Pradesh',
  agartala: 'Tripura', imphal: 'Manipur', aizawl: 'Mizoram', shillong: 'Meghalaya', kohima: 'Nagaland', itanagar: 'Arunachal Pradesh', gangtok: 'Sikkim',
};

/** State for a city name, or null when it isn't unambiguously known. */
export function stateForCity(city: string): string | null {
  return CITY_STATE[city.trim().toLowerCase()] ?? null;
}
