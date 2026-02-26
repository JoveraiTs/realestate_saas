# Multi-Product SaaS Architecture Plan

## 1) Target Architecture (One Backend, Multiple Product Frontends)

### Core principle
- Keep a single backend platform for all shared capabilities.
- Run separate tenant frontend apps per product vertical.

### Shared backend (single service)
Backend remains the source of truth for:
- Authentication and authorization
- Tenant lifecycle (register, approve, suspend)
- Plans, billing, and usage
- Notifications, email queue, audit logs
- Media/storage access control
- Shared account profile and organization metadata

### Product frontends (separate deployables)
- `tenant-website-next` (Real Estate)
- `tenant-website-ecommerce` (Ecommerce)
- `tenant-website-tourism` (Tourism)

Each frontend owns only product UX and product-specific screens, while consuming the same backend platform APIs plus product APIs.

### Tenant product model
- `Tenant.productType` determines the primary product experience.
- Allowed values: `realestate`, `ecommerce`, `tourism`.
- Registration is product-based and stores this at tenant creation.

## 2) Backend Module Boundaries

### Platform modules (shared)
- `auth`
- `tenant`
- `dashboard`
- `billing / plan`
- `notifications`

### Product modules (isolated)
Add product-specific routes/controllers/services:
- `product-realestate/*`
- `product-ecommerce/*`
- `product-tourism/*`

Recommended API namespace:
- `/api/platform/*` for shared capabilities
- `/api/products/realestate/*`
- `/api/products/ecommerce/*`
- `/api/products/tourism/*`

## 3) Frontend Structure Strategy

Use a monorepo-style structure to reduce duplication:

- `tenant-website-next` (real estate app)
- `tenant-website-ecommerce` (ecommerce app)
- `tenant-website-tourism` (tourism app)
- `packages/shared-ui` (design system components)
- `packages/shared-client` (API client, auth/session helpers)

Initial step can be copy-based scaffolding from `tenant-website-next`, followed by gradual extraction of shared code.

## 4) Routing & Runtime Resolution

### Resolution flow
1. User request arrives with host/subdomain.
2. Backend resolves tenant and `productType`.
3. Edge/router routes request to corresponding frontend service.

### Recommended production mapping
- `realestate` tenants -> `realestate-tenant-next.service` (port e.g. 3001)
- `ecommerce` tenants -> `realestate-tenant-ecommerce.service` (port e.g. 3002)
- `tourism` tenants -> `realestate-tenant-tourism.service` (port e.g. 3003)

Nginx uses tenant lookup (or deterministic host rule if adopted) to forward traffic to the correct frontend.

## 5) Execution Phases

## Phase 1: Platform Foundation (Done/Active)
Deliverables:
- Introduce tenant `productType`
- Product-based registration in SaaS frontend
- Backend accepts/stores/returns product type

Exit criteria:
- New tenants can register with selected product
- API responses include `productType`

## Phase 2: Product API Isolation
Deliverables:
- Create product route namespaces (`/api/products/{type}`)
- Move product-specific logic out of shared controllers
- Add middleware guard to block cross-product API access

Exit criteria:
- Real estate/ecommerce/tourism endpoints are isolated
- Shared modules remain product-agnostic

## Phase 3: Multi-Frontend Scaffolding
Deliverables:
- Scaffold `tenant-website-ecommerce`
- Scaffold `tenant-website-tourism`
- Shared auth/session bootstrap in all product frontends

Exit criteria:
- Each product frontend starts independently
- Tenant login lands in correct product frontend

## Phase 4: Edge Routing & Deployment
Deliverables:
- Add two new frontend systemd services
- Add Nginx upstreams and routing rules by tenant `productType`
- Health-check and fallback pages per product

Exit criteria:
- Production traffic routes to correct app per tenant
- Zero regression for existing real estate tenants

## Phase 5: Shared Package Extraction
Deliverables:
- Extract common UI/components into shared package
- Extract API client/session helpers into shared package
- Remove duplicated utility code from product apps

Exit criteria:
- Shared code reused by all product frontends
- Product apps contain only product-specific surfaces

## Phase 6: Monetization & Product Catalog
Deliverables:
- Product-based plan definitions and limits
- Optional add-on model for cross-product enablement
- Admin UI for product upgrades/changes

Exit criteria:
- Billing can represent product + plan cleanly
- Product switch flow is controlled and auditable

## 6) Data & Migration Notes

- Existing tenants without `productType` default to `realestate`.
- Backfill script should update historical tenant docs explicitly to avoid ambiguity.
- All analytics/reporting should include `productType` dimension for segmentation.

## 7) Security & Guardrails

- Enforce product boundary checks at API layer.
- Never trust frontend-supplied `productType` for authorization; resolve from tenant context.
- Log all product change events (who, when, old->new).

## 8) Recommended Immediate Next Sprint

Sprint scope:
1. Scaffold `tenant-website-ecommerce` and `tenant-website-tourism`.
2. Add backend product route skeletons.
3. Add Nginx + systemd staging routing for three frontend services.
4. Verify tenant routing with one test tenant per product.

Definition of done:
- Three product frontends run in parallel.
- One backend serves all three without code duplication in platform logic.
- Tenant sees correct frontend based on stored `productType`.