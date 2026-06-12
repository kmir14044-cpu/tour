const TDP_SHEETS_TIMEOUT = 12000;

function sheetsConfig() {
  const d = getStore();
  return {
    url: String(d.settings?.sheetsUrl || '').trim(),
    token: String(d.settings?.sheetsToken || '').trim()
  };
}

function sheetsEnabled() {
  return /^https:\/\/script\.google\.com\/macros\/s\//.test(sheetsConfig().url);
}

function sheetRequest(action, payload = {}) {
  const cfg = sheetsConfig();
  if (!cfg.url) return Promise.reject(new Error('Google Sheets Web App URL is not configured.'));
  return new Promise((resolve, reject) => {
    const callback = `tdpSheetCb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => cleanup(() => reject(new Error('Google Sheets request timed out.'))), TDP_SHEETS_TIMEOUT);
    function cleanup(done) {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
      done();
    }
    window[callback] = response => cleanup(() => {
      if (response && response.ok) resolve(response);
      else reject(new Error(response?.error || 'Google Sheets request failed.'));
    });
    const params = new URLSearchParams({
      action,
      callback,
      token: cfg.token,
      payload: JSON.stringify(payload)
    });
    script.onerror = () => cleanup(() => reject(new Error('Could not connect to Google Sheets Web App.')));
    script.src = `${cfg.url}${cfg.url.includes('?') ? '&' : '?'}${params.toString()}`;
    document.head.appendChild(script);
  });
}

function verifiedLead(lead) {
  return {
    ...lead,
    name: String(lead.name || '').trim(),
    email: String(lead.email || '').trim().toLowerCase(),
    phone: String(lead.phone || '').trim(),
    status: lead.status || 'New',
    verified: 'Yes',
    source: 'Trip Designer'
  };
}

async function syncLeadToSheet(lead) {
  if (!sheetsEnabled()) return { ok: false, skipped: true };
  return sheetRequest('addLead', verifiedLead(lead));
}

async function loadSheetData() {
  if (!sheetsEnabled()) return null;
  const response = await sheetRequest('list', {});
  return response.data || null;
}

async function updateSheetLeadStatus(id, status) {
  if (!sheetsEnabled()) return { ok: false, skipped: true };
  return sheetRequest('updateLeadStatus', { id, status });
}

async function syncRecordToSheet(type, record) {
  if (!sheetsEnabled()) return { ok: false, skipped: true };
  return sheetRequest('upsert', { type, record });
}

async function deleteRecordFromSheet(type, id) {
  if (!sheetsEnabled()) return { ok: false, skipped: true };
  return sheetRequest('delete', { type, id });
}
