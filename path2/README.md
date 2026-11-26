# COPQ Status — Input Data Hub (Quality Center)

เว็บแอปพลิเคชันสำหรับนำเข้าและจัดการข้อมูลต้นทุนความสูญเสียคุณภาพ (**COPQ / COGQ**) รองรับการใช้งานใน **Antigravity IDE** และรองรับการเชื่อมต่อ **AI หลายค่าย (Multi-Provider AI)**

## ค่าย AI ที่รองรับในระบบ OCR
1. **Google Gemini** (`AIza...`) — รองรับทั้งไฟล์ PDF และรูปภาพ (`gemini-2.5-flash`)
2. **OpenAI / ChatGPT** (`sk-...`) — รองรับไฟล์รูปภาพ JPG/PNG/WEBP (`gpt-4o-mini`, `gpt-4o`)
3. **Anthropic Claude** (`sk-ant-...`) — รองรับทั้งไฟล์ PDF และรูปภาพ (`claude-3-5-sonnet-latest`)
4. **Alibaba Qwen** (`sk-...`) — รองรับรูปภาพบิล (`qwen4-max`, `qwen3.8-27b`)
5. **zAI / Zhipu GLM** — รองรับรูปภาพบิล (`glm-5.3-flash`, `glm-5.3`)
6. **DeepSeek** (`sk-...`) — รองรับ OpenAI-Compatible Endpoint (`deepseek-chat`, `deepseek-v4.1-flash`)
7. **xAI Grok** (`xai-...`) — รองรับรูปภาพบิล (`grok-4.7`)
8. **OpenRouter** (`sk-or-...`) — รองรับทุกโมเดลในคีย์เดียว (`qwen/qwen4-max`, `x-ai/grok-4.7`, `z-ai/glm-5.3-flash`)
9. **Custom Endpoint** — รองรับ API มาตรฐาน OpenAI-Compatible

## โครงสร้างโฟลเดอร์
```text
COPQ-Status-multi-ai/
├── index.html          # หน้าหลักของระบบ (UI 3 ช่องทางนำเข้าข้อมูล + หน้าต่างเลือกค่าย AI)
├── style.css           # สไตล์เพิ่มเติมและโทนสีมาตรฐานองค์กร (#1B3668, #AE232A, #FFFFFF)
├── app.js              # ระบบ Multi-Provider AI OCR, Excel Batch Import, Manual Entry และ Export
└── README.md           # คู่มือการใช้งาน
```
