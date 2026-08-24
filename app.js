const APP_TITLE = 'Herramientas operativas SBVP';
const FICHERO_URL = 'apps/fichero/';
const CUARTEL_LOCATION = { latitude: -33.8967915, longitude: -60.5823517 };
const FICHERO_RADIUS_METERS = 200;
const ANNOUNCEMENTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxI1YYEKCwVon5SwCxRxrmUg5ZYJ3JGKqlP0G53Ubr4gRshs-IUYA7Z_XIO0HDUhn7xew/exec';

const toast = document.getElementById('toast');
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissInstallBtn = document.getElementById('dismissInstallBtn');
const permanentInstallBtn = document.getElementById('permanentInstallBtn');
const lastCodeUpdate = document.getElementById('lastCodeUpdate');
const ficheroAccess = document.getElementById('ficheroAccess');
const announcementsPanel = document.getElementById('announcementsPanel');

loadLastCodeUpdate();
loadAnnouncements();

if(ficheroAccess) ficheroAccess.addEventListener('click', verifyFicheroLocation);

let deferredInstallPrompt = null;

function verifyFicheroLocation(){
  if(!navigator.geolocation){
    showToast('Este dispositivo no permite verificar la ubicación.');
    return;
  }

  ficheroAccess.disabled = true;
  ficheroAccess.classList.add('location-checking');
  ficheroAccess.querySelector('span:last-child').textContent = 'Verificando ubicación…';

  navigator.geolocation.getCurrentPosition((position) => {
    const distance = distanceInMeters(
      position.coords.latitude,
      position.coords.longitude,
      CUARTEL_LOCATION.latitude,
      CUARTEL_LOCATION.longitude
    );
    const accuracyAllowance = Math.min(position.coords.accuracy || 0, 80);
    if(distance <= FICHERO_RADIUS_METERS + accuracyAllowance){
      ficheroAccess.querySelector('span:first-child').textContent = '🐾';
      ficheroAccess.querySelector('span:last-child').textContent = 'Fichero habilitado';
      window.location.href = FICHERO_URL;
      return;
    }

    resetFicheroAccess();
    showToast(`El Fichero solo se habilita en el cuartel. Distancia detectada: ${Math.round(distance)} m.`);
  }, (error) => {
    resetFicheroAccess();
    const message = error.code === error.PERMISSION_DENIED
      ? 'Necesitamos permiso de ubicación para habilitar el Fichero.'
      : 'No pudimos verificar tu ubicación. Intentá nuevamente cerca del cuartel.';
    showToast(message);
  }, { enableHighAccuracy:true, timeout:12000, maximumAge:30000 });
}

function resetFicheroAccess(){
  ficheroAccess.disabled = false;
  ficheroAccess.classList.remove('location-checking');
  ficheroAccess.querySelector('span:first-child').textContent = '🔒';
  ficheroAccess.querySelector('span:last-child').textContent = 'Fichero';
}

function distanceInMeters(lat1, lon1, lat2, lon2){
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function loadAnnouncements(){
  if(!announcementsPanel) return;
  const today = dateInArgentina();
  try{
    const url = `${ANNOUNCEMENTS_ENDPOINT}?action=calendario&date=${encodeURIComponent(today)}`;
    const response = await fetch(url, {cache:'no-store'});
    if(!response.ok) throw new Error('No se pudieron cargar los anuncios');
    const data = await response.json();
    renderAnnouncements(data.items || []);
  }catch(error){
    announcementsPanel.innerHTML = '<p class="announcements-status">No se pudieron cargar los recordatorios en este momento.</p>';
  }
}

function renderAnnouncements(items){
  announcementsPanel.innerHTML = '';
  if(!items.length){
    announcementsPanel.innerHTML = '<p class="announcements-status">No hay recordatorios para hoy.</p>';
    return;
  }
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'announcement-card';
    const icon = document.createElement('span');
    icon.className = 'announcement-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = announcementIcon(item.tipo);
    const content = document.createElement('div');
    const type = document.createElement('strong');
    type.textContent = item.tipo || 'Recordatorio';
    const message = document.createElement('span');
    message.textContent = announcementMessage(item);
    content.append(type, message);
    card.append(icon, content);
    announcementsPanel.appendChild(card);
  });
}

function announcementIcon(type){
  const value = String(type || '').toLowerCase();
  if(value.includes('cumple')) return '🎂';
  if(value.includes('anivers') || value.includes('alta')) return '🎖️';
  if(value.includes('reun')) return '📅';
  return '📌';
}

function announcementMessage(item){
  const type = String(item.tipo || '').trim().toLowerCase();
  const isBirthday = type.includes('cumple');
  const name = item.nombre || item.persona || item.felicitado || item.mensaje || 'Recordatorio';
  const years = item.anios ?? item.años ?? item.cantidad_anios ?? item.cantidad_anos ?? item.antiguedad ?? '';
  if(isBirthday || years === '' || years === null) return String(name);

  const yearsLabel = `${years} ${Number(years) === 1 ? 'año' : 'años'}`;
  return String(name).toLowerCase().includes(String(yearsLabel).toLowerCase())
    ? String(name)
    : `${name} · ${yearsLabel}`;
}

function dateInArgentina(offsetDays = 0){
  const date = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone:'America/Argentina/Buenos_Aires', year:'numeric', month:'2-digit', day:'2-digit'
  }).format(date);
}

async function loadLastCodeUpdate(){
  if(!lastCodeUpdate) return;

  const cacheKey = 'sbvpLastCodeUpdate';
  const cachedDate = localStorage.getItem(cacheKey);
  if(cachedDate) showLastCodeUpdate(cachedDate);

  try{
    const response = await fetch('https://api.github.com/repos/bomberospergamino/sbvp/commits/main', {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if(!response.ok) throw new Error('No se pudo consultar la actualización');

    const data = await response.json();
    const updateDate = data?.commit?.committer?.date;
    if(!updateDate) throw new Error('La actualización no tiene fecha');

    localStorage.setItem(cacheKey, updateDate);
    showLastCodeUpdate(updateDate);
  }catch(error){
    if(!cachedDate) lastCodeUpdate.textContent = 'no disponible';
  }
}

function showLastCodeUpdate(value){
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return;

  lastCodeUpdate.dateTime = date.toISOString();
  lastCodeUpdate.textContent = date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const card = trigger.closest('.accordion-card');
    card.classList.toggle('open');
  });
});

document.querySelectorAll('[data-pending]').forEach((el) => {
  el.classList.add('is-pending');
  el.setAttribute('aria-disabled', 'true');
  el.removeAttribute('href');
  el.tabIndex = -1;
});

document.getElementById('shareBtn').addEventListener('click', shareApp);
if(permanentInstallBtn) permanentInstallBtn.addEventListener('click', installApp);

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;

  const dismissed = localStorage.getItem('sbvpInstallDismissed') === 'true';
  if(!dismissed && installBanner) installBanner.classList.remove('hidden');
});

if(installBtn){
  installBtn.addEventListener('click', installApp);
}

if(dismissInstallBtn){
  dismissInstallBtn.addEventListener('click', () => {
    installBanner.classList.add('hidden');
    localStorage.setItem('sbvpInstallDismissed', 'true');
  });
}

window.addEventListener('appinstalled', () => {
  installBanner.classList.add('hidden');
  localStorage.setItem('sbvpInstallDismissed', 'true');
  showToast('APP instalada correctamente.');
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

async function installApp(){
  if(deferredInstallPrompt){
    if(installBanner) installBanner.classList.add('hidden');
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if(isIOS){
    showToast('En iPhone: abrí Compartir y elegí “Agregar a pantalla de inicio”.');
  }else{
    showToast('Abrí el menú del navegador y elegí “Instalar app” o “Agregar a pantalla principal”.');
  }
}

async function shareApp(){
  const publicAppUrl = 'https://sbvp-sigma.vercel.app/';
  const invitation = 'Te invitamos a descargar esta app que nos ayuda a organizarnos.\n\n¡Que tengas buena guardia! 👨‍🚒👩‍🚒💜';
  const shareData = {
    title: APP_TITLE,
    text: invitation,
    url: publicAppUrl
  };

  if(navigator.share){
    try{
      await navigator.share(shareData);
      return;
    }catch(err){
      if(err.name === 'AbortError') return;
    }
  }

  try{
    await navigator.clipboard.writeText(`${invitation}\n\n${publicAppUrl}`);
    showToast('Invitación y link copiados al portapapeles.');
  }catch(err){
    showToast(`Copiá este link: ${publicAppUrl}`);
  }
}

function showToast(message){
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3600);
}
