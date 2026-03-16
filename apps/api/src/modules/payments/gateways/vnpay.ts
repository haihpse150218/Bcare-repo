import crypto from "crypto";

interface VNPayCreateParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
}

export function createVNPayUrl(params: VNPayCreateParams): string {
  const tmnCode = process.env.VNPAY_TMN_CODE || "";
  const hashSecret = process.env.VNPAY_HASH_SECRET || "";
  const vnpUrl = process.env.VNPAY_URL || "https://sandbox.vnpay.vn/paymentv2/vpcpay.html";
  const returnUrl = process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment/result";
  const ipnUrl = process.env.VNPAY_IPN_URL || "http://localhost:3001/api/payments/vnpay/ipn";

  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000));

  const vnpParams: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(params.amount * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpnUrl: ipnUrl,
    vnp_IpAddr: params.ipAddress,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const sortedParams = sortObject(vnpParams);
  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  sortedParams.vnp_SecureHash = signed;
  return `${vnpUrl}?${new URLSearchParams(sortedParams).toString()}`;
}

export function verifyVNPaySignature(query: Record<string, string>): boolean {
  const hashSecret = process.env.VNPAY_HASH_SECRET || "";
  const secureHash = query.vnp_SecureHash;
  if (!secureHash) return false;

  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
}

export async function refundVNPay(transactionId: string, amount: number, orderId: string): Promise<boolean> {
  console.log(`VNPay refund: txn=${transactionId}, amount=${amount}, order=${orderId}`);
  return true;
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj).sort().reduce((result: Record<string, string>, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
