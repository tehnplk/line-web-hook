import { NextRequest, NextResponse } from "next/server";
import { messagingApi, WebhookEvent, validateSignature } from "@line/bot-sdk";
import { createHandleEvent } from "./handleEvent";


/* เพิ่มที่ .env */
/*
# จองคิว
URL_BOOKING=http://localhost:3000/booking

# ประวัติการจอง
URL_HISTORY=http://localhost:3000/history

# คำถามพบบ่อย
URL_FAQ=http://localhost:3000/faq

#ถ้า production ให้เปลี่ยน url เป็น https://ttm.plkhealth.go.th/xxx

*/



// บังคับใช้ Node.js Runtime เพื่อรองรับ Prisma และ LINE SDK เต็มรูปแบบ
//export const runtime = "nodejs";

// ตั้งค่า LINE SDK จาก environment variables
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
};

// สร้าง LINE Messaging API client
const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});


// URLs สำหรับลิงค์ต่างๆ
const BOOKING_URL = process.env.URL_BOOKING || "";
const HISTORY_URL = process.env.URL_HISTORY || "";
const FAQ_URL = process.env.URL_FAQ || "";

// จัดการ webhook events
const handleEvent = createHandleEvent(client, {
  BOOKING_URL,
  HISTORY_URL,
  FAQ_URL,
});

// POST handler สำหรับ LINE webhook
export async function POST(request: NextRequest) {
  try {
    // อ่าน raw body สำหรับการตรวจสอบ signature
    const body = await request.text();
    const signature = request.headers.get("x-line-signature") || "";

    // ตรวจสอบ signature
    if (!validateSignature(body, config.channelSecret, signature)) {
      console.error("Signature ไม่ถูกต้อง");
      return NextResponse.json({ error: "Signature ไม่ถูกต้อง" }, { status: 401 });
    }

    // แปลง body เป็น JSON
    const webhookBody = JSON.parse(body) as { events: WebhookEvent[] };

    const events = webhookBody.events;

    console.log(">>> Incoming Webhook Events:", JSON.stringify(events, null, 2));

    // ประมวลผล events ทั้งหมด
    const results = await Promise.all(events.map(handleEvent));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดใน Webhook:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

// GET handler สำหรับตรวจสอบสถานะ webhook
export async function GET() {
  return NextResponse.json({ status: "LINE Webhook กำลังทำงาน" });
}
