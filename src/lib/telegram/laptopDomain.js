import { telegramConfiguration } from './domain.js';
// The shared transport guard reads only the catalog channel. Lead settings are never inputs.
export function laptopTelegramConfiguration(settings, env) {
  return { ...telegramConfiguration(settings, env), autoPublish: settings.telegramAutoPublishLaptops === true };
}
