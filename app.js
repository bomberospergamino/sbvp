const APP_TITLE = 'Herramientas operativas SBVP';

const toast = document.getElementById('toast');

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
document.getElementById('shareTopBtn').addEventListener('click', shareApp);

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
