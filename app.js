const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
const accessKey = "F8BBA842ECF85"; // 1
const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz"; //2 cái này nên bỏ vào .env
//tạo link thanh toán
app.post("/payment", async (req, res) => {
  const orderInfo = "pay with MoMo";
  const partnerCode = "MOMO";
  const redirectUrl =
    "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b"; // sau khi thành công sẽ chuyển tới trang này
  const ipnUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b"; //tải ngrok
  //, rồi ngrok config add-authtoken <token> thay token bằng đăng nhập trên trang chủ, và cuối cùng thì ngrok http 5000
  const requestType = "payWithMethod";
  const amount = "50000";
  const orderId = partnerCode + new Date().getTime(); //check xem trạng thái đơn hàng
  const requestId = orderId;
  const extraData = "";
  const paymentCode = "your_payment_code_here"; // Make sure it's valid
  const autoCapture = true;
  const lang = "vi";

  const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode: partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    signature: signature,
  };

  try {
    const result = await axios({
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/create",
      headers: {
        "Content-Type": "application/json",
      },
      data: requestBody,
    });
    return res.status(200).json(result.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: error.message || "server error",
    });
  }
});
app.post("/callback", async (req, res) => {
  console.log("callback::");
  console.log(req.body);
  //update order

  return res.status(200).json(req.body);
});
app.post("/transaction-status", async (req, res) => {
  const { orderId } = req.body;

  // Signature generation
  const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  // Request body
  const requestBody = {
    partnerCode: "MOMO",
    requestId: orderId,
    orderId,
    signature,
    lang: "vi",
  };

  try {
    // Axios request to MoMo API
    const result = await axios({
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/query",
      headers: {
        "Content-Type": "application/json",
      },
      data: requestBody,
    });

    // Return response to the client
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("Transaction status error:", error);
    return res.status(500).json({
      statusCode: 500,
      message: error.message || "Failed to query transaction status",
    });
  }
});

app.listen(5000, () => {
  console.log("server is running on port 5000");
});
