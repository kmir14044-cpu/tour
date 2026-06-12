let data = getStore();
let state = {
  destination: '', hotel: '', days: 0, adults: 2, children: 0, rooms: 1,
  city: '', startDate: '', transport: '', travelerName: '', travelerEmail: '',
  travelerPhone: '', experiences: [], childAges: [], designed: false, leadKey: ''
};

const imgFallback = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const digits = value => String(value || '').replace(/\D/g, '');

function money(n) {
  return `${data.settings?.currency || 'PKR'} ${Number(n || 0).toLocaleString()}`;
}
function active(list) {
  return (list || []).filter(x => x.active !== false);
}
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}
function isPhone(v) {
  return digits(v).length >= 10;
}
function childAgesFilled() {
  return state.children === 0 || state.childAges.length === state.children && state.childAges.every(Boolean);
}
function requiredFilled() {
  return Boolean(state.travelerName.length >= 2 && isEmail(state.travelerEmail) && isPhone(state.travelerPhone) && state.startDate && state.city && state.destination && state.days && state.hotel && state.transport && state.adults >= 1 && state.rooms >= 1 && childAgesFilled());
}
function getWhatsappUrl() {
  const phone = digits(data.settings?.whatsapp || '+923703049245') || '923703049245';
  const msg = [
    `Hello ${data.settings?.company || 'Tours De Pakistan'}, I want to plan a trip.`,
    `Name: ${state.travelerName || '-'}`,
    `Phone: ${state.travelerPhone || '-'}`,
    `Email: ${state.travelerEmail || '-'}`,
    `Trip: ${state.days || '-'} days ${state.destination || '-'} from ${state.city || '-'}`,
    `Date: ${state.startDate || '-'}`,
    `Guests: ${state.adults} adults${state.children ? `, ${state.children} children (${state.childAges.join(', ')})` : ''}`,
    `Rooms: ${state.rooms}`,
    `Hotel: ${state.hotel || '-'}`,
    `Transport: ${state.transport || '-'}`
  ].join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
function initSelects() {
  $('destination').innerHTML = '<option value="">Select destination</option>' + active(data.destinations).map(d => `<option>${esc(d.name)}</option>`).join('');
  $('hotel').innerHTML = '<option value="">Select hotel category</option>' + (data.hotelCategories || []).map(h => `<option>${esc(h.name)}</option>`).join('');
  $('transport').innerHTML = '<option value="">Select transport type</option>' + active(data.transports).map(t => `<option value="${esc(t.name)}">${esc(t.name)} (${Number(t.seats || 0)} seats)</option>`).join('');
}
function renderChildAges() {
  const wrap = $('childAges');
  if (!state.children) {
    state.childAges = [];
    wrap.innerHTML = '';
    return;
  }
  state.childAges = state.childAges.slice(0, state.children);
  while (state.childAges.length < state.children) state.childAges.push('');
  wrap.innerHTML = `<label>Child Ages *</label><div>${Array.from({ length: state.children }, (_, i) => `<select data-child-age="${i}"><option value="">Age</option>${Array.from({ length: 12 }, (_, a) => { const age = `${a + 1} yrs`; return `<option ${state.childAges[i] === age ? 'selected' : ''}>${age}</option>`; }).join('')}</select>`).join('')}</div>`;
}
function renderExperiences() {
  const acts = active(data.activities).filter(a => !state.destination || a.destination === 'All' || a.destination === state.destination);
  $('expGrid').innerHTML = acts.map(a => `<div class="exp ${state.experiences.includes(a.id) ? 'active' : ''}"><img src="${esc(a.image || imgFallback)}" alt="${esc(a.name)}"><h3>${esc(a.name)}</h3><p>${money(a.price)}</p><button class="btn small alt" onclick="toggleExp(${Number(a.id)})">${state.experiences.includes(a.id) ? 'Added' : 'Add +'}</button></div>`).join('') || '<p>No activities added for this destination yet. Add them from admin panel.</p>';
}
function renderItinerary() {
  if (!state.destination || !state.days) {
    $('itineraryList').innerHTML = '';
    return;
  }
  const dest = data.destinations.find(d => d.name === state.destination);
  const image = dest?.image || imgFallback;
  const adminPlan = (data.itineraries || []).filter(x => String(x.destination).toLowerCase() === String(state.destination).toLowerCase()).sort((a, b) => a.day - b.day);
  const fallback = [`Arrival in ${state.city || 'starting city'} and transfer to hotel`, `Scenic journey toward ${state.destination}`, `${state.destination} sightseeing and photography`, 'Lake and valley excursion', 'Local culture, food and leisure', 'Adventure activity and shopping', 'Return journey and departure'];
  let html = '';
  for (let i = 1; i <= state.days; i++) {
    const row = adminPlan.find(x => Number(x.day) === i);
    const title = row ? row.title : (i === state.days ? 'Departure' : `${state.destination} Exploration`);
    const dayImage = row?.image || image;
    const lines = row ? [[row.time1, row.activity1], [row.time2, row.activity2], [row.time3, row.activity3]].filter(x => x[1]) : [['09:00 AM', fallback[(i - 1) % fallback.length]], ['01:00 PM', 'Lunch / rest stop'], ['04:00 PM', `${state.hotel} hotel check-in or curated experience`]];
    html += `<div class="day"><img class="photo" src="${esc(dayImage)}" alt="${esc(state.destination)}"><div class="timeline"><h3>Day ${i} - ${esc(title)}</h3><ul>${lines.map(x => `<li><b>${esc(x[0] || '')}</b> - ${esc(x[1])}</li>`).join('')}</ul></div></div>`;
  }
  $('itineraryList').innerHTML = html;
}
function updateLinks() {
  const url = getWhatsappUrl();
  if ($('navWhatsapp')) $('navWhatsapp').href = url;
  if ($('whatsappCta')) $('whatsappCta').href = url;
}
function update() {
  data = getStore();
  state.travelerName = $('travelerName').value.trim();
  state.travelerEmail = $('travelerEmail').value.trim();
  state.travelerPhone = $('travelerPhone').value.trim();
  state.startDate = $('startDate').value;
  state.city = $('city').value;
  state.destination = $('destination').value;
  state.days = Number($('days').value || 0);
  state.hotel = $('hotel').value;
  state.transport = $('transport').value;

  $('adultsVal').textContent = state.adults;
  $('childrenVal').textContent = state.children;
  $('roomsVal').textContent = state.rooms;

  const tags = [state.travelerName, state.city, state.destination, state.days ? `${state.days}D/${Math.max(state.days - 1, 1)}N` : '', state.hotel, state.transport].filter(Boolean);
  $('summaryTags').innerHTML = tags.length ? tags.map(x => `<span>${esc(x)}</span>`).join('') : '<span>Fill required fields to continue</span>';

  const valid = requiredFilled();
  $('designBtn').disabled = !valid;
  $('availabilityBox').textContent = valid ? 'Your selections are verified. Click Design My Trip to save the lead and view itinerary.' : 'Complete valid name, email, phone and trip details to continue.';
  $('availabilityBox').classList.toggle('ready', valid);
  if (valid) {
    const category = (data.hotelCategories || []).find(h => h.name === state.hotel);
    const hotelRate = category?.multiplier || 35000;
    const transport = (data.transports || []).find(t => t.name === state.transport);
    const transportRate = transport?.pricePerDay || 18000;
    const baseTour = (data.tours || []).find(t => t.destination === state.destination && Number(t.days) === state.days && t.active !== false);
    const activityTotal = state.experiences.reduce((sum, id) => sum + Number((data.activities || []).find(a => a.id === id)?.price || 0), 0);
    const total = (baseTour?.price || ((hotelRate * state.rooms + transportRate + 9000 * (state.adults + state.children)) * state.days)) + activityTotal;
    $('previewTitle').textContent = baseTour?.title || `${state.days} Days ${state.hotel} ${state.destination} Trip`;
    $('previewMeta').textContent = `${state.adults} Adult${state.adults > 1 ? 's' : ''}${state.children ? `, ${state.children} Children` : ''} | ${state.rooms} Room${state.rooms > 1 ? 's' : ''} | From ${state.city}`;
    $('price').textContent = money(total);
  }
  renderChildAges();
  renderExperiences();
  updateLinks();
  if (state.designed) renderItinerary();
}
function toggleExp(id) {
  state.experiences = state.experiences.includes(id) ? state.experiences.filter(x => x !== id) : [...state.experiences, id];
  update();
}
async function saveLeadOnce() {
  const leadKey = [state.travelerName, state.travelerEmail, state.travelerPhone, state.destination, state.startDate, state.days, state.hotel, state.transport, state.adults, state.children, state.rooms].join('|');
  if (state.leadKey === leadKey) return;
  const lead = { id: Date.now(), name: state.travelerName, email: state.travelerEmail.toLowerCase(), phone: state.travelerPhone, destination: state.destination, style: state.hotel, days: state.days, travelers: state.adults + state.children, childAges: state.childAges.join(', '), month: state.startDate, status: 'New', created: new Date().toLocaleString(), transport: state.transport, city: state.city, rooms: state.rooms, verified: 'Yes', source: 'Trip Designer' };
  data.leads.unshift(lead);
  setStore(data);
  state.leadKey = leadKey;
  if (typeof syncLeadToSheet === 'function' && sheetsEnabled()) {
    try {
      $('designBtn').textContent = 'Saving to Sheet...';
      await syncLeadToSheet(lead);
      $('designBtn').textContent = 'Saved - View Itinerary';
    } catch (err) {
      $('designBtn').textContent = 'Saved Locally - Sheet Pending';
      alert('Lead saved locally, but Google Sheets sync failed: ' + err.message);
    }
  }
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-counter]');
  if (!btn) return;
  const key = btn.dataset.counter;
  const dir = Number(btn.dataset.dir);
  const min = key === 'adults' || key === 'rooms' ? 1 : 0;
  state[key] = Math.max(min, state[key] + dir);
  update();
});
document.addEventListener('change', e => {
  const age = e.target.closest('[data-child-age]');
  if (!age) return;
  state.childAges[Number(age.dataset.childAge)] = age.value;
  update();
});
['travelerName', 'travelerEmail', 'travelerPhone', 'startDate', 'city', 'destination', 'days', 'hotel', 'transport'].forEach(id => {
  const ev = id === 'travelerName' || id === 'travelerEmail' || id === 'travelerPhone' ? 'input' : 'change';
  $(id).addEventListener(ev, update);
});
$('designBtn').addEventListener('click', async () => {
  update();
  if (!requiredFilled()) return;
  state.designed = true;
  ['resultBar', 'itinerary', 'experiences', 'helpCta'].forEach(id => $(id).classList.remove('hidden'));
  renderItinerary();
  await saveLeadOnce();
  $('resultBar').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

initSelects();
renderExperiences();
update();
