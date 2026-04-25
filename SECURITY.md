# 🔒 Security Policy

## Supported Versions

AlgoViz is currently in early development (MVP phase). We provide security fixes for the following versions:

| Version          | Supported             |
|------------------|-----------------------|
| `0.1.x` (latest) | ✅ Yes                 |
| Earlier versions | ❌ No — please upgrade |

As the project matures and more versions are released, this table will be updated accordingly.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities in public GitHub Issues.** This protects users while the issue is being investigated and fixed.

### How to Report

Send a private report using one of these methods:

1. **GitHub Private Security Advisory** *(preferred)*
   Go to [Security → Advisories → New draft advisory](https://github.com/shahjalal-mahmud/algo-viz/security/advisories/new) on this repository.

2. **Email**
   Contact the maintainers directly at: *(<mahmud.nubtk@gmail.com>)*
   Use the subject line: `[SECURITY] AlgoViz — <brief description>`

### What to Include

Please provide as much of the following as you can:

- **Description** — what the vulnerability is and how it can be triggered
- **Impact** — what an attacker could do with it
- **Steps to reproduce** — a minimal reproduction case
- **Environment** — OS, VS Code version, Node/Python versions
- **Suggested fix** — if you have one (optional, always appreciated)

---

## What to Expect

| Timeline              | What Happens                                    |
|-----------------------|-------------------------------------------------|
| Within **48 hours**   | We acknowledge your report                      |
| Within **7 days**     | We assess severity and begin investigation      |
| Within **14 days**    | We share our findings and expected fix timeline |
| After fix is released | We credit you (unless you prefer anonymity)     |

We aim to be transparent throughout the process and will keep you updated at each stage.

---

## Scope

### In Scope

The following are considered security concerns in AlgoViz:

- **Remote code execution** — especially via malicious `steps.json` or `performance.json` inputs
- **Path traversal or file system attacks** in the extension's file handling
- **WebView injection** — XSS or script injection into the VS Code WebView panel
- **Dependency vulnerabilities** — critical CVEs in npm or pip dependencies
- **Privilege escalation** — the extension running code it shouldn't have access to

### Out of Scope

The following are generally not treated as security vulnerabilities:

- Bugs that only affect the developer's local machine with their own files
- UI glitches or incorrect complexity detection
- Issues in algorithm examples (`bubble_sort.py`, `benchmark.py`) that only affect local execution
- Theoretical attacks with no practical exploit path

---

## Security Best Practices for Users

AlgoViz runs Python files and reads JSON data from your local filesystem. To stay safe:

- **Only run `viz.py`-instrumented files you wrote or trust** — do not instrument untrusted third-party code
- **Review `steps.json` and `performance.json`** if they came from an untrusted source before opening AlgoViz
- **Keep dependencies updated** — run `npm audit` periodically if you've installed from source
- **Use the latest version** of AlgoViz for the most up-to-date security fixes

---

## Disclosure Policy

We follow **coordinated disclosure**:

1. Reporter notifies us privately
2. We investigate and develop a fix
3. Fix is released in a new version
4. We publicly disclose the vulnerability with credit to the reporter (if desired)

We ask that reporters give us a reasonable window (typically 30–90 days) before public disclosure, depending on complexity.

---

## Hall of Fame

We gratefully acknowledge security researchers who help keep AlgoViz safe. Reporters who responsibly disclose vulnerabilities will be credited here (with permission).

*No entries yet — be the first!*

---

*Last updated: April 2026*
