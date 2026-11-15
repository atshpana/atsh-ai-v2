# ATSH Marketplace — reference assessment (15 November 2026)

## Chosen reference models
Buyer UX and operational breadth: Amazon Egypt (`https://www.amazon.eg/`) + Noon Egypt (`https://www.noon.com/egypt-ar/`). Similarweb September 2026 ranked Amazon Egypt #1, Noon #2 in Egypt ecommerce traffic: https://www.similarweb.com/top-websites/egypt/e-commerce-and-shopping/.
Open-source marketplace engine recommended: Mercur (https://github.com/mercurjs/mercur), MIT-licensed core on Medusa v2. The vendor and admin portals are distinct; official repo/README and docs describe seller onboarding, commissions, order splitting, payouts.
Official Mercur public enterprise demonstration: https://enterprise.mercurjs.com/ . Enterprise features and license must not be assumed to be MIT-licensed.

## Boundaries / fidelity
Replicate workflows and information architecture; do not copy proprietary Amazon/Noon branding, photography, content, code, trade dress or assert affiliation. The public preview is ATSH-branded, Arabic RTL and responsive.

## Role-specific surfaces
1. Customer storefront: collections, search, filters, listing, product details, promotions, cart, cross-merchant checkout, order status and customer account.
2. Seller portal: onboarding, own products/variants/stock, orders, returns, fulfilment, promotion, commission ledger, sales analytics, settlements, staff and shop settings.
3. Central management: tenant/vendor approvals, global catalogue moderation, order disputes, refunds, commissions, fee rules, customer service, editorial CMS/banners, SEO, integrations, finance, analytics, audit, user and team roles (create/promote/suspend/revoke/delete).
4. Team: role-based access control with server-enforced scoping, least privilege and audit log for every critical action.

## Current repository status
Branch starts from prior `projects/atsh-multivendor-market` FastAPI prototype with tests, mobile prototype, merchant approval, multi-seller checkout, commission ledger; see QA_REPORT.md for measured historical checks. This branch contains a new interactive static review in `marketplace-preview/`.
Static demo supports local browser interaction only. A true complete Mercur build is NOT vendored, deployed, wired to actual database/payments, or production-tested in this turn. DO NOT claim otherwise.

## Production acceptance before deployment
Vendor ownership isolation and RBAC/MFA tests; production PostgreSQL migrations; HTTPS; consent/privacy; Egyptian payment/shipping integrations and refunds; real wallet/payout reconciliation; image media storage; email/SMS and notifications; tax rules and invoices; seller KYC; fraud/abuse handling; E2E Playwright; mobile app build; performance/load/accessibility audits; staging and rollback; owner approval before public launch.

## Source references
- https://github.com/mercurjs/mercur
- https://medusajs.com/kb/marketplaces/multi-vendor-marketplace
- https://sell.amazon.com/tools/seller-central
- https://helpcenter.noon.partners/en/category/reports-and-analytics/reports-and-analytics-comprehensive-overview