import { Resend } from "resend";
import { welcomeEmailHtml, welcomeEmailText } from "@/emails/welcome";
import { submissionReceivedEmailHtml, submissionReceivedEmailText } from "@/emails/submission-received";
import { adminNotificationEmailHtml, adminNotificationEmailText } from "@/emails/admin-notification";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: "Welcome!",
    html: welcomeEmailHtml({ name: user.name, appUrl: APP_URL }),
    text: welcomeEmailText({ name: user.name, appUrl: APP_URL }),
  });
}

export async function sendSubmissionConfirmation(params: {
  user: { name: string; email: string };
  submissionId: string;
}) {
  const submissionUrl = `${APP_URL}/worker-productions/${params.submissionId}`;
  return resend.emails.send({
    from: FROM,
    to: params.user.email,
    subject: `Submission received`,
    html: submissionReceivedEmailHtml({ userName: params.user.name, submissionUrl }),
    text: submissionReceivedEmailText({ userName: params.user.name, submissionUrl }),
  });
}

export async function sendAdminNotification(params: {
  adminEmail: string;
  submitterName: string;
  submissionId: string;
}) {
  const submissionUrl = `${APP_URL}/admin/worker-productions/${params.submissionId}`;
  return resend.emails.send({
    from: FROM,
    to: params.adminEmail,
    subject: `New submission`,
    html: adminNotificationEmailHtml({ submitterName: params.submitterName, submissionUrl }),
    text: adminNotificationEmailText({ submitterName: params.submitterName, submissionUrl }),
  });
}
