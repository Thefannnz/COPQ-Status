# COPQ Status — Input Data Hub (Quality Center)

เว็บแอปพลิเคชันสำหรับนำเข้าและจัดการข้อมูลต้นทุนความสูญเสียคุณภาพ (**COPQ / COGQ**) รองรับการใช้งานใน **Antigravity IDE** ทันทีโดยไม่ต้องติดตั้ง Dependency เพิ่มเติม

## โครงสร้างโฟลเดอร์ (Folder Structure)
```text
copq-status-input-hub/
├── index.html          # หน้าหลักของระบบ (UI ครบทั้ง 3 ช่องทางนำเข้าข้อมูล + Central Data Hub)
├── css/
│   └── style.css       # สไตล์เพิ่มเติมและโทนสีมาตรฐานองค์กร (#1B3668, #AE232A, #FFFFFF)
├── js/
│   └── app.js          # ระบบ AI Bill OCR (Gemini API), Excel Batch Import, Manual Entry และ Export
└── README.md           # คู่มือการเปิดใช้งาน
```

## วิธีเปิดใช้งานใน Antigravity IDE
1. แตกไฟล์ ZIP (`copq-status-input-hub.zip`) แล้วเปิดโฟลเดอร์ `copq-status-input-hub` ใน **Antigravity IDE**
2. เปิดไฟล์ `index.html` แล้วกด **Live Preview / Open in Browser**
3. กดปุ่ม **ตั้งค่า API Key** มุมขวาบนเพื่อใส่ Gemini API Key (หรือกด **โหลดบิลตัวอย่าง** เพื่อทดสอบได้ทันที)
