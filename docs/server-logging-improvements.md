## Appendix: Gap Analysis Matrix (as of 2026-04-12)

| Plan Area               | Status      | Gaps/Notes                                                                                      |
| ----------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| Log context enrichment  | ✅ Complete | Comprehensive; includes request, user, resource, and IP.                                        |
| Correlation/trace IDs   | ⚠️ Partial  | Present in API/admin flows. Add for background/async jobs if/when present.                      |
| Error log consistency   | ⚠️ Partial  | Stack traces/context usually present, but no universal helper. Utility function recommended.    |
| Payload/meta logging    | ⚠️ Partial  | Meta always logged; field whitelisting/redaction for sensitive fields should be double-checked. |
| JSON log output         | ❌ Missing  | Plain/logfmt used; migrate/allowswitch to JSON lines for complete log ingestibility.            |
| Log level standards     | ⚠️ Partial  | Audit improved; codified documentation or lint/tooling still recommended.                       |
| Audit trail (critical)  | ✅ Complete | All admin/sensitive flows now log fully.                                                        |
| Helper/middleware utils | ⚠️ Partial  | Middleware/context utility done; standardize error wrapper/middleware for all exceptions.       |
| PII/redaction           | ⚠️ Partial  | Some redaction present; should standardize and explicitly document never-log fields.            |
| Test/rollout            | ⚠️ Partial  | Manual tested; CI log assertions or output checks not present.                                  |

_Last benchmarked: 2026-04-12_
