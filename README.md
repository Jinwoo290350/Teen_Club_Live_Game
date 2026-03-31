# Teen Club Live — Quiz Game

เว็บแอปเกมตอบคำถามด้านสุขภาพทางเพศสำหรับวัยรุ่น โดย **กรมอนามัย กระทรวงสาธารณสุข**

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Backend:** Google Sheets via Google Apps Script
- **Deployment:** Vercel

## Getting Started

```bash
pnpm install
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## Environment Variables

สร้างไฟล์ `.env.local` ที่ root:

```env
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
NEXT_PUBLIC_KNOWLEDGE_CARD_DRIVE_FOLDER=17MqEHFLzIa2hoH3xjzMcvaXVhVQygvx6
```

## Google Sheets Integration

ดูวิธีตั้งค่าได้ที่ [google_sheet/README.md](google_sheet/README.md)

## Project Structure

```
├── app/
│   ├── page.tsx              # Main app (all screens as state machine)
│   ├── api/pdf/[id]/         # PDF proxy route (hides Google Drive)
│   └── globals.css
├── components/
│   └── KnowledgePdf.tsx      # PDF viewer (react-pdf, no Drive UI)
├── lib/
│   ├── questions.ts          # 26 questions + satisfaction survey data
│   ├── googleSheets.ts       # API calls to Apps Script
│   └── types.ts
└── google_sheet/
    ├── Code.gs               # Google Apps Script
    └── README.md             # Setup instructions
```

## Deployment

ใช้ Vercel — ทุก push ไปยัง `main` จะ deploy อัตโนมัติ

อย่าลืมใส่ Environment Variables ใน Vercel Dashboard:
- `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`
- `NEXT_PUBLIC_KNOWLEDGE_CARD_DRIVE_FOLDER`
