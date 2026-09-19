const API_URL=window.TRANQUERAS_CONFIG?.endpoint||'';
const PERGAMINO=[-33.889,-60.573];
const CACHE_KEY='sbvpTranquerasPublicasV1';
let gates=[],markers=new Map(),userMarker=null;
const $=id=>document.getElementById(id);
const map=L.map('map',{zoomControl:false}).setView(PERGAMINO,10);
L.control.zoom({position:'bottomright'}).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);

$('searchInput').addEventListener('input',renderList);
$('refreshBtn').addEventListener('click',()=>loadGates(true));
$('fitBtn').addEventListener('click',fitAll);
$('locateBtn').addEventListener('click',locateUser);

async function loadGates(notify=false){
  if(!API_URL){setStatus('El mapa está listo. Falta habilitar su conexión pública.',true);return}
  $('refreshBtn').classList.add('spinning');
  try{
    const response=await fetch(`${API_URL}?_=${Date.now()}`);
    const result=await response.json();
    if(!result.ok)throw new Error(result.error||'Respuesta inválida');
    gates=(result.tranqueras||[]).filter(item=>Number.isFinite(Number(item.latitud))&&Number.isFinite(Number(item.longitud))).map(normalizeGate);
    localStorage.setItem(CACHE_KEY,JSON.stringify(gates));
    render();
    setStatus(`${gates.length} ubicaciones disponibles.`);
    if(notify)showToast('Información actualizada.');
  }catch(error){console.error(error);setStatus('No se pudo actualizar. Se muestra la última copia disponible.',true)}
  finally{$('refreshBtn').classList.remove('spinning')}
}

function loadCache(){try{const data=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]');if(Array.isArray(data)&&data.length){gates=data.map(normalizeGate);render();setStatus('Mostrando la última copia mientras se actualiza…')}}catch(error){console.warn(error)}}
function normalizeGate(item){return{codigo:String(item.codigo||'Sin código').trim(),titular:String(item.titular||'Sin titular informado').trim(),telefono:String(item.telefono||'').trim(),instrucciones:String(item.instrucciones||'Sin instrucciones informadas').trim(),latitud:Number(item.latitud),longitud:Number(item.longitud)}}
function render(){renderMarkers();renderList();$('count').textContent=gates.length;if(gates.length)fitAll()}
function renderMarkers(){markers.forEach(marker=>marker.remove());markers.clear();gates.forEach((gate,index)=>{const icon=L.divIcon({className:'',html:`<div class="gate-pin">${escapeHtml(shortCode(gate.codigo))}</div>`,iconSize:[34,34],iconAnchor:[17,17]});const marker=L.marker([gate.latitud,gate.longitud],{icon}).addTo(map).bindPopup(`<div class="mini-popup"><strong>Tranquera ${escapeHtml(gate.codigo)}</strong><span>${escapeHtml(gate.titular)}</span><button type="button" data-gate="${index}">Ver información</button></div>`);marker.on('popupopen',event=>event.popup.getElement().querySelector('[data-gate]')?.addEventListener('click',()=>showDetails(index)));markers.set(index,marker)})}
function renderList(){const term=normalizeText($('searchInput').value);const filtered=gates.map((gate,index)=>({gate,index})).filter(({gate})=>normalizeText([gate.codigo,gate.titular,gate.instrucciones].join(' ')).includes(term));$('gateList').innerHTML=filtered.length?filtered.map(({gate,index})=>cardTemplate(gate,index)).join(''):'<p class="status">No hay coincidencias para esa búsqueda.</p>';$('gateList').querySelectorAll('[data-open]').forEach(card=>card.addEventListener('click',event=>{if(event.target.closest('a,button'))return;focusGate(Number(card.dataset.open))}));$('gateList').querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',()=>shareGate(gates[Number(button.dataset.share)])))}
function cardTemplate(gate,index){const phone=phoneDigits(gate.telefono),whatsapp=whatsappNumber(phone);return `<article class="gate-card" data-open="${index}"><header><span class="gate-code">Tranquera ${escapeHtml(gate.codigo)}</span><small>Ver en mapa ↗</small></header><strong>${escapeHtml(gate.titular)}</strong><p>${escapeHtml(gate.instrucciones)}</p><div class="gate-actions">${phone?`<a class="primary" href="tel:${phone}">☎ Llamar</a><a class="whatsapp" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`:''}<a href="${directionsUrl(gate)}" target="_blank" rel="noopener">Cómo llegar</a><button type="button" data-share="${index}">Compartir</button></div></article>`}
function focusGate(index){const gate=gates[index],marker=markers.get(index);if(!gate||!marker)return;map.flyTo([gate.latitud,gate.longitud],16);marker.openPopup();if(innerWidth<=850)$('map').scrollIntoView({behavior:'smooth'})}
function showDetails(index){const gate=gates[index],phone=phoneDigits(gate.telefono),whatsapp=whatsappNumber(phone);if(!gate)return;$('detailsContent').innerHTML=`<div class="detail"><div class="detail-head"><div><p class="eyebrow">Punto de referencia</p><h2>Tranquera ${escapeHtml(gate.codigo)}</h2></div><button class="close" type="button" aria-label="Cerrar">×</button></div><div class="detail-row"><span>Titular</span><strong>${escapeHtml(gate.titular)}</strong></div>${phone?`<div class="detail-row"><span>Teléfono</span><strong>${escapeHtml(gate.telefono)}</strong></div>`:''}<div class="detail-row"><span>Instrucciones de acceso</span><p>${escapeHtml(gate.instrucciones)}</p></div><div class="detail-actions">${phone?`<a class="primary" href="tel:${phone}">☎ Llamar</a><a class="whatsapp" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`:''}<a href="${directionsUrl(gate)}" target="_blank" rel="noopener">Cómo llegar</a><button type="button" data-detail-share>Compartir</button></div></div>`;$('detailsDialog').showModal();$('detailsContent').querySelector('.close').addEventListener('click',()=>$('detailsDialog').close());$('detailsContent').querySelector('[data-detail-share]').addEventListener('click',()=>shareGate(gate))}
function fitAll(){if(!gates.length)return map.setView(PERGAMINO,10);map.fitBounds(L.latLngBounds(gates.map(g=>[g.latitud,g.longitud])).pad(.08),{maxZoom:15})}
function locateUser(){if(!navigator.geolocation)return showToast('Este dispositivo no ofrece ubicación.');showToast('Buscando tu ubicación…');navigator.geolocation.getCurrentPosition(({coords})=>{if(userMarker)userMarker.remove();userMarker=L.circleMarker([coords.latitude,coords.longitude],{radius:8,color:'#fff',weight:3,fillColor:'#247dcc',fillOpacity:1}).addTo(map).bindTooltip('Mi ubicación').openTooltip();map.flyTo([coords.latitude,coords.longitude],14)},()=>showToast('No se pudo acceder a tu ubicación.'),{enableHighAccuracy:true,timeout:10000})}
async function shareGate(gate){const text=`Tranquera ${gate.codigo}\nTitular: ${gate.titular}\n${gate.instrucciones}\nCómo llegar: ${directionsUrl(gate)}`;if(navigator.share){try{await navigator.share({title:`Tranquera ${gate.codigo}`,text});return}catch(error){if(error.name==='AbortError')return}}window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener')}
function directionsUrl(gate){return `https://www.google.com/maps/dir/?api=1&destination=${gate.latitud},${gate.longitud}`}
function phoneDigits(value){return String(value||'').replace(/\D/g,'')}
function whatsappNumber(phone){if(!phone)return'';let number=phone.replace(/^0+/,'');if(number.startsWith('54'))return number.startsWith('549')?number:`549${number.slice(2)}`;return number.length===10?`549${number}`:number}
function shortCode(code){const clean=String(code).replace(/\s+/g,'');return clean.length>4?clean.slice(-4):clean}
function normalizeText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function escapeHtml(value=''){const node=document.createElement('div');node.textContent=value;return node.innerHTML}
function setStatus(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error)}
function showToast(message){const toast=$('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),3000)}

loadCache();
loadGates();
