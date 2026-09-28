#!/usr/bin/env bash
# sync-local.sh — Lokalen Stand mit GitHub-Remote synchronisieren
# Aufruf: ./scripts/sync-local.sh [--pull-only]
#
# Dieses Script sorgt dafür, dass der lokale Klon immer auf dem neuesten
# Stand ist, bevor man entwickelt. Der GitHub-Actions-Bot committet täglich
# aktuelle Daten — dieses Script holt die Änderungen.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_DIR"

echo "🔄 Syncing rfc10023.de with GitHub remote..."

# Prüfe ob wir im richtigen Repo sind
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Fehler: Kein Git-Repository gefunden in $REPO_DIR"
  exit 1
fi

# Lösche hängende Lock-Datei falls vorhanden
if [ -f ".git/index.lock" ]; then
  echo "⚠️  Git lock-Datei gefunden, wird entfernt..."
  rm -f ".git/index.lock"
fi

# Remote-Änderungen holen
git fetch origin

# Status anzeigen
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "✅ Lokaler Stand ist aktuell ($(git log --oneline -1))"
  exit 0
fi

BEHIND=$(git rev-list HEAD..origin/main --count)
echo "📡 Lokaler Stand ist $BEHIND Commit(s) hinter Remote"

# Prüfe ob ungespeicherte Änderungen vorliegen
if ! git diff-index --quiet HEAD --; then
  echo "⚠️  Lokale Änderungen erkannt:"
  git status --short
  echo ""
  echo "Optionen:"
  echo "  1) Änderungen sind Daten-Updates vom Bot → werden durch Remote überschrieben"
  echo "  2) Eigene Code-Änderungen → bitte manuell committen/stashen"
  echo ""
  # Prüfe ob nur Data-Dateien geändert wurden
  CHANGED=$(git diff-index --name-only HEAD --)
  DATA_ONLY=true
  for f in $CHANGED; do
    if [[ "$f" != data/* ]]; then
      DATA_ONLY=false
      break
    fi
  done
  
  if [ "$DATA_ONLY" = "true" ]; then
    echo "ℹ️  Nur data/ Dateien geändert — Remote-Version überschreibt lokale Bot-Daten..."
    git checkout origin/main -- $CHANGED
  else
    echo "❌ Code-Änderungen vorhanden. Bitte manuell committen oder stashen, dann sync erneut ausführen."
    exit 1
  fi
fi

# Pull durchführen
echo "⬇️  Pulling from origin/main..."
git pull origin main

echo ""
echo "✅ Sync abgeschlossen!"
echo "   Letzter Commit: $(git log --oneline -1)"
