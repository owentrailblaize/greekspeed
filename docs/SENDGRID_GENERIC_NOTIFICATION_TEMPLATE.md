# SendGrid: Generic Notification Template

One dynamic template powers all of these email types:

- **Post comment** – "X commented on your post"
- **Comment reply** – "X replied to your comment"
- **Post like** – "X liked your post"
- **Comment like** – "X liked your comment"
- **Inactivity reminder** – "We haven't seen you in a while"

The app sends the template ID in `SENDGRID_GENERIC_NOTIFICATION_TEMPLATE_ID` and passes different copy via **dynamic template data**.

---

## 1. Create the template in SendGrid

1. Log in to [SendGrid](https://app.sendgrid.com/) and go to **Email API** > **Dynamic Templates**.
2. Click **Create a Dynamic Template**.
3. Name it (e.g. "Trailblaize – Generic notification") and note the **Template ID** (e.g. `d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
4. Add a **version** (e.g. "Version 1") and choose the **Dynamic** (Handlebars) editor.

---

## 2. Template HTML (Handlebars)

Use these variables so the app can pass title, body, and CTA:

- `recipient.first_name` – Recipient first name
- `recipient.email` – Recipient email (for reference)
- `title` – Short headline (e.g. "New comment on your post")
- `body` – Main message (plain text or HTML)
- `cta.label` – Button text (e.g. "View post", "Open Trailblaize")
- `cta.url` – Button link
- `unsubscribe` – Unsubscribe URL
- `unsubscribe_preferences` – Preferences URL

**Subject** (set in the template or via API):  
The app sets the subject in the API call, so you can leave the template subject as a fallback (e.g. `{{title}}`) or leave it blank and always rely on the API.

**Example HTML body:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #6b7280; }
    .footer a { color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 20px;">Trailblaize</h1>
    </div>
    <div class="content">
      <p>Hi {{recipient.first_name}},</p>
      <p><strong>{{title}}</strong></p>
      <p>{{body}}</p>
      {{#if cta.url}}
      <p><a href="{{cta.url}}" class="button">{{cta.label}}</a></p>
      {{/if}}
    </div>
    <div class="footer">
      <p><a href="{{unsubscribe_preferences}}">Manage email preferences</a> | <a href="{{unsubscribe}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
```

If your SendGrid plan supports a **plain-text** version, add one that uses the same variables (e.g. `Hi {{recipient.first_name}}, {{title}} {{body}} {{cta.label}}: {{cta.url}}`).

---

## 3. Set the template ID in the app

1. Copy the template ID from SendGrid (e.g. `d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
2. In your environment (e.g. `.env.local` or Vercel), set:
   ```bash
   SENDGRID_GENERIC_NOTIFICATION_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Restart the app (or redeploy) so the new env var is picked up.

---

## 4. Optional: Inactivity cron

To run the 30-day inactivity reminder on a schedule:

1. Set `CRON_SECRET` in your environment to a long random string.
2. In Vercel: **Project** > **Settings** > **Cron Jobs**, add a job that calls:
   - **URL:** `https://<your-domain>/api/cron/inactivity-reminder`
   - **Schedule:** e.g. daily at 2:00 AM
   - **Header:** `Authorization: Bearer <your CRON_SECRET>`
3. If you use an external cron, call the same URL with the same `Authorization` header.

---

## 5. Data the app sends (reference)

Each email type sends the same structure; only the values change:

| Field | Example (post comment) |
|-------|-------------------------|
| `recipient.first_name` | Jane |
| `recipient.email` | jane@example.com |
| `title` | New comment on your post |
| `body` | Alex commented: "Great post..." |
| `cta.label` | View post |
| `cta.url` | https://yoursite.com/dashboard/post/123 |
| `unsubscribe` | https://yoursite.com/unsubscribe?email=... |
| `unsubscribe_preferences` | https://yoursite.com/preferences?email=... |

Subject is set per email (e.g. "Alex commented on your post on Trailblaize") in the API; the template can use a default subject if you prefer.
