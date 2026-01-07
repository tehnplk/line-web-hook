import { messagingApi } from "@line/bot-sdk";

export const getYearOfHorseMessage = (): messagingApi.FlexMessage => ({
  type: "flex",
  altText: "สวัสดีปีม้าทอง 2569! 🐴🎉",
  contents: {
    type: "bubble",
    hero: {
      type: "image",
      url: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=1080&auto=format&fit=crop", // รูปม้าวิ่งสง่างาม
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
      action: {
        type: "uri",
        uri: "https://line.me",
      },
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "Happy Year of the Horse",
          weight: "bold",
          size: "xl",
          color: "#D4AF37", // สีทอง
          align: "center",
        },
        {
          type: "text",
          text: "2026",
          weight: "bold",
          size: "5xl",
          color: "#FFD700", // สีทองสว่าง
          align: "center",
          margin: "md",
        },
        {
          type: "text",
          text: "🐴 ขอให้ปีม้านี้ นำพาความสำเร็จและความก้าวหน้ามาสู่คุณอย่างรวดเร็ว",
          size: "sm",
          color: "#CCCCCC",
          wrap: true,
          align: "center",
          margin: "lg",
        },
      ],
      backgroundColor: "#1A1A1A", // พื้นหลังสีเข้ม
    },
    styles: {
      body: {
        backgroundColor: "#1A1A1A",
      },
    },
  },
});

export const getBookingMessage = (url: string): messagingApi.FlexMessage => ({
  type: "flex",
  altText: "จองคิว - กดปุ่มด้านล่างเพื่อจองคิว",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "🗓️ จองคิว",
          weight: "bold",
          size: "xl",
          align: "center",
        },
        {
          type: "text",
          text: "กรุณากดปุ่มด้านล่างเพื่อจองคิวของคุณ",
          size: "sm",
          color: "#666666",
          align: "center",
          margin: "md",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "📅 จองคิวเลย",
            uri: url,
          },
          style: "primary",
          color: "#22C55E", // สีเขียว
        },
      ],
    },
  },
});

export const getHistoryMessage = (url: string): messagingApi.FlexMessage => ({
  type: "flex",
  altText: "ประวัติการจอง - กดปุ่มด้านล่างเพื่อดูประวัติ",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📋 ประวัติการจอง",
          weight: "bold",
          size: "xl",
          align: "center",
        },
        {
          type: "text",
          text: "กรุณากดปุ่มด้านล่างเพื่อดูประวัติการจองของคุณ",
          size: "sm",
          color: "#666666",
          align: "center",
          margin: "md",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "📜 ดูประวัติการจอง",
            uri: url,
          },
          style: "primary",
          color: "#F97316", // สีส้ม
        },
      ],
    },
  },
});

export const getFaqMessage = (url: string): messagingApi.TemplateMessage => ({
  type: "template",
  altText: "คำถามพบบ่อย - กดปุ่มด้านล่างเพื่อดูคำถามที่พบบ่อย",
  template: {
    type: "buttons",
    title: "❓ คำถามพบบ่อย",
    text: "กรุณากดปุ่มด้านล่างเพื่อดูคำตอบที่พบบ่อย",
    actions: [
      {
        type: "uri",
        label: "📖 ดูคำถามพบบ่อย",
        uri: url,
      },
    ],
  },
});
