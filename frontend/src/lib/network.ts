// Real device networking for Apollo Threat Lab. Every function performs actual
// Android networking through the device's normal network path — nothing is
// simulated. No VPN, proxy, DoH resolver or certificate bypass is created.

import { dnsLookup, DnsLookupResult, isDnsAvailable } from "@/modules/apollo-dns";

import { withAbort } from "./async-abort";

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
// and lets real resolver errors (e.g. NXDOMAIN) propagate honestly. The native
// call itself cannot be interrupted, so `withAbort` makes Stop / timeout reject
// immediately and discards any late result so it is never recorded as Completed.
export async function performDnsLookup(
  hostname: string,
  signal: AbortSignal,
): Promise<DnsLookupResult> {
  if (!isDnsAvailable) {
    throw new Error("NATIVE_DNS_UNAVAILABLE");
  }
  return withAbort(signal, dnsLookup(hostname));
}
