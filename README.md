# RFC 10023 Reference Implementation & DNS Domain Auditor

[![Website](https://img.shields.io/badge/website-rfc10023.de-059669.svg)](https://www.rfc10023.de)
[![IETF Standard](https://img.shields.io/badge/IETF-RFC%2010023-blue.svg)](https://www.rfc10023.de/spezifikation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![DNSSEC Ready](https://img.shields.io/badge/DNSSEC-Ready-10b981.svg)](https://www.rfc10023.de/validator)

> **Official Open-Source Reference Implementation, DNS Validator, and Configuration Generator for IETF RFC 10023 (`_for-sale` TXT Resource Records) and RFC 7505 (Null-MX).**

---

## 🌐 Live Platform & Free REST API

* **Live Web App & Validator:** [https://www.rfc10023.de](https://www.rfc10023.de)
* **English Documentation:** [https://www.rfc10023.de/en](https://www.rfc10023.de/en)
* **Interactive Generator:** [https://www.rfc10023.de/generator](https://www.rfc10023.de/generator)
* **Public REST API v1:** [https://www.rfc10023.de/api/v1/validate?domain=forsaledns.net](https://www.rfc10023.de/api/v1/validate?domain=forsaledns.net)

---

## 📖 What is RFC 10023?

Published by the **IETF DNSOP Working Group** in July 2026, **RFC 10023** (*"The `_for-sale` Underscored and Globally Scoped DNS Node Name"*) establishes a standardized, decentralized protocol for domain owners to publish acquisition offers directly within the global Domain Name System.

By placing structured TXT records at the leaf node `_for-sale.<domain>`, domain sale signals become:
1. **Decentralized & Intermediary-Free:** No mandatory 10–15% broker commissions (Sedo, Afternic, Dan).
2. **Search-Engine Safe:** Keeps existing websites indexed without penalty from parking-page redirect banners.
3. **Machine-Readable:** Registries (like SIDN for `.nl`), domain registrars, and automated bots query availability directly during DNS lookups.
4. **DNSSEC Cryptographically Signed:** Protected against cache poisoning and DNS spoofing via DNSSEC RRSIG.

---

## 🚀 Key Features of this Platform

* **Real-time DNS-over-HTTPS (DoH) Validator:** Queries Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) Anycast resolvers directly from the client.
* **Readiness Index (0–100):** Multi-vector assessment scoring domain sale signals, email hygiene, and cryptographic integrity.
* **Email Hygiene & RFC 5321 Risk Detection:**
  * Detects **RFC 7505 Null-MX (`0 .`)** configuration for parked domains.
  * Warns against **SMTP Fallback Vulnerabilities** (where lack of MX records causes MTAs to deliver mail to A/AAAA web server IPs).
  * Validates **SPF (`v=spf1 -all`)** and **DMARC (`p=reject`)** policies.
* **Multi-Provider DNS Generator:** Ready-to-use configurations for **Cloudflare, Hetzner DNS, INWX, netcup, STRATO, IONOS, BIND Zonefiles, and Terraform**.

---

## 💻 REST API Example

Fetch the parsed RFC 10023 record and validation status via cURL:

```bash
curl -s "https://www.rfc10023.de/api/v1/validate?domain=forsaledns.net" | jq
```

**Response Example:**
```json
{
  "domain": "forsaledns.net",
  "node": "_for-sale.forsaledns.net",
  "status": "valid",
  "architecture": "ietf_multi",
  "dnssec": true,
  "data": {
    "v": "FORSALE1",
    "fval": "USD195000",
    "furi": "https://forsaledns.net/contact"
  }
}
```

---

## 🛠️ CLI Quick Check

Check any domain from your terminal:

```bash
dig TXT _for-sale.forsaledns.net +short
```

---

## 📄 License

Open-source under the [MIT License](LICENSE). Maintained by the [RFC 10023 Project](https://www.rfc10023.de).
