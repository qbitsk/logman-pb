export function adminNotificationEmailHtml({ submitterName, submissionUrl }: { submitterName: string; submissionUrl: string }): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f0f4ff;margin:0;padding:0">
  <div style="max-width:520px;margin:40px auto;padding:32px;background:#fff;border-radius:8px">
    <h1 style="color:#1e1d4c;font-size:22px;margin-bottom:16px">New Submission 🔔</h1>
    <p style="color:#444;font-size:15px;line-height:1.6"><strong>${submitterName}</strong> has submitted a new submission.</p>
    <p style="color:#444;font-size:15px;line-height:1.6">Review it in the admin panel.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${submissionUrl}" style="background:#4140ca;color:#fff;padding:12px 28px;border-radius:6px;font-weight:bold;text-decoration:none">Review Submission</a>
    </div>
  </div>
</body>
</html>`;
}

export function adminNotificationEmailText({ submitterName, submissionUrl }: { submitterName: string; submissionUrl: string }): string {
  return `New submission from ${submitterName}.

Review it in the admin panel: ${submissionUrl}`;
}
