# ATSH Marketplace — interactive review
Arabic RTL, mobile-first interactive review of a multi-vendor store, separate seller portal and central owner/operations dashboard.
Open index.html (shopper), seller.html (seller), admin.html (owner). They share localStorage state within the browser origin.
Scope: seeded demonstration data; interactive search, categories, product details, cart, simulated COD checkout and per-vendor order split, seller products/orders/commissions, operator approvals/catalogue/team/content/support/audit.
IMPORTANT: this static preview is NOT the authenticated production application and does not persist to the PostgreSQL database; NO REAL PAYMENTS OR SECURE AUTHORIZATION. Access to the dashboard is purposely open in this preview. Reset the browser localStorage key atsh-market-demo-v3 to clear data.
Backend prototype remains in the same private project branch; commercial-grade Mercur migration to be evaluated before production; see MARKETPLACE_REFERENCE.md.
Third-party inspiration: Amazon Egypt and Noon design/function categories; no protected assets, logos, or source copied. Original ATSH interface; product data and prices synthetic.