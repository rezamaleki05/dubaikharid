import 'server-only';

export function createWhatsappLeadClient({ token, phoneNumberId, version, fetchImpl = fetch, timeoutMs = 8000 }) {
  return {
    async sendTemplate(configuration, parameters) {
      if (!token || !/^[1-9]\d{4,30}$/.test(phoneNumberId || '') || !/^v\d+\.\d+$/.test(version || '')) {
        throw Object.assign(new Error('Not configured'), { code: 'WHATSAPP_NOT_CONFIGURED' });
      }
      let response, body;
      try {
        response = await fetchImpl(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual',
            to: configuration.recipient.slice(1), type: 'template',
            template: { name: configuration.template, language: { code: configuration.language },
              components: [{ type: 'body', parameters }] } }),
          signal: AbortSignal.timeout(timeoutMs), redirect: 'error', cache: 'no-store',
        });
        body = await response.json();
      } catch {
        throw Object.assign(new Error('Delivery uncertain'), { code: 'WHATSAPP_DELIVERY_UNCERTAIN' });
      }
      if (!response.ok) {
        throw Object.assign(new Error('Provider failure'), {
          code: response.status >= 500 ? 'WHATSAPP_DELIVERY_UNCERTAIN' : 'WHATSAPP_REJECTED',
        });
      }
      if (!body?.messages?.[0]?.id) throw Object.assign(new Error('Delivery uncertain'), { code: 'WHATSAPP_DELIVERY_UNCERTAIN' });
      return { accepted: true };
    },
  };
}
