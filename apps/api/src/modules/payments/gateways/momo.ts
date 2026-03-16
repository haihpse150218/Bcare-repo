import crypto from "crypto";

interface MoMoCreateParams {
  orderId: string;
  amount: number;
  orderInfo: string;
}

interface MoMoResponse {
  payUrl: string;
  resultCode: number;
  message: string;
}

export async function createMoMoPayment(params: MoMoCreateParams): Promise<string> {
  const partnerCode = process.env.MOMO_PARTNER_CODE || "";
  const accessKey = process.env.MOMO_ACCESS_KEY || "";
  const secretKey = process.env.MOMO_SECRET_KEY || "";
  const momoUrl = process.env.MOMO_URL || "https://test-payment.momo.vn/v2/gateway/api/create";
  const redirectUrl = process.env.MOMO_RETURN_URL || "http://localhost:3000/payment/result";
  const ipnUrl = process.env.MOMO_IPN_URL || "http://localhost:3001/api/payments/momo/ipn";

  const requestId = `${partnerCode}-${Date.now()}`;
  const requestType = "payWithMethod";
  const extraData = "";

  const rawSignature = `accessKey=${accessKey}&amount=${params.amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

  const body = {
    partnerCode,
    partnerName: "BCare",
    storeId: "BCareStore",
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    extraData,
    signature,
  };

  const res = await fetch(momoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: MoMoResponse = await res.json();
  if (data.resultCode !== 0) {
    throw { code: "MOMO_ERROR", message: data.message || "Lỗi tạo thanh toán MoMo", status: 502 };
  }

  return data.payUrl;
}

export function verifyMoMoSignature(body: Record<string, any>): boolean {
  const accessKey = process.env.MOMO_ACCESS_KEY || "";
  const secretKey = process.env.MOMO_SECRET_KEY || "";

  const rawSignature = `accessKey=${accessKey}&amount=${body.amount}&extraData=${body.extraData}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;

  const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
  return signature === body.signature;
}

export async function refundMoMo(transactionId: string, amount: number, orderId: string): Promise<boolean> {
  console.log(`MoMo refund: txn=${transactionId}, amount=${amount}, order=${orderId}`);
  return true;
}
