const TDP_DEFAULT_DATA = {
  admin: { username: 'admin', password: 'tdp12345', name: 'Tours De Pakistan Admin' },
  settings: { whatsapp: '+923703049245', currency: 'PKR', company: 'Tours De Pakistan', sheetsUrl: '', sheetsToken: '' },
  destinations: [
    { id: 1, name: 'Hunza', region:'Gilgit-Baltistan', subtitle: 'Forts, Attabad Lake and mountain views', image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 2, name: 'Skardu', region:'Gilgit-Baltistan', subtitle: 'Luxury valleys, blue lakes and forts', image: 'https://images.unsplash.com/photo-1626618012641-bfbca5a31239?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 3, name: 'Swat', region:'KPK', subtitle: 'Green valleys and family trips', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 4, name: 'Fairy Meadows', region:'Gilgit-Baltistan', subtitle: 'Nanga Parbat adventure experience', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 5, name: 'Kashmir', region:'AJK', subtitle: 'Peaceful nature escape', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80', active:true }
  ],
  hotelCategories: [
    { id:1, name:'Standard', multiplier:25000, description:'Clean reliable hotels' },
    { id:2, name:'Deluxe', multiplier:35000, description:'Comfort-focused hotels' },
    { id:3, name:'Premium', multiplier:45000, description:'Handpicked premium stays' },
    { id:4, name:'Luxury', multiplier:60000, description:'Best available resorts and boutique stays' }
  ],
  hotels: [
    { id: 1, name: 'Luxus Hunza', destination: 'Hunza', category: 'Luxury', price: 55000, nights:1, image:'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 2, name: 'Serena Shigar Fort', destination: 'Skardu', category: 'Luxury', price: 65000, nights:1, image:'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 3, name: 'Boutique Valley Hotel', destination: 'Hunza', category: 'Premium', price: 28000, nights:1, image:'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 4, name: 'Family Comfort Hotel', destination: 'Swat', category: 'Standard', price: 18000, nights:1, image:'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80', active:true }
  ],
  transports: [
    { id:1, name:'Toyota Corolla', seats:4, pricePerDay:18000, active:true },
    { id:2, name:'Grand Cabin', seats:12, pricePerDay:32000, active:true },
    { id:3, name:'Coaster Saloon', seats:22, pricePerDay:45000, active:true },
    { id:4, name:'Private Jeep', seats:4, pricePerDay:28000, active:true },
    { id:5, name:'Luxury SUV', seats:5, pricePerDay:38000, active:true }
  ],
  activities: [
    { id: 1, name: 'Jeep Safari', destination:'Skardu', price: 15000, image:'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 2, name: 'Boating', destination:'Hunza', price: 8000, image:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 3, name: 'Photography Tour', destination:'All', price: 10000, image:'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 4, name: 'Bonfire Night', destination:'All', price: 7000, image:'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 5, name: 'Cultural Dinner', destination:'All', price: 12000, image:'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80', active:true }
  ],
  tours: [
    { id: 1, title: '7 Days Hunza & Skardu Luxury Escape', destination: 'Hunza', style:'Luxury', days: 7, price: 285000, image:'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=900&q=80', active:true },
    { id: 2, title: '5 Days Swat Family Tour', destination: 'Swat', style:'Family', days: 5, price: 165000, image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', active:true }
  ],
  itineraries: [
    { id: 1, tourTitle:'7 Days Hunza & Skardu Luxury Escape', destination: 'Hunza', day: 1, title: 'Arrival in Islamabad', image:'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=900&q=80', time1: '11:00 AM', activity1: 'Airport pickup and hotel check-in', time2: '04:00 PM', activity2: 'Trip briefing with your tour expert', time3: '07:30 PM', activity3: 'Welcome dinner' },
    { id: 2, tourTitle:'7 Days Hunza & Skardu Luxury Escape', destination: 'Hunza', day: 2, title: 'Drive to Hunza', image:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80', time1: '08:00 AM', activity1: 'Scenic drive on Karakoram Highway', time2: '01:00 PM', activity2: 'Lunch stop near Naran / Chilas', time3: '06:00 PM', activity3: 'Check-in and valley sunset view' },
    { id: 3, tourTitle:'7 Days Hunza & Skardu Luxury Escape', destination: 'Hunza', day: 3, title: 'Altit, Baltit & Eagle Nest', image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80', time1: '09:00 AM', activity1: 'Visit Altit Fort and local streets', time2: '01:00 PM', activity2: 'Hunza cuisine lunch', time3: '05:00 PM', activity3: 'Eagle Nest sunset viewpoint' },
    { id: 4, tourTitle:'3 Days Skardu Starter', destination: 'Skardu', day: 1, title: 'Arrival in Skardu', image:'https://images.unsplash.com/photo-1626618012641-bfbca5a31239?auto=format&fit=crop&w=900&q=80', time1: '10:00 AM', activity1: 'Airport pickup and hotel check-in', time2: '02:00 PM', activity2: 'Upper Kachura Lake visit', time3: '06:00 PM', activity3: 'Dinner at resort' },
    { id: 5, tourTitle:'3 Days Skardu Starter', destination: 'Skardu', day: 2, title: 'Shigar Valley Experience', image:'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80', time1: '09:00 AM', activity1: 'Drive to Shigar Valley', time2: '12:30 PM', activity2: 'Visit Shigar Fort', time3: '04:00 PM', activity3: 'Cold Desert photography stop' }
  ],
  leads: [],
  bookings: []
};

function normalizeData(raw){
  const d = { ...TDP_DEFAULT_DATA, ...(raw||{}) };
  ['destinations','hotelCategories','hotels','transports','activities','tours','itineraries','leads','bookings'].forEach(k=>{ if(!Array.isArray(d[k])) d[k]=JSON.parse(JSON.stringify(TDP_DEFAULT_DATA[k]||[])); });
  d.settings = { ...TDP_DEFAULT_DATA.settings, ...(d.settings||{}) };
  d.admin = { ...TDP_DEFAULT_DATA.admin, ...(d.admin||{}) };
  return d;
}
function getStore(){
  const saved = localStorage.getItem('tdpData');
  if(saved){
    try { return normalizeData(JSON.parse(saved)); } catch(e){}
  }
  localStorage.setItem('tdpData', JSON.stringify(TDP_DEFAULT_DATA));
  return JSON.parse(JSON.stringify(TDP_DEFAULT_DATA));
}
function setStore(data){ localStorage.setItem('tdpData', JSON.stringify(normalizeData(data))); }
function resetStore(){ localStorage.setItem('tdpData', JSON.stringify(TDP_DEFAULT_DATA)); return getStore(); }
