/**
 * Structured messages for game logic.
 *
 * Pure engine code must not hold user-visible English. Instead it returns a
 * `Message` (a key plus parameters), and the browser shell formats it with the
 * active locale. A parameter may itself be a `Message`, which is how a nested
 * noun such as a beacon name stays translatable:
 *
 *   message('beacon.selected', { name: message('beacon.type.cross') })
 *
 * Browser-safe. Engines import only the types and `message()`.
 */

import { t, type MessageKey, type MessageParams } from './messages';
import type { Locale } from './config';

export type MessageParam = string | number | Message;

export interface Message {
  readonly key: MessageKey;
  readonly params?: Readonly<Record<string, MessageParam>>;
}

export function message(key: MessageKey, params?: Readonly<Record<string, MessageParam>>): Message {
  return params ? { key, params } : { key };
}

/** Render a message (and any nested messages) into plain text for `locale`. */
export function formatMessage(locale: Locale, value: Message): string {
  if (!value.params) return t(locale, value.key);
  const resolved: Record<string, string | number> = {};
  for (const [name, param] of Object.entries(value.params)) {
    resolved[name] = typeof param === 'object' ? formatMessage(locale, param) : param;
  }
  return t(locale, value.key, resolved as MessageParams);
}
