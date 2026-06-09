export function welcomeEmailHtml({ name, appUrl }: { name: string; appUrl: string }): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f0f4ff;margin:0;padding:0">
  <div style="max-width:520px;margin:40px auto;padding:32px;background:#fff;border-radius:8px">
    <h1 style="color:#1e1d4c;font-size:24px;margin-bottom:16px">Welcome, ${name} 👋</h1>
    <p style="color:#444;font-size:15px;line-height:1.6">Your account is ready. You can now log in and start submitting data.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${appUrl}/dashboard" style="background:#4f52e5;color:#fff;padding:12px 28px;border-radius:6px;font-weight:bold;font-size:15px;text-decoration:none">Go to Dashboard</a>
    </div>
    <p style="color:#999;font-size:12px;margin-top:24px">If you didn't create this account, you can safely ignore this email.</p>
  </div>
</body>
</html>`;
}

export function welcomeEmailText({ name, appUrl }: { name: string; appUrl: string }): string {
  return `Welcome, ${name}!

Your account is ready. You can now log in and start submitting data.

Go to Dashboard: ${appUrl}/dashboard

If you didn't create this account, you can safely ignore this email.`;
}
