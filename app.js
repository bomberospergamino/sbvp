const APP_TITLE = 'Herramientas operativas SBVP';

const toast = document.getElementById('toast');
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissInstallBtn = document.getElementById('dismissInstallBtn');

let deferredInstallPrompt = null;

document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const card = trigger.closest('.accordion-card');
    card.classList.toggle('open');
  });
});

document.querySelectorAll('[data-pending]').forEach((el) => {
  el.addEventListener('click', (event) => {
    event.preventDefault();
    const name = el.dataset.pending;
    showToast(`${name}: acceso preparado para vincular cuando esté creado el repo.`);
  });
});

document.getElementById('shareBtn').addEventListener('click', shareApp);

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;

  const dismissed = localStorage.getItem('sbvpInstallDismissed') === 'true';
  if(!dismissed && installBanner) installBanner.classList.remove('hidden');
});

if(installBtn){
  installBtn.addEventListener('click', async () => {
    if(!deferredInstallPrompt){
      showToast('Desde el navegador podés usar “Agregar a pantalla principal”.');
      return;
    }

    installBanner.classList.add('hidden');
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });
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

async function shareApp(){
  const shareData = {
    title: APP_TITLE,
    text: 'Acceso al panel de herramientas operativas de Bomberos Voluntarios Pergamino.',
    url: window.location.href
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
    await navigator.clipboard.writeText(window.location.href);
    showToast('Link copiado al portapapeles.');
  }catch(err){
    showToast(`Copiá este link: ${window.location.href}`);
  }
}

function showToast(message){
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3600);
}
