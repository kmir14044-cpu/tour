if(sessionStorage.getItem('tdpAdmin')!=='yes') location.href='login.html';
let data=getStore();
let editId=null, editType=null;
const $=id=>document.getElementById(id);
const clean=v=>String(v||'').trim();
const money=n=>`PKR ${Number(n||0).toLocaleString()}`;
const activeText=v=>v===false?'No':'Yes';
const statuses=['New','Contacted','Quoted','Booked','Cancelled'];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function opts(arr, selected='', label='Select'){return `<option value="">${label}</option>`+(arr||[]).map(x=>{const val=x.name||x.title||x;return `<option ${val==selected?'selected':''}>${val}</option>`}).join('')}
function show(id,el){document.querySelectorAll('main section').forEach(s=>s.classList.add('hidden'));$(id).classList.remove('hidden');document.querySelectorAll('.sideLink').forEach(a=>a.classList.remove('active')); if(el) el.classList.add('active')}
function logout(){sessionStorage.removeItem('tdpAdmin');location.href='login.html'}
function save(){setStore(data); data=getStore(); render()}
function setSyncStatus(msg,type='info'){ const el=$('syncStatus'); if(el){el.textContent=msg; el.className='syncStatus '+type;} }
function resetAll(){ if(confirm('Reset local browser data? Google Sheets records will not be deleted.')){ data=resetStore(); render(); } }
async function del(type,id){ if(confirm('Delete this item?')){data[type]=data[type].filter(x=>x.id!=id);save(); if(typeof deleteRecordFromSheet==='function' && sheetsEnabled()){try{setSyncStatus('Deleting from Google Sheets...'); await deleteRecordFromSheet(type,id); setSyncStatus('Google Sheets updated.','ok')}catch(err){setSyncStatus(err.message,'error')}}} }
function clearForm(){ editId=null; editType=null; render(); }
function row(type,key){ return (editType===type&&editId)?(data[type].find(x=>x.id===editId)||{}):{}; }
function val(type,key){ return row(type,key)?.[key]??''; }
function checked(type,key){ const r=row(type,key); return r[key]===false?'':'checked'; }
async function upsert(type,obj){ if(editType===type){data[type]=data[type].map(x=>x.id===editId?obj:x)} else {data[type].unshift(obj)} editId=null; editType=null; save(); if(typeof syncRecordToSheet==='function' && sheetsEnabled()){try{setSyncStatus('Saving to Google Sheets...'); await syncRecordToSheet(type,obj); setSyncStatus('Google Sheets updated.','ok')}catch(err){setSyncStatus(err.message,'error')}} }
function edit(type,id){ editType=type; editId=id; render(); setTimeout(()=>document.querySelector(`#${type} .adminCard`)?.scrollIntoView({behavior:'smooth',block:'center'}),50); }
function exportData(){ const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tdp-database-export.json'; a.click(); URL.revokeObjectURL(a.href); }

const csvHeaders={
  destinations:['name','region','subtitle','image','active'],
  tours:['title','destination','style','days','price','image','active'],
  hotels:['name','destination','category','price','nights','image','active'],
  hotelCategories:['name','multiplier','description'],
  transports:['name','seats','pricePerDay','active'],
  activities:['name','destination','price','image','active'],
  itineraries:['destination','tourTitle','day','title','image','time1','activity1','time2','activity2','time3','activity3'],
  bookings:['customer','email','phone','tour','travelDate','amount','status'],
  leads:['name','email','phone','destination','style','days','travelers','childAges','month','city','transport','rooms','status']
};
function csvEscape(v){v=v==null?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function toCSV(rows,headers){return [headers.join(','),...rows.map(r=>headers.map(h=>csvEscape(r[h])).join(','))].join('\n')}
function parseCSV(text){const rows=[];let row=[],cur='',q=false;for(let i=0;i<text.length;i++){let c=text[i],n=text[i+1];if(q&&c==='"'&&n==='"'){cur+='"';i++;continue}if(c==='"'){q=!q;continue}if(c===','&&!q){row.push(cur);cur='';continue}if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cur);if(row.some(x=>x.trim()!==''))rows.push(row);row=[];cur='';continue}cur+=c}row.push(cur);if(row.some(x=>x.trim()!==''))rows.push(row);return rows}
function normalizeImported(type,obj){
  const boolKeys=['active']; const numKeys=['days','price','nights','multiplier','seats','pricePerDay','day','amount','travelers','rooms'];
  Object.keys(obj).forEach(k=>{ if(numKeys.includes(k)) obj[k]=Number(obj[k]||0); if(boolKeys.includes(k)) obj[k]=String(obj[k]).toLowerCase()!=='false' && String(obj[k]).toLowerCase()!=='no' && String(obj[k])!=='0'; });
  if(type==='leads' && !obj.status) obj.status='New';
  if(type==='bookings' && !obj.status) obj.status='Pending';
  obj.id=Date.now()+Math.floor(Math.random()*100000);
  return obj;
}
function exportCSV(){
  const type=excelType.value; const headers=csvHeaders[type]; if(!headers) return alert('Select a valid table.');
  const blob=new Blob([toCSV(data[type]||[],headers)],{type:'text/csv'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`tdp-${type}.csv`; a.click(); URL.revokeObjectURL(a.href);
}
function importCSV(e){
  const file=e.target.files[0]; if(!file) return; const type=excelType.value; const headers=csvHeaders[type];
  const reader=new FileReader();
  reader.onload=()=>{try{const rows=parseCSV(reader.result); if(rows.length<2) return alert('CSV has no data rows.');
    const fileHeaders=rows[0].map(h=>h.trim());
    const missing=headers.filter(h=>!fileHeaders.includes(h));
    if(missing.length && !confirm('Missing columns: '+missing.join(', ')+'. Continue with available columns?')) return;
    const imported=rows.slice(1).map(r=>{const obj={};fileHeaders.forEach((h,i)=>obj[h]=r[i]||'');return normalizeImported(type,obj)});
    data[type]=[...imported,...(data[type]||[])]; save(); alert(imported.length+' rows imported into '+type+'.');
  }catch(err){alert('CSV import failed: '+err.message)} finally{e.target.value='';}};
  reader.readAsText(file);
}


function addDestination(){ const obj={id:editType==='destinations'?editId:Date.now(),name:clean(dName.value),region:clean(dRegion.value),subtitle:clean(dSubtitle.value),image:clean(dImage.value),active:dActive.checked}; if(!obj.name) return alert('Destination name is required.'); upsert('destinations',obj); }
function addTour(){ const obj={id:editType==='tours'?editId:Date.now(),title:clean(tTitle.value),destination:clean(tDest.value),style:clean(tStyle.value),days:Number(tDays.value||1),price:Number(tPrice.value||0),image:clean(tImage.value),active:tActive.checked}; if(!obj.title||!obj.destination) return alert('Please add tour title and destination.'); upsert('tours',obj); }
function addHotel(){ const obj={id:editType==='hotels'?editId:Date.now(),name:clean(hName.value),destination:clean(hDest.value),category:clean(hCat.value),price:Number(hPrice.value||0),nights:Number(hNights.value||1),image:clean(hImage.value),active:hActive.checked}; if(!obj.name||!obj.destination||!obj.category) return alert('Please add hotel name, destination and category.'); upsert('hotels',obj); }
function addHotelCategory(){ const obj={id:editType==='hotelCategories'?editId:Date.now(),name:clean(hcName.value),multiplier:Number(hcMultiplier.value||0),description:clean(hcDesc.value)}; if(!obj.name) return alert('Category name is required.'); upsert('hotelCategories',obj); }
function addTransport(){ const obj={id:editType==='transports'?editId:Date.now(),name:clean(trName.value),seats:Number(trSeats.value||1),pricePerDay:Number(trPrice.value||0),active:trActive.checked}; if(!obj.name) return alert('Transport name is required.'); upsert('transports',obj); }
function addAct(){ const obj={id:editType==='activities'?editId:Date.now(),name:clean(aName.value),destination:clean(aDest.value)||'All',price:Number(aPrice.value||0),image:clean(aImage.value),active:aActive.checked}; if(!obj.name) return alert('Please add activity name.'); upsert('activities',obj); }
function addItin(){ const obj={id:editType==='itineraries'?editId:Date.now(),tourTitle:clean(iTour.value),destination:clean(iDest.value),day:Number(iDay.value||1),title:clean(iTitle.value),image:clean(iImage.value),time1:clean(iTime1.value),activity1:clean(iActivity1.value),time2:clean(iTime2.value),activity2:clean(iActivity2.value),time3:clean(iTime3.value),activity3:clean(iActivity3.value)}; if(!obj.destination||!obj.day||!obj.title) return alert('Please add destination, day and title.'); upsert('itineraries',obj); }
function addBooking(){ const obj={id:editType==='bookings'?editId:Date.now(),customer:clean(bCustomer.value),email:clean(bEmail.value),phone:clean(bPhone.value),tour:clean(bTour.value),travelDate:clean(bDate.value),amount:Number(bAmount.value||0),status:clean(bStatus.value)||'Pending'}; if(!obj.customer||!obj.email||!obj.phone||!obj.tour) return alert('Customer name, email, phone and tour are required.'); upsert('bookings',obj); }
function saveSettings(){ data.settings={...data.settings,whatsapp:clean(sWhatsapp.value),currency:clean(sCurrency.value),company:clean(sCompany.value),sheetsUrl:clean(sSheetsUrl.value),sheetsToken:clean(sSheetsToken.value)}; save(); setSyncStatus(sheetsEnabled()?'Google Sheets connection saved. Use Sync Now to pull verified records.':'Google Sheets URL is not configured.','info'); }
async function updateLeadStatus(id,status){
  const lead=data.leads.find(l=>String(l.id)===String(id));
  data.leads=data.leads.map(l=>String(l.id)===String(id)?{...l,status}:l);
  if(status==='Booked' && lead && !(data.bookings||[]).some(b=>String(b.leadId)===String(id))){
    data.bookings.unshift({id:Date.now(),leadId:id,customer:lead.name,email:lead.email,phone:lead.phone,tour:lead.destination,travelDate:lead.month,amount:0,status:'Confirmed'});
  }
  save();
  if(typeof updateSheetLeadStatus==='function' && sheetsEnabled()){
    try{setSyncStatus('Updating Google Sheets status...'); await updateSheetLeadStatus(id,status); setSyncStatus(`Lead moved to ${status} in Google Sheets.`,'ok')}
    catch(err){setSyncStatus(err.message,'error')}
  }
}
async function syncFromSheet(){
  if(!sheetsEnabled()) return alert('Add the Google Apps Script Web App URL in Settings first.');
  try{
    setSyncStatus('Loading verified records from Google Sheets...');
    const remote=await loadSheetData();
    ['leads','bookings','destinations','hotelCategories','hotels','transports','activities','tours','itineraries'].forEach(k=>{ if(Array.isArray(remote?.[k])) data[k]=remote[k]; });
    setStore(data); data=getStore(); render();
    setSyncStatus('Verified Google Sheets records loaded.','ok');
  }catch(err){setSyncStatus(err.message,'error'); alert(err.message);}
}

function render(){
  leadCount.textContent=data.leads.length; destCount.textContent=data.destinations.length; tourCount.textContent=data.tours.length; hotelCount.textContent=data.hotels.length; itinCount.textContent=(data.itineraries||[]).length;
  const statusOptions=current=>statuses.map(s=>`<option ${current===s?'selected':''}>${s}</option>`).join('');
  const verifiedBadge=v=>v==='Yes'?'<span class="statusBadge verified">Verified</span>':'<span class="statusBadge local">Local</span>';
  document.querySelector('#dashboard .adminCard').innerHTML=`<h2>Google Sheets Sync</h2><p>The portal can use Google Sheets as the live records database through the Apps Script Web App in <b>Settings</b>. Traveler submissions save to the Sheet, and admin status changes move leads into Booked or Cancelled tabs.</p><div class="syncBar"><span id="syncStatus" class="syncStatus ${sheetsEnabled()?'ok':'info'}">${sheetsEnabled()?'Google Sheets is configured.':'Google Sheets is not configured yet.'}</span><button class="btn small" onclick="syncFromSheet()">Sync Now</button></div>`;

  leadsTable.innerHTML='<tr><th>Name</th><th>Email</th><th>Phone</th><th>Destination</th><th>Hotel</th><th>Days</th><th>Travelers</th><th>Child Ages</th><th>Date</th><th>Record</th><th>Status</th><th></th></tr>'+((data.leads||[]).map(l=>`<tr><td>${esc(l.name||'-')}</td><td>${esc(l.email||'-')}</td><td>${esc(l.phone||'-')}</td><td>${esc(l.destination||'-')}</td><td>${esc(l.style||'-')}</td><td>${esc(l.days||'-')}</td><td>${esc(l.travelers||'-')}</td><td>${esc(l.childAges||'-')}</td><td>${esc(l.month||'-')}</td><td>${verifiedBadge(l.verified)}</td><td><select onchange="updateLeadStatus(${Number(l.id)},this.value)">${statusOptions(l.status||'New')}</select></td><td><button class="btn small alt" onclick="del('leads',${Number(l.id)})">Delete</button></td></tr>`).join('')||'<tr><td colspan="12">No verified leads yet. Submit a request from the traveler page or click Sync Now.</td></tr>');

  destinationForm.innerHTML=`<h3>${editType==='destinations'?'Edit':'Add'} Destination</h3><div class="detailsGrid"><input id="dName" placeholder="Destination name" value="${val('destinations','name')}"><input id="dRegion" placeholder="Region" value="${val('destinations','region')}"><input id="dSubtitle" placeholder="Short subtitle" value="${val('destinations','subtitle')}"><input id="dImage" placeholder="Image URL" value="${val('destinations','image')}"></div><label class="check"><input id="dActive" type="checkbox" ${checked('destinations','active')}> Active on traveler page</label><br><button class="btn small" onclick="addDestination()">${editType==='destinations'?'Update':'Add'} Destination</button> ${editType==='destinations'?'<button class="btn small alt" onclick="clearForm()">Cancel</button>':''}`;
  destinationsTable.innerHTML='<tr><th>Name</th><th>Region</th><th>Subtitle</th><th>Active</th><th>Actions</th></tr>'+data.destinations.map(d=>`<tr><td>${d.name}</td><td>${d.region||'-'}</td><td>${d.subtitle||'-'}</td><td>${activeText(d.active)}</td><td><button class="btn small alt" onclick="edit('destinations',${d.id})">Edit</button> <button class="btn small alt" onclick="del('destinations',${d.id})">Delete</button></td></tr>`).join('');

  tourForm.innerHTML=`<h3>${editType==='tours'?'Edit':'Add'} Tour Package</h3><div class="detailsGrid"><input id="tTitle" placeholder="Tour title" value="${val('tours','title')}"><select id="tDest">${opts(data.destinations,val('tours','destination'),'Destination')}</select><input id="tStyle" placeholder="Style e.g Luxury / Family" value="${val('tours','style')}"><input id="tDays" type="number" placeholder="Days" value="${val('tours','days')}"><input id="tPrice" type="number" placeholder="Base price" value="${val('tours','price')}"><input id="tImage" placeholder="Image URL" value="${val('tours','image')}"></div><label class="check"><input id="tActive" type="checkbox" ${checked('tours','active')}> Active</label><br><button class="btn small" onclick="addTour()">${editType==='tours'?'Update':'Add'} Tour</button> ${editType==='tours'?'<button class="btn small alt" onclick="clearForm()">Cancel</button>':''}`;
  toursTable.innerHTML='<tr><th>Title</th><th>Destination</th><th>Style</th><th>Days</th><th>Price</th><th>Active</th><th>Actions</th></tr>'+data.tours.map(t=>`<tr><td>${t.title}</td><td>${t.destination}</td><td>${t.style||'-'}</td><td>${t.days}</td><td>${money(t.price)}</td><td>${activeText(t.active)}</td><td><button class="btn small alt" onclick="edit('tours',${t.id})">Edit</button> <button class="btn small alt" onclick="del('tours',${t.id})">Delete</button></td></tr>`).join('');

  hotelForm.innerHTML=`<h3>${editType==='hotels'?'Edit':'Add'} Hotel</h3><div class="detailsGrid"><input id="hName" placeholder="Hotel name" value="${val('hotels','name')}"><select id="hDest">${opts(data.destinations,val('hotels','destination'),'Destination')}</select><select id="hCat">${opts(data.hotelCategories,val('hotels','category'),'Hotel category')}</select><input id="hPrice" type="number" placeholder="Price per night" value="${val('hotels','price')}"><input id="hNights" type="number" placeholder="Default nights" value="${val('hotels','nights')}"><input id="hImage" placeholder="Image URL" value="${val('hotels','image')}"></div><label class="check"><input id="hActive" type="checkbox" ${checked('hotels','active')}> Active</label><br><button class="btn small" onclick="addHotel()">${editType==='hotels'?'Update':'Add'} Hotel</button> ${editType==='hotels'?'<button class="btn small alt" onclick="clearForm()">Cancel</button>':''}`;
  hotelsTable.innerHTML='<tr><th>Name</th><th>Destination</th><th>Category</th><th>Price/Night</th><th>Active</th><th>Actions</th></tr>'+data.hotels.map(h=>`<tr><td>${h.name}</td><td>${h.destination}</td><td>${h.category}</td><td>${money(h.price)}</td><td>${activeText(h.active)}</td><td><button class="btn small alt" onclick="edit('hotels',${h.id})">Edit</button> <button class="btn small alt" onclick="del('hotels',${h.id})">Delete</button></td></tr>`).join('');

  hotelCategoryForm.innerHTML=`<h3>${editType==='hotelCategories'?'Edit':'Add'} Hotel Category</h3><div class="detailsGrid"><input id="hcName" placeholder="Category name" value="${val('hotelCategories','name')}"><input id="hcMultiplier" type="number" placeholder="Pricing value per room/day" value="${val('hotelCategories','multiplier')}"><input id="hcDesc" placeholder="Description" value="${val('hotelCategories','description')}"></div><br><button class="btn small" onclick="addHotelCategory()">${editType==='hotelCategories'?'Update':'Add'} Category</button> ${editType==='hotelCategories'?'<button class="btn small alt" onclick="clearForm()">Cancel</button>':''}`;
  hotelCategoriesTable.innerHTML='<tr><th>Name</th><th>Pricing Value</th><th>Description</th><th>Actions</th></tr>'+data.hotelCategories.map(c=>`<tr><td>${c.name}</td><td>${money(c.multiplier)}</td><td>${c.description||'-'}</td><td><button class="btn small alt" onclick="edit('hotelCategories',${c.id})">Edit</button> <button class="btn small alt" onclick="del('hotelCategories',${c.id})">Delete</button></td></tr>`).join('');

  transportForm.innerHTML=`<h3>${editType==='transports'?'Edit':'Add'} Transport</h3><div class="detailsGrid"><input id="trName" placeholder="Vehicle name" value="${val('transports','name')}"><input id="trSeats" type="number" placeholder="Seats" value="${val('transports','seats')}"><input id="trPrice" type="number" placeholder="Price per day" value="${val('transports','pricePerDay')}"></div><label class="check"><input id="trActive" type="checkbox" ${checked('transports','active')}> Active</label><br><button class="btn small" onclick="addTransport()">${editType==='transports'?'Update':'Add'} Transport</button> ${editType==='transports'?'<button class="btn small alt" onclick="clearForm()">Cancel</button>':''}`;
  transportsTable.innerHTML='<tr><th>Vehicle</th><th>Seats</th><th>Price/Day</th><th>Active</th><th>Actions</th></tr>'+data.transports.map(t=>`<tr><td>${t.name}</td><td>${t.seats}</td><td>${money(t.pricePerDay)}</td><td>${activeText(t.active)}</td><td><button class="btn small alt" onclick="edit('transports',${t.id})">Edit</button> <button class="btn small alt" onclick="del('transports',${t.id})">Delete</button></td></tr>`).join('');

  activityForm.innerHTML=`<h3>${editType==='activities'?'Edit':'Add'} Activity</h3><div class="detailsGrid"><input id="aName" placeholder="Activity name" value="${val('activities','name')}"><select id="aDest"><option ${val('activities','destination')==='All'?'selected':''}>All</option>${opts(data.destinations,val('activities','destination'),'Destination')}</select><input id="aPrice" type="number" placeholder="Price" value="${val('activities','price')}"><input id="aImage" placeholder="Image URL" value="${val('activities','image')}"></div><label class="check"><input id="aActive" type="checkbox" ${checked('activities','active')}> Active</label><br><button class="btn small" onclick="addAct()">${editType==='activities'?'Update':'Add'} Activity</button> ${editType==='activities'?'<button class="btn small alt" onclick="clearForm()">Cancel</button>':''}`;
  activitiesTable.innerHTML='<tr><th>Name</th><th>Destination</th><th>Price</th><th>Active</th><th>Actions</th></tr>'+data.activities.map(a=>`<tr><td>${a.name}</td><td>${a.destination||'All'}</td><td>${money(a.price)}</td><td>${activeText(a.active)}</td><td><button class="btn small alt" onclick="edit('activities',${a.id})">Edit</button> <button class="btn small alt" onclick="del('activities',${a.id})">Delete</button></td></tr>`).join('');

  itineraryForm.innerHTML=`<h3>${editType==='itineraries'?'Edit':'Add'} Itinerary Day</h3><div class="detailsGrid"><select id="iDest">${opts(data.destinations,val('itineraries','destination'),'Destination')}</select><select id="iTour">${opts(data.tours,val('itineraries','tourTitle'),'Related tour optional')}</select><input id="iDay" type="number" placeholder="Day number" value="${val('itineraries','day')}"><input id="iTitle" placeholder="Day title" value="${val('itineraries','title')}"><input id="iImage" placeholder="Day image URL" value="${val('itineraries','image')}"><input id="iTime1" placeholder="Time 1" value="${val('itineraries','time1')}"><input id="iActivity1" placeholder="Activity 1" value="${val('itineraries','activity1')}"><input id="iTime2" placeholder="Time 2" value="${val('itineraries','time2')}"><input id="iActivity2" placeholder="Activity 2" value="${val('itineraries','activity2')}"><input id="iTime3" placeholder="Time 3" value="${val('itineraries','time3')}"><input id="iActivity3" placeholder="Activity 3" value="${val('itineraries','activity3')}"></div><br><button class="btn small" onclick="addItin()">${editType==='itineraries'?'Update':'Add'} Day</button> ${editType==='itineraries'?'<button class="btn small alt" onclick="clearForm()">Cancel</button>':''}`;
  itinerariesTable.innerHTML='<tr><th>Destination</th><th>Tour</th><th>Day</th><th>Title</th><th>Schedule</th><th>Actions</th></tr>'+data.itineraries.sort((a,b)=>(a.destination||'').localeCompare(b.destination||'')||a.day-b.day).map(i=>`<tr><td>${i.destination}</td><td>${i.tourTitle||'-'}</td><td>${i.day}</td><td>${i.title}</td><td>${[i.time1+' '+i.activity1,i.time2+' '+i.activity2,i.time3+' '+i.activity3].filter(x=>x.trim()).join('<br>')}</td><td><button class="btn small alt" onclick="edit('itineraries',${i.id})">Edit</button> <button class="btn small alt" onclick="del('itineraries',${i.id})">Delete</button></td></tr>`).join('');

  bookingForm.innerHTML=`<h3>${editType==='bookings'?'Edit':'Add'} Booking</h3><div class="detailsGrid"><input id="bCustomer" placeholder="Customer name" value="${val('bookings','customer')}"><input id="bEmail" placeholder="Email" value="${val('bookings','email')}"><input id="bPhone" placeholder="Phone / WhatsApp" value="${val('bookings','phone')}"><select id="bTour">${opts(data.tours,val('bookings','tour'),'Tour')}</select><input id="bDate" type="date" value="${val('bookings','travelDate')}"><input id="bAmount" type="number" placeholder="Amount" value="${val('bookings','amount')}"><select id="bStatus"><option ${val('bookings','status')==='Pending'?'selected':''}>Pending</option><option ${val('bookings','status')==='Confirmed'?'selected':''}>Confirmed</option><option ${val('bookings','status')==='Paid'?'selected':''}>Paid</option><option ${val('bookings','status')==='Cancelled'?'selected':''}>Cancelled</option></select></div><br><button class="btn small" onclick="addBooking()">${editType==='bookings'?'Update':'Add'} Booking</button> ${editType==='bookings'?'<button class="btn small alt" onclick="clearForm()">Cancel</button>':''}`;
  bookingsTable.innerHTML='<tr><th>Customer</th><th>Email</th><th>Phone</th><th>Tour</th><th>Travel Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr>'+((data.bookings||[]).map(b=>`<tr><td>${b.customer}</td><td>${b.email||'-'}</td><td>${b.phone||'-'}</td><td>${b.tour}</td><td>${b.travelDate||'-'}</td><td>${money(b.amount)}</td><td>${b.status}</td><td><button class="btn small alt" onclick="edit('bookings',${b.id})">Edit</button> <button class="btn small alt" onclick="del('bookings',${b.id})">Delete</button></td></tr>`).join('')||'<tr><td colspan="8">No bookings yet.</td></tr>');

  settingsForm.innerHTML=`<h3>Website Settings</h3><div class="detailsGrid settingsGrid"><input id="sCompany" placeholder="Company name" value="${esc(data.settings.company)}"><input id="sWhatsapp" placeholder="WhatsApp number" value="${esc(data.settings.whatsapp)}"><input id="sCurrency" placeholder="Currency" value="${esc(data.settings.currency)}"><input id="sSheetsUrl" class="span2" placeholder="Google Apps Script Web App URL" value="${esc(data.settings.sheetsUrl||'')}"><input id="sSheetsToken" placeholder="Sync token optional" value="${esc(data.settings.sheetsToken||'')}"></div><div class="syncBar"><span id="syncStatus" class="syncStatus ${sheetsEnabled()?'ok':'info'}">${sheetsEnabled()?'Google Sheets is configured.':'Paste your Apps Script Web App URL to enable live sync.'}</span><button class="btn small" onclick="saveSettings()">Save Settings</button><button class="btn small alt" onclick="syncFromSheet()">Sync Now</button></div>`;
}
render();
