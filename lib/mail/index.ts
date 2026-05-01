import { Resend } from "resend";
import { SubmissionReceivedEmail } from "@/emails/submission-received";
import { AdminNotificationEmail } from "@/emails/admin-notification";
import { WelcomeEmail } from "@/emails/welcome";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: "Welcome!",
    react: WelcomeEmail({ name: user.name, appUrl: APP_URL }),
  });
}

export async function sendSubmissionConfirmation(params: {
  user: { name: string; email: string };
  submissionId: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.user.email,
    subject: `Submission received`,
    react: SubmissionReceivedEmail({
      userName: params.user.name,
      submissionUrl: `${APP_URL}/worker-productions/${params.submissionId}`,
    }),
  });
}

export async function sendAdminNotification(params: {
  adminEmail: string;
  submitterName: string;
  submissionId: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.adminEmail,
    subject: `New submission`,
    react: AdminNotificationEmail({
      submitterName: params.submitterName,
      submissionUrl: `${APP_URL}/admin/worker-productions/${params.submissionId}`,
    }),
  });
}
