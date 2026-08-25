export default {
  AuthHeader: {
    login: {
      entry: 'New here?',
      button: 'Get started',
    },
    getStarted: {
      entry: 'Already have an account?',
      button: 'Sign in',
    },
    invite: {
      entry: 'Already have an account?',
      button: 'Sign in',
    },
  },
  HomePage: {
    title: 'Test - EN',
  },
  Login: {
    eyebrow: 'Sign in',
    title: 'Welcome back.',
    subtitle: 'Pick up where you left off, your boards are waiting.',
    email: {
      label: 'Email',
      placeholder: 'john.doe@ordre.app',
    },
    password: {
      label: 'Password',
      placeholder: 'Your password',
      forgot: 'Forgot?',
    },
    remember: 'Keep me signed in on this device',
    submit: 'Sign in',
    submitting: 'Signing in...',
    or: 'Or',
    magicLink: 'Email me a sign-in link',
    noAccount: "Don't have an account?",
    createOne: 'Create one',
    notices: {
      'password-reset': 'Your password has been reset. Sign in with your new password.',
      'account-exists': 'You already have an account. Sign in to accept the invite.',
    },
  },
  ForgotPassword: {
    eyebrow: 'Reset your password',
    title: 'Trouble signing in?',
    subtitle: "Enter your email below and we'll send you a link to set a new password.",
    email: {
      label: 'Email',
      placeholder: 'john.doe@ordre.app',
    },
    submit: 'Send reset link',
    submitting: 'Sending...',
    success: {
      title: 'Check your inbox',
      subtitle: 'A link to set a new password is on its way.',
      body: "We've sent an email to {email} if an account exists for it. It can take a few minutes to arrive - check your spam folder too.",
    },
    remembered: 'Remembered your password?',
    backToLogin: 'Sign in',
  },
  SetPassword: {
    'forgot-password': {
      eyebrow: 'Reset your password',
      title: 'Choose a new password.',
      subtitle: 'Almost there - enter a new password for your account below.',
    },
    'create-password': {
      eyebrow: 'Set up your account',
      title: 'Create your password.',
      subtitle: 'One last step - create a password to start using your account.',
    },
    invalidLink: {
      eyebrow: 'Link expired',
      title: 'This link no longer works.',
      subtitle:
        'Password links can only be used once, and they expire an hour after they are sent. Ask for a new one and it will be in your inbox shortly.',
      action: 'Request a new link',
    },
    password: {
      label: 'New password',
      placeholder: 'At least 8 characters',
    },
    confirm: {
      label: 'Confirm password',
      placeholder: 'Repeat your new password',
    },
    submit: 'Save password',
    submitting: 'Saving...',
    help: {
      entry: 'Link expired or not working?',
      link: 'Request a new one',
    },
  },
};
