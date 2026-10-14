# Security Policy

## Supported Versions

We release patches and bug fixes for the latest version of Driver Hub.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

Security of user systems is of the utmost priority, especially since Driver Hub interacts with low-level Windows hardware drivers, UAC administrator elevation, and the Windows DriverStore.

If you believe you have found a security vulnerability in Driver Hub, please do **NOT** report it publicly through a public GitHub issue.

Instead, please report the vulnerability privately:
1. Use GitHub's private security reporting feature: [Report a Vulnerability](https://github.com/aniketlab/DriverHub/security/advisories/new)
2. Or contact the lead developer directly: **Aniket Sharma** ([@aniketlab](https://github.com/aniketlab))

### What to Include in Your Report
- A detailed description of the vulnerability.
- Proof of concept (PoC) or step-by-step reproduction instructions.
- Potential impact and affected components (e.g. installer service, IPC bridge, elevation token).

We will acknowledge receipt within 48 hours and work diligently to release a patched build.
