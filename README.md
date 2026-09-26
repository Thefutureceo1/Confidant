# Confidant 🔐 — Centralized, Zero-Knowledge Secret & Env Manager

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker Support](https://img.shields.io/badge/Docker-Ready-cyan.svg)](Dockerfile)
[![Air-Gapped Ready](https://img.shields.io/badge/Deployment-Air--Gapped-emerald.svg)](#-100-offline--air-gapped-architecture)
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-indigo.svg)](#-zero-knowledge-security-architecture)

## What is Confidant?

**Confidant** is a zero-knowledge, client-side encrypted secret and environment variable manager built for **DevOps teams, platform engineers, and security-conscious developers** who need bulletproof secret management in restricted, air-gapped, or on-premises environments.

Unlike traditional secret managers (Vault, Doppler, AWS Secrets Manager), **Confidant never stores your unencrypted secrets** — not even the provider can access them. All cryptographic operations happen **entirely in your browser** using industry-standard Web Crypto APIs.

**Perfect for:**
- 🔒 High-security environments (defense, finance, healthcare)
- 🏢 Air-gapped/offline deployments (no external dependencies)
- 📋 Teams needing compliance-ready secret rotation
- 🏠 Self-hosted infrastructure (on-premises only)
- 🔐 Organizations requiring zero-trust architecture

---

## ⚡ Quick Start (2 minutes)

### Option 1: Docker (Recommended)
```bash
git clone https://github.com/Thefutureceo1/Confidant.git
cd Confidant
docker compose up -d --build
```
👉 Open `http://localhost:3000` in your browser

### Option 2: Local Development
```bash
git clone https://github.com/Thefutureceo1/Confidant.git
cd Confidant
npm install
npm run dev
```
👉 Open `http://localhost:3000` in your browser

### Option 3: Pre-Built Docker Image
Coming soon to Docker Hub! For now, build locally with `docker compose`.

---

## 📥 Download & Installation

### Prerequisites
- **Docker & Docker Compose** (for containerized deployment) OR
- **Node.js 20+** & **npm** (for local development)

### Download Options

| Method | Use Case | Command |
|--------|----------|---------|
| **Clone via Git** | Full source code, easy updates | `git clone https://github.com/Thefutureceo1/Confidant.git` |
| **Docker Compose** | Production deployment, air-gapped ready | `docker compose up -d --build` |
| **GitHub Releases** | Stable binaries (coming soon) | Check [Releases page](https://github.com/Thefutureceo1/Confidant/releases) |
| **npm Install** | Embed in your project (coming soon) | `npm install confidant` |
| **Docker Hub** | Pre-built images (coming soon) | `docker pull confidant:latest` |

### 🚀 Next Steps After Installation
1. Access the web UI at `http://localhost:3000` (or your server IP)
2. Create your first master password (strong, 16+ characters recommended)
3. Start adding secrets and configuring rotation policies
4. (Optional) Set up webhook dispatchers for CI/CD integration

---

## ⚡ Key Features

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
* **HMAC-SHA256 Signature Verification:** Dispatches secure client-side JSON webhooks. Every POST request includes an `X-Envault-Signature: sha256=<signature>` header so your servers can verify the payload authenticity.
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
   git clone https://github.com/Thefutureceo1/Confidant.git
   cd Confidant
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
* **Production Stage:** Copies the output artifacts into a highly locked-down Nginx Alpine image. The custom `nginx.conf` ensures correct handling of the Single Page App (SPA) HTML5 History router.

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

## 📚 Documentation & Support

- **[Full Documentation](https://github.com/Thefutureceo1/Confidant/wiki)** (Coming soon)
- **[Frequently Asked Questions](https://github.com/Thefutureceo1/Confidant/discussions)** — Ask questions in Discussions
- **[Contributing Guide](CONTRIBUTING.md)** — Interested in contributing? Start here!
- **[Security Policy](SECURITY.md)** — Report security vulnerabilities responsibly
- **[Issues & Feature Requests](https://github.com/Thefutureceo1/Confidant/issues)** — Found a bug? Have an idea?

---

## 🛡️ Security & Compliance

✅ **Zero-Knowledge Architecture** — We cannot access your secrets  
✅ **AES-256-GCM Encryption** — Military-grade encryption standard  
✅ **PBKDF2-HMAC-SHA256** — Industry-standard key derivation  
✅ **No External Dependencies** — Works offline and air-gapped  
✅ **Open Source** — Full transparency, security through scrutiny  
✅ **Compliant with:** NIST, FIPS 140-2 (cryptography standards)

**For security vulnerabilities,** please see [SECURITY.md](SECURITY.md) for responsible disclosure.

---

## 🤝 Contributing

We welcome contributions! Whether it's bug reports, documentation, features, or security reviews—your help makes Confidant better.

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for:
- Development setup
- How to submit PRs
- Code style guidelines
- Bug reporting process

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

Built with ❤️ by developers who believe security shouldn't be a luxury—it should be the default.

**Inspired by:** Vault, age, Signal Protocol, and the zero-knowledge movement.

---

## 🚀 Roadmap

- ✅ Core zero-knowledge encryption
- ✅ Secret rotation policies
- ✅ Webhook dispatchers
- 🔄 **Coming Soon:** Kubernetes integration (Helm charts)
- 🔄 **Coming Soon:** Docker Hub pre-built images
- 🔄 **Coming Soon:** Multi-user support with role-based access
- 🔄 **Coming Soon:** Audit logging & compliance reporting
- 🔄 **Coming Soon:** Hardware security module (HSM) integration

---

**Questions?** Open a [GitHub Discussion](https://github.com/Thefutureceo1/Confidant/discussions) or check out our [Issues](https://github.com/Thefutureceo1/Confidant/issues).

**Ready to secure your secrets?** [Clone the repo](https://github.com/Thefutureceo1/Confidant.git) and run `docker compose up` today! 🔐
