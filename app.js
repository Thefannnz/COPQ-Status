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

let ocrSelectedFiles = []; // Array of { name, mimeType, base64, previewUrl }
let stagedOcrBills = [];   // Array of extracted bill objects
let stagedExcelRows = [];

const DEPT_OPTIONS = [
  'OPD - ผู้ป่วยนอก',
  'IPD - ผู้ป่วยใน',
  'ER - ฉุกเฉิน',
  'LAB - ห้องปฏิบัติการ',
  'Pharmacy - เภสัชกรรม',
  'OR - ห้องผ่าตัด',
  'Quality Center - ศูนย์คุณภาพ'
];

const COST_TYPE_OPTIONS = [
  'COPQ - Internal Failure',
  'COPQ - External Failure',
  'COGQ - Prevention',
  'COGQ - Appraisal'
];

const ROOT_CAUSE_OPTIONS = [
  'Rework / ทำซ้ำ',
  'Scrap / เวชภัณฑ์ชำรุดหมดอายุ',
  'Equipment Failure / เครื่องมือขัดข้อง',
  'Process Delay / ความล่าช้าในกระบวนการ',
  'Quality Audit / การตรวจสอบคุณภาพ'
];

// Set default dates to today
const todayStr = new Date().toISOString().split('T')[0];
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

// ==================== 1. AI BILL OCR LOGIC (MULTI-BILL BATCH) ====================
const MAX_OCR_FILE_BYTES = 25 * 1024 * 1024;
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

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      resolve({
        dataUrl,
        base64: dataUrl.split(',')[1]
      });
    };
    reader.onerror = () => reject(new Error(`ไม่สามารถอ่านไฟล์ ${file.name} ได้`));
    reader.readAsDataURL(file);
  });
}

async function processSelectedOcrFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const statusEl = document.getElementById('ocrExtractStatus');
  const btnRunAi = document.getElementById('btnRunAi');

  let addedCount = 0;
  for (const file of files) {
    const mimeType = resolveOcrMimeType(file);
    if (!mimeType) {
      statusEl.innerHTML = `<span class="text-[#AE232A] font-medium">ข้ามไฟล์ ${file.name} (รองรับเฉพาะ PDF หรือรูปภาพ)</span>`;
      continue;
    }
    if (file.size > MAX_OCR_FILE_BYTES) {
      statusEl.innerHTML = `<span class="text-[#AE232A] font-medium">ไฟล์ ${file.name} มีขนาดเกิน 25MB</span>`;
      continue;
    }

    try {
      const { dataUrl, base64 } = await readFileAsBase64(file);
      const previewUrl = mimeType === 'application/pdf' ? URL.createObjectURL(file) : dataUrl;
      ocrSelectedFiles.push({
        name: file.name,
        mimeType,
        base64,
        previewUrl
      });
      addedCount++;
    } catch (err) {
      statusEl.innerHTML = `<span class="text-[#AE232A] font-medium">${err.message}</span>`;
    }
  }

  if (ocrSelectedFiles.length > 0) {
    renderOcrFileQueue();
    previewOcrFileAt(ocrSelectedFiles.length - 1);
    btnRunAi.disabled = false;
    statusEl.textContent = `พร้อมวิเคราะห์ทั้งหมด ${ocrSelectedFiles.length} ไฟล์ (คลิกปุ่มด้านล่างเพื่อแยกบิลทั้งหมด)`;
  }
}

function renderOcrFileQueue() {
  const box = document.getElementById('ocrFileListBox');
  if (!ocrSelectedFiles.length) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }
  box.classList.remove('hidden');
  box.innerHTML = ocrSelectedFiles.map((f, idx) => `
    <div class="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded border border-slate-200">
      <button type="button" onclick="previewOcrFileAt(${idx})" class="text-left truncate font-medium text-[#1B3668] hover:underline flex-1 pr-2">
        ${idx + 1}. ${escapeHtml(f.name)}
      </button>
      <button type="button" onclick="removeOcrFileAt(${idx})" class="text-slate-400 hover:text-[#AE232A] px-1" title="ลบไฟล์">✕</button>
    </div>
  `).join('');
}

function previewOcrFileAt(idx) {
  const fileObj = ocrSelectedFiles[idx];
  const previewBox = document.getElementById('ocrPreviewBox');
  if (!fileObj) {
    previewBox.innerHTML = '<p class="text-xs text-slate-400">ตัวอย่างเอกสารจะแสดงที่นี่</p>';
    return;
  }
  if (fileObj.mimeType === 'application/pdf') {
    previewBox.innerHTML = `<iframe src="${fileObj.previewUrl}" class="w-full h-[250px] border-0" title="PDF Preview"></iframe>`;
  } else {
    previewBox.innerHTML = `<img src="${fileObj.previewUrl}" alt="Bill Preview" class="max-h-[250px] object-contain" />`;
  }
}

function removeOcrFileAt(idx) {
  const removed = ocrSelectedFiles.splice(idx, 1)[0];
  if (removed && removed.mimeType === 'application/pdf' && removed.previewUrl) {
    URL.revokeObjectURL(removed.previewUrl);
  }
  renderOcrFileQueue();
  if (ocrSelectedFiles.length > 0) {
    previewOcrFileAt(0);
    document.getElementById('ocrExtractStatus').textContent = `พร้อมวิเคราะห์ทั้งหมด ${ocrSelectedFiles.length} ไฟล์`;
  } else {
    previewOcrFileAt(-1);
    document.getElementById('btnRunAi').disabled = true;
    document.getElementById('ocrExtractStatus').textContent = 'รอการนำเข้าข้อมูล';
  }
}

function handleOcrFile(event) {
  processSelectedOcrFiles(event.target.files);
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
    if (e.dataTransfer && e.dataTransfer.files) {
      processSelectedOcrFiles(e.dataTransfer.files);
    }
  });
})();

function loadSampleMultiBills() {
  document.getElementById('ocrPreviewBox').innerHTML = `
    <div class="p-3.5 bg-white border border-slate-300 rounded shadow-sm text-xs w-full m-3 font-mono text-slate-700 space-y-1.5">
      <div class="font-bold text-sm text-[#1B3668] border-b pb-1">BATCH PDF SAMPLE (3 ใบกำกับภาษีใน 1 ไฟล์)</div>
      <div>• หน้า 1: INV-2026-1125 | LAB - ห้องปฏิบัติการ | 13,375.00 ฿</div>
      <div>• หน้า 2: INV-2026-1128 | Pharmacy - เภสัชกรรม | 8,560.00 ฿</div>
      <div>• หน้า 3: INV-2026-1130 | OR - ห้องผ่าตัด | 24,075.00 ฿</div>
    </div>
  `;

  stagedOcrBills = [
    {
      docNo: 'INV-2026-1125',
      date: todayStr,
      vendor: 'บริษัท สยามเมดิคอล ซัพพลาย จำกัด',
      dept: 'LAB - ห้องปฏิบัติการ',
      costType: 'COPQ - Internal Failure',
      rootCause: 'Scrap / เวชภัณฑ์ชำรุดหมดอายุ',
      desc: 'ชุดตรวจ Rapid Test ทดแทนล็อตชำรุด (50 กล่อง)',
      subtotal: 12500,
      vat: 875,
      total: 13375.00,
      owner: 'หัวหน้าเวร LAB (คุณนภา)'
    },
    {
      docNo: 'INV-2026-1128',
      date: todayStr,
      vendor: 'บริษัท ฟาร์มาแคร์ ดิสทริบิวชั่น จำกัด',
      dept: 'Pharmacy - เภสัชกรรม',
      costType: 'COPQ - Internal Failure',
      rootCause: 'Scrap / เวชภัณฑ์ชำรุดหมดอายุ',
      desc: 'เวชภัณฑ์ยาฉีดทดแทนขวดที่แตกเสียหายระหว่างจัดเตรียม',
      subtotal: 8000,
      vat: 560,
      total: 8560.00,
      owner: 'เภสัชกรหัวหน้าเวร (คุณธนา)'
    },
    {
      docNo: 'INV-2026-1130',
      date: todayStr,
      vendor: 'บริษัท เซอร์จิคอล เทค จำกัด',
      dept: 'OR - ห้องผ่าตัด',
      costType: 'COPQ - Internal Failure',
      rootCause: 'Equipment Failure / เครื่องมือขัดข้อง',
      desc: 'ค่าซ่อมด่วนและอะไหล่ชุดเครื่องจี้ไฟฟ้าห้องผ่าตัด 2',
      subtotal: 22500,
      vat: 1575,
      total: 24075.00,
      owner: 'หัวหน้าพยาบาล OR (คุณสุดา)'
    }
  ];

  renderOcrStagingTable();
  document.getElementById('ocrExtractStatus').innerHTML = '<span class="text-emerald-600 font-medium">✓ โหลดตัวอย่าง 3 บิลแยกตามแผนกสำเร็จ</span>';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeExtractedBills(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('เซิร์ฟเวอร์ตอบกลับมาเป็นค่าว่าง (ตรวจสอบชื่อ Model ID หรือโควตา API)');
  }
  const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  let parsed = null;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Try extracting JSON object or array
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    const candidate = objMatch ? objMatch[0] : (arrMatch ? arrMatch[0] : null);
    if (candidate) {
      try {
        parsed = JSON.parse(candidate);
      } catch (_) {}
    }
  }

  if (!parsed) {
    throw new Error(`AI ตอบกลับไม่ใช่ JSON: "${cleaned.slice(0, 150)}"`);
  }

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.bills)) return parsed.bills;
  if (Array.isArray(parsed.invoices)) return parsed.invoices;
  if (Array.isArray(parsed.items)) return parsed.items;
  if (typeof parsed === 'object') return [parsed];
  return [];
}

function mapDeptSuggestion(rawDept) {
  if (!rawDept) return document.getElementById('ocrDefaultDept').value;
  const upper = String(rawDept).toUpperCase();
  if (upper.includes('LAB') || upper.includes('ปฏิบัติการ')) return 'LAB - ห้องปฏิบัติการ';
  if (upper.includes('PHARM') || upper.includes('เภสัช') || upper.includes('ยา')) return 'Pharmacy - เภสัชกรรม';
  if (upper.includes('OR') || upper.includes('ผ่าตัด')) return 'OR - ห้องผ่าตัด';
  if (upper.includes('ER') || upper.includes('ฉุกเฉิน')) return 'ER - ฉุกเฉิน';
  if (upper.includes('IPD') || upper.includes('ผู้ป่วยใน') || upper.includes('WARD')) return 'IPD - ผู้ป่วยใน';
  if (upper.includes('OPD') || upper.includes('ผู้ป่วยนอก')) return 'OPD - ผู้ป่วยนอก';
  if (upper.includes('QUALITY') || upper.includes('คุณภาพ')) return 'Quality Center - ศูนย์คุณภาพ';
  return document.getElementById('ocrDefaultDept').value;
}

function mapRootCauseSuggestion(rawCause) {
  if (!rawCause) return document.getElementById('ocrDefaultRootCause').value;
  const s = String(rawCause).toLowerCase();
  if (s.includes('scrap') || s.includes('หมดอายุ') || s.includes('ชำรุด') || s.includes('แตก')) return 'Scrap / เวชภัณฑ์ชำรุดหมดอายุ';
  if (s.includes('equip') || s.includes('เครื่องมือ') || s.includes('ซ่อม') || s.includes('ขัดข้อง')) return 'Equipment Failure / เครื่องมือขัดข้อง';
  if (s.includes('delay') || s.includes('ล่าช้า')) return 'Process Delay / ความล่าช้าในกระบวนการ';
  if (s.includes('audit') || s.includes('สอบเทียบ') || s.includes('ตรวจ')) return 'Quality Audit / การตรวจสอบคุณภาพ';
  if (s.includes('rework') || s.includes('ทำซ้ำ')) return 'Rework / ทำซ้ำ';
  return document.getElementById('ocrDefaultRootCause').value;
}

async function callGeminiProvider(cfg, prompt, fileObj) {
  const model = cfg.model || PROVIDER_DEFAULTS.gemini.defaultModel;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: fileObj.mimeType, data: fileObj.base64 } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API Error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callAnthropicProvider(cfg, prompt, fileObj) {
  const model = cfg.model || PROVIDER_DEFAULTS.anthropic.defaultModel;
  const isPdf = fileObj.mimeType === 'application/pdf';
  const mediaBlock = isPdf
    ? {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: fileObj.base64 }
      }
    : {
        type: 'image',
        source: { type: 'base64', media_type: fileObj.mimeType, data: fileObj.base64 }
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
      max_tokens: 4096,
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

async function callOpenAiCompatibleProvider(cfg, prompt, fileObj) {
  const providerMeta = PROVIDER_DEFAULTS[cfg.provider] || {};
  const isPdf = fileObj.mimeType === 'application/pdf';
  if (isPdf && !['openrouter', 'custom'].includes(cfg.provider)) {
    throw new Error(`ค่าย ${providerMeta.label || cfg.provider} รองรับการส่งไฟล์รูปภาพ (JPG/PNG/WEBP) โดยตรงผ่านเบราว์เซอร์เท่านั้น กรุณาใช้ค่าย Gemini / Claude / OpenRouter / Custom สำหรับไฟล์ PDF`);
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

  const dataUrl = `data:${fileObj.mimeType};base64,${fileObj.base64}`;
  const contentParts = [
    { type: 'text', text: prompt },
    isPdf
      ? { type: 'file', file: { filename: fileObj.name || 'invoices.pdf', file_data: dataUrl } }
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
    alert('กรุณาตั้งค่า AI API Key ที่มุมขวาบนก่อน หรือกดปุ่ม "โหลดตัวอย่าง 3 บิล" เพื่อทดสอบครับ');
    openApiModal();
    return;
  }

  if (!ocrSelectedFiles.length) return;

  const providerLabel = (PROVIDER_DEFAULTS[cfg.provider] || { label: cfg.provider }).label;
  const defaultDept = document.getElementById('ocrDefaultDept').value;
  const defaultCostType = document.getElementById('ocrDefaultCostType').value;
  const defaultRootCause = document.getElementById('ocrDefaultRootCause').value;
  const defaultOwner = document.getElementById('ocrDefaultOwner').value.trim() || 'หัวหน้าหน่วยงานที่เกี่ยวข้อง';

  btn.disabled = true;
  const allExtracted = [];

  const prompt = `You are a hospital Quality Center (COPQ) invoice OCR parser.
This document/file may contain ONE or MULTIPLE invoices/bills (for example, 10-20 invoices combined in a multi-page PDF).
Extract EVERY SINGLE invoice/bill separately. Do NOT merge multiple invoices into one record.
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "bills": [
    {
      "docNo": "invoice or tax invoice number",
      "date": "YYYY-MM-DD",
      "vendor": "vendor or supplier name",
      "department": "guess hospital department from items: OPD, IPD, ER, LAB, Pharmacy, OR, or Quality Center",
      "rootCause": "guess cause: Rework, Scrap, Equipment Failure, Process Delay, or Quality Audit",
      "description": "concise summary of items in Thai",
      "subtotal": 0,
      "vat": 0,
      "total": 0
    }
  ]
}`;

  try {
    for (let i = 0; i < ocrSelectedFiles.length; i++) {
      const fileObj = ocrSelectedFiles[i];
      statusEl.innerHTML = `<span class="text-blue-600 animate-pulse">กำลังวิเคราะห์ไฟล์ ${i + 1}/${ocrSelectedFiles.length} (${escapeHtml(fileObj.name)}) ด้วย ${providerLabel}...</span>`;

      let rawText = '';
      if (cfg.provider === 'gemini') {
        rawText = await callGeminiProvider(cfg, prompt, fileObj);
      } else if (cfg.provider === 'anthropic') {
        rawText = await callAnthropicProvider(cfg, prompt, fileObj);
      } else {
        rawText = await callOpenAiCompatibleProvider(cfg, prompt, fileObj);
      }

      const billsFromFile = normalizeExtractedBills(rawText);
      billsFromFile.forEach((b, bIdx) => {
        allExtracted.push({
          docNo: b.docNo || `DOC-${i + 1}-${bIdx + 1}`,
          date: b.date || todayStr,
          vendor: b.vendor || '-',
          dept: b.department ? mapDeptSuggestion(b.department) : defaultDept,
          costType: defaultCostType,
          rootCause: b.rootCause ? mapRootCauseSuggestion(b.rootCause) : defaultRootCause,
          desc: b.description || '-',
          subtotal: parseFloat(b.subtotal) || 0,
          vat: parseFloat(b.vat) || 0,
          total: parseFloat(b.total) || 0,
          owner: defaultOwner
        });
      });
    }

    if (!allExtracted.length) {
      throw new Error('ไม่พบรายการบิลในเอกสารที่อัปโหลด');
    }

    stagedOcrBills = stagedOcrBills.concat(allExtracted);
    renderOcrStagingTable();
    statusEl.innerHTML = `<span class="text-emerald-600 font-medium">✓ สกัดข้อมูลสำเร็จทั้งหมด ${allExtracted.length} บิล จาก ${ocrSelectedFiles.length} ไฟล์</span>`;
  } catch (err) {
    console.error(err);
    statusEl.innerHTML = `<span class="text-[#AE232A]">เกิดข้อผิดพลาด (${providerLabel}): ${escapeHtml(err.message)}</span>`;
  } finally {
    btn.disabled = false;
  }
}

function renderOcrStagingTable() {
  const section = document.getElementById('ocrStagingSection');
  const tbody = document.getElementById('ocrStagingTableBody');

  if (!stagedOcrBills.length) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');

  tbody.innerHTML = stagedOcrBills.map((bill, idx) => {
    const deptOptionsHtml = DEPT_OPTIONS.map(d =>
      `<option value="${d}" ${bill.dept === d ? 'selected' : ''}>${d}</option>`
    ).join('');

    const costOptionsHtml = COST_TYPE_OPTIONS.map(c =>
      `<option value="${c}" ${bill.costType === c ? 'selected' : ''}>${c}</option>`
    ).join('');

    const causeOptionsHtml = ROOT_CAUSE_OPTIONS.map(rc =>
      `<option value="${rc}" ${bill.rootCause === rc ? 'selected' : ''}>${rc}</option>`
    ).join('');

    return `
      <tr class="hover:bg-slate-50">
        <td class="px-2.5 py-2 text-center font-semibold text-slate-500">${idx + 1}</td>
        <td class="px-2.5 py-2">
          <input type="text" value="${escapeHtml(bill.docNo)}" onchange="updateStagedBill(${idx}, 'docNo', this.value)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white" />
        </td>
        <td class="px-2.5 py-2">
          <input type="date" value="${escapeHtml(bill.date)}" onchange="updateStagedBill(${idx}, 'date', this.value)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white" />
        </td>
        <td class="px-2.5 py-2">
          <input type="text" value="${escapeHtml(bill.vendor)}" onchange="updateStagedBill(${idx}, 'vendor', this.value)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white" />
        </td>
        <td class="px-2.5 py-2">
          <select onchange="updateStagedBill(${idx}, 'dept', this.value)"
            class="w-full px-2 py-1 text-xs font-medium text-[#1B3668] border border-blue-300 rounded bg-blue-50/40">
            ${deptOptionsHtml}
          </select>
        </td>
        <td class="px-2.5 py-2">
          <select onchange="updateStagedBill(${idx}, 'costType', this.value)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white">
            ${costOptionsHtml}
          </select>
        </td>
        <td class="px-2.5 py-2">
          <select onchange="updateStagedBill(${idx}, 'rootCause', this.value)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white">
            ${causeOptionsHtml}
          </select>
        </td>
        <td class="px-2.5 py-2">
          <input type="text" value="${escapeHtml(bill.desc)}" onchange="updateStagedBill(${idx}, 'desc', this.value)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white" />
        </td>
        <td class="px-2.5 py-2">
          <input type="number" step="0.01" value="${bill.total}" onchange="updateStagedBill(${idx}, 'total', parseFloat(this.value) || 0)"
            class="w-full px-2 py-1 text-xs text-right font-bold text-[#AE232A] border border-slate-300 rounded bg-white" />
        </td>
        <td class="px-2.5 py-2">
          <input type="text" value="${escapeHtml(bill.owner)}" onchange="updateStagedBill(${idx}, 'owner', this.value)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white" />
        </td>
        <td class="px-2.5 py-2 text-center">
          <button type="button" onclick="removeStagedBill(${idx})" class="text-slate-400 hover:text-[#AE232A] font-bold" title="ลบรายการนี้">✕</button>
        </td>
      </tr>
    `;
  }).join('');

  updateOcrStagingSummary();
}

function updateStagedBill(idx, field, value) {
  if (!stagedOcrBills[idx]) return;
  stagedOcrBills[idx][field] = value;
  updateOcrStagingSummary();
}

function updateOcrStagingSummary() {
  document.getElementById('ocrExtractedCount').textContent = stagedOcrBills.length;
  let totalSum = 0;
  const deptCounts = {};

  stagedOcrBills.forEach(b => {
    totalSum += (parseFloat(b.total) || 0);
    const shortDept = (b.dept || 'อื่นๆ').split(' - ')[0];
    deptCounts[shortDept] = (deptCounts[shortDept] || 0) + 1;
  });

  document.getElementById('ocrBatchTotalAmount').textContent =
    '฿' + totalSum.toLocaleString('th-TH', { minimumFractionDigits: 2 });

  const breakdownText = Object.entries(deptCounts)
    .map(([dept, count]) => `${dept} (${count} บิล)`)
    .join(', ');
  document.getElementById('ocrDeptBreakdown').textContent = breakdownText || '-';
}

function addEmptyOcrRow() {
  stagedOcrBills.push({
    docNo: `INV-${todayStr.replace(/-/g, '')}-${stagedOcrBills.length + 1}`,
    date: todayStr,
    vendor: '',
    dept: document.getElementById('ocrDefaultDept').value,
    costType: document.getElementById('ocrDefaultCostType').value,
    rootCause: document.getElementById('ocrDefaultRootCause').value,
    desc: '',
    subtotal: 0,
    vat: 0,
    total: 0,
    owner: document.getElementById('ocrDefaultOwner').value.trim() || 'หัวหน้าหน่วยงานที่เกี่ยวข้อง'
  });
  renderOcrStagingTable();
}

function removeStagedBill(idx) {
  stagedOcrBills.splice(idx, 1);
  renderOcrStagingTable();
}

function clearOcrStaging() {
  stagedOcrBills = [];
  renderOcrStagingTable();
  document.getElementById('ocrExtractStatus').textContent = 'ล้างรายการที่สกัดแล้ว';
}

function saveAllOcrRecords() {
  if (!stagedOcrBills.length) return;

  const deptSet = new Set();
  // Insert in reverse so order matches top-to-bottom in Hub
  for (let i = stagedOcrBills.length - 1; i >= 0; i--) {
    const b = stagedOcrBills[i];
    deptSet.add((b.dept || '').split(' - ')[0]);
    records.unshift({
      id: generateCaseId(),
      date: b.date || todayStr,
      source: 'AI Bill OCR',
      dept: b.dept,
      costType: b.costType,
      rootCause: b.rootCause,
      desc: `[${b.docNo}] ${b.vendor} - ${b.desc}`,
      amount: parseFloat(b.total) || 0,
      owner: b.owner || 'หัวหน้าหน่วยงานที่เกี่ยวข้อง',
      notified: true
    });
  }

  const savedCount = stagedOcrBills.length;
  saveAndRender();
  triggerOutlookToast(`บันทึกบิลจาก AI OCR จำนวน ${savedCount} รายการ (แยก ${deptSet.size} แผนก) เข้าสู่ Central Hub เรียบร้อยแล้ว`);

  stagedOcrBills = [];
  renderOcrStagingTable();
  document.getElementById('ocrExtractStatus').innerHTML = `<span class="text-emerald-600 font-medium">✓ บันทึกทั้งหมด ${savedCount} บิลลง Hub เรียบร้อย</span>`;
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
