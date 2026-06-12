const CONFIG = {
  // Optional: put the same token in Admin > Settings > Sync token.
  TOKEN: '',
  SHEETS: {
    leads: 'Leads',
    booked: 'Booked',
    cancelled: 'Cancelled',
    bookings: 'Bookings',
    destinations: 'Destinations',
    tours: 'Tours',
    hotels: 'Hotels',
    hotelCategories: 'Hotel Categories',
    transports: 'Transport',
    activities: 'Activities',
    itineraries: 'Itineraries'
  }
};

const HEADERS = {
  leads: ['id','created','name','email','phone','destination','style','days','travelers','childAges','month','city','transport','rooms','status','verified','source'],
  bookings: ['id','leadId','customer','email','phone','tour','travelDate','amount','status'],
  destinations: ['id','name','region','subtitle','image','active'],
  tours: ['id','title','destination','style','days','price','image','active'],
  hotels: ['id','name','destination','category','price','nights','image','active'],
  hotelCategories: ['id','name','multiplier','description'],
  transports: ['id','name','seats','pricePerDay','active'],
  activities: ['id','name','destination','price','image','active'],
  itineraries: ['id','destination','tourTitle','day','title','image','time1','activity1','time2','activity2','time3','activity3']
};

function doGet(e) {
  const callback = e.parameter.callback || 'callback';
  try {
    guardToken_(e.parameter.token || '');
    const action = e.parameter.action || 'list';
    const payload = parsePayload_(e.parameter.payload);
    const result = route_(action, payload);
    return jsonp_(callback, { ok: true, ...result });
  } catch (err) {
    return jsonp_(callback, { ok: false, error: err.message });
  }
}

function route_(action, payload) {
  if (action === 'list') return { data: listAll_() };
  if (action === 'addLead') return { record: addLead_(payload) };
  if (action === 'updateLeadStatus') return { record: updateLeadStatus_(payload.id, payload.status) };
  if (action === 'upsert') return { record: upsert_(payload.type, payload.record) };
  if (action === 'delete') return { deleted: delete_(payload.type, payload.id) };
  throw new Error('Unknown action: ' + action);
}

function listAll_() {
  ensureAllSheets_();
  const data = {};
  Object.keys(CONFIG.SHEETS).forEach(type => {
    if (type === 'booked' || type === 'cancelled') return;
    data[type] = readSheet_(type);
  });
  data.leads = [
    ...readSheet_('leads'),
    ...readNamedSheet_(CONFIG.SHEETS.booked, HEADERS.leads),
    ...readNamedSheet_(CONFIG.SHEETS.cancelled, HEADERS.leads)
  ].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  return data;
}

function addLead_(lead) {
  ensureAllSheets_();
  const record = normalizeLead_(lead);
  const existing = findRowByIdOrIdentity_('leads', record);
  if (existing.row > 0) {
    writeObjectRow_(sheetFor_('leads'), existing.row, HEADERS.leads, { ...existing.record, ...record });
    return record;
  }
  appendObjectRow_(sheetFor_('leads'), HEADERS.leads, record);
  return record;
}

function updateLeadStatus_(id, status) {
  ensureAllSheets_();
  status = String(status || 'New').trim();
  const found = findLeadEverywhere_(id);
  if (!found) throw new Error('Lead not found in Google Sheet.');
  const record = { ...found.record, status };
  const targetName = status === 'Booked' ? CONFIG.SHEETS.booked : status === 'Cancelled' ? CONFIG.SHEETS.cancelled : CONFIG.SHEETS.leads;
  if (found.sheet.getName() !== targetName) found.sheet.deleteRow(found.row);
  const target = sheetByName_(targetName, HEADERS.leads);
  const targetExisting = findRowById_(target, id);
  if (targetExisting.row > 0) writeObjectRow_(target, targetExisting.row, HEADERS.leads, record);
  else appendObjectRow_(target, HEADERS.leads, record);
  if (status === 'Booked') upsert_('bookings', {
    id: Date.now(),
    leadId: record.id,
    customer: record.name,
    email: record.email,
    phone: record.phone,
    tour: record.destination,
    travelDate: record.month,
    amount: 0,
    status: 'Confirmed'
  });
  return record;
}

function upsert_(type, record) {
  if (!HEADERS[type]) throw new Error('Unsupported table: ' + type);
  ensureSheet_(type);
  record = { id: record.id || Date.now(), ...record };
  const sheet = sheetFor_(type);
  const existing = findRowById_(sheet, record.id);
  if (existing.row > 0) writeObjectRow_(sheet, existing.row, HEADERS[type], record);
  else appendObjectRow_(sheet, HEADERS[type], record);
  return record;
}

function delete_(type, id) {
  if (!HEADERS[type]) throw new Error('Unsupported table: ' + type);
  const sheet = sheetFor_(type);
  const existing = findRowById_(sheet, id);
  if (existing.row > 0) sheet.deleteRow(existing.row);
  return id;
}

function ensureAllSheets_() {
  Object.keys(HEADERS).forEach(ensureSheet_);
  sheetByName_(CONFIG.SHEETS.booked, HEADERS.leads);
  sheetByName_(CONFIG.SHEETS.cancelled, HEADERS.leads);
}

function ensureSheet_(type) {
  sheetFor_(type);
}

function sheetFor_(type) {
  return sheetByName_(CONFIG.SHEETS[type], HEADERS[type]);
}

function sheetByName_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  const first = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (first.join('') === '') sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function readSheet_(type) {
  return readNamedSheet_(CONFIG.SHEETS[type], HEADERS[type]);
}

function readNamedSheet_(name, headers) {
  const sheet = sheetByName_(name, headers);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const sheetHeaders = values[0].map(String);
  return values.slice(1).filter(row => row.some(v => v !== '')).map(row => {
    const obj = {};
    sheetHeaders.forEach((h, i) => obj[h] = row[i]);
    return coerceRecord_(obj);
  });
}

function appendObjectRow_(sheet, headers, obj) {
  sheet.appendRow(headers.map(h => obj[h] ?? ''));
}

function writeObjectRow_(sheet, row, headers, obj) {
  sheet.getRange(row, 1, 1, headers.length).setValues([headers.map(h => obj[h] ?? '')]);
}

function findRowById_(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return { row: i + 1, record: rowToObject_(values[0], values[i]) };
  }
  return { row: -1, record: null };
}

function findRowByIdOrIdentity_(type, record) {
  const sheet = sheetFor_(type);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const obj = rowToObject_(values[0], values[i]);
    if (String(obj.id) === String(record.id)) return { row: i + 1, record: obj };
    if (String(obj.email).toLowerCase() === String(record.email).toLowerCase() && String(obj.phone) === String(record.phone) && String(obj.month) === String(record.month) && String(obj.destination) === String(record.destination)) return { row: i + 1, record: obj };
  }
  return { row: -1, record: null };
}

function findLeadEverywhere_(id) {
  const names = [CONFIG.SHEETS.leads, CONFIG.SHEETS.booked, CONFIG.SHEETS.cancelled];
  for (const name of names) {
    const sheet = sheetByName_(name, HEADERS.leads);
    const found = findRowById_(sheet, id);
    if (found.row > 0) return { sheet, ...found };
  }
  return null;
}

function normalizeLead_(lead) {
  if (!lead.name || !lead.email || !lead.phone) throw new Error('Name, email and phone are required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(lead.email))) throw new Error('Invalid email.');
  if (String(lead.phone).replace(/\D/g, '').length < 10) throw new Error('Invalid phone.');
  return {
    id: lead.id || Date.now(),
    created: lead.created || new Date(),
    name: String(lead.name).trim(),
    email: String(lead.email).trim().toLowerCase(),
    phone: String(lead.phone).trim(),
    destination: lead.destination || '',
    style: lead.style || '',
    days: Number(lead.days || 0),
    travelers: Number(lead.travelers || 0),
    childAges: lead.childAges || '',
    month: lead.month || '',
    city: lead.city || '',
    transport: lead.transport || '',
    rooms: Number(lead.rooms || 0),
    status: lead.status || 'New',
    verified: 'Yes',
    source: lead.source || 'Trip Designer'
  };
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach((h, i) => obj[h] = row[i]);
  return coerceRecord_(obj);
}

function coerceRecord_(obj) {
  ['id','days','travelers','rooms','price','nights','multiplier','seats','pricePerDay','day','amount'].forEach(k => {
    if (obj[k] !== '' && obj[k] != null && !isNaN(Number(obj[k]))) obj[k] = Number(obj[k]);
  });
  ['active'].forEach(k => {
    if (obj[k] !== '' && obj[k] != null) obj[k] = String(obj[k]).toLowerCase() !== 'false' && String(obj[k]).toLowerCase() !== 'no' && String(obj[k]) !== '0';
  });
  return obj;
}

function parsePayload_(text) {
  if (!text) return {};
  return JSON.parse(text);
}

function guardToken_(token) {
  if (CONFIG.TOKEN && token !== CONFIG.TOKEN) throw new Error('Invalid sync token.');
}

function jsonp_(callback, payload) {
  const safeCallback = String(callback).replace(/[^\w.$]/g, '');
  return ContentService
    .createTextOutput(`${safeCallback}(${JSON.stringify(payload)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
