import {
  Body, Button, Container, Head, Heading,
  Html, Preview, Section, Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  appUrl: string;
}

export function WelcomeEmail({ name, appUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to My App, {name}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome, {name} 👋</Heading>
          <Text style={text}>
            Your account is ready. You can now log in and start submitting data.
          </Text>
          <Section style={buttonSection}>
            <Button href={`${appUrl}/dashboard`} style={button}>
              Go to Dashboard
            </Button>
          </Section>
          <Text style={footer}>
            If you didn't create this account, you can safely ignore this email.
          </Text>
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
const h1 = { color: "#1e1d4c", fontSize: "24px", marginBottom: "16px" };
const text = { color: "#444", fontSize: "15px", lineHeight: "1.6" };
const buttonSection = { textAlign: "center" as const, margin: "24px 0" };
const button = {
  backgroundColor: "#4f52e5", color: "#fff", padding: "12px 28px",
  borderRadius: "6px", fontWeight: "bold", fontSize: "15px",
  textDecoration: "none",
};
const footer = { color: "#999", fontSize: "12px", marginTop: "24px" };
