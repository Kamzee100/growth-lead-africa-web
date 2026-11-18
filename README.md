# Growth Lead Africa — Resend email deployment

The partnership and volunteer forms send through Resend's HTTPS API from the server. The API key is never exposed to the browser.

## Render environment variables
- `RESEND_API_KEY`: secret key created in Resend.
- `EMAIL_FROM`: use `onboarding@resend.dev` for initial sandbox testing. Production requires an address on a domain verified in Resend.
- `EMAIL_TO`: receiving inbox. In sandbox mode, this must be the email address associated with your Resend account. After verifying your own domain, set it to `growthlead05@gmail.com`.
- `HOST`: `0.0.0.0`.

## Setup
1. Create/sign in at https://resend.com.
2. Create a sending API key at https://resend.com/api-keys. Keep it private.
3. In Render → service → Environment, set `RESEND_API_KEY`.
4. For sandbox testing, use `EMAIL_FROM=onboarding@resend.dev` and set `EMAIL_TO` to your Resend account email.
5. For public form delivery to `growthlead05@gmail.com`, add a domain you own in Resend, publish the DNS records it supplies, wait for verification, then set `EMAIL_FROM` to an address on that verified domain and `EMAIL_TO=growthlead05@gmail.com`.
6. Save and redeploy. Test both website forms and check the inbox and Resend Logs.

Never commit API keys to GitHub or paste them into chat. Add them only as Render environment secrets.
