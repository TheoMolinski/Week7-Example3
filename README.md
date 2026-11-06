# Secure Frontend App Example

This is the Product SPA for Week 7, Part D. Run it locally against the deployed
Products API (the caller) from Part C: a Windows Consumption Function App using
Functions 4 and Node.js 22 in your shared Week 7 resource group. Use the worksheet
for the ordered lab; this README supports setup, access checks and recovery.

## Local Setup

Start Docker and wait for its engine to be running before opening VS Code.
Check that VS Code has the Dev Containers extension and sign in to GitHub.
Follow the Week 5–6 private-copy workflow (worksheet A2). If you already have a
private copy, continue in it and skip the clone and remote setup below.

1. In VS Code, choose **Git: Clone** from the Command Palette and enter
   `https://github.com/tpdavison/cis3039-example-security-app.git`.
2. Open the cloned folder and choose **Dev Containers: Reopen in Container**.
3. In GitHub, create an empty **private** repository named
   `cis3039-example-security-app`, without an initial README, licence or
   `.gitignore`.
4. At the repository root in the Dev Container, open Bash. Replace the
   placeholder with your new private repository's HTTPS URL, then run:

```bash
PRIVATE_REPOSITORY_URL='YOUR_PRIVATE_REPOSITORY_URL'
git remote set-url origin "$PRIVATE_REPOSITORY_URL"
git remote -v
git branch --show-current
```

Confirm that both `origin` URLs (fetch and push) name your private repository
and the branch is `main`. If either differs, correct it before continuing.
Push the existing history to your empty private repository:

```bash
git push -u origin main
```

Check that GitHub shows the project and its commit history. Keep the upstream
history when making your private copy.

Run the remaining Bash commands at this repository's root in the course Dev
Container. It uses `ghcr.io/tpdavison/devops-labs:2026-latest`, with Node.js 22
and npm. Install the versions recorded in the lockfile:

```bash
npm ci
```

Expect installation to finish successfully. If it fails, confirm you are in
the course Dev Container and keep the lockfile. Complete the shared Auth0 and
public settings setup below before starting Vite.

## Shared Auth0 and backend setup

Complete the [security backend's ordered Auth0 setup](https://github.com/tpdavison/cis3039-example-security-svc/blob/main/readme.md#auth0-setup)
through steps 1–5 first (worksheet D1–D3). Use your own free Auth0 account
established in backend step 1 and carry forward the same tenant, Products API
(`products-dev-api`), reader role, two test users and SPA registration. This
API registration represents the deployed caller; its identifier/audience is
separate from the caller's HTTP URL. Choose your own test passwords in the
Auth0 Dashboard; keep passwords and access tokens out of Git, saved commands
and screenshots.

Before switching to this repository, confirm:

- The Products API uses RS256, defines `read:products`, and has **Enable RBAC**
  switched on. Leave **Add Permissions in the Access Token** off.
- Only the reader test user has a role granting `read:products`; the second user
  has no role or direct grant of that permission.
- The deployed backend uses the same API identifier/audience and exact tenant
  issuer (including the issuer's final slash). After editing its hard-coded
  constants, rebuild and republish it as in backend step 4.
- One **Single Page Application** is registered in that tenant with the test
  users' database connection enabled. Its **Allowed Callback URLs**,
  **Allowed Logout URLs** and **Allowed Web Origins** include
  `http://localhost:5173`.
- The deployed backend separately permits `http://localhost:5173` in its Azure
  CORS list, as in worksheet D3. Auth0's origin settings do not configure backend
  CORS. CORS and HTTPS do not authorise users.

The flow is **role → API permissions → requested/granted scope → backend check**.
The SPA requests `openid profile email read:products`; the backend checks granted
`scope`, without requiring an optional `permissions` claim. Signing in alone
therefore does not grant access to prices. See the official
[RBAC guidance](https://auth0.com/docs/get-started/apis/enable-role-based-access-control-for-apis)
and [Vue SDK setup](https://auth0.github.io/auth0-vue/).

The SDK uses Authorization Code with PKCE and its default in-memory session
behaviour. This example does not configure persistent `localStorage` or refresh
tokens. If session restoration or token acquisition fails, the app shows an
error and asks you to sign in again; it never silently retries as anonymous.

### Configure and run the SPA

After `npm ci` succeeds, copy the public example settings in **this SPA
repository's course Dev Container**. If `.env.local` already exists, skip the
copy and edit that file instead:

```bash
cp .env.example .env.local
```

Edit `.env.local` using the values from the shared setup:

```dotenv
VITE_AUTH0_DOMAIN=YOUR_ACTUAL_AUTH0_DOMAIN
VITE_AUTH0_CLIENT_ID=YOUR_SPA_CLIENT_ID
VITE_AUTH0_AUDIENCE=YOUR_PRODUCTS_API_IDENTIFIER
VITE_API_BASE_URL=https://YOUR_CALLER_HOSTNAME/api
```

Use the tenant domain without `https://` or a trailing slash, the existing
SPA's client ID and the exact Products API identifier. The audience is an Auth0
identifier, separate from the backend HTTP address. All `VITE_*` values are
public and embedded in the browser build. Keep client secrets, Function App
host keys and bearer tokens out of this file. Follow Week 5 for assessment
configuration practice.

For `VITE_API_BASE_URL`, use the caller's recorded `SECURITY_API_BASE_URL` from
Part C: `https://` followed by its actual hostname and `/api`, without a
trailing slash or `/products` suffix. The SPA appends `/products` itself.
Use the hostname returned by the caller README's lookup; do not construct it
from the app name.

If you need to repeat that lookup in this Dev Container, sign in and list
your Azure subscriptions:

```bash
az login --use-device-code
az account list --query '[].{Name:name,Id:id,IsDefault:isDefault}' --output table
```

If the current selection differs from your Azure subscription for the lab,
enter its ID from the list and select it:

```bash
WEEK7_SUBSCRIPTION_ID='YOUR_SUBSCRIPTION_ID'
az account set --subscription "$WEEK7_SUBSCRIPTION_ID"
```

Confirm the active subscription before continuing:

```bash
az account show --query '{Name:name,Id:id}' --output table
```

Enter the caller app name from C3 and the same shared group name from B2
(for example, `caller-lab-YOUR_UID-func` and `week7-lab-YOUR_UID-rg`, using your
chosen identifier). Display the hostname directly:

```bash
SECURITY_APP_NAME='YOUR_CALLER_APP_NAME'
WEEK7_RESOURCE_GROUP='YOUR_WEEK7_RESOURCE_GROUP'
az functionapp show \
  --name "$SECURITY_APP_NAME" \
  --resource-group "$WEEK7_RESOURCE_GROUP" \
  --query defaultHostName --output tsv
```

If the lookup fails, is blank or returns `None`, check the app name, shared
group and selected subscription, then repeat it. Enter the returned hostname
in `.env.local`'s API base URL before starting Vite:

```bash
npm run dev
```

Expect Vite to report [http://localhost:5173](http://localhost:5173). Open the
browser Network panel before loading the page, as described below. Vite listens
on all interfaces for Dev Container access and keeps port 5173; if it is busy,
stop the other process using that port and run the command again. Restart Vite
after changing `.env.local`.

### Verify access and authentication transitions

Open the browser's developer tools and select **Network**, then load
[http://localhost:5173](http://localhost:5173). If already signed in, sign out
before starting. For each browser check, select the matching
`GET /api/products` request and read its status and **Response** JSON before
moving on. Keep credentials and request headers out of screenshots. The same
backend route serves public and protected reads; the backend enforces price
access.

| Request | Backend result | SPA result |
| --- | --- | --- |
| Signed out; no bearer token | `200`, `pricePence: null` in JSON | Public products with price placeholders. |
| Direct invalid bearer token request | `401`, no Product data | Direct API check in the terminal. |
| Sign in as the user without `read:products` | `403`, no Product data | Permission-denied message. |
| Sign out, then sign in as the reader with granted `read:products` | `200`, including prices | Products with prices. |

For the direct invalid-token case, use the caller's actual `/api` base URL
from Part C, as in step 6 of the
[backend Auth0 setup](https://github.com/tpdavison/cis3039-example-security-svc/blob/main/readme.md#6-verify-the-token-and-permission-states):

```bash
SECURITY_API_BASE_URL='https://YOUR_CALLER_HOSTNAME/api'
curl -i "${SECURITY_API_BASE_URL}/products" \
  -H 'Authorization: Bearer deliberately-invalid-token'
```

Read the status and response body in the terminal. Keep real tokens out of
commands, screenshots and repository files.

Finally, sign out of the reader account. Confirm the restricted view clears
and the returned signed-out page shows public products with price placeholders.
Inspect the latest response JSON: prices are `null` again. You should observe
both `200` responses and the distinct `401` and `403` denials.

If a result differs, use worksheet D6 and these checks:

- **Sign-in failure:** check the tenant domain, SPA client ID, enabled test-user
  connection and exact `http://localhost:5173` callback/logout/origin settings.
- **Failed request or `404`:** check the actual `/api/products` request URL and
  the deployed backend's CORS origin. Check Auth0's origin settings separately.
- **`401` for a user token:** check the backend's issuer, API audience and token
  expiry. The SDK must request an API access token for the Products API.
- **Unexpected `403` for the reader:** check the role's API permission, the
  audience and the requested `read:products` scope. After a role or permission
  change, sign out and sign back in to obtain a newly issued token.
- **`503`:** check the backend token-verification configuration and signing-key
  availability. This is an operational failure, separate from invalid credentials.
- **Session or token-acquisition error:** sign out and sign in again. For API
  availability errors, restore the backend and select **Retry**. Errors remain
  visible without stale prices or an anonymous fallback.

### Trace the access decision

Follow worksheet D4 through the source:

1. In `src/config/composition-root.ts`, find the audience and requested
   `openid profile email read:products` scopes.
2. In `src/composables/use-products.ts`, find where the SDK supplies an access
   token for signed-in requests. In `src/infra/http-product-service.ts`, find
   where it becomes the bearer header.
3. In the backend repository, follow `src/functions/list-products-http.ts` and
   `src/config/composition-root.ts` to JWT verification, then find the granted
   scope check in `src/app/list-products.ts`.

Use this path to explain why a signed-in user can receive `403`: signing in
establishes identity, while the backend checks permission to receive prices.

The example demonstrates public catalogue data and permission-dependent prices.
It does not implement assessment staff-only actions, ownership rules or
reservation safeguards. Map these examples into the existing Stage 2 plan and
diagrams; this repository adds no assessment deliverable or Week 7 coding task.

### Retain the setup and clean up

Keep the shared backend, receiver and Auth0 setup until the receiver, caller
and SPA checks are complete. Then stop Vite and any local Functions hosts with
**Ctrl+C**. Follow worksheet Part F for the single shared Azure group clean-up,
clearing key variables in every shell where they were set, and removing only
disposable Auth0 items. Keep resources needed for other work.

## Reference: production build and hosting

The Week 7 route uses the local SPA with the deployed backend. For an optional
production build, run:

```bash
npm run build
```

This checks TypeScript and creates `dist/`. If the build fails, resolve the
reported errors before previewing or uploading it. To preview a successful build:

```bash
npm run preview -- --host 0.0.0.0
```

Vite embeds public environment settings at build time. Rebuild after changing
them, then upload the contents of `dist/` using the Week 5 hosting workflow.
Production hosting must serve `index.html` for client-side routes because this
SPA uses history routing. Add the actual deployed SPA HTTPS origin to Auth0's
callback, logout and web-origin lists and, separately, to the backend's Azure
CORS list. Retain localhost settings if still using the local SPA.

`npm run type-check` checks types separately; `npm run format` formats source
files with the project's Prettier preferences.

## Reference: how the project was made

```bash
npm create vue@3 . -- \
  --force \
  --bare \
  --typescript \
  --router \
  --prettier
```

Restore any deleted devcontainer configuration:

```bash
git restore .devcontainer/devcontainer.json
```

Add extensions to devcontainer:

- `"esbenp.prettier-vscode"`,
- `"Vue.volar"`

Update preferences in `.prettierrc.json`:

- `"semi": true`
- `"singleQuote": true`
- `"printWidth": 80`

## Reference: product listing and local backend

The baseline SPA reads products from an existing HTTP service; it does not add product
editing, storage, automatic retries or a fake-data mode.

For an optional local-backend route, start the caller using its README and
edit the existing `.env.local` API base URL, retaining the shared Auth0 settings:

```env
VITE_API_BASE_URL=http://localhost:7071/api
```

`/products` is appended to this path. Use `/api` without a trailing slash, as
in the guided deployed-backend setup. If the setting is absent, the intentional
default is the local Functions host shown above. An explicitly blank or invalid
value fails startup; only absolute HTTP(S) URLs without credentials, query
strings or fragments are accepted.

Restart Vite after changing environment files. Vite embeds these **public,
build-time** settings in `dist/`; deployment changes require a rebuild. Never put
server credentials or function keys in browser settings. Local environment files
are ignored; `.env.example` contains only public placeholders.

The existing service contract is a bare JSON array, for example:

```json
[
  { "id": "p1", "name": "Notebook", "pricePence": 399 },
  { "id": "p2", "name": "Pen", "pricePence": null }
]
```

IDs must be unique, non-blank strings; names must be non-blank strings. Prices
may be absent or null, or a non-negative safe integer in pence. Descriptions are
optional strings. Additional service fields are ignored. Missing prices display
as a placeholder; the browser does not calculate which prices a caller may see.
An invalid list or record is an operational failure, never an empty-list success.
Network and HTTP failures show a safe message and a manual Retry button. Each
refresh clears previous data; failures display an error without stale prices.
The display preserves service order and makes no sorting or pagination promise.

| File | Responsibility |
| --- | --- |
| `src/domain/product.ts` | Read-only product list projection, without Vue or wire concerns. |
| `src/app/product-service.ts`, `list-products.ts` | Service port and ordinary use-case function with explicit dependencies. |
| `src/infra/http-product-service.ts` | HTTP request, status handling and validation of unknown JSON. |
| `src/config/composition-root.ts` | Resolve public environment settings and assemble the product service and Auth0 plugin. |
| `src/composables/products-key.ts`, `use-products.ts` | Typed injection, use-case calls, loading and safe errors. |
| `src/main.ts`, `src/views/Products.vue` | Bootstrap dependencies/startup feedback and render UI state. |

The Auth0 integration acquires an access token only for signed-in requests and
passes it through the service port. Session failures stop the request. The HTTP adapter attaches the bearer
header; it does not acquire tokens or make authorisation decisions.
