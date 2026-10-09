// Real device networking for Apollo Threat Lab. Every function performs actual
// device networking through the device's normal network path — nothing is
// simulated. No VPN, proxy, DoH resolver or certificate bypass is created.

import { dnsLookup, DnsLookupResult, isDnsAvailable } from "@/modules/apollo-dns";

import { withAbort } from "./async-abort";

export type HttpResult = {
  httpStatus: number;
  finalUrl: string;
  bytes: number;
  durationMs: number;
};

// Bounded HTTP/HTTPS GET on the device's normal network path. Honors the abort
// signal so Stop Test and timeouts can cancel it. Follows redirects.
// Works for both https:// and http:// URLs — the Unencrypted HTTP test relies
// on the latter (requires usesCleartextTraffic on Android, ATS exception on iOS).
export async function performHttpRequest(url: string, signal: AbortSignal): Promise<HttpResult> {
  const start = Date.now();
  const res = await fetch(url, { method: "GET", signal, redirect: "follow" });
  const text = await res.text();
  return {
    httpStatus: res.status,
    finalUrl: res.url || url,
    bytes: text.length,
    durationMs: Date.now() - start,
  };
}

// EICAR test file result. `eicarDetected` is true when the EICAR test string
// is present in the response — meaning the download was NOT blocked at the
// content level. A false value with a successful HTTP status may indicate
// Apollo returned a block page instead of the actual file.
export type EicarResult = {
  httpStatus: number;
  finalUrl: string;
  bytes: number;
  durationMs: number;
  eicarDetected: boolean;
};

// Industry-standard harmless test file fetch. The EICAR test string is NOT
// malware — it is a text file with a recognized signature that security
// products are required to detect. Receiving it means content-level inspection
// did not block the download; a network error means it may have been blocked.
export async function performEicarRequest(url: string, signal: AbortSignal): Promise<EicarResult> {
  const start = Date.now();
  const res = await fetch(url, { method: "GET", signal, redirect: "follow" });
  const text = await res.text();
  return {
    httpStatus: res.status,
    finalUrl: res.url || url,
    bytes: text.length,
    durationMs: Date.now() - start,
    // EICAR-STANDARD-ANTIVIRUS-TEST-FILE is the unique phrase in every EICAR string.
    eicarDetected: text.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"),
  };
}

// Genuine native system DNS resolution via the native module (Kotlin on Android,
// Swift on iOS). Throws "NATIVE_DNS_UNAVAILABLE" when the native module is absent
// (Expo Go / web), and lets real resolver errors (e.g. NXDOMAIN) propagate
// honestly. The native call cannot be interrupted, so `withAbort` rejects
// immediately on Stop/timeout and discards any late result.
export async function performDnsLookup(
  hostname: string,
  signal: AbortSignal,
): Promise<DnsLookupResult> {
  if (!isDnsAvailable) {
    throw new Error("NATIVE_DNS_UNAVAILABLE");
  }
  return withAbort(signal, dnsLookup(hostname));
}
