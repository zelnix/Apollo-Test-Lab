package com.harmonywellnessgroup.apollothreatlab.dns

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.InetAddress

// ApolloDns performs a genuine Android system DNS lookup using the platform
// resolver (InetAddress.getAllByName). This uses the device's normal network
// path so Apollo can observe the traffic. It does NOT bypass Apollo's VPN and
// does NOT use an external DNS-over-HTTPS resolver. Resolver failures such as
// UnknownHostException (NXDOMAIN) propagate to JS as a rejected promise so the
// result is reported honestly — never simulated.
class ApolloDnsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ApolloDns")

    AsyncFunction("lookup") { hostname: String ->
      val start = System.nanoTime()
      val addresses = InetAddress.getAllByName(hostname)
      val durationMs = (System.nanoTime() - start) / 1_000_000.0
      val ips = addresses.mapNotNull { it.hostAddress }.filter { it.isNotEmpty() }
      mapOf(
        "hostname" to hostname,
        "addresses" to ips,
        "durationMs" to durationMs
      )
    }
  }
}
