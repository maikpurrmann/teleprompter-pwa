# Teleprompter PWA

Schlanke Web-App, die Markdown-Dateien als scrollenden Teleprompter-Text auf dem Smartphone anzeigt. Gebaut fuer ein Prompter-Gehaeuse mit 45-Grad-Beam-Splitter-Spiegel und Webcam.

## Aufbau

Das Smartphone liegt im Gehaeuse unter der Spiegelscheibe. Die App zeigt den Text an, der Spiegel reflektiert ihn in Richtung Kamera. Der Sprecher liest den Text, waehrend er direkt in die Kamera schaut.

```
  [Kamera]
     |
 [===========]  <-- Beam-Splitter (45 Grad, 12.5cm breit)
     |
 [Smartphone]   <-- zeigt gespiegelten Text
```

## Dateien

```
teleprompter/
  server.js          Node.js-Server (HTTP + WebSocket-Relay)
  package.json       Dependencies (ws)
  public/
    index.html       Komplette App (HTML + CSS + JS inline)
    manifest.json    PWA-Manifest fuer "Zum Home-Bildschirm"
    sw.js            Service Worker (Network-First mit Offline-Fallback)
  README.md          Diese Datei

teleprompter-stack.yml   Docker-Compose fuer Portainer-Deployment
```

## UI-Flow

Die App hat drei Modi, die ueber einen Startbildschirm gewaehlt werden:

1. **Startbildschirm** -- Modus-Wahl: "Prompter starten" oder "Remote Control"
2. **Prompter-Modus** -- Datei laden, dann scrollender Text mit Toolbar
3. **Remote-Control-Modus** -- Steuerungs-UI fuer ein zweites Geraet

Der Modus wird zuerst gewaehlt, bevor eine Datei geladen wird. Das Remote-Control-Geraet braucht keine Datei.

## Features

### Prompter

- **Markdown laden** -- lokale Datei (.md/.txt) oder per URL
- **Spiegelung** -- vertikaler Flip (scaleY) fuer den 45-Grad-Beam-Splitter, umschaltbar
- **Auto-Scroll** -- Play/Pause + Speed-Regler mit definierten Stufen (30, 45, 60, 80, 110, 150, 200 px/s)
- **Speed-Anzeige** -- aktuelle Geschwindigkeit neben dem Slider sichtbar
- **Manuelles Scrollen** -- Touch-Wischen jederzeit moeglich
- **Schriftgroesse** -- A+/A- Buttons (Default: 2.5rem)
- **Zum Anfang** -- Button springt zurueck auf Position 0
- **Vollbild** -- Fullscreen-API-Button (Android/Desktop), auf iOS via PWA-Install
- **Seitenraender** -- 15vw links/rechts, passend fuer die 12.5cm breite Scheibe
- **Toolbar unten** -- leicht erreichbar beim Griff ins Gehaeuse, grosser Play-Button
- **Toolbar-Autohide** -- blendet nach 3s aus, erscheint bei Touch
- **SVG-Icons** -- Play/Pause als Inline-SVG (kein Unicode/Emoji)
- **Letzte Datei merken** -- via localStorage
- **Progress-Bar** -- zeigt Position im Text

### Remote Control

- **Play/Pause** -- Auto-Scroll starten/stoppen
- **Scroll hoch/runter** -- manuelles Scrollen per Button
- **Speed-Slider** -- Geschwindigkeit in Echtzeit aendern
- **Schriftgroesse** -- A-/A+ Buttons
- **Spiegelung** -- Mirror-Toggle
- **Zum Anfang** -- Springt zurueck auf Position 0
- **Status-Anzeige** -- Verbindungsstatus (Verbunden/Getrennt)
- **State-Sync** -- zeigt aktuellen Fortschritt, Speed und Play-Status vom Prompter
- **Tastatur-Shortcuts** -- gleiche Tastenbelegung wie im Prompter

### Netzwerk / WebSocket

- **Automatische Verbindung** -- beide Modi verbinden sich beim Start zum WebSocket-Server
- **Reconnect** -- bei Verbindungsverlust automatischer Neuverbindungsversuch (2s Intervall)
- **Keepalive** -- Server sendet Ping alle 15s, Client antwortet mit Pong
- **Visibility-Handler** -- Reconnect bei Tab-Wechsel (besonders fuer mobile Browser)
- **State-Broadcast** -- Prompter sendet alle 500ms seinen State (Position, Speed, Playing)

## Bluetooth-Fernbedienung / Tastatur

| Taste               | Funktion               |
|----------------------|------------------------|
| Space / Enter        | Play / Pause           |
| Pfeil hoch / Page Up | Manuell hoch scrollen  |
| Pfeil runter / Page Down | Manuell runter scrollen |
| Pfeil rechts         | Speed eine Stufe hoch  |
| Pfeil links          | Speed eine Stufe runter|

Funktioniert in beiden Modi (Prompter und Remote Control).
Empfohlen: Bluetooth Presenter-Clicker (sendet Pfeiltasten/Page Up/Down).

## Deployment

### Lokal testen (vom Mac aus)

```bash
cd teleprompter
npm install
node server.js
```

Server laeuft auf `http://0.0.0.0:8090` (alle Interfaces).

Dann auf dem iPhone in Safari/Chrome: `http://<Mac-IP>:8090`

Fuer Remote Control: Zweites Geraet/Tab oeffnen, gleiche URL, "Remote Control" klicken.

### Dauerhaft auf NUC/Homelab (Portainer)

Die App laeuft als Node.js-Docker-Container auf dem NUC (192.168.2.65).

**Stack neu generieren** (nach Aenderungen an den Dateien):

```bash
cd teleprompter
b64_index=$(base64 < public/index.html)
b64_manifest=$(base64 < public/manifest.json)
b64_sw=$(base64 < public/sw.js)
b64_server=$(base64 < server.js)
b64_pkg=$(base64 < package.json)

cat > ../teleprompter-stack.yml << YAMLEOF
services:
  teleprompter:
    image: node:22-alpine
    container_name: teleprompter
    ports:
      - "8090:8090"
    restart: unless-stopped
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        mkdir -p /app/public
        echo '${b64_server}' | base64 -d > /app/server.js
        echo '${b64_pkg}' | base64 -d > /app/package.json
        echo '${b64_index}' | base64 -d > /app/public/index.html
        echo '${b64_manifest}' | base64 -d > /app/public/manifest.json
        echo '${b64_sw}' | base64 -d > /app/public/sw.js
        cd /app && npm install --production && node server.js
YAMLEOF
```

**In Portainer deployen:**

1. Portainer oeffnen: http://192.168.2.65:9000
2. Stacks -> Add stack (oder bestehenden Stack updaten)
3. Name: `teleprompter`
4. Web editor: Inhalt von `teleprompter-stack.yml` einfuegen
5. Deploy the stack

**Erreichbar unter:** http://192.168.2.65:8090

### Safari auf macOS: Hostname statt IP

Safari auf macOS hat Probleme mit WebSocket-Verbindungen zu reinen IP-Adressen. Die Seite laedt normal, aber die WebSocket-Verbindung (fuer Remote Control) haengt oder braucht sehr lange. Loesung: einen Hostnamen verwenden.

**Auf jedem Mac/MacBook einmalig ausfuehren:**

```bash
echo "192.168.2.65 teleprompter.local" | sudo tee -a /etc/hosts
```

Danach die App ueber `http://teleprompter.local:8090` oeffnen statt ueber die IP-Adresse.

Der Eintrag in `/etc/hosts` gilt nur fuer den jeweiligen Rechner. Alternativ kann der Hostname zentral im Router oder DNS-Server (Fritz!Box, Pi-hole, AdGuard Home) eingetragen werden -- dann gilt er fuer alle Geraete im Netzwerk.

**Hinweis:** Auf iOS (iPhone/iPad) tritt das Problem nicht auf. Dort funktioniert die IP-Adresse problemlos.

### Vollbild

**iPhone (Safari):** URL oeffnen, dann: Teilen -> "Zum Home-Bildschirm" -- die App laeuft dann ohne Safari-Adressleiste.

**Android (Chrome):** Im Browser den Vollbild-Button in der Toolbar nutzen. Alternativ: Dreipunkt-Menue -> "App installieren" / "Zum Startbildschirm" -- die installierte App startet direkt im Fullscreen (Manifest: `display: fullscreen`).

**Desktop:** Vollbild-Button in der Toolbar nutzt die Fullscreen-API.

## Remote Control

Ein zweites Geraet kann den Prompter fernsteuern:

1. **Prompter-Geraet (iPhone):** App oeffnen -> "Prompter starten" -> Datei laden -> Prompter laeuft
2. **Steuerungs-Geraet (Mac/iPad):** Gleiche URL oeffnen -> "Remote Control" klicken
3. Steuerung per Buttons oder Tastatur (Space, Pfeiltasten)

Die Verbindung laeuft ueber WebSocket im lokalen Netzwerk -- alle Geraete auf der gleichen URL landen im gleichen Room (kein Room-Code noetig, Single-User-Setup).

### WebSocket-Protokoll

Commands werden als JSON zwischen den Clients ausgetauscht:

| Command | Richtung | Beschreibung |
|---------|----------|--------------|
| `{ cmd: "play" }` | Remote -> Prompter | Auto-Scroll starten |
| `{ cmd: "pause" }` | Remote -> Prompter | Auto-Scroll stoppen |
| `{ cmd: "speed", value: N }` | Remote -> Prompter | Speed-Stufe setzen (0-6) |
| `{ cmd: "scroll", direction: "up"/"down" }` | Remote -> Prompter | Manuell scrollen |
| `{ cmd: "font", direction: "up"/"down" }` | Remote -> Prompter | Schriftgroesse aendern |
| `{ cmd: "mirror" }` | Remote -> Prompter | Spiegelung togglen |
| `{ cmd: "top" }` | Remote -> Prompter | Zum Anfang springen |
| `{ state: {...} }` | Prompter -> Remote | State-Sync (Position, Speed, Playing) |

## Technische Details

### Server (server.js)

- Node.js HTTP-Server fuer statische Dateien aus `public/`
- WebSocket-Server mit `noServer: true` Pattern (explizites HTTP-Upgrade-Handling)
- Ping/Pong-Keepalive alle 15 Sekunden (erkennt tote Clients)
- Relay: Jede Nachricht wird an alle anderen verbundenen Clients weitergeleitet
- Kein Room-Konzept noetig (Single-User-Homelab)

### Service Worker (sw.js)

- **Network-First-Strategie**: Versucht immer zuerst das Netzwerk, cached die Antwort, faellt bei Offline auf Cache zurueck
- Cache-Version: `teleprompter-v7`
- Alte Caches werden beim Aktivieren automatisch geloescht
- Cached: index.html, manifest.json, marked.js (CDN)

### PWA

- Manifest mit `display: fullscreen` und `orientation: portrait`
- SVG-Icon (weisses "T" auf schwarz) als Data-URI im Manifest
- Service Worker fuer Offline-Faehigkeit
- Prompter funktioniert auch ohne Netzwerk (Remote Control natuerlich nicht)

## Bekannte Einschraenkungen

- **Safari WebSocket auf macOS**: Safari auf macOS hat Probleme mit WebSocket-Verbindungen zu reinen IP-Adressen (haengt oder verbindet sehr langsam). Loesung: Hostname statt IP verwenden (`teleprompter.local` statt `192.168.2.65`, siehe Abschnitt "Safari auf macOS"). Auf iOS tritt das Problem nicht auf.
- **Kein Auth**: Keine Authentifizierung -- nur fuer vertrauenswuerdiges LAN gedacht.
- **Single Room**: Alle Clients auf dem gleichen Server sind im gleichen "Raum". Fuer Multi-User-Szenarien muesste ein Room-Konzept ergaenzt werden.

## Abhaengigkeiten

- `marked.js` via CDN (https://cdn.jsdelivr.net/npm/marked/marked.min.js) -- wird vom Service Worker gecacht
- `ws` ^8.18.0 (Node.js WebSocket-Library) -- fuer Remote Control Relay
- Node.js 22 Alpine Docker Image (fuer Portainer-Deployment)
- Keine Build-Tools, kein Framework, kein Bundler
