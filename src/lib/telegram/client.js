import 'server-only';
import { TelegramError } from './domain.js';

export function createTelegramClient({ token, fetchImpl = fetch, timeoutMs = 8000 }) {
  async function call(method, payload, posting = false) {
    if (!token) throw new TelegramError('TELEGRAM_NOT_CONFIGURED');
    let response, body;
    try {
      response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs), redirect: 'error', cache: 'no-store',
      });
      body = await response.json();
      if (!body || typeof body !== 'object' || typeof body.ok !== 'boolean') throw new Error('Malformed Telegram response');
    } catch {
      // Never retain errors containing the request URL (it contains the secret).
      throw new TelegramError(posting ? 'TELEGRAM_DELIVERY_UNCERTAIN' : 'TELEGRAM_UNAVAILABLE', { uncertain: posting });
    }
    if (!response.ok || body.ok !== true) {
      const code = body.error_code || response.status;
      if (code === 401 || code === 404) throw new TelegramError('TELEGRAM_AUTH_FAILED');
      if (code === 403) throw new TelegramError('TELEGRAM_FORBIDDEN');
      if (code === 429) throw new TelegramError('TELEGRAM_RATE_LIMITED', { retryAfter: Math.min(86400, Math.max(1, Number(body.parameters?.retry_after) || 60)) });
      if (code >= 500) throw new TelegramError(posting ? 'TELEGRAM_DELIVERY_UNCERTAIN' : 'TELEGRAM_UNAVAILABLE', { uncertain: posting });
      throw new TelegramError('TELEGRAM_REJECTED');
    }
    return body.result;
  }
  async function sendProductPost(channel, post) {
    const common = { chat_id: channel, parse_mode: post.parse_mode, reply_markup: post.reply_markup };
    if (post.photo) {
      try { return await call('sendPhoto', { ...common, photo: post.photo, caption: post.text }, true); }
      catch (error) {
        // Only a definite rejection is safe to fall back; never retry a timeout.
        if (error.code !== 'TELEGRAM_REJECTED') throw error;
      }
    }
    return call('sendMessage', { ...common, text: post.text }, true);
  }
  return {
    sendProductPost,
    async testConnection(channel) {
      const bot = await call('getMe', {});
      const chat = await call('getChat', { chat_id: channel });
      const member = await call('getChatMember', { chat_id: chat.id, user_id: bot.id });
      const canPost = member.status === 'creator' || (member.status === 'administrator' && (chat.type !== 'channel' || member.can_post_messages === true));
      if (!canPost) throw new TelegramError('TELEGRAM_FORBIDDEN');
      return { connected: true, chatId: String(chat.id), canPost: true };
    },
    sendTestMessage(channel) { return call('sendMessage', { chat_id: channel, text: 'DubaiKharid Telegram Test\nپیام آزمایشی اتصال دبی خرید؛ قابل حذف توسط مدیر کانال.' }, true); },
  };
}
