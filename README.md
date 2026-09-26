# Confidant 🔐 — Centralized, Zero-Knowledge Secret & Env Manager

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker Support](https://img.shields.io/badge/Docker-Ready-cyan.svg)](Dockerfile)
[![Air-Gapped Ready](https://img.shields.io/badge/Deployment-Air--Gapped-emerald.svg)](#-100-offline--air-gapped-architecture)
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-indigo.svg)](#-zero-knowledge-security-architecture)

**Confidant** is a high-security, client-side, **zero-knowledge encrypted** environment variable and configuration manager. Built specifically for developers, engineering teams, and strict DevOps administrators, Confidant allows you to structure environment configurations, organize variables across multiple environments (Development, Staging, Production), and securely coordinate secrets without exposing plaintext keys to any remote servers.

The application is completely self-contained and **offline-first**, engineered from the ground up to operate in high-security, highly-restricted **air-gapped environments** without any external dependencies.

---

## ⚡ Key Capabilities

### 🔑 Zero-Knowledge Security Architecture
All cryptographic processes run strictly in the user's browser runtime using standard **Native Web Crypto APIs**:
* **Master Key Derivation:** Plaintext master passwords are never stored. Confidant uses **PBKDF2-HMAC-SHA256** with unique salts to derive secure operational cryptographic keys.
* **Payload Encryption:** Secrets are encrypted on the fly using authenticated **AES-256-GCM** encryption before writing to disk. Plaintext values only exist in volatile browser memory when unlocked.

### 🔄 Recurring Secret Rotation Policies
Keep sensitive credentials fresh with proactive, customizable automated rotation:
* **Custom Intervals:** Configure rotation schedules ranging from 7 days to 180 days per variable.
* **Cryptographic Strategies:** Choose from multiple generator systems (Auto-Gen Alphanumeric, Auto-Gen Hex strings, UUIDv4, or Manual alerting).
* **Overdue Warnings & One-Click Regeneration:** Spot expired keys instantly with animated dashboard indicators and regenerate tokens securely on the fly.

### 🔌 Cryptographic Webhook Dispatcher
Sync environment updates immediately with your production pipelines:
* **HMAC-SHA256 Signature Verification:** Dispatches secure client-side JSON webhooks. Every POST request includes an `X-Envault-Signature: sha256=<signature>` header so your servers can verify the sender.
* **Trigger Events:** Triggers automatically on `secret.created`, `secret.updated`, or `secret.deleted` configurations.

### 🌐 100% Offline & Air-Gapped Ready
Confidant runs entirely standalone:
* **Zero Telemetry / Tracker SDKs:** No analytics, remote pixels, or CDNs.
* **No Fonts CDNs:** All Google Font external preconnect references are eliminated. Uses native System UI typefaces to prevent timeouts on networks without internet.
* **Connection State Indicator:** Embedded `OfflineModeIndicator` component in the Navbar to dynamically display connection statuses and verify secure offline sandbox modes.

---

## 🛠️ Tech Stack

* **Core Runtime:** [React 18](https://react.dev/) + [TypeScript](https://www.typescript.org/)
* **Build System:** [Vite](https://vite.dev/)
* **CSS & Style:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Web Server (Docker):** [Nginx Alpine](https://www.nginx.com/)

---

## 🐳 Running on On-Premises or Air-Gapped Environments

Confidant is pre-packaged for instantaneous container deployment. Because it's completely static, the resulting image is extremely lightweight and secure.

### Prerequisites
* [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on the server.

### Simple Compose Launch

1. **Clone the repository** to your server:
   ```bash
   git clone https://github.com/your-username/confidant.git
   cd confidant
   ```

2. **Boot up the container**:
   ```bash
   docker compose up -d --build
   ```

3. **Verify the container is running**:
   ```bash
   docker ps
   ```
   The application is now hosted and accessible over port `3000` (e.g., `http://localhost:3000` or `http://<your-server-ip>:3000`).

### Inspecting Dockerfile Architecture
We employ a secure, optimized **multi-stage build** pipeline:
* **Build Stage:** Utilizes a lightweight Node 20 environment to pull dependencies and compile optimized production chunks.
* **Production Stage:** Copies the output artifacts into a highly locked-down Nginx Alpine image. The custom `nginx.conf` ensures correct handling of the Single Page App (SPA) HTML5 History router (`try_files $uri $uri/ /index.html;`) and serves files with compressed offline caching policies.

---

## 🚀 Local Development

To run the application locally outside of Docker:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Launch the Vite Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your preferred browser.

3. **Run Lint Checks**:
   ```bash
   npm run lint
   ```

4. **Compile Production Bundle**:
   ```bash
   npm run build
   ```

---

## 💡 Webhook Verification Snippet (Node.js/Express)

For servers receiving outbound webhooks from Confidant, verify requests using this production-ready middleware:

```javascript
const crypto = require('crypto');

function verifyConfidantWebhook(req, res, next) {
  const secretKey = 'your_webhook_signing_secret'; // Set in Confidant Panel
  const signature = req.headers['x-envault-signature'];
  const eventType = req.headers['x-envault-event'];

  if (!signature) {
    return res.status(401).send('Missing X-Envault-Signature');
  }

  // Generate SHA-256 HMAC of raw body payload
  const hmac = crypto.createHmac('sha256', secretKey);
  const rawBody = JSON.stringify(req.body);
  const calculatedSignature = `sha256=${hmac.update(rawBody).digest('hex')}`;

  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature))) {
    console.log(`Verified event: ${eventType}`);
    next();
  } else {
    res.status(403).send('Invalid Signature Digest');
  }
}
```

---

## 🛡️ License

This project is open-source software licensed under the [MIT License](LICENSE).
