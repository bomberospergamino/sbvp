const APP_TITLE = 'Herramientas operativas SBVP';

const toast = document.getElementById('toast');
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissInstallBtn = document.getElementById('dismissInstallBtn');
const permanentInstallBtn = document.getElementById('permanentInstallBtn');
const lastCodeUpdate = document.getElementById('lastCodeUpdate');

loadLastCodeUpdate();

let deferredInstallPrompt = null;

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
