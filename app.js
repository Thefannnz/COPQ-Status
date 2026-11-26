// Initialize Icons & Default Data
lucide.createIcons();

const STORAGE_KEY = 'copq_hub_records_v1';
const API_CONFIG_STORAGE = 'copq_ai_provider_config_v1';
const LEGACY_API_KEY_STORAGE = 'gemini_api_key_copq';

const PROVIDER_DEFAULTS = {
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    endpoint: '',
    hint: 'แนะนำ: gemini-2.5-flash (อ่านได้ทั้งไฟล์ PDF และรูปภาพ)',
    supportsPdf: true,
    supportsVision: true
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    hint: 'แนะนำ: gpt-4o-mini หรือ gpt-4o (รองรับไฟล์รูปภาพ JPG/PNG/WEBP)',
    supportsPdf: false,
    supportsVision: true
  },
  anthropic: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-latest',
    endpoint: '',
    hint: 'แนะนำ: claude-3-5-sonnet-latest (รองรับทั้ง PDF และรูปภาพ)',
    supportsPdf: true,
    supportsVision: true
  },
  qwen: {
    label: 'Alibaba Qwen',
    defaultModel: 'qwen4-max',
    endpoint: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    hint: 'รองรับ: qwen4-max (อ่านรูปภาพบิลได้แม่นยำ) หรือ qwen3.8-27b (ประหยัด)',
    supportsPdf: false,
    supportsVision: true
  },
  zai: {
    label: 'zAI / Zhipu GLM',
    defaultModel: 'glm-5.3-flash',
    endpoint: 'https://api.z.ai/api/paas/v4/chat/completions',
    hint: 'แนะนำ: glm-5.3-flash (รองรับรูปภาพ/Vision) หรือ glm-5.3 (งานข้อความ/โค้ด)',
    supportsPdf: false,
    supportsVision: true
  },
  deepseek: {
    label: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    hint: 'รุ่น: deepseek-chat / deepseek-v4.1-flash (หมายเหตุ: หากโมเดลไม่รองรับรูปภาพ แนะนำเรียกผ่าน OpenRouter หรือใช้ Gemini/Qwen4-Max)',
    supportsPdf: false,
    supportsVision: false
  },
  xai: {
    label: 'xAI Grok',
    defaultModel: 'grok-4.7',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    hint: 'รุ่น: grok-4.7 (รองรับรูปภาพ JPG/PNG/WEBP ความแม่นยำสูง)',
    supportsPdf: false,
    supportsVision: true
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'qwen/qwen4-max',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    hint: 'รวมทุกค่ายในคีย์เดียว เช่น qwen/qwen4-max, x-ai/grok-4.7, z-ai/glm-5.3-flash, google/gemini-2.5-flash',
    supportsPdf: true,
    supportsVision: true
  },
  custom: {
    label: 'Custom API',
    defaultModel: 'qwen4-max',
    endpoint: '',
    hint: 'ระบุ Endpoint URL ที่รองรับมาตรฐาน OpenAI Chat Completions (/v1/chat/completions)',
    supportsPdf: false,
    supportsVision: true
  }
};

let records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  {
    id: 'COPQ-2026-001',
    date: '2026-11-20',
    source: 'AI Bill OCR',
    dept: 'LAB - ห้องปฏิบัติการ',
    costType: 'COPQ - Internal Failure',
    rootCause: 'Rework / ทำซ้ำ',
    desc: 'น้ำยาตรวจวิเคราะห์ชุดใหม่ทดแทนชุดที่เก็บรักษาอุณหภูมิผิดพลาด (INV-8841)',
    amount: 14500.00,
    owner: 'หัวหน้าห้องปฏิบัติการ (คุณวิภา)',
    notified: true
  },
  {
    id: 'COPQ-2026-002',
    date: '2026-11-22',
    source: 'Manual Entry',
    dept: 'OPD - ผู้ป่วยนอก',
    costType: 'COPQ - Internal Failure',
    rootCause: 'Process Delay / ความล่าช้าในกระบวนการ',
    desc: 'ค่าเสียเวลาทำซ้ำการลงทะเบียนและคูปองชดเชยผู้ป่วยรอนานเกินมาตรฐาน',
    amount: 3200.00,
    owner: 'พยาบาลหัวหน้าเวร OPD (คุณสมชาย)',
    notified: true
  }
];

let currentOcrFileBase64 = null;
let currentOcrMimeType = null;
let currentOcrPreviewUrl = null;
let stagedExcelRows = [];

// Set default dates to today
const todayStr = new Date().toISOString().split('T')[0];
document.getElementById('ocrDate').value = todayStr;
document.getElementById('manDate').value = todayStr;

updateApiBadge();
renderHubTable();

// ==================== TAB NAVIGATION ====================
function switchTab(tabName) {
  ['ocr', 'excel', 'manual'].forEach(t => {
    document.getElementById(`panel-${t}`).classList.add('hidden');
    document.getElementById(`tab-${t}`).classList.remove('active');
    document.getElementById(`tab-${t}`).classList.add('text-slate-600');
  });
  document.getElementById(`panel-${tabName}`).classList.remove('hidden');
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.remove('text-slate-600');
}

// ==================== MULTI-PROVIDER AI MANAGEMENT ====================
function getAiConfig() {
  const saved = localStorage.getItem(API_CONFIG_STORAGE);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  // Backward compatibility with legacy gemini key
  const legacyKey = localStorage.getItem(LEGACY_API_KEY_STORAGE);
  if (legacyKey) {
    return {
      provider: 'gemini',
      model: PROVIDER_DEFAULTS.gemini.defaultModel,
      apiKey: legacyKey,
      baseUrl: ''
    };
  }
  return {
    provider: 'gemini',
    model: PROVIDER_DEFAULTS.gemini.defaultModel,
    apiKey: '',
    baseUrl: ''
  };
}

function detectProviderFromPrefix(key) {
  const trimmed = (key || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('AIza')) return 'gemini';
  if (trimmed.startsWith('sk-ant-')) return 'anthropic';
  if (trimmed.startsWith('sk-or-')) return 'openrouter';
  if (trimmed.startsWith('xai-')) return 'xai';
  // Note: OpenAI, Qwen (DashScope), and DeepSeek all use sk- prefix, so don't override if user already chose qwen/deepseek/zai
  const current = document.getElementById('aiProviderSelect')?.value;
  if (trimmed.startsWith('sk-') && !['qwen', 'deepseek', 'zai', 'custom'].includes(current)) {
    return 'openai';
  }
  return null;
}

function autoDetectProviderFromKey(key) {
  const detected = detectProviderFromPrefix(key);
  const tagEl = document.getElementById('detectedProviderTag');
  const selectEl = document.getElementById('aiProviderSelect');
  if (detected && selectEl.value !== 'custom') {
    selectEl.value = detected;
    onProviderChange(true);
    tagEl.textContent = `ตรวจพบค่าย: ${PROVIDER_DEFAULTS[detected].label}`;
  } else if (!key.trim()) {
    tagEl.textContent = '';
  } else {
    tagEl.textContent = '';
  }
}

function onProviderChange(keepCustomModel = false) {
  const provider = document.getElementById('aiProviderSelect').value;
  const meta = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.gemini;
  const modelInput = document.getElementById('aiModelInput');
  const hintEl = document.getElementById('aiProviderHint');
  const customGroup = document.getElementById('customEndpointGroup');

  hintEl.textContent = meta.hint;
  modelInput.placeholder = `เช่น ${meta.defaultModel}`;
  if (!keepCustomModel || !modelInput.value.trim()) {
    modelInput.value = meta.defaultModel;
  } else {
    // Replace if current value belongs to another provider's default
    const allDefaults = Object.values(PROVIDER_DEFAULTS).map(p => p.defaultModel);
    if (allDefaults.includes(modelInput.value.trim())) {
      modelInput.value = meta.defaultModel;
    }
  }

  if (provider === 'custom') {
    customGroup.classList.remove('hidden');
  } else {
    customGroup.classList.add('hidden');
  }
}

function openApiModal() {
  const cfg = getAiConfig();
  document.getElementById('aiProviderSelect').value = cfg.provider || 'gemini';
  document.getElementById('aiModelInput').value = cfg.model || PROVIDER_DEFAULTS[cfg.provider || 'gemini'].defaultModel;
  document.getElementById('aiBaseUrlInput').value = cfg.baseUrl || '';
  document.getElementById('aiApiKeyInput').value = cfg.apiKey || '';
  document.getElementById('detectedProviderTag').textContent = '';
  onProviderChange(true);
  document.getElementById('apiModal').classList.remove('hidden');
}

function closeApiModal() {
  document.getElementById('apiModal').classList.add('hidden');
}

function saveApiKey() {
  const provider = document.getElementById('aiProviderSelect').value;
  const model = document.getElementById('aiModelInput').value.trim() || PROVIDER_DEFAULTS[provider].defaultModel;
  const baseUrl = document.getElementById('aiBaseUrlInput').value.trim();
  const apiKey = document.getElementById('aiApiKeyInput').value.trim();

  if (apiKey) {
    localStorage.setItem(API_CONFIG_STORAGE, JSON.stringify({ provider, model, baseUrl, apiKey }));
  } else {
    localStorage.removeItem(API_CONFIG_STORAGE);
  }
  localStorage.removeItem(LEGACY_API_KEY_STORAGE);
  updateApiBadge();
  closeApiModal();
}

function clearApiSettings() {
  localStorage.removeItem(API_CONFIG_STORAGE);
  localStorage.removeItem(LEGACY_API_KEY_STORAGE);
  document.getElementById('aiApiKeyInput').value = '';
  document.getElementById('detectedProviderTag').textContent = '';
  updateApiBadge();
  closeApiModal();
}

function updateApiBadge() {
  const cfg = getAiConfig();
  const badge = document.getElementById('apiStatusBadge');
  if (cfg.apiKey) {
    const label = (PROVIDER_DEFAULTS[cfg.provider] || { label: cfg.provider }).label;
    badge.className = 'hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30';
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span> ${label} Ready`;
  } else {
    badge.className = 'hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-400/30';
    badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span> Demo Mode (No API Key)';
  }
}

// ==================== 1. AI BILL OCR LOGIC ====================
const MAX_OCR_FILE_BYTES = 10 * 1024 * 1024;
const EXT_TO_MIME = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp'
};

function resolveOcrMimeType(file) {
  if (file.type && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
    return file.type;
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return EXT_TO_MIME[ext] || '';
}

function processSelectedOcrFile(file) {
  if (!file) return;
  const statusEl = document.getElementById('ocrExtractStatus');
  const previewBox = document.getElementById('ocrPreviewBox');
  const btnRunAi = document.getElementById('btnRunAi');

  const mimeType = resolveOcrMimeType(file);
  if (!mimeType) {
    statusEl.innerHTML = '<span class="text-[#AE232A] font-medium">รองรับเฉพาะไฟล์ PDF หรือรูปภาพ (JPG, PNG, WEBP)</span>';
    return;
  }
  if (file.size > MAX_OCR_FILE_BYTES) {
    statusEl.innerHTML = '<span class="text-[#AE232A] font-medium">ไฟล์มีขนาดเกิน 10MB กรุณาเลือกไฟล์ที่เล็กลง</span>';
    return;
  }

  currentOcrMimeType = mimeType;
  if (currentOcrPreviewUrl) {
    URL.revokeObjectURL(currentOcrPreviewUrl);
    currentOcrPreviewUrl = null;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    currentOcrFileBase64 = dataUrl.split(',')[1];

    if (mimeType === 'application/pdf') {
      currentOcrPreviewUrl = URL.createObjectURL(file);
      previewBox.innerHTML = `<iframe src="${currentOcrPreviewUrl}" class="w-full h-[300px] border-0" title="PDF Preview"></iframe>`;
    } else {
      previewBox.innerHTML = `<img src="${dataUrl}" alt="Bill Preview" class="max-h-[300px] object-contain" />`;
    }

    btnRunAi.disabled = false;
    statusEl.textContent = `พร้อมวิเคราะห์: ${file.name}`;
  };
  reader.onerror = function() {
    statusEl.innerHTML = '<span class="text-[#AE232A] font-medium">ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่อีกครั้ง</span>';
  };
  reader.readAsDataURL(file);
}

function handleOcrFile(event) {
  const file = event.target.files[0];
  processSelectedOcrFile(file);
  // Reset input so re-selecting the same file still triggers onchange
  event.target.value = '';
}

(function initOcrDropzone() {
  const dropzone = document.getElementById('ocrDropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(evtName => {
    dropzone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('border-[#1B3668]', 'bg-blue-50/70');
    });
  });

  ['dragleave', 'drop'].forEach(evtName => {
    dropzone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('border-[#1B3668]', 'bg-blue-50/70');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    processSelectedOcrFile(file);
  });
})();

function loadSampleBill() {
  document.getElementById('ocrPreviewBox').innerHTML = `
    <div class="p-4 bg-white border border-slate-300 rounded shadow-sm text-xs w-full m-3 font-mono text-slate-700">
      <div class="font-bold text-sm text-[#1B3668] border-b pb-1 mb-2">TAX INVOICE / ใบกำกับภาษี</div>
      <div>ผู้ขาย: บริษัท สยามเมดิคอล ซัพพลาย จำกัด</div>
      <div>เลขที่: INV-2026-1125 | วันที่: ${todayStr}</div>
      <div class="mt-2 border-t border-b py-1">
        1. ชุดตรวจ Rapid Test ทดแทนล็อตชำรุด (50 กล่อง) - 12,500.00
      </div>
      <div class="text-right mt-2">
        <div>ยอดก่อนภาษี: 12,500.00</div>
        <div>VAT 7%: 875.00</div>
        <div class="font-bold text-[#AE232A]">รวมทั้งสิ้น: 13,375.00 บาท</div>
      </div>
    </div>
  `;
  document.getElementById('ocrDocNo').value = 'INV-2026-1125';
  document.getElementById('ocrDate').value = todayStr;
  document.getElementById('ocrVendor').value = 'บริษัท สยามเมดิคอล ซัพพลาย จำกัด';
  document.getElementById('ocrDept').value = 'LAB - ห้องปฏิบัติการ';
  document.getElementById('ocrCostType').value = 'COPQ - Internal Failure';
  document.getElementById('ocrRootCause').value = 'Scrap / เวชภัณฑ์ชำรุดหมดอายุ';
  document.getElementById('ocrOwner').value = 'หัวหน้าเวร LAB (คุณนภา)';
  document.getElementById('ocrDesc').value = 'ชุดตรวจ Rapid Test ทดแทนล็อตชำรุด (50 กล่อง) - INV-2026-1125';
  document.getElementById('ocrSubtotal').value = '12500.00';
  document.getElementById('ocrVat').value = '875.00';
  document.getElementById('ocrTotal').value = '13375.00';
  document.getElementById('ocrExtractStatus').innerHTML = '<span class="text-emerald-600 font-medium">✓ โหลดข้อมูลตัวอย่างสำเร็จ</span>';
}

function extractJsonFromText(rawText) {
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('AI ไม่ได้ส่งข้อมูลกลับมาในรูปแบบ JSON ที่ถูกต้อง');
  }
}

async function callGeminiProvider(cfg, prompt) {
  const model = cfg.model || PROVIDER_DEFAULTS.gemini.defaultModel;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: currentOcrMimeType, data: currentOcrFileBase64 } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API Error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callAnthropicProvider(cfg, prompt) {
  const model = cfg.model || PROVIDER_DEFAULTS.anthropic.defaultModel;
  const isPdf = currentOcrMimeType === 'application/pdf';
  const mediaBlock = isPdf
    ? {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: currentOcrFileBase64 }
      }
    : {
        type: 'image',
        source: { type: 'base64', media_type: currentOcrMimeType, data: currentOcrFileBase64 }
      };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          mediaBlock,
          { type: 'text', text: prompt }
        ]
      }]
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Anthropic API Error');
  return data.content?.[0]?.text || '';
}

async function callOpenAiCompatibleProvider(cfg, prompt) {
  const providerMeta = PROVIDER_DEFAULTS[cfg.provider] || {};
  const isPdf = currentOcrMimeType === 'application/pdf';
  if (isPdf && cfg.provider !== 'openrouter') {
    throw new Error(`ค่าย ${providerMeta.label || cfg.provider} รองรับการส่งไฟล์รูปภาพ (JPG/PNG/WEBP) โดยตรงผ่านเบราว์เซอร์เท่านั้น กรุณาแปลง PDF เป็นรูปภาพ หรือใช้ค่าย Gemini / Claude / OpenRouter`);
  }

  let endpoint = providerMeta.endpoint || 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cfg.apiKey}`
  };

  if (cfg.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'COPQ Status Input Data Hub';
  } else if (cfg.provider === 'custom') {
    if (!cfg.baseUrl) throw new Error('กรุณาระบุ Base URL สำหรับ Custom Endpoint');
    endpoint = cfg.baseUrl;
  }

  const dataUrl = `data:${currentOcrMimeType};base64,${currentOcrFileBase64}`;
  const contentParts = [
    { type: 'text', text: prompt },
    isPdf
      ? { type: 'file', file: { filename: 'invoice.pdf', file_data: dataUrl } }
      : { type: 'image_url', image_url: { url: dataUrl } }
  ];

  const bodyPayload = {
    model: cfg.model || providerMeta.defaultModel || 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: contentParts
    }]
  };

  if (['openai', 'qwen', 'deepseek'].includes(cfg.provider)) {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload)
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'API Error');
  return data.choices?.[0]?.message?.content || '';
}

async function processBillWithAI() {
  const cfg = getAiConfig();
  const statusEl = document.getElementById('ocrExtractStatus');
  const btn = document.getElementById('btnRunAi');

  if (!cfg.apiKey) {
    alert('กรุณาตั้งค่า AI API Key ที่มุมขวาบนก่อน หรือกดปุ่ม "โหลดบิลตัวอย่าง" เพื่อทดสอบครับ');
    openApiModal();
    return;
  }

  if (!currentOcrFileBase64) return;

  const providerLabel = (PROVIDER_DEFAULTS[cfg.provider] || { label: cfg.provider }).label;
  btn.disabled = true;
  statusEl.innerHTML = `<span class="text-blue-600 animate-pulse">กำลังอ่านเอกสารด้วย ${providerLabel} (${cfg.model})...</span>`;

  const prompt = `Extract invoice/bill data for a hospital COPQ (Cost of Poor Quality) system. Return ONLY valid JSON with these exact keys (no markdown, no explanation):
  {
    "docNo": "string",
    "date": "YYYY-MM-DD",
    "vendor": "string",
    "description": "string summary of items in Thai",
    "subtotal": number,
    "vat": number,
    "total": number
  }`;

  try {
    let rawText = '';
    if (cfg.provider === 'gemini') {
      rawText = await callGeminiProvider(cfg, prompt);
    } else if (cfg.provider === 'anthropic') {
      rawText = await callAnthropicProvider(cfg, prompt);
    } else {
      rawText = await callOpenAiCompatibleProvider(cfg, prompt);
    }

    const parsed = extractJsonFromText(rawText);

    document.getElementById('ocrDocNo').value = parsed.docNo || '';
    if (parsed.date) document.getElementById('ocrDate').value = parsed.date;
    document.getElementById('ocrVendor').value = parsed.vendor || '';
    document.getElementById('ocrDesc').value = parsed.description || '';
    document.getElementById('ocrSubtotal').value = parsed.subtotal || 0;
    document.getElementById('ocrVat').value = parsed.vat || 0;
    document.getElementById('ocrTotal').value = parsed.total || 0;

    statusEl.innerHTML = `<span class="text-emerald-600 font-medium">✓ สกัดข้อมูลด้วย ${providerLabel} สำเร็จ</span>`;
  } catch (err) {
    console.error(err);
    statusEl.innerHTML = `<span class="text-[#AE232A]">เกิดข้อผิดพลาด (${providerLabel}): ${err.message}</span>`;
  } finally {
    btn.disabled = false;
  }
}

function calcOcrVat() {
  const sub = parseFloat(document.getElementById('ocrSubtotal').value) || 0;
  const vat = +(sub * 0.07).toFixed(2);
  document.getElementById('ocrVat').value = vat;
  document.getElementById('ocrTotal').value = +(sub + vat).toFixed(2);
}

function saveOcrRecord(e) {
  e.preventDefault();
  const newRec = {
    id: generateCaseId(),
    date: document.getElementById('ocrDate').value,
    source: 'AI Bill OCR',
    dept: document.getElementById('ocrDept').value,
    costType: document.getElementById('ocrCostType').value,
    rootCause: document.getElementById('ocrRootCause').value,
    desc: `[${document.getElementById('ocrDocNo').value}] ${document.getElementById('ocrVendor').value} - ${document.getElementById('ocrDesc').value}`,
    amount: parseFloat(document.getElementById('ocrTotal').value) || 0,
    owner: document.getElementById('ocrOwner').value,
    notified: true
  };
  addRecord(newRec);
  document.getElementById('ocrForm').reset();
  document.getElementById('ocrDate').value = todayStr;
}

// ==================== 2. EXCEL BATCH IMPORT LOGIC ====================
function downloadExcelTemplate() {
  const templateData = [
    {
      'Date (YYYY-MM-DD)': todayStr,
      'Department': 'IPD - ผู้ป่วยใน',
      'Cost_Type': 'COPQ - Internal Failure',
      'Root_Cause': 'Scrap / เวชภัณฑ์ชำรุดหมดอายุ',
      'Description': 'เวชภัณฑ์ปลอดเชื้อหมดอายุในคลังย่อย Ward 4',
      'Amount_THB': 11500,
      'Owner': 'หัวหน้าหอผู้ป่วย Ward 4'
    },
    {
      'Date (YYYY-MM-DD)': todayStr,
      'Department': 'Pharmacy - เภสัชกรรม',
      'Cost_Type': 'COGQ - Prevention',
      'Root_Cause': 'Quality Audit / การตรวจสอบคุณภาพ',
      'Description': 'ค่าสอบเทียบตู้เย็นเก็บวัคซีนประจำเดือน',
      'Amount_THB': 4500,
      'Owner': 'เภสัชกรคลังยา'
    }
  ];
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'COPQ_Template');
  XLSX.writeFile(wb, 'COPQ_Input_Template.xlsx');
}

function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonRows = XLSX.utils.sheet_to_json(firstSheet);

    stagedExcelRows = jsonRows.map(row => ({
      date: row['Date (YYYY-MM-DD)'] || row['Date'] || todayStr,
      dept: row['Department'] || 'Quality Center - ศูนย์คุณภาพ',
      costType: row['Cost_Type'] || 'COPQ - Internal Failure',
      rootCause: row['Root_Cause'] || 'Rework / ทำซ้ำ',
      desc: row['Description'] || '-',
      amount: parseFloat(row['Amount_THB'] || row['Amount'] || 0),
      owner: row['Owner'] || 'Quality Center Team'
    }));

    renderExcelStaging();
  };
  reader.readAsArrayBuffer(file);
}

function renderExcelStaging() {
  const area = document.getElementById('excelStagingArea');
  const tbody = document.getElementById('excelStagingBody');
  area.classList.remove('hidden');

  let highRisk = 0;
  tbody.innerHTML = stagedExcelRows.map(r => {
    const isHigh = r.amount > 10000;
    if (isHigh) highRisk++;
    return `
      <tr class="${isHigh ? 'bg-red-50/70' : ''}">
        <td class="px-3 py-2">${r.date}</td>
        <td class="px-3 py-2">${r.dept}</td>
        <td class="px-3 py-2">${r.costType}</td>
        <td class="px-3 py-2">${r.rootCause}</td>
        <td class="px-3 py-2">${r.desc}</td>
        <td class="px-3 py-2 text-right font-semibold ${isHigh ? 'text-[#AE232A]' : ''}">${r.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
        <td class="px-3 py-2">${r.owner}</td>
        <td class="px-3 py-2 text-center">
          ${isHigh
            ? '<span class="px-2 py-0.5 rounded bg-red-100 text-[#AE232A] font-medium">Alert (>10k)</span>'
            : '<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">พร้อมนำเข้า</span>'}
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('excelRowCount').textContent = stagedExcelRows.length;
  document.getElementById('excelHighRiskCount').textContent = highRisk;
}

function commitExcelBatch() {
  if (!stagedExcelRows.length) return;
  stagedExcelRows.forEach(r => {
    records.unshift({
      id: generateCaseId(),
      date: r.date,
      source: 'Excel Batch',
      dept: r.dept,
      costType: r.costType,
      rootCause: r.rootCause,
      desc: r.desc,
      amount: r.amount,
      owner: r.owner,
      notified: true
    });
  });
  saveAndRender();
  triggerOutlookToast(`นำเข้าข้อมูล Excel จำนวน ${stagedExcelRows.length} รายการ และส่งแจ้งเตือนผู้รับผิดชอบแล้ว`);
  stagedExcelRows = [];
  document.getElementById('excelStagingArea').classList.add('hidden');
  document.getElementById('excelFileInput').value = '';
}

// ==================== 3. MANUAL CASE ENTRY LOGIC ====================
function calcManualTotal() {
  const mat = parseFloat(document.getElementById('manMaterialCost').value) || 0;
  const hrs = parseFloat(document.getElementById('manReworkHours').value) || 0;
  const rate = parseFloat(document.getElementById('manHourlyRate').value) || 0;
  document.getElementById('manTotalCost').value = +(mat + (hrs * rate)).toFixed(2);
}

function saveManualRecord(e) {
  e.preventDefault();
  const newRec = {
    id: generateCaseId(),
    date: document.getElementById('manDate').value,
    source: 'Manual Entry',
    dept: document.getElementById('manDept').value,
    costType: document.getElementById('manCostType').value,
    rootCause: document.getElementById('manRootCause').value,
    desc: document.getElementById('manDesc').value,
    amount: parseFloat(document.getElementById('manTotalCost').value) || 0,
    owner: document.getElementById('manOwner').value,
    notified: true
  };
  addRecord(newRec);
  document.getElementById('manualForm').reset();
  document.getElementById('manDate').value = todayStr;
  document.getElementById('manHourlyRate').value = 350;
}

// ==================== CENTRAL HUB & EXPORT ====================
function generateCaseId() {
  const num = String(records.length + 1).padStart(3, '0');
  return `COPQ-2026-${num}`;
}

function addRecord(rec) {
  records.unshift(rec);
  saveAndRender();
  triggerOutlookToast(`บันทึก ${rec.id} สำเร็จ! ส่งอีเมลแจ้งเตือนไปยัง "${rec.owner}" เรียบร้อยแล้ว`);
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  renderHubTable();
}

function renderHubTable() {
  const tbody = document.getElementById('hubTableBody');
  let copqSum = 0;
  let cogqSum = 0;
  let alertCount = 0;

  tbody.innerHTML = records.map(r => {
    const isCopq = r.costType.startsWith('COPQ');
    if (isCopq) copqSum += r.amount;
    else cogqSum += r.amount;
    if (r.amount > 10000) alertCount++;

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-3 py-2.5 font-semibold text-[#1B3668] whitespace-nowrap">${r.id}</td>
        <td class="px-3 py-2.5 whitespace-nowrap">${r.date}</td>
        <td class="px-3 py-2.5 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">${r.source}</span>
        </td>
        <td class="px-3 py-2.5">${r.dept}</td>
        <td class="px-3 py-2.5">
          <span class="px-2 py-0.5 rounded text-[11px] font-medium ${isCopq ? 'bg-red-50 text-[#AE232A]' : 'bg-blue-50 text-[#1B3668]'}">
            ${r.costType}
          </span>
        </td>
        <td class="px-3 py-2.5 max-w-xs">
          <div class="font-medium text-slate-800 truncate" title="${r.desc}">${r.desc}</div>
          <div class="text-[11px] text-slate-500">${r.rootCause}</div>
        </td>
        <td class="px-3 py-2.5 text-right font-bold ${r.amount > 10000 ? 'text-[#AE232A]' : 'text-slate-800'}">
          ${r.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </td>
        <td class="px-3 py-2.5">${r.owner}</td>
        <td class="px-3 py-2.5 text-center whitespace-nowrap">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Outlook Sent
          </span>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('kpiTotalCases').textContent = records.length;
  document.getElementById('kpiCopqAmount').textContent = '฿' + copqSum.toLocaleString('th-TH', { minimumFractionDigits: 2 });
  document.getElementById('kpiCogqAmount').textContent = '฿' + cogqSum.toLocaleString('th-TH', { minimumFractionDigits: 2 });
  document.getElementById('kpiAlertCases').textContent = alertCount;
}

function triggerOutlookToast(msg) {
  const toast = document.getElementById('outlookToast');
  document.getElementById('outlookToastMsg').textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 5000);
}

function exportToExcel() {
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'COPQ_Data_Hub');
  XLSX.writeFile(wb, `COPQ_Status_Hub_${todayStr}.xlsx`);
}

function exportToCSV() {
  const headers = ['Case_ID', 'Date', 'Input_Source', 'Department', 'Cost_Type', 'Root_Cause', 'Description', 'Amount_THB', 'Owner', 'Outlook_Notified'];
  const csvRows = [headers.join(',')];
  records.forEach(r => {
    const row = [
      r.id,
      r.date,
      `"${r.source}"`,
      `"${r.dept}"`,
      `"${r.costType}"`,
      `"${r.rootCause}"`,
      `"${r.desc.replace(/"/g, '""')}"`,
      r.amount,
      `"${r.owner}"`,
      r.notified
    ];
    csvRows.push(row.join(','));
  });
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `COPQ_Status_PowerBI_${todayStr}.csv`;
  link.click();
}

function clearAllRecords() {
  if (confirm('ต้องการล้างข้อมูลในตารางทั้งหมดใช่หรือไม่?')) {
    records = [];
    saveAndRender();
  }
}
