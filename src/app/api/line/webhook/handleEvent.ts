import { messagingApi, WebhookEvent } from "@line/bot-sdk";
import prisma from "@/lib/prisma";
import {
  getBookingMessage,
  getFaqMessage,
  getHistoryMessage,
  getLocationMessage,
  getYearOfHorseMessage,
} from "./messages";

type Urls = {
  BOOKING_URL: string;
  HISTORY_URL: string;
  FAQ_URL: string;
};

const getSourceLabel = (event: WebhookEvent) => {
  const { source } = event;
  if (source.type === "group") return `group:${source.groupId || ""}`;
  if (source.type === "room") return `room:${source.roomId || ""}`;
  return `user:${source.userId || ""}`;
};

let botUserIdPromise: Promise<string> | null = null;
const getBotUserId = async (client: messagingApi.MessagingApiClient) => {
  if (!botUserIdPromise) {
    botUserIdPromise = client
      .getBotInfo()
      .then((info) => info.userId || "")
      .catch(() => "");
  }
  return botUserIdPromise;
};

export const createHandleEvent = (
  client: messagingApi.MessagingApiClient,
  urls: Urls
) =>
  async (event: WebhookEvent): Promise<messagingApi.ReplyMessageResponse | null> => {
    // Handle follow (เพิ่มเพื่อน)
    if (event.type === "follow") {
      try {
        const userId = event.source.userId || "";
        await prisma.lineLog.create({
          data: {
            lineId: userId,
            message: "ติดตาม (Add Friend)",
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error saving follow log:", error);
      }
      return null;
    }

    // Handle unfollow (เลิกติดตาม/บล็อก)
    if (event.type === "unfollow") {
      try {
        const userId = event.source.userId || "";
        await prisma.lineLog.create({
          data: {
            lineId: userId,
            message: "เลิกติดตาม (Block/Unfriend)",
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error saving unfollow log:", error);
      }
      return null;
    }

    // Handle join (ถูกเชิญเข้ากลุ่ม/ห้อง)
    if (event.type === "join") {
      try {
        await prisma.lineLog.create({
          data: {
            lineId: getSourceLabel(event),
            message: "บอทถูกเชิญเข้าห้อง/กลุ่ม",
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error saving join log:", error);
      }
      return null;
    }

    // รับเฉพาะ message event
    if (event.type !== "message") {
      return null;
    }

    const replyToken = event.replyToken;

    if (!replyToken) {
      return null;
    }

    // ถ้า user ส่งสติกเกอร์ -> ตอบกลับสติกเกอร์แบบเดียวกัน
    if (event.message.type === "sticker") {
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "sticker",
            packageId: event.message.packageId,
            stickerId: event.message.stickerId,
          },
        ],
      });
    }

    // รับเฉพาะ text message (หลังจาก handle sticker แล้ว)
    if (event.message.type !== "text") {
      return null;
    }

    const userMessage = event.message.text;

    const userId = event.source.userId || "";

    let displayNamePromise: Promise<string> | null = null;
    const sourceType = event.source.type;
    const groupId = sourceType === "group" ? event.source.groupId : undefined;
    const roomId = sourceType === "room" ? event.source.roomId : undefined;

    const getDisplayName = async (): Promise<string> => {
      if (!userId) return "";
      if (!displayNamePromise) {
        displayNamePromise = (async () => {
          try {
            if (groupId && userId) {
              const profile = await client.getGroupMemberProfile(groupId, userId);
              return profile.displayName || "";
            }
            if (roomId && userId) {
              const profile = await client.getRoomMemberProfile(roomId, userId);
              return profile.displayName || "";
            }
            const profile = await client.getProfile(userId);
            return profile.displayName || "";
          } catch {
            return "";
          }
        })();
      }
      return displayNamePromise;
    };

    // ตรวจจับการแท็กบอทใน group/room
    const mentionees = event.message.mention?.mentionees || [];
    const botId = await getBotUserId(client);
    const botMentioned =
      !!botId && mentionees.some((m) => m.userId && m.userId === botId);

    if (botMentioned) {
      try {
        await prisma.lineLog.create({
          data: {
            lineId: getSourceLabel(event),
            message: `mention:${userMessage}`,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error saving mention log:", error);
      }

      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "text",
            text: "รับทราบค่ะ เรียกบอทได้เลย 🙌",
          },
        ],
      });
    }

    // user พิมพ์ hi -> Happy New Year 2026 (Year of the Horse)
    if (userMessage.toLowerCase() === "hi") {
      const hnyFlex = getYearOfHorseMessage();

      return client.replyMessage({
        replyToken,
        messages: [hnyFlex],
      });
    }

    // user ถาม จองคิว
    if (userMessage.includes("จองคิว")) {
      // สร้าง URL พร้อมแนบ LINE ID
      const bookingUrlWithLineId = `${urls.BOOKING_URL}?userid=${userId}`;

      const displayName = await getDisplayName();

      // ตอบกลับด้วย Flex Message พร้อมปุ่มสีเขียว
      const bookingFlex = getBookingMessage(bookingUrlWithLineId, displayName);

      return client.replyMessage({
        replyToken,
        messages: [bookingFlex],
      });
    }

    // user ถาม ประวัติการจอง
    if (userMessage.includes("ประวัติการจอง")) {
      // สร้าง URL พร้อมแนบ LINE ID
      const historyUrlWithLineId = `${urls.HISTORY_URL}?userid=${userId}`;

      const displayName = await getDisplayName();

      // ตอบกลับด้วย Flex Message พร้อมปุ่มสีส้ม
      const historyFlex = getHistoryMessage(historyUrlWithLineId, displayName);

      return client.replyMessage({
        replyToken,
        messages: [historyFlex],
      });
    }

    // user ถาม คำถามพบบ่อย
    if (userMessage.includes("คำถามพบบ่อย")) {
      // สร้าง URL พร้อมแนบ LINE ID
      const faqUrlWithLineId = `${urls.FAQ_URL}?userid=${userId}`;

      // ตอบกลับด้วย Buttons Template พร้อมปุ่มลิงค์ FAQ
      const faqTemplate = getFaqMessage(faqUrlWithLineId);

      return client.replyMessage({
        replyToken,
        messages: [faqTemplate],
      });
    }

    // user ถาม ตรงไหน
    if (userMessage.includes("ตรงไหน")) {
      const locationMsg = getLocationMessage();
      return client.replyMessage({
        replyToken,
        messages: [locationMsg],
      });
    }

    // ตอบกลับข้อความอื่นๆ
    // บันทึก log ลงฐานข้อมูล
    try {
      await prisma.lineLog.create({
        data: {
          lineId: getSourceLabel(event),
          message: userMessage,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error saving line log:", error);
    }

    return client.replyMessage({
      replyToken,
      messages: [
        {
          type: "text",
          text: "🌈✨ สวัสดีค่ะ! 😊🌸",
        },
      ],
    });
  };
