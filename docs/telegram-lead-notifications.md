# Private Telegram lead group

Base: 3674a8b8a6ce37a27be0767b7ee5f3eb936952ba. Separate from the owner-DM/WhatsApp branch.

## Real sources
- Calculator → QuickPurchaseRequestModal, Product enquiry/final-price request, Profile purchase request, external-product checkout: POST /api/purchase-requests persists PurchaseRequest and Customer.
- Cart/Product/laptop checkout: POST /api/orders persists Order and related commerce records.
- Payment conversion of an existing purchase request is a follow-up, not another new lead.
- Profile support tickets are not connected; WhatsApp/email/phone links are outbound only. No persisted Contact/callback route exists. Do not invent events for these.

## Configuration and separation
Existing Settings store only telegramLeadEnabled (default false) and telegramLeadChatId (default empty). Group IDs are negative numeric strings within Telegram's 52-bit range, including -100 supergroup IDs. No real group ID is hardcoded. Tokens remain in server-only TELEGRAM_BOT_TOKEN.

Products retain telegramChannel, intended @dubaikharid, existing product enable flags and TelegramPublication. Leads read only the two lead keys and never create TelegramPublication. No WhatsApp configuration or migration is added.

Before each lead send, getChat must return the matching group/supergroup without a public username, active usernames, direct-message identity or linked channel. getMe/getChatMember verifies the bot is permitted to send; normal members need default send permission, restricted members need explicit permission, administrators/creators are accepted. Channels and private user DMs are refused. Group privacy and membership remain an owner's operational responsibility; changing them after verification cannot be made atomic with sending.

Reference: [official Telegram Bot API](https://core.telegram.org/bots/api#chatfullinfo).

## Event and failure behavior
The centralized server service uses Next after once the authoritative customer record commits. Existing idempotency/created results skip replays and unique-key race recovery. Frontends never trigger sends. Provider or logging failures do not fail customer submission. Persian HTML content is escaped, bounded and contains only relevant persisted fields and safe Product/Admin links.

Delivery is best effort, with no durable queue or automatic retry. Runtime termination may lose an event. A genuinely separate submission/new idempotency key creates another event. Uncertain delivery is never retried blindly. Activity records contain only sanitized status/code, no lead content, destination or secret.

## Protected Admin actions
Settings → Notifications → اعلان لیدها در تلگرام is distinct from کانال تلگرام محصولات.
Save updates only the two lead settings. GET configuration requires SETTINGS_VIEW; verify/test POST requires SETTINGS_EDIT, same-origin checks and saved configuration only. Test sends require confirmation and use synthetic fixed-purpose content. Verify sends no message. API responses contain no token or provider error strings.

Both automatic and test delivery require VERCEL_ENV=production and TELEGRAM_ALLOW_SEND=true explicitly. Local/Preview cannot send, even with inherited credentials. QA mocks transport only, using fake IDs and an isolated local database; no real Telegram requests.

## Owner setup after deployment approval
The owner already created «مشتری های دبی خرید» and added the bot. During a later approved rollout, enter its real numeric ID in Admin (never source code), save, enable telegramLeadEnabled, and approve TELEGRAM_ALLOW_SEND=true separately. Verify group connection, then explicitly confirm a synthetic test. Keep the group private and restrict membership to the authorized team. No Production settings/env are changed in this implementation phase.
