# RFC 10023 Ecosystem & Adoption Tracker – Entwickler-Dokumentation

Diese Dokumentation beschreibt die Architektur, Datenhaltung und Pflege des **RFC 10023 Ecosystem & Adoption Trackers** auf `rfc10023.de`.

---

## 1. Übersicht & Philosophie

Der Tracker dokumentiert transparent und quellenbasiert:
1. **Adoptions-Messwerte**: Telemetrische Zahlen (z. B. erfasste Domains mit `_for-sale` TXT-Record).
2. **Ökosystem-Integrationen**: Registries, Registrare, Scanner, APIs, MCP-Server und Tools von Drittanbietern.
3. **Eigene Tools**: Diagnose- und Generator-Werkzeuge auf `rfc10023.de` (strikte Trennung von Drittanbieter-Einträgen zur Wahrung redaktioneller Neutralität).

---

## 2. Speicherorte der Daten

Alle Daten werden zentral in maschinenlesbaren JSON-Dateien im Verzeichnis `/data/` gepflegt:

| Datei | Zweck | Aktualisierung |
|---|---|---|
| `data/ecosystem.json` | Liste aller verifizierten Drittanbieter-Integrationen | **Redaktionell manuell** |
| `data/adoption-current.json` | Aktuelle numerische Telemetriedaten und Quellen | **Automatisch / Manuell** |
| `data/adoption-history.json` | Historische Zeitreihe (max. 1 Datenpunkt pro Tag/Quelle) | **Automatisch ergänzt** |
| `data/timeline.json` | Chronologische Meilensteine seit RFC-Veröffentlichung | **Redaktionell manuell** |

Typisierungen und Hilfsfunktionen liegen in `src/data/ecosystem.ts`.

---

## 3. Wie eine neue Integration hinzugefügt wird

Öffne `data/ecosystem.json` und füge ein neues Objekt in das `integrations`-Array ein:

```json
{
  "id": "anbieter-name",
  "name": "Anbieter Name",
  "category": "domain-intelligence",
  "supportType": "scanner",
  "status": "supported",
  "description": "Prägnante deutsche Beschreibung der tatsächlichen Funktion.",
  "descriptionEn": "Concise English description of the verified functionality.",
  "sourceUrl": "https://anbieter.example/rfc10023-support",
  "firstObserved": "2026-09-24",
  "lastVerified": "2026-09-24"
}
```

### Gültige Kategorien (`category`)
- `registry` (ccTLD/gTLD Registries und Forschungsabteilungen)
- `registrar` (Domain-Registrare und DNS-Hoster)
- `domain-intelligence` (Whois-, DNS- und Sicherheits-Analyseplattformen)
- `aftermarket-search` (Spezialisierte Suchmaschinen und Marktplatz-Indizes)
- `developer-ai` (Model Context Protocol [MCP] Server, AI-Agent-Tools, SDKs)
- `dataset-monitoring` (Globale Zonen-Telemetrie und Zensus-Projekte)
- `browser-utility` (Browser-Erweiterungen und Desktop-Tools)

### Gültige Support-Typen (`supportType`)
- **Native Integration**: `native-integration`, `discovery`
- **Tool Support**: `parser`, `scanner`, `API`, `MCP`, `browser-extension`, `dataset`
- **Dokumentation / Awareness**: `documentation`, `DNS-configuration`

### Gültige Status-Werte (`status`)
- `production` (Im produktiven Regelbetrieb aktiv)
- `supported` (Offiziell unterstützt und verifiziert)
- `experimental` (Öffentlich verfügbare Beta-, Test- oder Prototyp-Version)
- `announced` (Offiziell angekündigt, noch nicht live geschaltet)
- `information` (Reine Dokumentation / Wissensdatenbank ohne native Auswertung)

> **Wichtiger Grundsatz**: Kein Eintrag ohne öffentlich nachprüfbare Quellen-URL (`sourceUrl`). Ein Blogartikel eines Registrars ist keine „Native Integration“, sondern `supportType: "documentation"` mit `status: "information"`.

---

## 4. Pflege der Adoptions-Kennzahlen

### Datei: `data/adoption-current.json`
Enthält für jede Quelle das aktuelle Kontingent:

```json
{
  "lastUpdated": "2026-09-24T06:00:00Z",
  "sources": {
    "domainsMonitor": {
      "value": 392683,
      "label": "Domains with detected _for-sale record",
      "labelDe": "Erkannte Domains mit _for-sale Record",
      "sourceUrl": "https://domains-monitor.com/research/rfc10023",
      "lastSuccessfulFetch": "2026-09-24T06:00:00Z",
      "mode": "manual"
    }
  }
}
```

- `mode: "manual"`: Für Quellen, die keine maschinenlesbare JSON-API anbieten (Schutz vor fehlerhaftem HTML-Scraping).
- `mode: "automatic"`: Für Quellen mit verifizierter JSON-Schnittstelle.

---

## 5. Automatische Aktualisierung via GitHub Actions

### Workflow-Datei: `.github/workflows/update-adoption.yml`
- **Trigger**:
  - Täglich um 05:17 UTC (`cron: '17 5 * * *'`)
  - Manuell über die GitHub-Weboberfläche (`workflow_dispatch`)
- **Rechte**: Minimale `contents: write` Berechtigung.
- **Commit-Verhalten**: Committet nur, wenn sich tatsächliche Daten geändert haben. Verhindert leere Commits.

### Manuelles Ausführen des Workflows
1. Gehe im GitHub-Repository auf den Reiter **Actions**.
2. Wähle den Workflow **Update RFC 10023 Adoption Data**.
3. Klicke auf **Run workflow** -> Branch auswählen -> **Run workflow**.

---

## 6. Lokales Ausführen des Update-Skripts

Das Skript kann jederzeit lokal getestet werden:

```bash
node scripts/update-adoption.mjs
```

### Plausibilitätsprüfungen & Fehlerschutz
- Verhindert das Löschen oder Nullsetzen bestehender Werte bei Netzwerkausfällen (Fallback auf letzten bekannten Wert).
- Verwirft Werte `≤ 0` oder nicht-numerische Ausgaben.
- Verwirft unplausible Sprünge `> 50%` gegenüber dem Vortag und protokolliert eine Warnung.
- Verhindert Duplikate in `adoption-history.json` (max. 1 Eintrag pro Kalendertag und Quelle).

---

## 7. Wie eine neue automatisierte Datenquelle ergänzt wird

1. Öffne `data/adoption-current.json`.
2. Ergänze einen neuen Schlüssel unter `sources`:

```json
"openDnsTelemetry": {
  "value": 50000,
  "label": "OpenDNS telemetry samples",
  "sourceUrl": "https://telemetry.example.org/api/v1/for-sale-count",
  "lastSuccessfulFetch": "2026-09-24T00:00:00Z",
  "mode": "automatic"
}
```

3. `scripts/update-adoption.mjs` verarbeitet den Endpunkt automatisch, validiert den Rückgabewert und schreibt Historie-Einträge fort.
