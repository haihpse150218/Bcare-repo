import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || "re_test_key");
  }
  return resend;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const from = process.env.EMAIL_FROM || "BCare <noreply@bcare.vn>";
    await getResend().emails.send({ from, to, subject, html });
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}
