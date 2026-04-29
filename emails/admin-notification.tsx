import {
  Body, Button, Container, Head, Heading,
  Html, Preview, Text, Section,
} from "@react-email/components";

interface AdminNotificationEmailProps {
  submitterName: string;
  submissionUrl: string;
}

export function AdminNotificationEmail({
  submitterName, submissionUrl,
}: AdminNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New submission from {submitterName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Submission 🔔</Heading>
          <Text style={text}>
            <strong>{submitterName}</strong> has submitted a new submission.
          </Text>
          <Text style={text}>Review it in the admin panel.</Text>
          <Section style={buttonSection}>
            <Button href={submissionUrl} style={button}>
              Review Submission
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f0f4ff", fontFamily: "sans-serif" };
const container = {
  margin: "40px auto", padding: "32px", backgroundColor: "#ffffff",
  borderRadius: "8px", maxWidth: "520px",
};
const h1 = { color: "#1e1d4c", fontSize: "22px", marginBottom: "16px" };
const text = { color: "#444", fontSize: "15px", lineHeight: "1.6" };
const buttonSection = { textAlign: "center" as const, margin: "24px 0" };
const button = {
  backgroundColor: "#4140ca", color: "#fff", padding: "12px 28px",
  borderRadius: "6px", fontWeight: "bold", textDecoration: "none",
};
