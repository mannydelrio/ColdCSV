import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResultEmail(to: string, csvBase64: string, rowCount: number) {
  await resend.emails.send({
    from: "ColdCSV <noreply@coldcsv.com>",
    to,
    subject: `Your ${rowCount} opening lines are ready`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#1A1A18;">Your file is ready</h2>
        <p style="color:#5A5A54;font-size:15px;line-height:1.5;margin:0 0 24px;">
          ColdCSV finished generating <strong>${rowCount} personalized opening lines</strong>.
          The completed CSV is attached to this email.
        </p>
        <p style="color:#9A9A94;font-size:13px;margin:0;">
          You can also download it anytime from your
          <a href="https://coldcsv.com/dashboard" style="color:#2A6B4A;">dashboard</a>.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: "coldcsv-results.csv",
        content: csvBase64,
      },
    ],
  });
}
