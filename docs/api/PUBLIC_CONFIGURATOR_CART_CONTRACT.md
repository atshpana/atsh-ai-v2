# Public Configurator, Pricing and Cart Contract — Draft v0.1

- Status: implementation contract draft; not a live API and not a commercial pricing approval.
- Authority: Executive Reference v2.0, public screen catalog PUB-02..PUB-07, configurator eight-stage flow and pricing-engine rules.
- Backend: NestJS modular monolith under `/api`.
- Money: decimal strings at API boundaries; never JavaScript floating-point as an authoritative value.
- Current implementation boundary: no authentication/session, catalog persistence, pricing service, cart persistence or order submission is connected. Do not enable customer mutations until those dependencies and security controls exist.

## 1. Domain boundaries

1. The published catalog and published configurator schema are the source of available services, options, dependencies, conflicts and field validation.
2. The server-side pricing engine is the sole authority for money. Browser values are selections and display hints only.
3. A cart is a temporary editable selection. A submitted service request is a durable business record with immutable item and price snapshots.
4. A custom-quote service may return `quote_required`; it must not produce a fabricated grand total.
5. One cart may contain multiple compatible ready-priced service/package lines. The custom-system intake remains a distinct route; combining it with a ready-priced cart is not assumed by this contract.
6. Development/hosting recurring charges must remain distinct from one-time implementation charges and display their billing periods and renewal terms separately.
7. Tax, discounts, currency conversion and payment remain inactive unless an approved configuration exists. Never infer a tax rate or payment provider.

## 2. Public catalog and configurator reads

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/public/services?locale=ar|en&category=&q=&page=&pageSize=` | Published service listing |
| GET | `/api/public/services/:slug?locale=ar|en` | Localized service details |
| GET | `/api/public/configurator/:serviceSlug?locale=ar|en` | Published configurator schema and valid options |
| GET | `/api/public/packages?locale=ar|en` | Published package listing, when package records and composition are approved |
| GET | `/api/public/packages/:slug?locale=ar|en` | Package detail and included components |

Public responses must omit draft/archived records, internal notes, unpublished prices/rules, provider credentials, internal identifiers that are not needed by the client, and staff-only metadata. Locale must be explicitly validated; only `ar` and `en` are supported for the public site in the current scope.

### Configurator schema response

The configurator endpoint returns a versioned, read-only schema:

```ts
type ConfiguratorDefinition = {
  service: { slug: string; name: string; summary?: string };
  configuratorVersion: number;
  pricingVersion: number | null;
  mode: "ready_priced" | "starting_price" | "custom_quote";
  steps: Array<{
    key: string;
    title: string;
    description?: string;
    fields: Array<{
      key: string;
      type: "single_select" | "multi_select" | "number" | "text" | "boolean" | "file";
      label: string;
      helpText?: string;
      required: boolean;
      validation?: Record<string, unknown>;
      choices?: Array<{ key: string; label: string; description?: string }>;
      visibility?: Record<string, unknown>;
    }>;
  }>;
  options: Array<{
    key: string;
    label: string;
    description?: string;
    selection: "single" | "multiple" | "quantity";
    required: boolean;
    dependencies?: string[];
    conflicts?: string[];
    pricingKind: "fixed" | "per_unit" | "tiered" | "recurring" | "custom_quote";
  }>;
};
```

- The schema is published as an immutable version. Editing creates a draft/new version; it does not mutate an active customer session.
- Conditions use a constrained declarative format with an allow-listed operator set. No executable JavaScript, SQL, arbitrary expressions or client-supplied rule code.
- The server validates required fields, types, bounds, allowed choice keys, option dependencies, conflicts and file metadata.
- A file field returns an upload intent only after private object storage, MIME/size validation, malware scanning and ownership rules are designed. Until then, file upload is not enabled.

## 3. Pricing calculation

### Request

```json
{
  "locale": "ar",
  "serviceSlug": "websites-platforms",
  "configuratorVersion": 1,
  "items": [
    {
      "optionSelections": [
        { "key": "content-writing", "quantity": 1 },
        { "key": "extra-pages", "quantity": 3 }
      ],
      "answers": {
        "page-count": 8,
        "languages": ["ar", "en"]
      },
      "quantity": 1
    }
  ]
}
```

The example keys and values above are illustrative contract examples only; they do not define live ATSH options, limits or prices.

### Response

```ts
type PricingResult =
  | {
      status: "priced";
      calculationId: string;
      expiresAt: string;
      pricingVersion: number;
      currency: string;
      lines: Array<{
        key: string;
        label: string;
        quantity: number;
        unitAmount: string;
        lineAmount: string;
        billingPeriod: "one_time" | "monthly" | "yearly" | null;
      }>;
      subtotal: string;
      discountTotal: string;
      taxTotal: string;
      oneTimeTotal: string;
      recurring: Array<{ period: "monthly" | "yearly"; amount: string }>;
      grandTotal: string;
      requiresManualQuote: false;
    }
  | {
      status: "quote_required";
      calculationId: string;
      pricingVersion: number | null;
      reasonCode: string;
      message: string;
      requiresManualQuote: true;
    };
```

- Amounts are serialized decimal strings with the currency code. The API must define a single rounding policy and apply it consistently.
- The server derives all prices from the active approved pricing version and persisted rules. It ignores/rejects client-supplied amount, discount, tax, currency, billing period and total fields.
- Support rule types: fixed, per-unit, tiered, recurring and custom quote. Page overage follows `max(0, requested_pages - included_pages) × approved_unit_price` only where that rule is configured.
- The calculation returns a short-lived calculation reference. It is not a price lock or a submitted request.
- When the calculation expires or the pricing/configurator version changes, the server recalculates and returns the new breakdown. The client must display the difference and require customer confirmation before continuing.
- A custom-quote result contains no numeric grand total. The interface must clearly show that the team will review requirements and issue a formal quote.
- If tax/discount configuration is not approved, return zero only when the pricing configuration explicitly says so; otherwise return a configuration error rather than silently assuming a rate.

## 4. Cart contract

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/cart` | Create or resume an anonymous-session/authenticated cart |
| GET | `/api/cart/:cartId` | Read the caller's cart |
| POST | `/api/cart/:cartId/items` | Add a service/package line |
| PATCH | `/api/cart/:cartId/items/:itemId` | Change quantity, answers or options |
| DELETE | `/api/cart/:cartId/items/:itemId` | Remove a line |
| DELETE | `/api/cart/:cartId` | Clear cart after explicit UI confirmation |

Cart write request contains identifiers/keys, quantities, answers and a current calculation reference where applicable. It never accepts authoritative amounts.

Cart response includes:
- Cart identifier and expiry.
- Lines with service/package label snapshots for display, selected option labels and quantities.
- Latest server-calculated line breakdown, currency and pricing version.
- One-time charges and recurring charges grouped by billing period.
- A state flag: `ready`, `reprice_required`, `quote_required` or `unavailable`.
- Non-sensitive validation messages and allowed next actions.

### Cart invariants

1. Cart ID is not authorization. Every read/write checks authenticated ownership or a high-entropy anonymous-session binding.
2. Never trust a cart ID supplied by a different session. Do not expose whether another user's cart exists.
3. Revalidate publication status, option availability, dependencies, conflicts, quantity bounds and pricing on every mutation.
4. If an option becomes unavailable, preserve the user's other selections and return a structured conflict requiring correction; do not silently drop options.
5. If price changes, return `reprice_required` with old/new breakdowns and do not silently accept the new total.
6. Clearing/removing a line must be explicit and idempotent. Expired carts cannot be submitted.
7. Use a bounded line count, quantity bounds, request-size limits and rate limits.
8. Anonymous cart transfer to an authenticated account, if later enabled, must verify both session and account ownership and be audited.

## 5. Request submission boundary

Submission is a separate operation from cart mutation:

`POST /api/orders`

Required headers:
- `Idempotency-Key`: high-entropy client-generated key reused only for retries of the same submission.
- Session/authentication context established by the server; the body does not identify an owner.

Request body contains contact fields, project details, consent evidence, cart revision/calculation references and the customer's explicit confirmation of the displayed server calculation. The exact required contact fields and privacy consent text must be finalized against PUB-05 and the approved privacy policy.

Server transaction:
1. Resolve and authorize the cart/session.
2. Lock or revision-check the cart to prevent concurrent mutation.
3. Revalidate every service, package, answer, option, dependency and quantity.
4. Recalculate from the currently active approved pricing version.
5. If the displayed calculation differs, return `PRICE_CHANGED` with the current breakdown; do not create the request.
6. If any item requires a custom quote, create the request only through the explicit quote-request path and do not store a fabricated total.
7. Atomically create the request, request item/option snapshots, price snapshot (only for fully priced items), initial event and idempotency result.
8. Return success only after commit, with a non-guessable public reference and next-step instructions.

A repeated request with the same idempotency key and identical normalized payload returns the original result. Reuse with a different payload returns `IDEMPOTENCY_KEY_REUSED`.

No payment is initiated by request submission. Payment is a later, separately approved integration.

## 6. Error envelope

```ts
type ApiError = {
  code:
    | "VALIDATION_FAILED"
    | "SERVICE_UNAVAILABLE"
    | "OPTION_UNAVAILABLE"
    | "OPTION_CONFLICT"
    | "DEPENDENCY_MISSING"
    | "QUANTITY_OUT_OF_RANGE"
    | "CONFIGURATOR_VERSION_STALE"
    | "PRICING_VERSION_STALE"
    | "PRICE_CHANGED"
    | "QUOTE_REQUIRED"
    | "CART_EXPIRED"
    | "CART_ACCESS_DENIED"
    | "IDEMPOTENCY_KEY_REUSED"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR";
  message: string;
  fieldErrors?: Array<{ path: string; code: string; message: string }>;
  correlationId: string;
  details?: Record<string, unknown>;
};
```

Error details must not include stack traces, SQL, secret values, private customer data or another customer's record existence.

## 7. Required acceptance tests

### Catalog/configurator
- Only published services, options and configurator versions are returned.
- Arabic and English labels are returned for the requested locale; missing translations follow an explicit fallback policy or fail publication validation.
- Draft, archived, conflicting or dependency-invalid options cannot be selected.
- Invalid field keys, types, choice keys, quantities and oversized payloads are rejected.
- Old configurator versions are handled deterministically and never silently interpreted as the current version.

### Pricing
- Client-supplied prices/totals/currency/tax/discount are ignored or rejected.
- Fixed, per-unit, tiered and recurring calculations use decimal-safe arithmetic.
- One-time and recurring amounts remain distinct.
- Expired calculations and pricing-version changes force recalculation and customer confirmation.
- Custom quote never displays a numeric total.
- Unconfigured tax/discount rules do not default to an invented value.

### Cart
- Cross-session and cross-account access is denied without revealing cart existence.
- Every mutation recalculates on the server.
- Stale options and price changes are returned as actionable conflicts without data loss.
- Repeated add/remove/clear retries do not duplicate side effects.
- Expired carts cannot be submitted.

### Submission
- Two concurrent submissions with one idempotency key create exactly one request.
- A changed payload with the same key is rejected.
- A price change creates no request until the customer confirms the new breakdown.
- Request, snapshots and initial event commit atomically or not at all.
- No success/reference is shown before the transaction commits.
- Anonymous tracking reveals only the minimum allowed status after separate proof of access.

## 8. Implementation gates

Do not enable configurator/cart/order mutations until all are true:
- Approved catalog/configurator data contract and publication validation.
- Server-side pricing module with unit tests and version/expiry behavior.
- Cart ownership/session mechanism and rate limits.
- Authentication/session and authorization foundations for protected paths.
- Reviewed Prisma model and migration plan in an isolated new PostgreSQL environment.
- Private file-upload path if configurator attachments are enabled.
- Request idempotency, transactional snapshots and audit/event behavior.
- API integration tests and browser tests for Arabic RTL, English LTR, mobile summary behavior and price-change confirmation.

Until then, public screens may present the service catalog and detail content, but must not imply that options, cart, prices, customer submission or tracking are operational.
