export async function sendSMS(phone: string, content: string): Promise<boolean> {
  try {
    const apiKey = process.env.ESMS_API_KEY;
    const secretKey = process.env.ESMS_SECRET_KEY;
    const brandName = process.env.ESMS_BRAND_NAME || "BCare";

    if (!apiKey || !secretKey) {
      console.warn("eSMS credentials not configured, skipping SMS");
      return false;
    }

    const res = await fetch(
      "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ApiKey: apiKey,
          Content: content,
          Phone: phone,
          SecretKey: secretKey,
          SmsType: "2",
          Brandname: brandName,
        }),
      }
    );

    const data = await res.json();
    return data.CodeResult === "100";
  } catch (err) {
    console.error("SMS send failed:", err);
    return false;
  }
}
