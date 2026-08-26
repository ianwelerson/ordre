import type { EmailMessages } from '../../types/email.ts';

/**
 * Copy for every transactional email, keyed by the block the template renders.
 *
 * Placeholders are ICU and name variables the delivery declares in
 * `OUTBOX_PAYLOAD_SCHEMAS`, so a template can only interpolate something its
 * payload actually carries.
 *
 * Typed as `EmailMessages`: adding a message in core breaks this file, in every
 * locale, until someone writes words for it.
 */
export const emails: EmailMessages = {
  shared: {
    help: 'Central de ajuda',
    privacy: 'Privacidade',
  },
  accountCreated: {
    subject: 'Bem-vindo à Ordre',
    preview: 'Comece a usar sua conta Ordre e compartilhe o andamento dos serviços.',
    category: 'Conta',
    eyebrow: 'Bem-vindo à oficina',
    heading: 'Bem-vindo à Ordre, {user_name}',
    body: 'Sua conta está pronta. A Ordre dá a cada serviço um quadro de status privado que você compartilha com um único link - o cliente acompanha o trabalho em tempo real, sem baixar aplicativo e sem criar conta. Só o link.',
    action: 'Entrar na Ordre',
    note: 'Você entrou como {user_email}.',
    disclaimer:
      'Você recebeu este e-mail porque uma conta Ordre foi criada com {user_email}. Se não foi você, pode ignorar esta mensagem - a conta fica bloqueada até que uma senha seja definida.',
    stepsLabel: 'Primeiros passos',
    steps: [
      {
        title: 'Configure seu espaço de trabalho',
        body: 'Dê um nome à sua oficina, escolha seu ramo e convide sua equipe quando quiser.',
      },
      {
        title: 'Crie seu primeiro quadro',
        body: 'Escolha um modelo que combine com o serviço e preencha os detalhes. Leva um minuto.',
      },
      {
        title: 'Compartilhe o link',
        body: 'Envie por SMS, e-mail ou WhatsApp. Publique atualizações conforme o trabalho avança - seu cliente apenas acompanha.',
      },
    ],
  },
  verifyEmail: {
    subject: 'Confirme seu e-mail',
    preview: 'Confirme seu e-mail para concluir a configuração da sua conta Ordre.',
    category: 'Verificação',
    eyebrow: 'Uma conferida rápida',
    heading: 'Confirme seu e-mail.',
    body: 'Vamos confirmar que esta caixa de entrada é sua. Clique no botão abaixo para verificar {user_email} e concluir a configuração da sua conta Ordre.',
    action: 'Verificar e-mail',
    note: 'Este link expira em 1 hora. Se o botão não funcionar, copie e cole este endereço no seu navegador:',
    disclaimer:
      'Você recebeu este e-mail porque alguém informou {user_email} ao se cadastrar na Ordre. Não foi você? Pode ignorar esta mensagem - o endereço não será verificado e nenhuma conta será criada sem este passo.',
  },
  resetPassword: {
    subject: 'Redefina sua senha da Ordre',
    preview: 'Redefina sua senha da Ordre para voltar a acessar sua conta.',
    category: 'Segurança',
    eyebrow: 'Redefinição de senha',
    heading: 'Redefina sua senha.',
    body: 'Recebemos um pedido para redefinir a senha de {user_email}. Clique no botão abaixo para escolher uma nova senha e voltar à sua conta Ordre.',
    action: 'Redefinir senha',
    note: 'Este link expira em 1 hora e só pode ser usado uma vez. Se o botão não funcionar, copie e cole este endereço no seu navegador:',
    disclaimer:
      'Você recebeu este e-mail porque foi solicitada a redefinição de senha de {user_email} na Ordre. Não foi você? Pode ignorar esta mensagem - sua senha não muda até que você crie uma nova.',
  },
  workspaceCreated: {
    subject: '{workspace_name} está no ar',
    preview: 'Comece criando seu primeiro quadro e compartilhando com um cliente.',
    category: 'Espaço de trabalho',
    eyebrow: 'Espaço de trabalho criado',
    heading: '{workspace_name} está no ar.',
    body: 'Seu espaço de trabalho está configurado e pronto. Crie seu primeiro quadro, escolha um modelo que combine com o serviço e compartilhe o link - sem aplicativo, sem conta para o cliente, apenas uma página que ele acompanha em tempo real.',
    action: 'Criar seu primeiro quadro',
    note: 'Ou vá direto para o seu painel:',
    disclaimer:
      'Você recebeu este e-mail porque {owner_email} criou o espaço de trabalho {workspace_name} na Ordre.',
    detailWorkspace: 'Espaço de trabalho',
    detailIndustry: 'Ramo',
    detailPlan: 'Plano',
    detailOwner: 'Responsável',
    stepsLabel: 'Próximos passos',
    steps: [
      {
        title: 'Crie seu primeiro quadro',
        body: 'Escolha um modelo que combine com o serviço e preencha os detalhes. Leva um minuto.',
      },
      {
        title: 'Convide sua equipe',
        body: 'Adicione quem toca os serviços com você em Configurações, Membros. Todos trabalham nos mesmos quadros.',
      },
      {
        title: 'Compartilhe o link',
        body: 'Envie por SMS, e-mail ou WhatsApp. Publique atualizações conforme o trabalho avança - seu cliente apenas acompanha.',
      },
    ],
  },
  inviteCreated: {
    subject: 'Entre em {workspace_name} na Ordre',
    preview:
      '{inviter_name} convidou você para entrar em {workspace_name} na Ordre. Aceite para começar a colaborar nos quadros.',
    category: 'Convite',
    eyebrow: 'Você foi convidado',
    heading: 'Entre em {workspace_name} na Ordre.',
    body: '{inviter_name} convidou você para entrar no espaço de trabalho como {invited_role}. A Ordre dá a cada serviço um quadro de status privado compartilhado por um único link - aceite o convite para começar a colaborar nos quadros com a equipe.',
    action: 'Aceitar convite',
    note: 'Este convite expira em 7 dias. Se o botão não funcionar, copie e cole este endereço no seu navegador:',
    disclaimer:
      'Você recebeu este e-mail porque {inviter_name} convidou {invitee_email} para um espaço de trabalho na Ordre. Se não esperava por isso, pode ignorar esta mensagem - nenhuma conta é criada até que você aceite.',
    roleOwner: 'Proprietário',
    roleAdmin: 'Administrador',
    roleMember: 'Membro',
    detailWorkspace: 'Espaço de trabalho',
    detailInvitedBy: 'Convidado por',
    detailRole: 'Sua função',
  },
};
