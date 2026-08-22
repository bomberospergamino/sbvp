const API_URL='https://script.google.com/macros/s/AKfycbxKKdJ3tNnt33UaPymYtwzNRGOkcCuKnNgJnG7zsYufVLZDtyrzGtxo1415jbpd8mU7uQ/exec';
const PERGAMINO=[-33.889,-60.573];
let hydrants=[],markers=new Map(),adding=false,selectingOrigin=false,origin=null,originMarker=null,adminToken='',selectedPhotos=[];
const map=L.map('map',{zoomControl:false}).setView(PERGAMINO,11);
L.control.zoom({position:'bottomright'}).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
const $=id=>document.getElementById(id),editor=$('editorDialog'),details=$('detailsDialog'),form=$('editorForm');

$('addBtn').addEventListener('click',toggleAdding);$('emptyAddBtn').addEventListener('click',toggleAdding);
$('fitBtn').addEventListener('click',fitAll);$('locateBtn').addEventListener('click',locateUser);
$('changeLocationBtn').addEventListener('click',toggleOriginSelection);$('clearOriginBtn').addEventListener('click',clearOrigin);
$('refreshBtn').addEventListener('click',()=>loadHydrants(true));$('searchInput').addEventListener('input',renderList);
$('deleteBtn').addEventListener('click',deleteCurrent);
$('closeEditorBtn').addEventListener('click',()=>editor.close());$('cancelEditorBtn').addEventListener('click',()=>editor.close());
$('galleryInput').addEventListener('change',event=>addSelectedPhotos(event.target.files,event.target));
$('cameraInput').addEventListener('change',event=>addSelectedPhotos(event.target.files,event.target));

map.on('click',({latlng})=>{
  if(selectingOrigin){setOrigin(latlng.lat,latlng.lng,'Ubicación elegida en el mapa');stopModes();return}
  if(adding){stopModes();openEditor(null,latlng.lat,latlng.lng,false)}
});

form.addEventListener('submit',async event=>{
  if(event.submitter?.value==='cancel')return;
  event.preventDefault();
  const id=$('hydrantId').value,isEditing=Boolean(id);
  const data={id,name:$('name').value.trim(),status:$('status').value,publication:$('publication').value,lat:Number($('lat').value),lng:Number($('lng').value),schedule:$('schedule').value.trim(),height:$('height').value.trim(),suitableVehicles:$('vehicles').value.trim(),couplingType:$('coupling').value.trim(),responsible:$('responsible').value.trim(),contact:$('contact').value.trim(),notes:$('notes').value.trim(),photos:selectedPhotos.map(({name,mimeType,base64})=>({name,mimeType,base64}))};
  setFormBusy(true);
  try{
    const result=await apiPost(isEditing?{action:'update',token:adminToken,data}:{action:'add',data});
    if(!result.ok)throw new Error(result.error||'No se pudo guardar.');
    editor.close();await loadHydrants();const baseMessage=isEditing?'Hidrante actualizado.':'Hidrante guardado como PENDIENTE. Para verlo en el mapa, cambiá Publicación a Publicado en la planilla.';showToast(result.photoErrors?.length?`${baseMessage} Algunas fotos no pudieron subirse.`:`${baseMessage}${result.photosUploaded?` ${result.photosUploaded} foto(s) guardada(s).`:''}`,isEditing?3600:8500);
  }catch(error){showToast(error.message)}finally{setFormBusy(false)}
});

async function loadHydrants(notify=false){
  $('refreshBtn').classList.add('spinning');
  try{const response=await fetch(`${API_URL}?action=list&_=${Date.now()}`);const result=await response.json();if(!result.ok)throw new Error(result.error);hydrants=result.hydrants||[];render();if(notify)showToast('Mapa actualizado.');}
  catch(error){showToast('No se pudieron cargar los hidrantes.');console.error(error)}finally{$('refreshBtn').classList.remove('spinning')}
}

function toggleAdding(){adding?stopModes():startAdding()}
function startAdding(){stopModes();adding=true;$('map').style.cursor='crosshair';$('mapHint').textContent='Tocá el lugar exacto del nuevo hidrante.';$('mapHint').classList.remove('hidden');$('addBtn').textContent='× Cancelar';scrollToMap()}
function toggleOriginSelection(){selectingOrigin?stopModes():startOriginSelection()}
function startOriginSelection(){stopModes();selectingOrigin=true;$('map').style.cursor='crosshair';$('mapHint').textContent='Tocá cualquier lugar para buscar hidrantes cercanos.';$('mapHint').classList.remove('hidden');$('changeLocationBtn').textContent='× Cancelar';scrollToMap()}
function stopModes(){adding=false;selectingOrigin=false;$('map').style.cursor='';$('mapHint').classList.add('hidden');$('addBtn').textContent='＋ Agregar hidrante';$('changeLocationBtn').textContent='◎ Cambiar ubicación'}

function setOrigin(lat,lng,label){origin={lat,lng,label};if(originMarker)originMarker.remove();originMarker=L.marker([lat,lng],{icon:L.divIcon({className:'user-origin',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map).bindTooltip(label).openTooltip();$('originSummary').classList.remove('hidden');$('originText').textContent=label;renderList();renderMarkers();}
function clearOrigin(){origin=null;if(originMarker){originMarker.remove();originMarker=null}$('originSummary').classList.add('hidden');renderList();renderMarkers()}
function locateUser(){if(!navigator.geolocation)return showToast('Este dispositivo no ofrece ubicación.');showToast('Buscando tu ubicación…');navigator.geolocation.getCurrentPosition(({coords})=>{setOrigin(coords.latitude,coords.longitude,'Mi ubicación actual');map.flyTo([coords.latitude,coords.longitude],13)},()=>showToast('No se pudo acceder a tu ubicación.'),{enableHighAccuracy:true,timeout:10000})}

function render(){renderMarkers();$('count').textContent=hydrants.length;renderList();if(hydrants.length)fitAll()}
function renderMarkers(){markers.forEach(marker=>marker.remove());markers.clear();hydrants.forEach(item=>{const state=item.status==='Inactivo'?'Inactivo':'Activo';const icon=L.divIcon({className:'hydrant-marker',html:`<div class="hydrant-pin ${state==='Inactivo'?'fuera-servicio':''}"><span>💧</span></div>`,iconSize:[34,34],iconAnchor:[17,31]});const marker=L.marker([item.lat,item.lng],{icon}).addTo(map);const distance=origin?formatDistance(distanceKm(origin,item)):'';marker.bindPopup(`<div class="mini-popup"><strong>${escapeHtml(item.name)}</strong><small>${state}${distance?` · ${distance}`:''}</small><button type="button" data-open-id="${escapeHtml(String(item.id))}">Ver información</button></div>`);marker.on('popupopen',event=>{event.popup.getElement().querySelector('[data-open-id]')?.addEventListener('click',()=>showDetails(item.id))});markers.set(String(item.id),marker)})}
function renderList(){const term=$('searchInput').value.trim().toLowerCase();let filtered=hydrants.filter(item=>[item.name,item.status,item.schedule,item.responsible,item.contact,item.notes].join(' ').toLowerCase().includes(term));if(origin)filtered=filtered.slice().sort((a,b)=>distanceKm(origin,a)-distanceKm(origin,b));$('emptyState').classList.toggle('hidden',hydrants.length>0||term.length>0);$('hydrantList').innerHTML=filtered.map(item=>{const distance=origin?formatDistance(distanceKm(origin,item)):'';return `<button class="hydrant-card" data-id="${escapeHtml(String(item.id))}" type="button"><span class="status-dot ${item.status==='Inactivo'?'fuera-servicio':''}"></span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.status||'Sin estado')}${distance?` · <span class="distance">${distance}</span>`:''}</small></span><span class="chev">›</span></button>`}).join('');$('hydrantList').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>showDetails(button.dataset.id)))}

async function showDetails(id){const item=hydrants.find(h=>String(h.id)===String(id));if(!item)return;map.flyTo([item.lat,item.lng],Math.max(map.getZoom(),14));details.showModal();$('detailsContent').innerHTML='<div class="loading">Cargando ficha…</div>';let photos=[];try{const response=await fetch(`${API_URL}?action=photos&id=${encodeURIComponent(item.id)}&_=${Date.now()}`);const result=await response.json();if(result.ok)photos=result.photos||[]}catch(error){console.warn(error)}
  const distance=origin?formatDistance(distanceKm(origin,item)):'';
  const fields=[['Horario',item.schedule],['Altura',item.height],['Apto móviles',item.suitableVehicles],['Tipo de acople',item.couplingType],['Responsable',item.responsible],['Contacto',item.contact]];
  $('detailsContent').innerHTML=`<div class="details-hero"><div class="dialog-head"><div><p class="eyebrow">Ficha del hidrante</p><h2>${escapeHtml(item.name)}</h2><span class="status-badge ${item.status}">● ${escapeHtml(item.status||'Sin estado')}</span></div><button class="close" type="button" data-close-details aria-label="Cerrar">×</button></div></div><div class="details-body">${distance?`<p class="details-distance">◎ A ${distance} de la ubicación seleccionada</p>`:''}<div class="details-grid">${fields.map(([label,value])=>`<div class="detail"><span>${label}</span><strong>${escapeHtml(value||'Sin información')}</strong></div>`).join('')}</div>${item.notes?`<div class="details-notes">${escapeHtml(item.notes)}</div>`:''}${photos.length?`<div class="photo-gallery">${photos.map(photo=>`<a href="${escapeAttr(photo.url)}" target="_blank" rel="noopener"><img src="${escapeAttr(photo.url)}" alt="${escapeAttr(photo.name)}" loading="lazy"></a>`).join('')}</div>`:''}<div class="details-actions">${item.contact?`<a class="primary" href="tel:${escapeAttr(phoneOnly(item.contact))}">☎ Llamar</a>`:''}${item.photosFolder?`<a href="${escapeAttr(item.photosFolder)}" target="_blank" rel="noopener"><button type="button">▣ Ver fotos</button></a>`:''}<a href="https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}" target="_blank" rel="noopener"><button type="button">↗ Cómo llegar</button></a><button type="button" data-edit-id="${escapeAttr(String(item.id))}">Editar</button></div></div>`;
  document.querySelector('[data-close-details]')?.addEventListener('click',()=>details.close());document.querySelector('[data-edit-id]')?.addEventListener('click',()=>requestEdit(item));
}

async function requestEdit(item){if(!adminToken){const pin=prompt('Ingresá la clave administrativa para editar o eliminar:');if(pin===null)return;try{const result=await apiPost({action:'adminLogin',pin});if(!result.ok)throw new Error(result.error||'Clave incorrecta.');adminToken=result.token}catch(error){showToast(error.message);return}}details.close();openEditor(item,item.lat,item.lng,true)}
function openEditor(item,lat,lng,isAdmin){form.reset();selectedPhotos=[];renderSelectedPhotos();$('hydrantId').value=item?.id||'';$('name').value=item?.name||'';$('status').value=item?.status||'Activo';$('publication').value=item?.publication||'Publicado';$('schedule').value=item?.schedule||'';$('height').value=item?.height||'';$('vehicles').value=item?.suitableVehicles||'';$('coupling').value=item?.couplingType||'';$('responsible').value=item?.responsible||'';$('contact').value=item?.contact||'';$('notes').value=item?.notes||'';$('lat').value=item?.lat??lat;$('lng').value=item?.lng??lng;$('dialogTitle').textContent=item?'Editar hidrante':'Nuevo hidrante';$('adminFields').classList.toggle('hidden',!isAdmin);$('deleteBtn').classList.toggle('hidden',!isAdmin||!item);$('coordinates').textContent=`Ubicación: ${Number($('lat').value).toFixed(6)}, ${Number($('lng').value).toFixed(6)}`;editor.showModal();setTimeout(()=>$('name').focus(),50)}
async function deleteCurrent(){const id=$('hydrantId').value;if(!id||!confirm('¿Eliminar este hidrante del mapa? La fila y sus fotos se conservarán para auditoría.'))return;try{const result=await apiPost({action:'delete',token:adminToken,id});if(!result.ok)throw new Error(result.error);editor.close();await loadHydrants();showToast('Hidrante eliminado del mapa.')}catch(error){showToast(error.message)}}

async function apiPost(payload){const response=await fetch(API_URL,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});return response.json()}
function fitAll(){if(!hydrants.length)return map.setView(PERGAMINO,11);const points=hydrants.map(item=>[item.lat,item.lng]);if(origin)points.push([origin.lat,origin.lng]);map.fitBounds(L.latLngBounds(points).pad(.12),{maxZoom:15})}
function distanceKm(a,b){const R=6371,toRad=value=>value*Math.PI/180,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng),x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function formatDistance(km){return km<1?`${Math.round(km*1000)} m`:`${km.toFixed(km<10?1:0)} km`}
function phoneOnly(value){return String(value).replace(/[^\d+]/g,'')}
function scrollToMap(){if(innerWidth<=760)$('map').scrollIntoView({behavior:'smooth'})}
function setFormBusy(busy){form.querySelectorAll('button,input,select,textarea').forEach(element=>element.disabled=busy)}
async function addSelectedPhotos(files,input){const available=6-selectedPhotos.length;const images=Array.from(files||[]).filter(file=>file.type.startsWith('image/')).slice(0,available);input.value='';if(!images.length)return showToast(available?'Elegí un archivo de imagen.':'Ya seleccionaste el máximo de 6 fotos.');$('photoHelp').textContent='Preparando fotos…';$('photoHelp').closest('.photo-field').classList.add('busy');try{for(const file of images)selectedPhotos.push(await compressPhoto(file));renderSelectedPhotos()}catch(error){showToast('Una de las fotos no pudo prepararse.')}finally{$('photoHelp').closest('.photo-field').classList.remove('busy');updatePhotoHelp()}}
async function compressPhoto(file){const source=typeof createImageBitmap==='function'?await createImageBitmap(file,{imageOrientation:'from-image'}):await loadPhotoElement(file);const scale=Math.min(1,1600/Math.max(source.width,source.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);source.close?.();if(source.dataset?.objectUrl)URL.revokeObjectURL(source.dataset.objectUrl);const dataUrl=canvas.toDataURL('image/jpeg',.82);return{name:(file.name||`foto-${Date.now()}`).replace(/\.[^.]+$/,'.jpg'),mimeType:'image/jpeg',base64:dataUrl.split(',')[1],preview:dataUrl}}
function loadPhotoElement(file){return new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.dataset.objectUrl=url;image.onload=()=>resolve(image);image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la imagen.'))};image.src=url})}
function renderSelectedPhotos(){$('selectedPhotos').innerHTML=selectedPhotos.map((photo,index)=>`<div class="selected-photo"><img src="${photo.preview}" alt="Foto seleccionada ${index+1}"><button type="button" data-remove-photo="${index}" aria-label="Quitar foto">×</button></div>`).join('');$('selectedPhotos').querySelectorAll('[data-remove-photo]').forEach(button=>button.addEventListener('click',()=>{selectedPhotos.splice(Number(button.dataset.removePhoto),1);renderSelectedPhotos();updatePhotoHelp()}));updatePhotoHelp()}
function updatePhotoHelp(){$('photoHelp').textContent=selectedPhotos.length?`${selectedPhotos.length} de 6 fotos listas para subir.`:'Hasta 6 fotos por envío.'}
function escapeHtml(value=''){const node=document.createElement('div');node.textContent=value;return node.innerHTML}
function escapeAttr(value=''){return escapeHtml(value).replace(/"/g,'&quot;')}
function showToast(message,duration=3600){const toast=$('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),duration)}

loadHydrants();
