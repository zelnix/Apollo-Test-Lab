// Real device networking for Apollo Threat Lab. Every function performs actual
// Android networking through the device's normal network path — nothing is
// simulated. No VPN, proxy, DoH resolver or certificate bypass is created.

import { dnsLookup, DnsLookupResult, isDnsAvailable } from "@/modules/apollo-dns";

export type HttpResult = {
  httpStatus: number;
  finalUrl: string;
  bytes: number;
  durationMs: number;
};

// Bounded HTTPS GET on the device's normal network path. Honors the abort
// signal so Stop Test and timeouts can cancel it. Follows redirects.
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

// Genuine Android system DNS resolution via the native Kotlin module. Throws
// "NATIVE_DNS_UNAVAILABLE" when the native module is absent (Expo Go / web),
// and lets real resolver errors (e.g. NXDOMAIN) propagate honestly.
export async function performDnsLookup(hostname: string): Promise<DnsLookupResult> {
  if (!isDnsAvailable) {
    throw new Error("NATIVE_DNS_UNAVAILABLE");
  }
  return dnsLookup(hostname);
}
