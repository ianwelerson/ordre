import type { ErrorCode } from '../../errors/index.ts';

/**
 * User-facing copy for every code in the catalog, keyed by the code itself.
 *
 * No mapping table anywhere: a consumer renders `t(`errors.${error.code}`)` and
 * is done. The code is the key precisely so there is nothing to keep in sync.
 *
 * This is not a duplicate of the `message` in `@ordre/core/errors`. That one is
 * developer-facing - it goes on the wire and into the OpenAPI reference, and for
 * the Better Auth mirror it is kept verbatim so reverse lookups work. This one
 * is what a person reads.
 *
 * Typed as `Record<ErrorCode, string>`: adding a code in core breaks this file,
 * in every locale, until someone writes words for it.
 */
export const errors: Record<ErrorCode, string> = {
  INTERNAL_ERROR: 'Algo deu errado. Tente novamente.',
  UNAUTHORIZED: 'Sua sessão terminou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para fazer isso.',
  USER_NOT_FOUND: 'Não encontramos uma conta com esses dados.',
  FAILED_TO_CREATE_USER: 'Não conseguimos criar sua conta. Tente novamente.',
  FAILED_TO_UPDATE_USER: 'Não conseguimos salvar suas alterações. Tente novamente.',
  INVALID_USER: 'Não conseguimos verificar sua conta.',
  USER_EMAIL_NOT_FOUND: 'Não encontramos uma conta com esse e-mail.',
  USER_ALREADY_EXISTS: 'Já existe uma conta com esse e-mail.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Já existe uma conta com esse e-mail. Tente outro.',
  USER_ALREADY_HAS_PASSWORD: 'Sua conta já tem uma senha. Informe-a para continuar.',
  ACCOUNT_NOT_FOUND: 'Não encontramos essa conta.',
  CREDENTIAL_ACCOUNT_NOT_FOUND: 'Não encontramos uma conta com senha definida.',
  FAILED_TO_UNLINK_LAST_ACCOUNT: 'Você não pode desvincular seu último método de acesso.',
  LINKED_ACCOUNT_ALREADY_EXISTS: 'Essa conta já está vinculada.',
  SOCIAL_ACCOUNT_ALREADY_LINKED: 'Essa conta já está vinculada a outro usuário.',
  FAILED_TO_CREATE_SESSION: 'Não conseguimos entrar. Tente novamente.',
  FAILED_TO_GET_SESSION: 'Não conseguimos verificar sua sessão. Entre novamente.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente.',
  SESSION_NOT_FRESH: 'Confirme sua senha para continuar.',
  INVALID_PASSWORD: 'Essa senha não está correta.',
  INVALID_EMAIL: 'Informe um endereço de e-mail válido.',
  INVALID_EMAIL_OR_PASSWORD: 'Esse e-mail e senha não conferem.',
  PASSWORD_TOO_SHORT: 'Essa senha é muito curta.',
  PASSWORD_TOO_LONG: 'Essa senha é muito longa.',
  PASSWORD_ALREADY_SET: 'Sua conta já tem uma senha definida.',
  EMAIL_NOT_VERIFIED: 'Verifique seu e-mail antes de continuar.',
  EMAIL_CAN_NOT_BE_UPDATED: 'Esse e-mail não pode ser alterado.',
  CHANGE_EMAIL_DISABLED: 'Alterar o e-mail não está disponível.',
  EMAIL_ALREADY_VERIFIED: 'Esse e-mail já foi verificado.',
  EMAIL_MISMATCH: 'Esse e-mail não confere.',
  VERIFICATION_EMAIL_NOT_ENABLED: 'A verificação de e-mail não está disponível.',
  FAILED_TO_CREATE_VERIFICATION: 'Não conseguimos enviar o e-mail de verificação. Tente novamente.',
  PROVIDER_NOT_FOUND: 'Esse método de acesso não está disponível.',
  INVALID_TOKEN: 'Este link não é válido. Solicite um novo.',
  TOKEN_EXPIRED: 'Este link expirou. Solicite um novo.',
  ID_TOKEN_NOT_SUPPORTED: 'Esse método de acesso não é suportado.',
  FAILED_TO_GET_USER_INFO: 'Não conseguimos ler seu perfil nesse provedor.',
  INVALID_ORIGIN: 'Esta solicitação veio de um endereço que não reconhecemos.',
  MISSING_OR_NULL_ORIGIN: 'Esta solicitação veio de um endereço que não reconhecemos.',
  INVALID_CALLBACK_URL: 'Esse endereço de retorno não é permitido.',
  INVALID_REDIRECT_URL: 'Esse endereço de retorno não é permitido.',
  INVALID_ERROR_CALLBACK_URL: 'Esse endereço de retorno não é permitido.',
  INVALID_NEW_USER_CALLBACK_URL: 'Esse endereço de retorno não é permitido.',
  CALLBACK_URL_REQUIRED: 'É necessário informar um endereço de retorno.',
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
    'Por segurança, este acesso foi bloqueado. Tente novamente pela página de login.',
  METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED: 'Algo deu errado. Tente novamente.',
  INVALID_INPUT: 'Algumas informações que você preencheu não são válidas.',
  VALIDATION_ERROR: 'Algumas informações que você preencheu não são válidas.',
  MISSING_FIELD: 'Este campo é obrigatório.',
  FIELD_NOT_ALLOWED: 'Este campo não pode ser definido.',
  BODY_MUST_BE_AN_OBJECT: 'Algo deu errado. Tente novamente.',
  ASYNC_VALIDATION_NOT_SUPPORTED: 'Algo deu errado. Tente novamente.',
  WORKSPACE_NOT_FOUND: 'Não encontramos o workspace que você procura.',
  WORKSPACE_CREATE_FAILED: 'Algo deu errado ao criar seu workspace. Tente novamente.',
  WORKSPACE_SLUG_ALREADY_EXISTS: 'Este nome já está em uso.',
  WORKSPACE_SLUG_RESERVED: 'Este nome é reservado. Escolha outro.',
  WORKSPACE_SLUG_PROTECTED:
    'Este nome é reservado. Se ele pertence à sua organização, entre em contato conosco.',
  WORKSPACE_SLUG_BANNED: 'Este nome não está disponível. Escolha outro.',
  LOCATION_NOT_FOUND: 'Não encontramos o local que você procura.',
  LOCATION_CREATE_FAILED: 'Algo deu errado ao criar o local. Tente novamente.',
  LOCATION_MEMBER_ASSIGN_FAILED: 'Algo deu errado ao vincular o membro ao local. Tente novamente.',
  LOCATION_IS_DEFAULT: 'Você não pode excluir seu local padrão.',
  MEMBER_NOT_FOUND: 'Não encontramos o membro que você procura.',
  MEMBER_ALREADY_EXISTS: 'Já existe um membro com este e-mail no workspace.',
  MEMBER_LAST_OWNER:
    'Um workspace precisa de pelo menos um proprietário. Defina outro proprietário antes.',
  MEMBER_TARGET_SUSPENDED: 'Você não pode alterar o papel de um membro suspenso.',
  MEMBER_SELF_SUSPENDED: 'Seu acesso a este workspace foi suspenso.',
  MEMBER_SELF_ROLE_UPDATE: 'Você não pode alterar seu próprio papel.',
  MEMBER_SELF_REMOVE: 'Você não pode remover a si mesmo do workspace.',
  MEMBER_OWNER_ROLE_FORBIDDEN:
    'Apenas um proprietário pode atribuir ou alterar o papel de proprietário.',
  MEMBER_REMOVE_FORBIDDEN: 'Você só pode remover membros, não proprietários ou administradores.',
  INVITE_NOT_FOUND: 'Não encontramos o convite que você procura.',
  INVITE_CREATE_FAILED: 'Algo deu errado ao criar o convite. Tente novamente.',
  INVITE_ALREADY_PENDING: 'Já existe um convite pendente para este e-mail.',
  INVITE_EMAIL_MISMATCH: 'Este convite foi enviado para outro endereço de e-mail.',
  PLAN_MISSING:
    'Não encontramos um plano ativo para este workspace. Entre em contato com o suporte.',
  PLAN_ENTITLEMENTS_INVALID:
    'Não conseguimos ler os limites do seu plano. Entre em contato com o suporte.',
  PLAN_LOCATION_LIMIT_REACHED: 'Você atingiu o número máximo de locais permitido no seu plano.',
  PLAN_SEAT_LIMIT_REACHED:
    'Você usou todas as vagas do seu plano. Convites pendentes também ocupam vagas.',
  NETWORK_ERROR: 'Não conseguimos alcançar o servidor. Verifique sua conexão e tente novamente.',
  MALFORMED_RESPONSE: 'Recebemos uma resposta inesperada do servidor. Tente novamente.',
  UNKNOWN_ERROR: 'Algo deu errado. Tente novamente.',
  FEATURE_LOGIN_DISABLED: 'No momento não é possível entrar. Tente novamente mais tarde.',
  FEATURE_REGISTRATION_DISABLED: 'No momento não estamos aceitando novas contas. Volte em breve.',
  FEATURE_WORKSPACE_CREATION_DISABLED:
    'No momento não estamos aceitando novos workspaces. Volte em breve.',
  FEATURE_WORKSPACE_LOCATION_DISABLED:
    'No momento não é possível adicionar novas localizações. Tente novamente mais tarde.',
  FEATURE_WORKSPACE_INVITE_DISABLED:
    'No momento não é possível convidar novos membros. Tente novamente mais tarde.',
};
