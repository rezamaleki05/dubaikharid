# Owner lead notifications

## Actual sources and event boundaries

| Customer action | Persistence | Notification boundary |
| --- | --- | --- |
| Home calculator → purchase request modal | PurchaseRequest + Customer | POST `/api/purchase-requests`, newly committed record only |
| Product page enquiry / final-price request | PurchaseRequest + Customer | Same route |
| Profile purchase-request form | PurchaseRequest + Customer | Same route |
| External-product checkout | PurchaseRequest + Customer | Same route |
| Cart, Product or laptop checkout | Order + items/payments/reservations | POST `/api/orders`, newly committed record only |
| Profile request payment / conversion | Existing lead converted to Order | Follow-up to original lead; no duplicate new-lead notification |
| Profile support ticket | Not connected; displays explanatory notice | No server event |
| Footer/Profile/manual-payment WhatsApp, email/phone contact links | Outbound links only | No server event |

There is no persisted Contact/callback form. The central formatter supports a contact-shaped event and tests it, but no new contact route or fake lead source was added. Reviews, sign-in, address changes, tracking and payment uploads are not new lead events.

## Delivery and privacy

`scheduleOwnerLeadNotification` uses Next `after` after a committed customer submission. Existing database idempotency determines `created`; replays and uniqueness-race recovery do not send again. Notification work does not run inside the business transaction. Telegram and WhatsApp run independently with sanitized outcomes. No provider failure is returned to the customer.

This is best-effort delivery, with no durable queue or automatic retries. A terminated runtime can lose a notification. Uncertain sends are never retried blindly. One separate genuine customer submission with a new idempotency key is a new event. Admin activity records contain provider status/code only, without customer content, destinations, tokens or provider error strings. No notification-history migration is needed.

Product publishing remains on `telegramChannel` (the configured product channel, intended `@dubaikharid`) and its existing `TelegramPublication` records. Lead notifications read only `LEAD_SETTING_KEYS`, never `telegramChannel`, and never create `TelegramPublication`.

## Telegram owner setup

1. Keep the existing server-only `TELEGRAM_BOT_TOKEN`.
2. Owner opens the existing bot and presses Start.
3. Obtain the owner's positive numeric private Chat ID from a trusted account-information tool, or inspect private updates using Bot API `getUpdates` in a secure server tool. Never paste the token into a browser URL, client bundle, screenshot or logs. Match the update to the owner; do not use a group/channel ID or `@username`.
4. Admin Settings → Notifications → **اعلان لیدها**: enter `telegramLeadChatId`, enable `telegramLeadsEnabled`, save only lead settings.
5. When explicitly approved for a later Production rollout, set the server send gate `TELEGRAM_ALLOW_SEND=true`. This implementation does not change any environment. Product publishing still has its own enable flags.
6. “بررسی چت شخصی” calls `getChat`, requires `type=private` and exact matching ID, and sends no message. Sending also verifies the private chat. Test messages require a separate confirmation and use synthetic content only.

## WhatsApp owner setup

Use only official Meta WhatsApp Cloud API. Configure server secrets `WHATSAPP_CLOUD_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, a supported `WHATSAPP_GRAPH_API_VERSION`, and—only after later explicit rollout approval—`WHATSAPP_ALLOW_SEND=true`. Credentials are never stored in Settings or returned to Admin.

Owner must opt in to receiving notifications. Configure their separate `whatsappLeadRecipient` in E.164, `whatsappLeadTemplate`, and exact approved `whatsappLeadTemplateLanguage`. Enable `whatsappLeadsEnabled` only when ready. `supportWhatsapp`, generic WhatsApp, footer and manual-payment links remain untouched.

Create a Meta-approved template with exactly eight **positional body text parameters**, no dynamic header or button parameters:

1. Lead type
2. Customer name
3. Phone/email
4. Product/items/order reference
5. Amount, with currency; missing amount is “—”
6. Message
7. Source + safe Admin/Product link
8. Timestamp

Suggested body: “لید جدید دبی‌خرید. نوع: {{1}}. نام: {{2}}. تماس: {{3}}. محصول/سفارش: {{4}}. مبلغ: {{5}}. پیام: {{6}}. منبع: {{7}}. زمان: {{8}}.” Obtain Meta approval for the exact intended purpose/category and locale; saving a template name does not verify approval. No free-form fallback exists, even during a conversation window.

Meta requires approved templates to initiate conversations or send outside the 24-hour customer-service window: [official messaging policy](https://whatsappbusiness.com/policy/). Payload structure follows [Meta's official Cloud API collection](https://www.postman.com/meta/whatsapp-business-platform/overview).

Missing token, phone-number ID, API version, template or locale produces `WHATSAPP_NOT_CONFIGURED` when enabled. Telegram continues independently. The send gate must also allow the Production environment. A provider acceptance is not proof of final WhatsApp delivery; verify in the destination/provider tooling.

## QA / rollout

Tests inject mock transports and synthetic events. Local and Preview sends are always blocked, even with inherited Production credentials. Do not enable Telegram, alter Production environment/data, send real messages, deploy, run migrations, or seed Production while reviewing this branch. Existing Settings hold non-secret configuration; all defaults are off. Production deployment and owner setup are separate future steps.
