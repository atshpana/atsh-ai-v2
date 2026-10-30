# Data Classification and Handling Baseline — Draft v0.1

| Class | Examples | Default handling |
|---|---|---|
| Public | Published website pages, public service catalog, public pricing where approved | May be served publicly after publication checks |
| Internal | Internal task notes, operational dashboards, unpublished content | Authenticated staff only, scoped by role |
| Confidential | Customer contact details, proposals, contracts, project files, support conversations | Need-to-know access, customer/project scoping, private storage, audited exports |
| Restricted | Password reset tokens, session secrets, API credentials, payment-provider secrets, private signing keys | Secret manager only; never log, display, commit or store in ordinary business JSON |

## Rules
- Collect only data needed for the stated business purpose.
- Do not expose customer records through public tracking endpoints; use an unpredictable reference plus a separate access proof.
- Never log credentials, session cookies, access tokens, full payment data or private connection strings.
- Store uploaded files in private object storage by default; validate actual MIME/content, size and malware status before making them available.
- Signed download links must be short-lived and issued only after server-side authorization.
- Redact or minimize personal data in AI prompts, telemetry and test fixtures.
- Use synthetic data in development, CI and public repository examples.
- Define retention, deletion, export and legal-hold policies before production intake launches.
- Audit access to restricted/confidential exports and privileged reads where justified.
- Keep production credentials and customer data outside GitHub issues, commits, Actions logs and public docs.
