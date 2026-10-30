# Open Decisions

Only decisions not explicitly made by the owner remain open. A recommendation is not an approval unless the owner accepts it.

## Decisions already made
| Decision | Approved scope | Date |
|---|---|---|
| Implementation approach | Fully greenfield; rebuild the entire system independently | 30 October 2026 |
| Legacy application | Excluded as code/design foundation and runtime dependency | 30 October 2026 |
| Application database | New independent database; no legacy DB connection, schema reuse or data import | 30 October 2026 |
| Repository visibility | Public | 30 October 2026 |
| Public website languages | Arabic and English; visitor language switcher; RTL Arabic and LTR English | 30 October 2026 |
| Internal administration dashboard language | Arabic only in the current scope | 30 October 2026 |

## Still open
| Decision | Current status | Required evidence or approval |
|---|---|---|
| Application stack | Recommendation to be reviewed | Architecture ADR and owner ratification |
| New database provider/hosting | Open | Availability, backup, security, latency and cost assessment |
| Authentication/session implementation | Open | Threat model and security design |
| File/object storage provider | Open | Privacy, durability, access controls and cost |
| Email/notification provider | Open | Deliverability, regional support and owner approval |
| AI providers/models and budgets | Open | Workload tests, data policy, limits and cost controls |
| n8n deployment/license boundary | Open | Internal orchestration versus customer-facing workflow service |
| Staging and production hosting | Open | Capacity, isolation, backup/restore and operating cost |
| Customer portal language | Open | Explicit owner decision |
| Payment provider, tax, prices and contract rules | Open | Commercial/legal approval |
| Exact production rollout timing | Open | Explicit owner approval after staging acceptance |

## Approval rule
Record every newly approved decision with date, scope, impact and affected requirements. Do not infer an open decision from a technical recommendation.
