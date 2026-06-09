export function submissionReceivedEmailHtml({ userName, submissionUrl }: { userName: string; submissionUrl: string }): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f0f4ff;margin:0;padding:0">
  <div style="max-width:520px;margin:40px auto;padding:32px;background:#fff;border-radius:8px">
    <h1 style="color:#1e1d4c;font-size:22px;margin-bottom:16px">Submission Received ✅</h1>
    <p style="color:#444;font-size:15px;line-height:1.6">Hi ${userName},</p>
    <p style="color:#444;font-size:15px;line-height:1.6">We've received your submission. Our team will review it and get back to you.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${submissionUrl}" style="background:#4f52e5;color:#fff;padding:12px 28px;border-radius:6px;font-weight:bold;text-decoration:none">View Submission</a>
    </div>
  </div>
</body>
</html>`;
}

export function submissionReceivedEmailText({ userName, submissionUrl }: { userName: string; submissionUrl: string }): string {
  return `Hi ${userName},

We've received your submission. Our team will review it and get back to you.

View Submission: ${submissionUrl}`;
}
