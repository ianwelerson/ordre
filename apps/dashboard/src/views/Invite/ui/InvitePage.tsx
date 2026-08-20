import {
  Avatar,
  Button,
  Card,
  Eyebrow,
  TextField,
  TextLink,
  Typography,
} from '@ordre/ui/components';

export default function InvitePage() {
  const inviteDetails = {
    email: 'welerson.ian@gmail.com',
    name: 'John Doe',
    role: 'member',
    workspaceName: 'Bike Shop',
    workspaceLogo: null,
    invitedByName: 'Ian Welerson',
    expiresAt: '2026-09-20T06:05:12.117Z',
  };

  return (
    <div>
      <Card
        padding="none"
        className="flex w-full max-w-[460px] flex-col gap-7 px-10 pt-10 pb-8 max-[460px]:rounded-none"
      >
        <div className="flex flex-col gap-3.5">
          <Eyebrow>JOIN WORKSPACE</Eyebrow>
          <Card variant="quiet">
            <div className="flex gap-4">
              <Avatar
                label={inviteDetails.workspaceName}
                image={inviteDetails.workspaceLogo ?? undefined}
              />
              <div className="">
                <Typography tag="p" tone="default" variant="caption">
                  <span className="font-bold">{inviteDetails.invitedByName}</span> invited you to
                  join
                </Typography>
              </div>
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-2.5">
          <Typography tag="h1" variant="h2">
            Set up your account.
          </Typography>
          <Typography tag="p" variant="body">
            You'll sign in with <span className="font-bold">{inviteDetails.email}</span>. Add a
            name, a phone (optional), and choose a password.
          </Typography>
        </div>
        <div className="flex flex-col gap-4.5">
          <form className="flex flex-col gap-4.5">
            <TextField
              name="name"
              type="text"
              size="lg"
              label="Your name"
              placeholder="John Doe"
              autoFocus
            />
            <TextField
              name="phone"
              type="phone"
              size="lg"
              label="Phone"
              placeholder="351 912 234 678"
              helper="Only used for account recovery, never shared with clients."
              optional
            />
            <TextField
              name="password"
              type="password"
              size="lg"
              label="Create Password"
              placeholder="At least 8 characters"
            />
            <Button size="lg" trailingIcon="arrow-right" fullWidth type="submit">
              Accept invite & Continue
            </Button>
          </form>
          <Typography tag="p" variant="caption">
            By continuing you agree to Ordre's{' '}
            <TextLink variant="inline" href="/terms">
              Terms
            </TextLink>{' '}
            and{' '}
            <TextLink variant="inline" href="/privacy">
              Privacy Policy
            </TextLink>
            .
          </Typography>
        </div>
      </Card>
    </div>
  );
}
