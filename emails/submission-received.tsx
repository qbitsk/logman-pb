import {
  Body, Button, Container, Head, Heading,
  Html, Preview, Text, Section,
} from "@react-email/components";

interface SubmissionReceivedEmailProps {
  userName: string;
  submissionUrl: string;
}

export function SubmissionReceivedEmail({
  userName, submissionUrl,
}: SubmissionReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your submission has been received</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Submission Received ✅</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            We've received your submission.
            Our team will review it and get back to you.
          </Text>
          <Section style={buttonSection}>
            <Button href={submissionUrl} style={button}>
              View Submission
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
  backgroundColor: "#4f52e5", color: "#fff", padding: "12px 28px",
  borderRadius: "6px", fontWeight: "bold", textDecoration: "none",
};
