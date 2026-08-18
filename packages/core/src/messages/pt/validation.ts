import type { ValidationKey } from '../../schemas/index.ts';

/**
 * Copy for every key the shared Zod error map produces (see
 * `error-map.ts` in `@ordre/core/schemas`). Schemas carry no messages of their
 * own, so this is where a validation failure gets its words - in the browser for
 * a form, and in the OpenAPI reference for the published spec.
 *
 * Typed as `Record<ValidationKey, string>`: adding a key in core breaks this
 * file, in every locale, until someone translates it.
 *
 * Keys carry no parameters, so `tooShort` cannot say "at least 8 characters". A
 * rule that needs the number passes its own key - `z.string().min(8,
 * 'validation.passwordTooShort')` - and adds it below.
 */
export const validation: Record<ValidationKey, string> = {
  required: 'Este campo é obrigatório.',
  invalidType: 'Este valor não está no formato esperado.',
  invalidFormat: 'Este valor não está no formato esperado.',
  invalid: 'Este valor não é válido.',
  email: 'Informe um endereço de e-mail válido.',
  url: 'Informe uma URL válida.',
  uuid: 'Informe um identificador válido.',
  datetime: 'Informe uma data e hora válidas.',
  date: 'Informe uma data válida.',
  time: 'Informe um horário válido.',
  ipv4: 'Informe um endereço IPv4 válido.',
  ipv6: 'Informe um endereço IPv6 válido.',
  regex: 'Este valor não está no formato esperado.',
  tooShort: 'Este valor é muito curto.',
  tooLong: 'Este valor é muito longo.',
  invalidOption: 'Escolha uma das opções disponíveis.',
  invalidNumber: 'Informe um número válido.',
  unknownField: 'Este campo não é reconhecido.',
};
