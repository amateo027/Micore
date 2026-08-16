# **Micore**

### Tech Stack

* **Backend:** Rust, Tauri v2, SQLite (`rusqlite`), `ring` (Cryptography)
* **Frontend:** TypeScript, TailwindCSS, React / Svelte

---

<details>
<summary><b>Phase 1: Core Architecture & Storage (Foundation)</b></summary>

* [x] Design SQLite schema with relational link tables for cross-referencing
* [x] Implement secure storage layer (Argon2id KDF + AES-256-GCM / XChaCha20-Poly1305)
* [x] Set up IPC bridge commands between Rust core and Webview host
* [ ] Implement zero-memory trace policies (secure memory wiping on lock/idle)

</details>

<details>
<summary><b>Phase 2: Core Modules & Dashboard UI</b></summary>

* [ ] **Contacts & Profiles:** Network graph, identities, cross-linked metadata
* [ ] **Bookmark Manager:** Link storage, OpenGraph title auto-fetch, tag systems
* [ ] **Code Snippets & Vault:** Syntax-highlighted snippets and one-click secrets copy
* [ ] **Knowledge Base:** Markdown editor with live preview and cross-linking

</details>

<details>
<summary><b>Phase 3: Search, Interactivity & Optimization</b></summary>

* [ ] Implement global fuzzy search palette (`Ctrl+K`)
* [ ] Interactive graph visualization for interconnected items
* [ ] Full keyboard-driven navigation (`vim`-style keybindings)
* [ ] Encrypted export/import pipeline (Backup to single binary payload)

</details>

<details>
<summary><b>Phase 4: DevSecOps & Release Engineering</b></summary>

* [ ] Configure GitHub Actions CI/CD (Cross-compilation for Windows/Linux/macOS)
* [ ] Enforce security checks (`cargo-clippy`, `cargo-audit`, dependency pinning)
* [ ] Write documentation and cut release v1.0.0

</details>

---

### Getting Started

#### Prerequisites

* Node.js (v18+)
* Rust (latest stable)

#### Installation

1. Clone the repository:

```bash
git clone https://github.com/amateo027/Micore.git
cd Micore

```

2. Install frontend dependencies:

```bash
npm install

```

3. Launch in development mode:

```bash
npm run tauri dev

