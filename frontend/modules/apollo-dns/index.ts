// JS bridge for the local Kotlin "ApolloDns" Expo module.
//
// The native module performs a genuine Android system DNS lookup
// (InetAddress.getAllByName) on the device's normal network path, giving
// Apollo the opportunity to observe the traffic. It is NOT present in Expo Go
// or the web preview — only in a built Android app — so `isDnsAvailable` is
// false there and callers must report that honestly instead of simulating a
// result.

import { requireOptionalNativeModule } from "expo-modules-core";

export type DnsLookupResult = {
  hostname: string;
  addresses: string[];
  durationMs: number;
};

type ApolloDnsNativeModule = {
  lookup(hostname: string): Promise<DnsLookupResult>;
};

const ApolloDns = requireOptionalNativeModule<ApolloDnsNativeModule>("ApolloDns");

export const isDnsAvailable = ApolloDns != null;

export async function dnsLookup(hostname: string): Promise<DnsLookupResult> {
  if (!ApolloDns) {
    throw new Error("NATIVE_DNS_UNAVAILABLE");
  }
  return ApolloDns.lookup(hostname);
}
