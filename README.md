# Growth Lead Africa redesigned website

Responsive redesign with seven expanded focus areas, SDG alignment detail and proposed Liberia-specific strategic goals.

## Deploy on Render
1. Replace the website files in the connected GitHub repository with these files (keep `server.mjs`, `index.html`, `package.json`, `.env.example`, and `render.yaml`).
2. Commit and push to the branch connected to Render.
3. In Render > Environment, set `RESEND_API_KEY` (secret), `EMAIL_FROM` and `EMAIL_TO`.
   - For testing without a verified domain: `EMAIL_FROM=onboarding@resend.dev` and `EMAIL_TO=growthlead05@gmail.com` (must be the Resend account's email address).
   - Production sending to other recipients requires a domain you own, verified in Resend. Then set `EMAIL_FROM` to a sender on that domain.
4. Save, deploy, and test the forms. The form status now displays a direct email fallback when delivery is unavailable.

## Local test
Node 20.6+; run `npm start` and open `http://localhost:3000`.

## Strategic note
SDG connections and focus-area strategies are suggested for GLA planning, tailored to Liberia's context and the AAID 2025–2029 / Agenda 2030. They are not evidence that GLA currently delivers these programs or that any official agency endorses GLA. Validate priorities, targets, baseline indicators, safeguarding and implementation capacity with communities and partners before publishing program commitments.
