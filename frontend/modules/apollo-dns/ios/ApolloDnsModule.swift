import ExpoModulesCore
import Foundation

// ApolloDnsModule performs genuine iOS system DNS resolution using POSIX
// getaddrinfo(3). This uses the device's normal resolver path — the same path
// a DNS Proxy Extension or Network Extension (Packet Tunnel Provider) can
// observe if Apollo has an active native extension on this device.
//
// It does NOT use a custom resolver, DNS-over-HTTPS endpoint, certificate
// bypass, alternate VPN tunnel or any privileged networking API. No special
// iOS entitlements or Info.plist keys are required.
//
// Both IPv4 (AF_INET) and IPv6 (AF_INET6) records are returned when the
// device's network configuration supports them.
//
// expo-modules-core dispatches AsyncFunction handlers on a dedicated background
// queue — the main thread is never blocked regardless of how long the OS
// resolver takes to respond.
//
// Resolution failures (NXDOMAIN, no connectivity, resolver timeout) throw and
// propagate to JavaScript as rejected promises. They are NEVER silently
// converted into empty-success results. Callers must report them honestly.
public class ApolloDnsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ApolloDns")

        // Genuine iOS system DNS lookup equivalent to InetAddress.getAllByName
        // on Android. Returns { hostname, addresses, durationMs }.
        AsyncFunction("lookup") { (hostname: String) throws -> [String: Any] in
            let startTime = Date()

            // Zero-initialise then set only the fields we care about.
            var hints = addrinfo()
            hints.ai_family   = AF_UNSPEC    // Accept both IPv4 and IPv6 results
            hints.ai_socktype = SOCK_STREAM  // Hint required; avoids duplicate entries

            var result: UnsafeMutablePointer<addrinfo>? = nil
            let gaiStatus = getaddrinfo(hostname, nil, &hints, &result)
            let durationMs = Date().timeIntervalSince(startTime) * 1000.0

            // Always free the result list, even on error (freeaddrinfo(nil) is safe).
            defer { freeaddrinfo(result) }

            guard gaiStatus == 0 else {
                let errMsg = String(cString: gai_strerror(gaiStatus))
                throw NSError(
                    domain: "ApolloDns",
                    code: Int(gaiStatus),
                    userInfo: [
                        NSLocalizedDescriptionKey:
                            "DNS resolution failed for \(hostname): \(errMsg)"
                    ]
                )
            }

            // Walk the linked list and convert each sockaddr to a numeric string.
            var addresses: [String] = []
            var node = result

            while let current = node {
                let ai = current.pointee

                if let addr = ai.ai_addr {
                    var hostBuffer = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    let nameStatus = getnameinfo(
                        addr,
                        ai.ai_addrlen,
                        &hostBuffer,
                        socklen_t(NI_MAXHOST),
                        nil, 0,           // service name not needed
                        NI_NUMERICHOST    // numeric IP string, not reverse-DNS
                    )
                    if nameStatus == 0 {
                        let ip = String(cString: hostBuffer)
                        // Deduplicate: getaddrinfo may return the same address
                        // multiple times for different socket types.
                        if !ip.isEmpty && !addresses.contains(ip) {
                            addresses.append(ip)
                        }
                    }
                }

                node = ai.ai_next
            }

            return [
                "hostname": hostname,
                "addresses": addresses,
                "durationMs": durationMs
            ]
        }
    }
}
