# Growth Lead Africa — Render deployment

## Publish the website on Render

1. Create a GitHub repository and upload the contents of this folder to its root. Include `render.yaml`, `package.json`, `server.mjs`, `index.html`, `brand-logo.png`, and `.gitignore`. Do not upload `.env` or passwords.
2. Sign in at https://render.com and choose **New → Blueprint**.
3. Connect GitHub and select the repository containing `render.yaml`.
4. Review the Blueprint and deploy the `growth-lead-africa` web service.
5. Render assigns a free `https://<service-name>.onrender.com` URL after deployment.

## Important: contact-form email on Render Free

The website can be hosted on Render's free web-service plan, but Render blocks outbound SMTP traffic on ports 25, 465, and 587 for free web services. This app currently sends form submissions through Gmail SMTP, so the contact forms will not deliver email on the free plan even when Gmail credentials are configured.

To enable email delivery, either:
- use a paid Render web-service instance that permits outbound SMTP, then configure the Gmail App Password below; or
- update the app to use an email provider's HTTPS API and configure that provider's API key (some providers require a verified sending domain).

Until email delivery is configured, the site itself remains accessible and the forms show a setup/error message rather than silently claiming delivery.

## Gmail SMTP setup (for a plan that permits SMTP)

Enable 2-Step Verification on `growthlead05@gmail.com` and create a Google App Password for Mail. In Render service → Environment, set `SMTP_USER` to `growthlead05@gmail.com` and `SMTP_PASS` to the generated App Password. `HOST=0.0.0.0` is configured by the Blueprint. Never commit `.env`, app passwords, or other credentials to GitHub.

## Local development

Requires Node.js 22 or newer. Run `npm install`, set `SMTP_USER` and `SMTP_PASS` in your shell, then run `npm start`. Open http://127.0.0.1:3000.

## Post-deployment checks

Open the Render URL and check the home page, navigation, and mobile layout. Once email delivery is configured, submit one partnership inquiry and one volunteer inquiry; confirm both arrive at `growthlead05@gmail.com` and that Reply targets the visitor. Render's free web services spin down after 15 minutes without traffic, so the first request after inactivity can take about a minute to wake.
