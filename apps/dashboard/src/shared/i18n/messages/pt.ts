export default {
  AuthHeader: {
    login: {
      entry: 'Novo por aqui?',
      button: 'Começar',
    },
    getStarted: {
      entry: 'Já tem uma conta?',
      button: 'Entrar',
    },
    invite: {
      entry: 'Já tem uma conta?',
      button: 'Entrar',
    },
  },
  HomePage: {
    title: 'Test - PT',
  },
  Login: {
    eyebrow: 'Entrar',
    title: 'Bem-vindo de volta.',
    subtitle: 'Retome de onde parou, seus quadros estão esperando.',
    email: {
      label: 'E-mail',
      placeholder: 'joao.silva@ordre.app',
    },
    password: {
      label: 'Senha',
      placeholder: 'Sua senha',
      forgot: 'Esqueceu?',
    },
    remember: 'Manter conectado neste dispositivo',
    submit: 'Entrar',
    submitting: 'Entrando...',
    or: 'Ou',
    magicLink: 'Enviar um link de acesso por e-mail',
    noAccount: 'Ainda não tem uma conta?',
    createOne: 'Crie uma',
    notices: {
      'password-reset': 'Sua senha foi redefinida. Entre com sua nova senha.',
      'account-exists': 'Você já tem uma conta. Entre para aceitar o convite.',
    },
  },
  GetStarted: {
    eyebrow: 'Comece agora',
    title: 'Os cadastros estão fechados por enquanto.',
    subtitle: 'Novas contas estão desativadas enquanto terminamos de construir o Ordre.',
    contact: 'Dúvidas? Fale com a gente em',
  },
  ForgotPassword: {
    eyebrow: 'Redefinir senha',
    title: 'Problemas para entrar?',
    subtitle: 'Informe seu e-mail abaixo e enviaremos um link para definir uma nova senha.',
    email: {
      label: 'E-mail',
      placeholder: 'joao.silva@ordre.app',
    },
    submit: 'Enviar link',
    submitting: 'Enviando...',
    success: {
      title: 'Confira sua caixa de entrada',
      subtitle: 'Um link para definir uma nova senha está a caminho.',
      body: 'Enviamos um e-mail para {email}, se existir uma conta com esse endereço. Pode levar alguns minutos para chegar - confira também a caixa de spam.',
    },
    remembered: 'Lembrou sua senha?',
    backToLogin: 'Entrar',
  },
  SetPassword: {
    'forgot-password': {
      eyebrow: 'Redefinir senha',
      title: 'Escolha uma nova senha.',
      subtitle: 'Quase lá - informe abaixo uma nova senha para a sua conta.',
    },
    'create-password': {
      eyebrow: 'Configurar conta',
      title: 'Crie sua senha.',
      subtitle: 'Último passo - crie uma senha para começar a usar sua conta.',
    },
    invalidLink: {
      eyebrow: 'Link expirado',
      title: 'Este link não funciona mais.',
      subtitle:
        'Os links de senha só podem ser usados uma vez e expiram uma hora depois de enviados. Solicite um novo e ele chegará à sua caixa de entrada em instantes.',
      action: 'Solicitar um novo link',
    },
    password: {
      label: 'Nova senha',
      placeholder: 'Pelo menos 8 caracteres',
    },
    confirm: {
      label: 'Confirmar senha',
      placeholder: 'Repita sua nova senha',
    },
    submit: 'Salvar senha',
    submitting: 'Salvando...',
    help: {
      entry: 'Link expirado ou com problema?',
      link: 'Solicite um novo',
    },
  },
  Invite: {
    eyebrow: 'Entrar no workspace',
    invitedBy: '<b>{name}</b> convidou você para entrar em <b>{workspace}</b>',
    /** The API leaves `invitedByName` empty when the inviting member is gone. */
    invitedByUnknown: 'Você foi convidado para entrar em <b>{workspace}</b>',
    roles: {
      owner: 'Acesso de proprietário',
      admin: 'Acesso de administrador',
      member: 'Acesso de membro',
    },
    signUp: {
      title: 'Configure sua conta.',
      subtitle: 'Você vai entrar com <mono>{email}</mono>.',
    },
    accept: {
      title: 'Aceite seu convite.',
      subtitle:
        'Você está conectado como <mono>{email}</mono>. Ao aceitar, esta conta entra no workspace.',
    },
    mismatch: {
      eyebrow: 'Conta incorreta',
      title: 'Este convite é para outra pessoa.',
      subtitle:
        'Ele foi enviado para <mono>{invited}</mono>, mas você está conectado como <mono>{current}</mono>.',
      submit: 'Sair e continuar',
      submitting: 'Saindo...',
      dashboard: 'Voltar para o dashboard',
    },
    firstName: {
      label: 'Nome',
      placeholder: 'ex.: Lucas',
    },
    lastName: {
      label: 'Sobrenome',
      placeholder: 'ex.: Marino',
    },
    password: {
      label: 'Criar senha',
      placeholder: 'Pelo menos 8 caracteres',
    },
    productNews: {
      label: 'Quero receber novidades do produto',
      description: 'Atualizações ocasionais sobre a Ordre. Cancele em qualquer uma delas.',
    },
    submit: 'Aceitar convite e continuar',
    submitting: 'Entrando no workspace...',
    terms:
      'Ao continuar, você concorda com os <terms>Termos</terms> e a <privacy>Política de Privacidade</privacy> da Ordre.',
    loading: 'Carregando convite',
    error: {
      eyebrow: 'Convite indisponível',
      title: 'Não foi possível abrir este convite.',
      action: 'Ir para o login',
    },
  },
};
