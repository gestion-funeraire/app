var TARIFS={j1:2000,j11:2500,nec:25000,fml:4000,inj:1500,cpl:11000};
var USERS_DB=[
{login:'gabriel',pass:'promoteur123',nom:'GBEDJISSOKPA Gabriel',role:'Promoteur',actif:true,last:'Jamais',pwDate:today()},
{login:'basile',pass:'gerant123',nom:'BOKOSSA BASILE',role:'Gérant',actif:true,last:'Jamais',pwDate:today()},
{login:'agent1',pass:'agent123',nom:'SEMONTCHE Jean-Marie',role:'Agent',actif:true,last:'Jamais',pwDate:today()},
];
var today0=new Date().toISOString().slice(0,10);
function daysAgo(n){var d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);}
var CORPS0=[];
var REC0=[];
var DEP0=[];
var SAL0=[];
var JNL0=[];
var PERS0=[];
var STK0=[
{a:'Formol',u:'litres',q:0,min:20},{a:'Gants',u:'paires',q:0,min:10},
{a:'Chaussettes',u:'paires',q:0,min:10},{a:'Coton',u:'rouleaux',q:0,min:5},
{a:'Porpeline',u:'pièces',q:0,min:5},{a:'Voile',u:'pièces',q:0,min:5},
{a:'Chapelet',u:'pièces',q:0,min:5},{a:'Super Glue',u:'flacons',q:0,min:3},
{a:'Alcool',u:'litres',q:0,min:2},{a:'Épingles',u:'boîtes',q:0,min:2},
{a:'Scotch',u:'rouleaux',q:0,min:2},{a:'Latex',u:'paires',q:0,min:8},
{a:'Marqueur',u:'pièces',q:0,min:2},{a:'Boîte de maquillage',u:'boîtes',q:0,min:1},
];
var corps,recettes,depenses,salaires,personnel,stocks,stocksLog,journal,notifications=[],corpsN,selC,CU,depN,USERS_LIST=[];
function deepCopy(arr){return JSON.parse(JSON.stringify(arr));}
var LS_KEY='colombe_nge_data';
async function sauvegarder(){
try{
var data={
corps:corps,recettes:recettes,depenses:depenses,
salaires:salaires,personnel:personnel,stocks:stocks,
stocksLog:stocksLog,
journal:journal,notifications:notifications,corpsN:corpsN,depN:depN,
tarifs:TARIFS,users:USERS_DB,
savedAt:new Date().toISOString()
};
localStorage.setItem(LS_KEY,JSON.stringify(data));
var e=document.getElementById('last-backup');
if(e)e.textContent=now();
syncCloud(data);
}catch(err){console.warn('Sauvegarde locale échouée:',err);}
}
var ORG_ID=null;
var SYNC_EN_COURS=false;
var DERNIERE_SYNC_CLOUD=null;
async function syncCloud(data){
if(SYNC_EN_COURS)return;
try{
SYNC_EN_COURS=true;
var donnees={
corps:data.corps,recettes:data.recettes,depenses:data.depenses,
salaires:data.salaires,personnel:data.personnel,stocks:data.stocks,
stocksLog:data.stocksLog,journal:data.journal,notifications:data.notifications,
corpsN:data.corpsN,depN:data.depN,tarifs:data.tarifs
};
var res=await sb.from('app_data').upsert({
organisation_id:ORG_ID,
donnees:donnees,
updated_by:CU?CU.id:null
});
if(!res.error){
DERNIERE_SAUVEGARDE_TS=Date.now();
DERNIER_CLOUD_TS=Date.now();
var e=document.getElementById('last-backup');
if(e)e.textContent=now()+' (cloud ✓)';
}
}catch(err){console.warn('Synchronisation cloud échouée:',err);}
finally{SYNC_EN_COURS=false;}
}
async function chargerCloud(){
try{
var r=await sb.from('app_data').select('donnees,updated_at').eq('organisation_id',ORG_ID).single();
if(r.error||!r.data){
corps=[];recettes=[];depenses=[];salaires=[];personnel=[];stocksLog=[];journal=[];notifications=[];
stocks=deepCopy(STK0);
corpsN=1;depN=1;
return{ok:true,ts:Date.now()};
}
var d=r.data.donnees||{};
corps=d.corps||[];
recettes=d.recettes||[];
depenses=d.depenses||[];
salaires=d.salaires||[];
personnel=d.personnel||[];
stocks=(d.stocks&&d.stocks.length>0)?d.stocks:deepCopy(STK0);
stocksLog=d.stocksLog||[];
journal=d.journal||[];
notifications=d.notifications||[];
corpsN=d.corpsN||1;
depN=d.depN||1;
if(d.tarifs)Object.assign(TARIFS,d.tarifs);
return{ok:true,ts:new Date(r.data.updated_at).getTime()};
}catch(err){
console.warn('Chargement cloud échoué:',err);
corps=[];recettes=[];depenses=[];salaires=[];personnel=[];stocksLog=[];journal=[];notifications=[];
return{ok:false,ts:null};
}
}
var DERNIER_CLOUD_TS=null;
var DERNIERE_SAUVEGARDE_TS=null;
async function rafraichirCloud(){
if(SYNC_EN_COURS)return;
if(!CU||!ORG_ID)return;
if(DERNIERE_SAUVEGARDE_TS&&Date.now()-DERNIERE_SAUVEGARDE_TS<8000)return;
try{
var orgAuMoment=ORG_ID;
var r=await sb.from('app_data').select('updated_at').eq('organisation_id',ORG_ID).single();
if(!CU||ORG_ID!==orgAuMoment)return;
if(!r.data)return;
var cloudTs=new Date(r.data.updated_at).getTime();
if(!DERNIER_CLOUD_TS||cloudTs>DERNIER_CLOUD_TS){
var res=await chargerCloud();
if(!CU||ORG_ID!==orgAuMoment)return;
if(res.ok){
DERNIER_CLOUD_TS=res.ts;
var pages=['dashboard','corps','retrait','facturation','recettes','depenses','stocks','personnel','salaires','journal','rapports'];
pages.forEach(rp);
updateBadgeNotifs();
if(el('notif-panel').style.display==='block')rdNotifPanel();
if(selC){
var num=selC.num;
for(var i=0;i<corps.length;i++){if(corps[i].num===num){selC=corps[i];break;}}
if(selC)ouvrF(selC.num);
}
}
}
}catch(err){console.warn('Rafraîchissement cloud échoué:',err);}
}
setInterval(async function(){if(CU)await rafraichirCloud();},10000);
function chargerDepuisLocal(){
try{
var raw=localStorage.getItem(LS_KEY);
if(!raw)return false;
var data=JSON.parse(raw);
corps=data.corps||[];
recettes=data.recettes||[];
depenses=data.depenses||[];
salaires=data.salaires||[];
personnel=data.personnel&&data.personnel.length>0?data.personnel:deepCopy(PERS0);
stocks=data.stocks&&data.stocks.length>0?data.stocks:deepCopy(STK0);
stocksLog=data.stocksLog||[];
journal=data.journal||[];
corpsN=data.corpsN||1;
depN=data.depN||1;
if(data.tarifs)Object.assign(TARIFS,data.tarifs);
if(data.users&&data.users.length>0){
USERS_DB.length=0;
data.users.forEach(function(u){USERS_DB.push(u);});
}
return true;
}catch(err){console.warn('Chargement local échoué:',err);return false;}
}
function initData(){
var loaded=chargerDepuisLocal();
if(!loaded){
corps=deepCopy(CORPS0);
recettes=deepCopy(REC0);
depenses=deepCopy(DEP0);
salaires=deepCopy(SAL0);
personnel=deepCopy(PERS0);
stocks=deepCopy(STK0);
stocksLog=[];
journal=deepCopy(JNL0);
corpsN=1;depN=1;
}
selC=null;
}
initData();
function exporterJSON(){
try{
var data={
corps:corps,recettes:recettes,depenses:depenses,
salaires:salaires,personnel:personnel,stocks:stocks,
stocksLog:stocksLog,
journal:journal,corpsN:corpsN,depN:depN,
tarifs:TARIFS,users:USERS_DB,
exportedAt:now(),version:'1.0'
};
var json=JSON.stringify(data,null,2);
var blob=new Blob([json],{type:'application/json;charset=utf-8'});
var url=URL.createObjectURL(blob);
var a=document.createElement('a');
a.href=url;
a.download='COLOMBE_sauvegarde_'+today()+'.json';
document.body.appendChild(a);a.click();
document.body.removeChild(a);URL.revokeObjectURL(url);
alert('✓ Sauvegarde exportée!\n\nFichier : COLOMBE_sauvegarde_'+today()+'.json\n\nConservez ce fichier dans un endroit sûr.');
}catch(err){alert('Erreur export : '+err.message);}
}
function importerJSON(){
var input=document.createElement('input');
input.type='file';input.accept='.json,application/json';
input.onchange=function(e){
var file=e.target.files[0];
if(!file)return;
var reader=new FileReader();
reader.onload=function(ev){
try{
var data=JSON.parse(ev.target.result);
if(!data.corps&&!data.recettes){alert('Fichier invalide. Veuillez choisir un fichier de sauvegarde COLOMBE.');return;}
if(!confirm('⚠️ RESTAURATION\n\nCette action remplacera toutes les données actuelles par celles du fichier :\n'+file.name+'\n\nConfirmer ?'))return;
corps=data.corps||[];
recettes=data.recettes||[];
depenses=data.depenses||[];
salaires=data.salaires||[];
personnel=data.personnel&&data.personnel.length>0?data.personnel:deepCopy(PERS0);
stocks=data.stocks&&data.stocks.length>0?data.stocks:deepCopy(STK0);
stocksLog=data.stocksLog||[];
journal=data.journal||[];
corpsN=data.corpsN||1;
depN=data.depN||1;
if(data.tarifs)Object.assign(TARIFS,data.tarifs);
if(data.users&&data.users.length>0){USERS_DB.length=0;data.users.forEach(function(u){USERS_DB.push(u);});}
sauvegarder();
selC=null;
el('fact-panel').style.display='none';
el('fact-ph').style.display='block';
var pages=['dashboard','corps','retrait','facturation','recettes','depenses','stocks','personnel','salaires','journal','utilisateurs','rapports'];
pages.forEach(function(p){rp(p);});
genNum();fillSalSel();
addLog('Restauration','Depuis fichier : '+file.name);rdJnl();
alert('✓ Données restaurées avec succès depuis :\n'+file.name);
}catch(err){alert('Erreur lors de la restauration : '+err.message);}
};
reader.readAsText(file);
};
input.click();
}
function el(id){return document.getElementById(id);}
function v(id){var e=el(id);return e?e.value:'';}
function sv(id,val){var e=el(id);if(e)e.textContent=val;}
function now(){return new Date().toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function today(){return new Date().toISOString().slice(0,10);}
function fd(d){if(!d)return'—';var p=d.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d;}
function ech(arr){var d=new Date(arr);d.setDate(d.getDate()+30);return d.toISOString().slice(0,10);}
function jC(arr,ret){var d1=new Date(arr);d1.setHours(0,0,0,0);var d2=ret?new Date(ret):new Date();d2.setHours(0,0,0,0);return Math.max(0,Math.round((d2.getTime()-d1.getTime())/86400000)+1);}
function jR(arr){return Math.floor((new Date(ech(arr)).getTime()-Date.now())/86400000);}
function fcfa(n){if(n===null||n===undefined)return'—';return new Intl.NumberFormat('fr-FR').format(n)+' F';}
function fmt(n){return new Intl.NumberFormat('fr-FR').format(n);}
function depNum(){return'D-'+String(depN).padStart(4,'0');}
var PHOTO_DATA={};
var CLOUDINARY_CLOUD='dzqvfopos';
var CLOUDINARY_PRESET='morgue_photos';
async function uploadPhoto(dataUrl,chemin){
try{
var arr=dataUrl.split(',');
var mime=arr[0].match(/:(.*?);/)[1];
var bstr=atob(arr[1]),n=bstr.length,u8=new Uint8Array(n);
for(var i=0;i<n;i++)u8[i]=bstr.charCodeAt(i);
var blob=new Blob([u8],{type:mime});
var ext=mime.indexOf('png')>=0?'png':'jpg';
var nomFichier=chemin.replace(/\
var formData=new FormData();
formData.append('file',blob,nomFichier);
formData.append('upload_preset',CLOUDINARY_PRESET);
formData.append('public_id',nomFichier.replace('.'+ext,''));
var r=await fetch('https://api.cloudinary.com/v1_1/'+CLOUDINARY_CLOUD+'/image/upload',{
method:'POST',
body:formData
});
var data=await r.json();
if(data.error){alert('Erreur Cloudinary : '+data.error.message);return null;}
return data.secure_url;
}catch(e){alert('Exception upload : '+e.message);return null;}
}
async function getPhotoUrl(path){
if(!path)return null;
return path;
}
function compressImage(file,maxDim,quality,cb){
if(!file.type||file.type.indexOf('image/')!==0){
var r=new FileReader();
r.onload=function(e){cb(e.target.result);};
r.onerror=function(){cb(null);};
r.readAsDataURL(file);
return;
}
var reader=new FileReader();
reader.onload=function(e){
var img=new Image();
img.onload=function(){
var w=img.width,h=img.height;
if(w>maxDim||h>maxDim){
if(w>h){h=Math.round(h*maxDim/w);w=maxDim;}
else{w=Math.round(w*maxDim/h);h=maxDim;}
}
var canvas=document.createElement('canvas');
canvas.width=w;canvas.height=h;
var ctx=canvas.getContext('2d');
ctx.drawImage(img,0,0,w,h);
try{cb(canvas.toDataURL('image/jpeg',quality));}
catch(err){cb(e.target.result);}
};
img.onerror=function(){cb(e.target.result);};
img.src=e.target.result;
};
reader.onerror=function(){cb(null);};
reader.readAsDataURL(file);
}
function initPhotoFields(){
document.querySelectorAll('.photo-field').forEach(function(wrap){
if(wrap.dataset.bound==='1')return;
wrap.dataset.bound='1';
var key=wrap.getAttribute('data-key');
var preview=wrap.querySelector('.photo-preview');
var img=preview?preview.querySelector('img'):null;
wrap.querySelectorAll('input[type=file]').forEach(function(inp){
inp.addEventListener('change',function(){
if(!inp.files||!inp.files[0])return;
compressImage(inp.files[0],1280,0.72,function(dataUrl){
if(!dataUrl)return;
PHOTO_DATA[key]=dataUrl;
if(preview){preview.style.display='flex';if(img)img.src=dataUrl;}
});
});
});
var rm=wrap.querySelector('.photo-remove');
if(rm)rm.addEventListener('click',function(){
delete PHOTO_DATA[key];
if(preview)preview.style.display='none';
wrap.querySelectorAll('input[type=file]').forEach(function(i){i.value='';});
});
});
}
function resetPhotoField(key){
delete PHOTO_DATA[key];
var wrap=document.querySelector('.photo-field[data-key="'+key+'"]');
if(!wrap)return;
var preview=wrap.querySelector('.photo-preview');
if(preview)preview.style.display='none';
wrap.querySelectorAll('input[type=file]').forEach(function(i){i.value='';});
}
var SB_URL='https://gvamgrzrkxsqpvizmycw.supabase.co';
var SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2YW1ncnpya3hzcXB2aXpteWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMjQ0MDUsImV4cCI6MjA5NjkwMDQwNX0.HEOJq16ffFnfE4Pmog7Amxn10Auy5jA72N5TwY0-bM0';
var sb=supabase.createClient(SB_URL,SB_KEY);
emailjs.init('uP7YuitU4aunee4Ya');
async function fetchProfil(userId){
var r=await sb.from('profils').select('*').eq('id',userId).single();
if(r.error)return null;
return r.data;
}
function profilVersCU(id,profil){
return{id:id,login:profil.login,nom:profil.nom,role:profil.role,pwDate:profil.mdp_date,org:profil.organisation_id,last:now()};
}
async function entrerApp(u){
viderDonneesMemoire();
CU=u;
ORG_ID=u.org;
if(!ORG_ID){
alert('Erreur : organisation introuvable pour ce compte. Contactez votre administrateur.');
await sb.auth.signOut();
CU=null;
el('login-screen').style.display='flex';
return;
}
el('login-screen').style.display='none';
el('app').style.display='flex';
sv('user-display',u.nom);sv('user-role-display',u.role);
el('user-avatar').textContent=u.nom[0];
var msgs=[
'Chaque famille mérite dignité et professionnalisme. 🕊️',
'Votre dévouement fait une vraie différence pour les familles. 💛',
'Accueillez chaque famille avec empathie et respect. 🤝',
'Votre travail honore ceux qui ne peuvent plus parler. 🙏',
'La rigueur aujourd\'hui,c\'est la confiance de demain. ⭐',
'Un service funéraire de qualité commence par vous. 🌟',
'Soyez attentifs aux besoins de chaque famille endeuillée. 💙',
'La compassion est votre plus grande force. 🌿',
'Chaque dossier est une histoire de vie. Traitez-le avec soin. 📋',
'Votre professionnalisme apaise les familles dans l\'épreuve. 🕯️'
];
var bvMsg=msgs[Math.floor(Math.random()*msgs.length)];
var bvEtab=TARIFS.etab||u.nom||'Gestion Funéraire';
var bvLogo=TARIFS.logo;
var bv=document.createElement('div');
bv.id='bienvenue-screen';
bv.style.cssText='position:fixed;inset:0;background:var(--night);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;padding:24px;text-align:center;';
bv.innerHTML='<div style="margin-bottom:20px">'+(bvLogo?'<img src="'+bvLogo+'" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--or)">':'<div style="width:80px;height:80px;border-radius:50%;background:var(--panel);border:3px solid var(--or);display:flex;align-items:center;justify-content:center;font-size:36px;margin:auto">🏥</div>')+'</div>'
+'<div style="font-size:11px;color:var(--or);text-transform:uppercase;letter-spacing:.15em;margin-bottom:8px">Bienvenue</div>'
+'<div style="font-size:20px;font-weight:700;color:var(--white);margin-bottom:4px">'+bvEtab+'</div>'
+'<div style="font-size:13px;color:var(--text-dim);margin-bottom:28px">'+u.nom+' — '+u.role+'</div>'
+'<div style="font-size:14px;color:var(--text);max-width:300px;line-height:1.6;margin-bottom:28px;font-style:italic">'+bvMsg+'</div>'
+'<div style="width:200px;height:3px;background:var(--border);border-radius:2px;overflow:hidden"><div id="bv-bar" style="height:100%;width:0%;background:var(--or);transition:width 10s linear"></div></div>'
+'<div style="margin-top:16px;font-size:11px;color:var(--text-dim)">Appuyez pour continuer</div>';
bv.onclick=function(){bv.remove();};
document.body.appendChild(bv);
setTimeout(function(){var b=document.getElementById('bv-bar');if(b)b.style.width='100%';},100);
setTimeout(function(){var s=document.getElementById('bienvenue-screen');if(s)s.remove();},10200);
if(u.role==='Agent'){
document.querySelectorAll('.admin-only').forEach(function(x){x.style.display='none';});
document.querySelectorAll('.agent-hidden').forEach(function(x){x.style.display='none';});
}else{
document.querySelectorAll('.agent-hidden').forEach(function(x){x.style.display='';});
document.querySelectorAll('.admin-only').forEach(function(x){x.style.display='';});
}
await chargerCloud().then(function(res){if(res&&res.ts)DERNIER_CLOUD_TS=res.ts;});
await chargerPlanAbonnement();
applyIdentite();
updateBadgeNotifs();
initApp();startClock();initPhotoFields();
NAV_HISTORY=[];updateBoutonRetour();
if(u.role==='Agent'){
var navCorps=document.querySelector('[onclick="navTo(\'corps\',this)"]');
navTo('corps',navCorps);
}else{
var navDash=document.querySelector('[onclick="navTo(\'dashboard\',this)"]');
navTo('dashboard',navDash);
}
NAV_HISTORY=[];updateBoutonRetour();
}
var PW_EXPIRE_DAYS=30;
var PENDING_USER=null;
function pwExpired(profil){
if(!profil.mdp_date)return false;
var ms=Date.now()-new Date(profil.mdp_date).getTime();
return ms>PW_EXPIRE_DAYS*24*60*60*1000;
}
function afficherChangementMdp(id,profil){
PENDING_USER={id:id,profil:profil};
el('login-user').value='';el('login-pass').value='';
el('pwchange-new').value='';el('pwchange-confirm').value='';
el('pwchange-error').style.display='none';
el('login-screen').style.display='none';
el('pwchange-screen').style.display='flex';
}
function afficherInscription(){
el('login-screen').style.display='none';
el('inscription-screen').style.display='flex';
el('inscription-error').style.display='none';
['ins-etab','ins-nom','ins-tel','ins-login','ins-pass','ins-pass2'].forEach(function(id){el(id).value='';});
}
async function doInscription(){
var etab=v('ins-etab').trim(),nom=v('ins-nom').trim(),login=v('ins-login').trim().toLowerCase(),
pass=v('ins-pass'),pass2=v('ins-pass2');
var err=el('inscription-error');
err.style.display='none';
if(!etab||!nom||!login||!pass){err.textContent='Veuillez remplir tous les champs obligatoires.';err.style.display='block';return;}
if(login.length<3){err.textContent='L\'identifiant doit contenir au moins 3 caractères.';err.style.display='block';return;}
if(!/^[a-z0-9_]+$/.test(login)){err.textContent='L\'identifiant ne doit contenir que des lettres minuscules,chiffres et underscores.';err.style.display='block';return;}
if(pass.length<4){err.textContent='Le mot de passe doit contenir au moins 4 caractères.';err.style.display='block';return;}
if(pass!==pass2){err.textContent='Les mots de passe ne correspondent pas.';err.style.display='block';return;}
var res=await sb.rpc('inscrire_organisation',{
p_nom_etablissement:etab,
p_login:login,
p_nom_utilisateur:nom,
p_mdp:pass
});
if(res.error){err.textContent='Erreur : '+res.error.message;err.style.display='block';return;}
var data=res.data;
if(!data.success){err.textContent=data.error||'Une erreur est survenue.';err.style.display='block';return;}
if(data.organisation_id){
await sb.from('organisations').update({
date_essai_debut: new Date().toISOString(),
abonnement_actif: false,
type_abonnement: 'essai'
}).eq('id',data.organisation_id);
await sb.from('app_data').upsert({organisation_id:data.organisation_id,cle:'contact_whatsapp',valeur:v('ins-tel').trim()},{onConflict:'organisation_id,cle'});
await sb.from('app_data').upsert({organisation_id:data.organisation_id,cle:'pays',valeur:v('ins-pays')},{onConflict:'organisation_id,cle'});
}
try{
await emailjs.send('service_c8043ar','template_o8sz65v',{
etablissement: etab,
nom_promoteur: nom,
whatsapp: v('ins-tel').trim(),
pays: v('ins-pays'),
login: login,
date: new Date().toLocaleDateString('fr-FR'),
name: nom,
email: 'gestionfuneraire.app@gmail.com'
});
}catch(e){console.log('Email error:',e);}
var telClient=v('ins-tel').trim();
var paysClient=v('ins-pays');
var msgWa='🆕 *Nouvelle inscription-Gestion Funéraire*%0A%0A'
+'🏥 *Établissement :* '+encodeURIComponent(etab)+'%0A'
+'👤 *Promoteur :* '+encodeURIComponent(nom)+'%0A'
+'📱 *WhatsApp :* '+encodeURIComponent(telClient)+'%0A'
+'🌍 *Pays :* '+encodeURIComponent(paysClient)+'%0A'
+'🔑 *Login :* '+encodeURIComponent(login)+'%0A%0A'
+'⏳ *Essai gratuit :* 15 jours%0A'
+'📅 *Date :* '+encodeURIComponent(new Date().toLocaleDateString('fr-FR'));
var waUrl='https://wa.me/2290162496691?text='+msgWa;
el('inscription-screen').style.display='none';
el('login-screen').style.display='flex';
el('login-user').value=login;
el('login-pass').value='';
var popup=document.createElement('div');
popup.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px;';
popup.innerHTML='<div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:28px 24px;max-width:340px;width:100%;text-align:center;"><div style="font-size:36px;margin-bottom:12px">&#x2705;</div><h3 style="color:#f7f4ee;font-size:16px;margin-bottom:8px">Compte cr&#233;&#233;avec succ&#232;s!</h3><p style="color:#8b8b8b;font-size:13px;margin-bottom:6px">&#201;tablissement :<strong style="color:#d4d0c8">'+etab+'</strong></p><p style="color:#8b8b8b;font-size:13px;margin-bottom:20px">Identifiant :<strong style="color:#C8973A">'+login+'</strong></p><p style="color:#8b8b8b;font-size:12px;margin-bottom:16px">&#x1F381;<strong style="color:#C8973A">15 jours essai gratuit</strong></p><a href="'+waUrl+'" target="_blank" style="display:block;background:#25D366;color:#fff;border-radius:8px;padding:12px;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:10px">&#x1F4AC;Notifier le support WhatsApp</a><button onclick="this.parentElement.parentElement.remove();" style="background:none;border:none;color:#8b8b8b;font-size:12px;cursor:pointer;padding:8px;">Passer&#x2192;Se connecter</button></div>';
document.body.appendChild(popup);
}
async function doLogin(){
var lg=v('login-user').trim(),pw=v('login-pass'),err=el('login-error');
err.style.display='none';
if(!lg||!pw){err.textContent='Veuillez saisir votre login et votre mot de passe.';err.style.display='block';return;}
var email=lg+'@morgue.local';
var res=await sb.auth.signInWithPassword({email:email,password:pw});
if(res.error){err.textContent='Erreur connexion : '+res.error.message;err.style.display='block';console.error(res.error);return;}
var uid=res.data.user.id;
var profil=await fetchProfil(uid);
if(!profil){err.textContent='Profil introuvable. Contactez votre administrateur.';err.style.display='block';await sb.auth.signOut();return;}
if(!profil.actif){
if(profil.role==='Agent')err.textContent='Session désactivée,veuillez contacter votre administrateur.';
else err.textContent='Compte désactivé. Contactez l\'administrateur.';
err.style.display='block';
await sb.auth.signOut();
return;
}
if(pwExpired(profil)){afficherChangementMdp(uid,profil);return;}
var orgRes=await sb.from('organisations').select('actif,abonnement_actif,date_essai_debut,type_abonnement,date_fin_abonnement').eq('id',profil.organisation_id).single();
if(!orgRes.error&&orgRes.data){
var org=orgRes.data;
if(!org.actif){err.textContent='⛔ Structure désactivée. Veuillez vous réabonner ou contacter votre administrateur.';err.style.display='block';await sb.auth.signOut();return;}
if(!org.abonnement_actif){
var debut=new Date(org.date_essai_debut||org.created_at||Date.now());
var joursEcoules=Math.floor((Date.now()-debut.getTime())/(1000*60*60*24));
if(joursEcoules>15){
await sb.auth.signOut();
el('login-screen').style.display='none';
el('essai-expire-screen').style.display='flex';
return;
}
}
}
addLog('Connexion','');
sauvegarder();
await entrerApp(profilVersCU(uid,profil));
}
async function doChangePassword(){
var pend=PENDING_USER,err=el('pwchange-error');
err.style.display='none';
if(!pend)return;
var p1=v('pwchange-new'),p2=v('pwchange-confirm');
if(!p1||p1.length<4){err.textContent='Le mot de passe doit contenir au moins 4 caractères.';err.style.display='block';return;}
if(p1!==p2){err.textContent='Les mots de passe ne correspondent pas.';err.style.display='block';return;}
var upd=await sb.auth.updateUser({password:p1});
if(upd.error){err.textContent='Erreur : '+upd.error.message;err.style.display='block';return;}
await sb.from('profils').update({mdp_date:today()}).eq('id',pend.id);
pend.profil.mdp_date=today();
addLog('Changement mdp (expiration)',pend.profil.login);
sauvegarder();
el('pwchange-screen').style.display='none';
var cu=profilVersCU(pend.id,pend.profil);
PENDING_USER=null;
await entrerApp(cu);
}
function viderDonneesMemoire(){
corps=[];recettes=[];depenses=[];salaires=[];personnel=[];
stocks=[];stocksLog=[];journal=[];notifications=[];
corpsN=1;depN=1;selC=null;
ORG_ID=null;
DERNIER_CLOUD_TS=null;DERNIERE_SAUVEGARDE_TS=null;
PHOTO_DATA={};
TARIFS.etab='';TARIFS.adresse='';TARIFS.ville='';TARIFS.tel='';TARIFS.logo=null;
updateBadgeNotifs();
var p=el('notif-panel');if(p)p.style.display='none';
var ov=el('notif-overlay');if(ov)ov.style.display='none';
NAV_HISTORY=[];
updateBoutonRetour();
}
async function doLogout(){
addLog('Déconnexion','');
sauvegarder();
await sb.auth.signOut();
CU=null;
viderDonneesMemoire();
var pages=['dashboard','corps','retrait','facturation','recettes','depenses','stocks','personnel','salaires','journal','utilisateurs','rapports'];
pages.forEach(function(p){rp(p);});
el('app').style.display='none';el('login-screen').style.display='flex';
el('login-user').value='';el('login-pass').value='';
}
var PLAN_ABONNEMENT={plan:'gratuit',actif:false,expiration:null,joursRestants:0,statut:'essai'};
var LIMITES_PLAN={
gratuit:{corps_mois:50},
starter:{corps_mois:50},
pro:{corps_mois:9999},
premium:{corps_mois:9999}
};
async function chargerPlanAbonnement(){
if(!ORG_ID)return;
try{
var r=await sb.from('v_statut_abonnement').select('*').eq('id',ORG_ID).single();
if(r.data){
PLAN_ABONNEMENT.plan=r.data.abonnement_plan||'gratuit';
PLAN_ABONNEMENT.actif=r.data.abonnement_actif||false;
PLAN_ABONNEMENT.expiration=r.data.abonnement_expiration;
PLAN_ABONNEMENT.statut=r.data.statut_global||'essai';
PLAN_ABONNEMENT.joursRestants=r.data.jours_restants||0;
}
var badge=el('badge-abo');
if(badge){
if(PLAN_ABONNEMENT.statut==='expiré'){badge.textContent='EXP';badge.style.display='';}
else if(PLAN_ABONNEMENT.statut==='essai'&&PLAN_ABONNEMENT.joursRestants<=5){badge.textContent=PLAN_ABONNEMENT.joursRestants+'j';badge.style.display='';}
else badge.style.display='none';
}
}catch(e){console.warn('Erreur plan:',e);}
}
function verifierLimiteCorps(){
var mois=today().substring(0,7);
var corpsMois=corps.filter(function(c){return c.arr&&c.arr.substring(0,7)===mois;}).length;
var limite=(LIMITES_PLAN[PLAN_ABONNEMENT.plan]||LIMITES_PLAN['gratuit']).corps_mois;
if(corpsMois>=limite){
var nomPlan=PLAN_ABONNEMENT.plan.charAt(0).toUpperCase()+PLAN_ABONNEMENT.plan.slice(1);
return{ok:false,message:'⚠️ Limite atteinte\n\nVotre plan '+nomPlan+' est limité à '+limite+' corps par mois.\nVous avez enregistré '+corpsMois+' corps ce mois.\n\nUpgradez votre abonnement pour continuer.'};
}
return{ok:true};
}
function verifierEtOuvrirCorps(){
var chk=verifierLimiteCorps();
if(!chk.ok){alert(chk.message);return;}
openModal('modal-corps');
}
function ouvrirAbonnement(){
closeSidebar();
navTo('abonnement',el('nav-abonnement'));
rdAbonnement();
}
async function forceLogoutDesactive(){
await sb.auth.signOut();
CU=null;
viderDonneesMemoire();
el('app').style.display='none';
el('pwchange-screen').style.display='none';
el('login-screen').style.display='flex';
el('login-user').value='';el('login-pass').value='';
var err=el('login-error');
err.textContent='Session désactivée,veuillez contacter votre administrateur.';
err.style.display='block';
}
setInterval(async function(){
if(!CU)return;
if(CU.role!=='Agent')return;
var profil=await fetchProfil(CU.id);
if(!profil||!profil.actif)forceLogoutDesactive();
},15000);
(function(){
var params=new URLSearchParams(window.location.search);
var aboStatus=params.get('abo_status');
if(aboStatus==='completed'){
history.replaceState({},'',window.location.pathname);
setTimeout(function(){
alert('✅ Paiement reçu!\n\nVotre abonnement est en cours d\'activation.\nActualisez dans quelques secondes pour voir votre nouveau statut.');
},2000);
}
})();
async function tenterReprise(){
var res=await sb.auth.getSession();
var session=res.data&&res.data.session;
if(!session)return false;
var uid=session.user.id;
var profil=await fetchProfil(uid);
if(!profil||!profil.actif){await sb.auth.signOut();return false;}
if(pwExpired(profil)){afficherChangementMdp(uid,profil);return true;}
await entrerApp(profilVersCU(uid,profil));
return true;
}
el('login-pass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
el('pwchange-confirm').addEventListener('keydown',function(e){if(e.key==='Enter')doChangePassword();});
el('ins-pass2').addEventListener('keydown',function(e){if(e.key==='Enter')doInscription();});
tenterReprise();
function toggleSidebar(){el('sidebar').classList.toggle('open');el('sidebar-overlay').classList.toggle('show');}
function closeSidebar(){el('sidebar').classList.remove('open');el('sidebar-overlay').classList.remove('show');}
var PT={dashboard:'Tableau de bord',corps:'Enregistrer un corps',retrait:'Retrait de corps',
facturation:'Facturation',recettes:'Recettes',depenses:'Dépenses',stocks:'Stocks',
personnel:'Personnel',salaires:'Salaires',rapports:'Rapports&Stats',
journal:"Journal d'activités",utilisateurs:'Utilisateurs',parametres:'Paramètres',
abonnement:'Mon abonnement'};
var NAV_HISTORY=[];
function navTo(id,navEl){
var pageActuelle=document.querySelector('.page.active');
if(pageActuelle){
var idActuel=pageActuelle.id.replace('page-','');
if(idActuel!==id)NAV_HISTORY.push(idActuel);
if(NAV_HISTORY.length>30)NAV_HISTORY.shift();
}
document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
el('page-'+id).classList.add('active');
document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
if(navEl) navEl.classList.add('active');
sv('page-title',PT[id]||id);
rp(id);closeSidebar();
updateBoutonRetour();
window.scrollTo({top:0,behavior:'instant'});
}
function retourArriere(){
var factPanel=el('fact-panel');
if(factPanel&&factPanel.style.display==='block'&&selC){
fermerPanneauFacture();
return;
}
if(NAV_HISTORY.length===0)return;
var precedente=NAV_HISTORY.pop();
document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
el('page-'+precedente).classList.add('active');
document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
var navEl=document.querySelector('[onclick="navTo(\''+precedente+'\',this)"]');
if(navEl)navEl.classList.add('active');
sv('page-title',PT[precedente]||precedente);
rp(precedente);
updateBoutonRetour();
window.scrollTo({top:0,behavior:'instant'});
}
function updateBoutonRetour(){
var btn=el('btn-back-global');
var factPanel=el('fact-panel');
var factureOuverte=factPanel&&factPanel.style.display==='block'&&selC;
if(btn)btn.style.display=(NAV_HISTORY.length>0||factureOuverte)?'flex':'none';
}
function initApp(){
genNum();fillSalSel();
var pages=['dashboard','corps','retrait','facturation','recettes','depenses','stocks','personnel','salaires','journal','utilisateurs','rapports'];
pages.forEach(rp);
}
function rp(id){
var m={dashboard:rdDash,corps:rdCorps,retrait:rdRetrait,facturation:rdFact,
recettes:rdRec,depenses:rdDep,stocks:rdStk,personnel:rdPers,
salaires:rdSal,journal:rdJnl,utilisateurs:rdUsr,rapports:rdRpts,
abonnement:rdAbonnement};
if(m[id]) m[id]();
}
var ABO_PERIODE_ANNUELLE=false;
var ABO_PLANS=[
{id:'starter',icone:'🌱',nom:'Starter',desc:'Idéal pour débuter',prix_m:9900,prix_a:95000,
features:['1 structure','50 corps/mois','Registre&facturation','Rapports de base','Support email'],
non:['Multi-structures','API&intégrations']},
{id:'pro',icone:'⚡',nom:'Pro',desc:'Pour les structures en croissance',prix_m:24900,prix_a:239000,recommande:true,
features:['3 structures','Corps illimités','Facturation avancée','Rapports PDF&Excel','Notifications WhatsApp','Support prioritaire'],
non:['API&intégrations']},
{id:'premium',icone:'👑',nom:'Premium',desc:'Pour les réseaux funéraires',prix_m:49900,prix_a:479000,
features:['Structures illimitées','Corps illimités','Toutes fonctionnalités','Rapports avancés','API&intégrations','Support dédié 24/7'],
non:[]}
];
var ABO_SB_URL='https://gvamgrzrkxsqpvizmycw.supabase.co';
var ABO_SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2YW1ncnpya3hzcXB2aXpteWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMjQ0MDUsImV4cCI6MjA5NjkwMDQwNX0.HEOJq16ffFnfE4Pmog7Amxn10Auy5jA72N5TwY0-bM0';
var ABO_MASTER_KEY='i7CD29Iq-Aian-tY5v-a0hz-U1AGCVpuuCYP';
var ABO_PRIVATE_KEY='test_private_hC3AiURYN66Hrlwf2ARBeTJQrGJ';
var ABO_TOKEN='0wrLUxbTQe3xx3dtgblV';
var ABO_MODE='test';
function aboTogglePeriode(){
ABO_PERIODE_ANNUELLE=!ABO_PERIODE_ANNUELLE;
var btn=el('abo-toggle');
var knob=el('abo-toggle-knob');
if(btn)btn.style.background=ABO_PERIODE_ANNUELLE?'#0f3460':'#444';
if(knob)knob.style.transform=ABO_PERIODE_ANNUELLE?'translateX(24px)':'translateX(0)';
var lm=el('abo-label-mensuel'),la=el('abo-label-annuel');
if(lm){lm.style.fontWeight=ABO_PERIODE_ANNUELLE?'400':'700';lm.style.color=ABO_PERIODE_ANNUELLE?'var(--text-dim)':'var(--accent)';}
if(la){la.style.fontWeight=ABO_PERIODE_ANNUELLE?'700':'400';la.style.color=ABO_PERIODE_ANNUELLE?'var(--accent)':'var(--text-dim)';}
afficherPlansAbo();
}
function afficherPlansAbo(){
var grille=el('abo-grille');
if(!grille)return;
grille.innerHTML=ABO_PLANS.map(function(p){
var prix=ABO_PERIODE_ANNUELLE?p.prix_a:p.prix_m;
var prixFmt=prix.toLocaleString('fr-FR');
var equivM=ABO_PERIODE_ANNUELLE?Math.round(p.prix_a/12).toLocaleString('fr-FR'):'';
var estActif=PLAN_ABONNEMENT.plan===p.id&&PLAN_ABONNEMENT.statut==='actif';
return'<div style="background:var(--surface);border:2px solid '+(p.recommande?'#e2b04a':'var(--border)')+';border-radius:12px;padding:20px;position:relative">'
+(p.recommande?'<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#e2b04a;color:#1a1a1a;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;white-space:nowrap">⭐ Le plus populaire</div>':'')
+'<div style="font-size:24px;margin-bottom:8px">'+p.icone+'</div>'
+'<div style="font-size:16px;font-weight:700;color:var(--white);margin-bottom:4px">'+p.nom+'</div>'
+'<div style="font-size:12px;color:var(--text-dim);margin-bottom:14px">'+p.desc+'</div>'
+'<div style="margin-bottom:14px"><span style="font-size:26px;font-weight:800;color:var(--white)">'+prixFmt+'</span><span style="font-size:13px;color:var(--text-dim)">FCFA '+(ABO_PERIODE_ANNUELLE?'/an':'/mois')+'</span>'
+(ABO_PERIODE_ANNUELLE?'<div style="font-size:11px;color:var(--green)">≈ '+equivM+' FCFA/mois — 20% économisé</div>':'')+'</div>'
+'<ul style="list-style:none;margin-bottom:16px">'
+p.features.map(function(f){return'<li style="font-size:13px;color:var(--text);padding:3px 0;display:flex;gap:8px"><span style="color:var(--green)">✓</span>'+f+'</li>';}).join('')
+p.non.map(function(f){return'<li style="font-size:13px;color:var(--muted);padding:3px 0;display:flex;gap:8px"><span>✗</span>'+f+'</li>';}).join('')
+'</ul>'
+(estActif
?'<button style="width:100%;padding:12px;background:var(--green-dim);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:default">✓ Plan actuel</button>'
:'<button style="width:100%;padding:12px;background:'+(p.recommande?'#e2b04a':'var(--accent)')+';color:'+(p.recommande?'#1a1a1a':'#fff')+';border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer" onclick="aboChoisirPlan(\''+p.id+'\')">Choisir '+p.nom+'</button>')
+'</div>';
}).join('');
}
async function rdAbonnement(){
await chargerPlanAbonnement();
var statut=PLAN_ABONNEMENT.statut;
var badgeCoul=statut==='actif'?'#2ecc71':statut==='essai'?'#e2b04a':'#e74c3c';
var badgeTxt=statut==='actif'?'● Actif':statut==='essai'?'◐ Essai gratuit':'✗ Expiré';
var nomPlan=(PLAN_ABONNEMENT.plan||'Gratuit');
nomPlan=nomPlan.charAt(0).toUpperCase()+nomPlan.slice(1);
var nomEl=el('abo-nom-plan');
if(nomEl)nomEl.innerHTML=nomPlan+'<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;background:'+badgeCoul+';color:'+(statut==='essai'?'#1a1a1a':'#fff')+'">'+badgeTxt+'</span>';
var joursEl=el('abo-jours');
if(joursEl)joursEl.textContent=PLAN_ABONNEMENT.joursRestants||'0';
var expEl=el('abo-date-exp');
if(expEl&&PLAN_ABONNEMENT.expiration){
expEl.textContent='Expire le '+new Date(PLAN_ABONNEMENT.expiration).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
}
afficherPlansAbo();
var hist=el('abo-historique');
if(!hist)return;
try{
var r=await sb.from('abonnements_saas').select('*').eq('organisation_id',ORG_ID).order('created_at',{ascending:false}).limit(5);
if(!r.data||!r.data.length){hist.textContent='Aucun paiement enregistré.';return;}
hist.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:12px">'
+'<thead><tr style="background:var(--panel)">'
+'<th style="padding:8px;text-align:left;color:var(--text-dim)">Date</th>'
+'<th style="padding:8px;text-align:left;color:var(--text-dim)">Plan</th>'
+'<th style="padding:8px;text-align:left;color:var(--text-dim)">Montant</th>'
+'<th style="padding:8px;text-align:left;color:var(--text-dim)">Statut</th>'
+'</tr></thead><tbody>'
+r.data.map(function(p){
var sc=p.statut==='completed'?'#2ecc71':p.statut==='failed'?'#e74c3c':'#e2b04a';
var st=p.statut==='completed'?'✓ Payé':p.statut==='failed'?'✗ Échoué':'⏳ En attente';
return'<tr style="border-bottom:1px solid var(--border)">'
+'<td style="padding:8px">'+new Date(p.created_at).toLocaleDateString('fr-FR')+'</td>'
+'<td style="padding:8px;text-transform:capitalize;font-weight:600">'+p.plan+'</td>'
+'<td style="padding:8px">'+(p.montant?p.montant.toLocaleString('fr-FR')+' F':'—')+'</td>'
+'<td style="padding:8px"><span style="color:'+sc+';font-weight:600">'+st+'</span></td>'
+'</tr>';
}).join('')+'</tbody></table>';
}catch(e){hist.textContent='Erreur chargement historique.';}
}
async function aboChoisirPlan(planId){
var plan=null;
for(var i=0;i<ABO_PLANS.length;i++){if(ABO_PLANS[i].id===planId){plan=ABO_PLANS[i];break;}}
if(!plan)return;
var prix=ABO_PERIODE_ANNUELLE?plan.prix_a:plan.prix_m;
var periode=ABO_PERIODE_ANNUELLE?'annuel':'mensuel';
if(!confirm('Souscrire au plan '+plan.nom+' ('+periode+') ?\n\nMontant : '+prix.toLocaleString('fr-FR')+' FCFA\n\nVous allez être redirigé vers la page de paiement PayDunya.'))return;
var baseUrl=ABO_MODE==='live'?'https://app.paydunya.com/api/v1':'https://app.paydunya.com/sandbox-api/v1';
try{
var returnUrl=window.location.origin+window.location.pathname+'?abo_status=completed';
var payload={
invoice:{total_amount:prix,description:'Abonnement Gestion Funéraire — '+plan.nom+' ('+periode+')'},
store:{name:'Gestion Funéraire SaaS',tagline:'Plateforme de gestion des structures funéraires'},
actions:{
cancel_url:window.location.origin+window.location.pathname,
return_url:returnUrl,
callback_url:'https://gvamgrzrkxsqpvizmycw.supabase.co/functions/v1/paydunya-ipn'
},
custom_data:{org_id:ORG_ID,plan_name:planId,plan_type:periode}
};
var r=await fetch(baseUrl+'/checkout-invoice/create',{
method:'POST',
headers:{
'Content-Type':'application/json',
'PAYDUNYA-MASTER-KEY':ABO_MASTER_KEY,
'PAYDUNYA-PRIVATE-KEY':ABO_PRIVATE_KEY,
'PAYDUNYA-TOKEN':ABO_TOKEN
},
body:JSON.stringify(payload)
});
var data=await r.json();
if(data.response_code==='00'){
window.location.href=data.response_url;
}else{
alert('Erreur PayDunya : '+(data.response_text||'Impossible de créer la facture.'));
}
}catch(e){alert('Erreur connexion PayDunya : '+e.message);}
}
function rdDash(){
var cons=corps.filter(function(c){return c.st==='Conservé';});
var retires=corps.filter(function(c){return c.st==='Retiré';});
var al5=cons.filter(function(c){return jR(c.arr)<=5&&jR(c.arr)>=0;});
var depasse=cons.filter(function(c){return jR(c.arr)<0;});
var tj=today();
var recJ=recettes.filter(function(r){return r.ret===tj;}).reduce(function(s,r){return s+r.paye;},0);
var depJ=depenses.filter(function(d){return d.date===tj;}).reduce(function(s,d){return s+d.mt;},0);
var totR=recettes.reduce(function(s,r){return s+r.paye;},0);
var totD=depenses.reduce(function(s,d){return s+d.mt;},0);
var totS=salaires.reduce(function(s,x){return s+x.net;},0);
sv('s-total',corps.length);sv('s-cons',cons.length);
sv('s-retires',retires.length);sv('s-ech',al5.length);sv('s-depasse',depasse.length);
sv('s-rec',fmt(recJ));sv('s-dep',fmt(depJ));sv('s-sol',fmt(totR-totD-totS));
sv('badge-alerte',al5.length);
sv('badge-stock',stocks.filter(function(s){return s.q<=s.min;}).length);
var da=el('dash-alert');
if(al5.length>0){da.style.display='flex';sv('dash-alert-txt',al5.length+' corps proches de l\'échéance légale (≤ 5 jours).');}
else da.style.display='none';
el('dash-tbl').innerHTML=cons.length?cons.map(function(c){
var jr=jR(c.arr),bd=jr<0?'badge-red':jr<=5?'badge-orange':'badge-green';
var lb=jr<0?'Dépassé':jr<=5?jr+'j restants':'Normal';
return'<tr><td class="mono">'+c.num+'</td><td><b>'+c.nom+'</b>'+c.pre+'</td><td>'+fd(c.arr)+'</td><td class="mono">'+jC(c.arr,c.dateRet)+'j</td><td>'+fd(ech(c.arr))+'</td><td><span class="badge '+bd+'">'+lb+'</span></td></tr>';
}).join(''):'<tr><td colspan="6" class="empty-state">Aucun corps conservé</td></tr>';
}
function rdCorps(){
el('tbl-corps').innerHTML=corps.length?corps.map(function(c){
var jr=jR(c.arr),bd=c.st==='Retiré'?'badge-muted':jr<0?'badge-red':jr<=5?'badge-orange':'badge-green';
var lb=c.st==='Retiré'?'Retiré':jr<0?'Dépassé':jr<=5?jr+'j':'Normal';
var isGerant=CU&&(CU.role==='Gérant'||CU.role==='Promoteur');
var pmtStatut='';
if(isGerant){
var f=calcF(c),paye=c.pmts.reduce(function(s,p){return s+p;},0),solde=Math.max(0,f.total-paye);
pmtStatut=solde<=0?'<span class="badge badge-green">Soldé</span>':'<span class="badge badge-orange">'+fcfa(solde)+'</span>';
}
return'<tr><td class="mono">'+c.num+'</td><td><b>'+c.nom+'</b></td><td>'+c.pre+'</td><td>'+c.sx+'</td><td>'+c.age+'a</td><td>'+fd(c.arr)+'</td><td class="mono">'+jC(c.arr,c.dateRet)+'j</td><td class="mono">'+c.fml+'L</td>'
+'<td style="font-size:11px;color:var(--text-dim)">'+(c.morguier||'—')+'</td>'
+'<td><span class="badge '+bd+'">'+lb+'</span></td>'
+(isGerant?'<td>'+pmtStatut+'</td>':'')
+'<td style="white-space:nowrap"><button class="btn btn-sm" onclick="voirD(\''+c.num+'\')">Dossier</button>'
+(c.st!=='Retiré'&&isGerant?'<button class="btn btn-sm btn-primary" onclick="versF(\''+c.num+'\')">Facturer</button>':'')
+'</td></tr>';
}).join(''):'<tr><td colspan="11" class="empty-state">Aucun corps enregistré</td></tr>';
}
function lancerRecherche(inputId,tableId){
var q=document.getElementById(inputId).value.toLowerCase().trim();
filterT2(tableId,q);
}
function filterT2(tableId,q){
document.querySelectorAll('#'+tableId+' tr').forEach(function(tr){
tr.style.display=(q===''||tr.textContent.toLowerCase().includes(q))?'':'none';
});
}
function searchOnEnter(e,inputId,tableId){if(e.key==='Enter')lancerRecherche(inputId,tableId);}
var retraitNumCourant=null;
function confRetrait(num){
var c=null;for(var i=0;i<corps.length;i++){if(corps[i].num===num){c=corps[i];break;}}
if(!c)return;
retraitNumCourant=num;
var f=calcF(c),paye=c.pmts.reduce(function(s,p){return s+p;},0),solde=f.total-paye;
el('retrait-info-defunt').innerHTML=
'<b style="color:var(--white)">'+c.nom+' '+c.pre+'</b>'
+'<div style="font-size:11px;color:var(--text-dim);margin-top:4px">'
+'N° '+c.num+' · Arrivée : '+fd(c.arr)+' · '+jC(c.arr,c.dateRet)+' jours de conservation</div>'
+'<div style="font-size:11px;margin-top:6px">'
+'<span style="color:var(--text-dim)">Total facturé :</span><b>'+fcfa(f.total)+'</b>'
+'&nbsp;|&nbsp;<span style="color:var(--text-dim)">Payé :</span><b style="color:var(--green)">'+fcfa(paye)+'</b>'
+'&nbsp;|&nbsp;<span style="color:var(--text-dim)">Reste à payer :</span><b style="color:'+(solde>0?'var(--orange)':'var(--green)')+'">'+fcfa(solde)+'</b>'
+'</div>';
var sw=el('retrait-solde-warn');
if(solde>0){
var isJustice=(c.justice==='exo_cons'||c.justice==='gratuit'||c.justice==='partiel');
if(isJustice){
sw.style.display='block';sw.style.background='rgba(56,139,253,.1)';sw.style.borderColor='rgba(56,139,253,.3)';sw.style.color='var(--blue)';
sw.textContent='ℹ️ Dossier sous main de justice — reste à payer de '+fcfa(solde)+'. Le retrait est autorisé selon la décision judiciaire.';
}else{
sw.style.display='block';sw.style.background='rgba(248,81,73,.1)';sw.style.borderColor='rgba(248,81,73,.3)';sw.style.color='var(--red)';
sw.innerHTML='🚫<b>Retrait bloqué</b>— Solde impayé :<b>'+fcfa(solde)+'</b>.<br>Le retrait est impossible tant que la facture n\'est pas soldée. Veuillez d\'abord enregistrer le paiement complet dans Facturation.';
}
}
else sw.style.display='none';
['ret-photo-proc','ret-photo-cert','ret-photo-permis','ret-photo-recu','ret-photo-autre'].forEach(function(id){var e=el(id);if(e)e.value='';});
el('ret-obs').value='';
openModal('modal-retrait-docs');
}
async function validerRetrait(){
if(!retraitNumCourant)return;
var c=null;for(var i=0;i<corps.length;i++){if(corps[i].num===retraitNumCourant){c=corps[i];break;}}
if(!c)return;
var f=calcF(c),paye=c.pmts.reduce(function(s,p){return s+p;},0),solde=f.total-paye;
var isJustice=(c.justice==='exo_cons'||c.justice==='gratuit'||c.justice==='partiel');
if(solde>0&&!isJustice){
alert('🚫 Retrait impossible!\n\nReste à payer : '+fcfa(solde)+'\n\nVeuillez solder la facture avant de procéder au retrait du corps.');
return;
}
var docInputs=[
{id:'ret-photo-proc',key:'procureur'},
{id:'ret-photo-cert',key:'certificat'},
{id:'ret-photo-permis',key:'permis'},
{id:'ret-photo-recu',key:'recu'},
{id:'ret-photo-autre',key:'autre'}
];
if(!c.docsRetrait)c.docsRetrait={};
c.docsRetrait.obs=el('ret-obs').value;
for(var j=0;j<docInputs.length;j++){
var di=docInputs[j];
var inp=el(di.id);
if(inp&&inp.files&&inp.files.length>0){
var file=inp.files[0];
var chemin='corps/'+c.num+'/retrait_'+di.key;
try{
var r=await sb.storage.from('photos').upload(chemin,file,{upsert:true,contentType:file.type});
if(!r.error)c.docsRetrait[di.key]=chemin;
else{
await new Promise(function(res){compressImage(file,1600,0.75,function(d){c.docsRetrait[di.key]=d;res();});});
}
}catch(e){
await new Promise(function(res){compressImage(file,1600,0.75,function(d){c.docsRetrait[di.key]=d;res();});});
}
}
}
c.st='Retiré';
c.dateRet=today();
var retraitItems=[{a:'Coton',q:1},{a:'Porpeline',q:1},{a:'Gants',q:1},{a:'Chaussettes',q:1},{a:'Latex',q:4},{a:'Super Glue',q:1}];
retraitItems.forEach(function(item){
for(var i=0;i<stocks.length;i++){if(stocks[i].a===item.a){stocks[i].q=Math.max(0,parseFloat((stocks[i].q-item.q).toFixed(2)));addStkLog(item.a,-item.q,'Retrait corps '+c.num);break;}}
});
var nbRetires=corps.filter(function(x){return x.st==='Retiré';}).length;
if(nbRetires>0&&nbRetires%5===0){
var autresItems=['Voile','Chapelet','Alcool','Épingles','Scotch','Marqueur','Boîte de maquillage','Bic','Coton','Porpeline','Gants','Chaussettes','Latex','Super Glue'];
autresItems.forEach(function(a){
for(var i=0;i<stocks.length;i++){if(stocks[i].a===a){stocks[i].q=Math.max(0,parseFloat((stocks[i].q-1).toFixed(2)));addStkLog(a,-1,'Règle 5 retraits ('+nbRetires+'e sortie)');break;}}
});
}
addLog('Retrait corps',c.num+' — '+c.nom+' '+c.pre);
sauvegarder();
closeModal('modal-retrait-docs');
retraitNumCourant=null;
rdRetrait();rdCorps();rdFact();rdDash();rdStk();
alert('✓ Retrait enregistré avec succès.\n💾 Sauvegardé.');
}
function rdRetrait(){
el('tbl-retrait').innerHTML=corps.length?corps.map(function(c){
var jr=jR(c.arr),bd=c.st==='Retiré'?'badge-muted':jr<0?'badge-red':jr<=5?'badge-orange':'badge-green';
var lb=c.st==='Retiré'?'Retiré':jr<0?'Dépassé':jr<=5?jr+'j':'Conservé';
return'<tr><td class="mono">'+c.num+'</td><td><b>'+c.nom+'</b></td><td>'+c.pre+'</td><td>'+fd(c.arr)+'</td><td class="mono">'+jC(c.arr,c.dateRet)+'j</td>'
+'<td>'+(c.dep?c.dep.nom:'—')+'</td><td class="mono">'+(c.dep&&c.dep.tel?c.dep.tel:'—')+'</td>'
+'<td><span class="badge '+bd+'">'+lb+'</span></td>'
+'<td style="white-space:nowrap">'+(c.st!=='Retiré'?'<button class="btn btn-sm btn-danger" onclick="confRetrait(\''+c.num+'\')">🚪 Retirer</button>':'<span style="color:var(--text-dim);font-size:11px">✓ Sorti</span>')
+'<button class="btn btn-sm" onclick="voirD(\''+c.num+'\')">Dossier</button></td></tr>';
}).join(''):'<tr><td colspan="9" class="empty-state">Aucun corps enregistré</td></tr>';
}
function rdFact(){
el('tbl-fact').innerHTML=corps.length?corps.map(function(c){
var f=calcF(c),paye=c.pmts.reduce(function(s,p){return s+p;},0),solde=f.total-paye;
var solde=Math.max(0,f.total-paye);
var estSolde=solde<=0&&f.total>0;
var estGratuit=f.total===0;
var actionHtml=(estSolde||estGratuit
?'<span style="color:var(--green);font-size:11px;font-weight:600;white-space:nowrap">✅ Soldé</span>'
:(CU&&CU.role==='Agent'?'<span style="color:var(--text-dim);font-size:11px">—</span>'
:'<button class="btn btn-primary btn-sm" style="white-space:nowrap" onclick="ouvrF(\''+c.num+'\')">Facturer</button>'));
return'<tr onclick="ouvrF(\''+c.num+'\')" style="cursor:pointer"><td class="mono">'+c.num+'</td><td>'+c.nom+' '+c.pre+'</td><td>'+fd(c.arr)+'</td><td class="mono">'+jC(c.arr,c.dateRet)+'j</td>'
+'<td class="mono">'+fcfa(f.total)+'</td><td class="mono" style="color:var(--green)">'+fcfa(paye)+'</td>'
+'<td class="mono" style="color:'+(solde>0?'var(--orange)':'var(--green)')+'">'+fcfa(solde)+'</td>'
+'<td style="position:sticky;right:0;background:var(--card,#0d1117);box-shadow:-6px 0 6px-6px rgba(0,0,0,.4)" onclick="event.stopPropagation();ouvrF(\''+c.num+'\')">'+actionHtml+'</td></tr>';
}).join(''):'<tr><td colspan="8" class="empty-state">Aucun dossier disponible</td></tr>';
}
function fermerPanneauFacture(){
el('fact-panel').style.display='none';
el('fact-ph').style.display='block';
selC=null;
updateBoutonRetour();
var list=document.querySelector('.fact-list');
if(list)list.scrollIntoView({behavior:'smooth',block:'start'});
else window.scrollTo({top:0,behavior:'smooth'});
}
function ouvrF(num){
var found=null;for(var i=0;i<corps.length;i++){if(corps[i].num===num){found=corps[i];break;}}
selC=found;if(!selC)return;
el('fact-ph').style.display='none';
el('fact-panel').style.display='block';
el('fact-actions').style.display='flex';
updateBoutonRetour();
setTimeout(function(){
var panel=el('fact-panel');
if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'});
},50);
el('fact-pmt-box').innerHTML='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim);margin-bottom:10px">💳 Enregistrer un paiement</div>'
+'<div class="field"><label>Montant à encaisser (FCFA)</label><input type="number" id="pmt-mt" placeholder="0" oninput="valPmt()"></div>'
+'<div id="pmt-err" style="color:var(--red);font-size:12px;display:none;margin-bottom:8px"></div>'
+'<button class="btn btn-success btn-full" onclick="enregPmt()">✓ Valider le paiement</button>';
el('fact-pmt-box').style.display='block';
var justiceSaved=selC.justice||'non';
var radios=document.querySelectorAll('input[name="cas-part"]');
for(var r=0;r<radios.length;r++){radios[r].checked=(radios[r].value===justiceSaved);}
el('cp-nec').checked=(selC.nec!=='non');
el('red-val').value=selC.red||0;
el('red-type').value=selC.redType||'fixe';
onRedTypeChange();
el('cp-red-bloc').style.display=(justiceSaved==='partiel'?'block':'none');
var depHtml='';
if(selC.dep){
depHtml='<div style="margin-bottom:10px;padding:8px 10px;background:rgba(255,255,255,.04);border-radius:6px;font-size:12px">'
+'<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim);margin-bottom:6px">👤 Client (déposant)</div>'
+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px">'
+'<div><span style="color:var(--text-dim)">Nom :</span><b style="color:var(--white)">'+selC.dep.nom+(selC.dep.pre?' '+selC.dep.pre:'')+'</b></div>'
+(selC.dep.tel?'<div><span style="color:var(--text-dim)">Tél :</span><span style="color:var(--blue)">'+selC.dep.tel+'</span></div>':'<div></div>')
+(selC.dep.lien?'<div><span style="color:var(--text-dim)">Lien :</span>'+selC.dep.lien+'</div>':'<div></div>')
+(selC.dep.adresse?'<div><span style="color:var(--text-dim)">Adresse :</span>'+selC.dep.adresse+'</div>':'<div></div>')
+'</div></div>';
}
el('fact-body').innerHTML=
'<div style="margin-bottom:10px;padding:8px 10px;background:rgba(255,255,255,.04);border-radius:6px;font-size:12px">'
+'<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim);margin-bottom:6px">🏷️ N° '+selC.num+' — Défunt</div>'
+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px">'
+'<div><b style="color:var(--white);font-size:13px">'+selC.nom+' '+selC.pre+'</b></div>'
+'<div style="color:var(--text-dim)">'+(selC.sx?selC.sx+' · ':'')+selC.age+' ans</div>'
+'<div style="color:var(--text-dim)">Arrivée :<b style="color:var(--text)">'+fd(selC.arr)+(selC.h?' à '+selC.h:'')+'</b></div>'
+'<div style="color:var(--text-dim)">Conservation :<b style="color:var(--gold)">'+jC(selC.arr,selC.dateRet)+' jour(s)</b></div>'
+(selC.fml>0?'<div style="color:var(--text-dim)">Formol utilisé :<b style="color:var(--text)">'+selC.fml+' L</b></div>':'')
+(selC.prov?'<div style="color:var(--text-dim)">Provenance : '+selC.prov+'</div>':'')
+'</div></div>'
+depHtml;
recalcFact();
el('pmt-mt').value='';
el('pmt-err').style.display='none';
}
function recalcFact(){
if(!selC)return;
var cas='non';
var radios=document.querySelectorAll('input[name="cas-part"]');
for(var r=0;r<radios.length;r++){if(radios[r].checked){cas=radios[r].value;break;}}
var redType=v('red-type')||'fixe';
var redVal=parseFloat(v('red-val'))||0;
var necInclus=el('cp-nec').checked;
var f=calcFAvecCas(selC,cas,redType,redVal,necInclus);
var paye=selC.pmts.reduce(function(s,p){return s+p;},0);
var solde=f.total-paye;
function ligneVal(v,exo){return exo?'<span style="color:var(--text-dim);font-style:italic">Exonéré</span>':(v===0?'<span style="color:var(--text-dim)">—</span>':fcfa(v));}
el('fr-nec').innerHTML=!necInclus?'<span style="color:var(--text-dim)">Non inclus</span>':ligneVal(f.nec,f.necExo);
el('fr-fml-lbl').textContent='Frais formol'+(selC.fml>0?' ('+selC.fml+'L × '+fcfa(TARIFS.fml)+')':'');
el('fr-fml').innerHTML=selC.fml>0?ligneVal(f.ffml,f.fmlExo):'<span style="color:var(--text-dim)">—</span>';
el('fr-inj-lbl').textContent='Frais injection'+(selC.fml>0?' ('+selC.fml+'L × '+fcfa(TARIFS.inj)+')':'');
el('fr-inj').innerHTML=selC.fml>0?ligneVal(f.finj,f.injExo):'<span style="color:var(--text-dim)">—</span>';
el('fr-cons-lbl').textContent='Conservation ('+jC(selC.arr,selC.dateRet)+'j)';
el('fr-cons').innerHTML=ligneVal(f.fcons,f.consExo);
el('fr-cpl').innerHTML=ligneVal(f.fcpl,f.cplExo);
if(f.red>0){
el('fr-red-row').style.display='flex';
el('fr-red').textContent='— '+fcfa(f.red);
}else{el('fr-red-row').style.display='none';}
el('fr-total').textContent=fcfa(f.total);
el('fr-paye').textContent=fcfa(paye);
el('fr-solde').textContent=fcfa(solde);
el('fr-solde').style.color=solde<=0?'var(--green)':'var(--orange)';
el('fact-pmt-box').style.display=(f.total===0||solde<=0)?'none':'block';
if(solde<=0&&paye>0)el('fact-pmt-box').innerHTML='<div style="text-align:center;padding:10px;color:var(--green);font-weight:600">✅ Facture entièrement soldée</div>';
}
function onCasChange(){
var cas='non';
var radios=document.querySelectorAll('input[name="cas-part"]');
for(var r=0;r<radios.length;r++){if(radios[r].checked){cas=radios[r].value;break;}}
el('cp-red-bloc').style.display=(cas==='partiel')?'block':'none';
if(cas!=='partiel'){el('red-val').value=0;}
recalcFact();
}
function onRedTypeChange(){
var t=v('red-type');
el('red-lbl').textContent=(t==='pct')?'Pourcentage (%)':'Montant (FCFA)';
recalcFact();
}
function valPmt(){
if(!selC)return;
var cas='non';
var radios=document.querySelectorAll('input[name="cas-part"]');
for(var r=0;r<radios.length;r++){if(radios[r].checked){cas=radios[r].value;break;}}
var f=calcFAvecCas(selC,cas,v('red-type'),parseFloat(v('red-val'))||0,el('cp-nec').checked);
var paye=selC.pmts.reduce(function(s,p){return s+p;},0);
var mt=parseInt(v('pmt-mt'))||0,err=el('pmt-err');
if(mt>f.total-paye){err.textContent='Le montant saisi dépasse le solde restant à payer.';err.style.display='block';}
else err.style.display='none';
}
async function enregPmt(){
if(!selC){alert('Sélectionnez un dossier.');return;}
var cas='non';
var radios=document.querySelectorAll('input[name="cas-part"]');
for(var r=0;r<radios.length;r++){if(radios[r].checked){cas=radios[r].value;break;}}
var redType=v('red-type')||'fixe';
var redVal=parseFloat(v('red-val'))||0;
var necInclus=el('cp-nec').checked;
var f=calcFAvecCas(selC,cas,redType,redVal,necInclus);
selC.justice=cas;selC.redType=redType;selC.red=f.red;selC.nec=necInclus?'oui':'non';
var paye=selC.pmts.reduce(function(s,p){return s+p;},0);
if(f.total===0){alert('Ce dossier est entièrement exonéré. Aucun paiement requis.');return;}
var solde=Math.max(0,f.total-paye);
if(solde<=0){alert('Cette facture est déjà entièrement soldée.');return;}
var mt=parseInt(v('pmt-mt'))||0;
if(mt<=0){alert('Veuillez saisir un montant.');return;}
if(mt>solde){alert('Le montant saisi dépasse le solde restant à payer ('+fcfa(solde)+').');return;}
selC.pmts.push(mt);
var newPaye=paye+mt;
var newSolde=Math.max(0,f.total-newPaye);
var recIdx=-1;
for(var i=0;i<recettes.length;i++){
if(recettes[i].corpNum===selC.num){recIdx=i;break;}
}
if(recIdx>=0){
recettes[recIdx].paye=newPaye;
recettes[recIdx].solde=newSolde;
recettes[recIdx].fac=f.total;
recettes[recIdx].red=f.red;
recettes[recIdx].fml=selC.fml||0;
recettes[recIdx].justice=selC.justice||'non';
recettes[recIdx].ret=today();
}else{
recettes.unshift({
num:'R-'+String(recettes.length+1).padStart(4,'0'),
corpNum:selC.num,
def:selC.nom+' '+selC.pre,
arr:selC.arr,
ret:today(),
fac:f.total,
red:f.red,
paye:newPaye,
solde:newSolde,
fml:selC.fml||0,
justice:selC.justice||'non'
});
}
addLog('Paiement',selC.num+' — '+fcfa(mt)+(newSolde===0?' — SOLDÉ':''));
sauvegarder();
DERNIERE_SYNC_CLOUD=Date.now();
ouvrF(selC.num);rdDash();rdCorps();rdRetrait();rdFact();rdRec();
if(newSolde===0){
alert('✓ Paiement enregistré — Facture SOLDÉE!\n💾 Sauvegardé.');
}else{
alert('✓ Paiement enregistré. Reste à payer : '+fcfa(newSolde)+'\n💾 Sauvegardé.');
}
}
function genFacturePDF(){
if(!selC){alert('Sélectionnez un dossier.');return;}
var cas='non';
var radios=document.querySelectorAll('input[name="cas-part"]');
for(var r=0;r<radios.length;r++){if(radios[r].checked){cas=radios[r].value;break;}}
var f=calcFAvecCas(selC,cas,v('red-type'),parseFloat(v('red-val'))||0,el('cp-nec').checked);
var paye=selC.pmts.reduce(function(s,p){return s+p;},0);
var solde=f.total-paye;
var etab=TARIFS.etab||'COLOMBE NGE';
var adresse=TARIFS.adresse||'Morgue Nouvelle Génération d\'Egbessi';
var ville=TARIFS.ville||'Quartier Egbessi,Glazoué,Bénin';
var tel=TARIFS.tel||'';
var statut=selC.st==='Retiré'?'✅ Soldé':'⏳ En cours';
var casLib={non:'Cas ordinaire',exo_cons:'Sous main de justice',gratuit:'Cas social / Gratuit',partiel:'Cas social / Partiel'};
var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facture '+selC.num+'</title>'
+'<style>'
+'*{box-sizing:border-box;margin:0;padding:0;}'
+'body{font-family:Arial,sans-serif;font-size:13px;color:#222;padding:30px;max-width:900px;margin:auto;}'
+'.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #222;padding-bottom:16px;margin-bottom:20px;}'
+'.logo{font-size:22px;font-weight:800;color:#222;}.logo-sub{font-size:12px;color:#555;margin-top:2px;}'
+'.fact-info{text-align:right;}.fact-num{font-size:18px;font-weight:800;}.fact-date{font-size:11px;color:#666;margin-top:4px;}'
+'.statut{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;background:#fff3cd;color:#856404;margin-top:6px;}'
+'.section{border:1px solid #e0e0e0;border-radius:8px;padding:14px 16px;margin-bottom:14px;}'
+'.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:10px;}'
+'.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;}'
+'.lbl{color:#888;font-size:12px;}.val{font-weight:600;font-size:13px;}'
+'.val-blue{font-weight:700;color:#0066cc;}'
+'table{width:100%;border-collapse:collapse;margin-top:4px;}'
+'tr{border-bottom:1px solid #f0f0f0;}'
+'td{padding:8px 4px;font-size:13px;}'
+'td:last-child{text-align:right;font-weight:500;}'
+'.total-row td{font-weight:800;font-size:15px;border-top:2px solid #222;border-bottom:none;padding-top:10px;}'
+'.paye-box{background:#f8f9fa;border-radius:6px;padding:10px 14px;margin-top:10px;}'
+'.paye-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;}'
+'.paye-green{color:#198754;font-weight:700;}'
+'.solde-row{font-weight:800;font-size:14px;color:'+(solde>0?'#e67e22':'#198754')+';}'
+'.footer{text-align:center;margin-top:24px;font-size:11px;color:#aaa;border-top:1px solid #e0e0e0;padding-top:10px;}'
+'</style></head><body>'
+'<div class="header">'
+'<div style="display:flex;align-items:center;gap:14px">'
+(TARIFS.logo?'<img src="'+TARIFS.logo+'" style="height:64px;width:64px;object-fit:cover;border-radius:8px;border:1px solid #e0e0e0">':'')
+'<div>'
+'<div class="logo">'+etab+'</div>'
+'<div class="logo-sub">'+adresse+'</div>'
+'<div class="logo-sub">'+ville+'</div>'
+(tel?'<div class="logo-sub">Tél : '+tel+'</div>':'')
+'</div>'
+'</div>'
+'<div class="fact-info">'
+'<div class="fact-num">FACTURE N° '+selC.num+'</div>'
+'<div class="fact-date">Date : '+now()+'</div>'
+'<div class="statut">'+statut+'</div>'
+'</div>'
+'</div>'
+'<div class="section">'
+'<div class="section-title">🏷️ Défunt</div>'
+'<div class="grid2">'
+'<div><span class="lbl">Nom complet :</span><span class="val">'+selC.nom+' '+selC.pre+'</span></div>'
+'<div><span class="lbl">Âge :</span><span class="val">'+selC.age+' ans</span></div>'
+'<div><span class="lbl">Arrivée :</span><span class="val">'+fd(selC.arr)+(selC.h?' à '+selC.h:'')+'</span></div>'
+'<div><span class="lbl">Conservation :</span><span class="val">'+jC(selC.arr,selC.dateRet)+' jours</span></div>'
+(selC.prov?'<div><span class="lbl">Provenance :</span><span class="val">'+selC.prov+'</span></div>':'')
+(selC.cause?'<div><span class="lbl">Cause :</span><span class="val">'+selC.cause+'</span></div>':'')
+'<div><span class="lbl">Situation :</span><span class="val">'+(casLib[selC.justice||'non'])+'</span></div>'
+(selC.dateRet?'<div><span class="lbl">Date retrait :</span><span class="val">'+fd(selC.dateRet)+'</span></div>':'')
+'</div>'
+'</div>'
+(selC.dep?'<div class="section">'
+'<div class="section-title">👤 Déposant / Client</div>'
+'<div class="grid2">'
+'<div><span class="lbl">Nom :</span><span class="val">'+selC.dep.nom+(selC.dep.pre?' '+selC.dep.pre:'')+'</span></div>'
+(selC.dep.tel?'<div><span class="lbl">Tél :</span><span class="val-blue">'+selC.dep.tel+'</span></div>':'')
+(selC.dep.lien?'<div><span class="lbl">Lien :</span><span class="val">'+selC.dep.lien+'</span></div>':'')
+(selC.dep.adresse?'<div><span class="lbl">Adresse :</span><span class="val">'+selC.dep.adresse+'</span></div>':'')
+'</div></div>':'')
+'<div class="section">'
+'<div class="section-title">🧾 Détail Facture</div>'
+'<table>'
+(selC.nec!=='non'?'<tr><td>Frais nécessaires</td><td>'+(f.necExo?'Exonéré':fcfa(f.nec))+'</td></tr>':'')
+(selC.fml>0?'<tr><td>Formol '+selC.fml+'L × '+fcfa(TARIFS.fml)+'</td><td>'+(f.fmlExo?'Exonéré':fcfa(f.ffml))+'</td></tr>':'')
+(selC.fml>0?'<tr><td>Injection '+selC.fml+'L × '+fcfa(TARIFS.inj)+'</td><td>'+(f.injExo?'Exonéré':fcfa(f.finj))+'</td></tr>':'')
+'<tr><td>Conservation '+jC(selC.arr,selC.dateRet)+'j</td><td>'+(f.consExo?'Exonéré':fcfa(f.fcons))+'</td></tr>'
+'<tr><td>Frais complémentaires</td><td>'+(f.cplExo?'Exonéré':fcfa(f.fcpl))+'</td></tr>'
+(f.red>0?'<tr><td style="color:#dc3545">Réduction accordée</td><td style="color:#dc3545">— '+fcfa(f.red)+'</td></tr>':'')
+'<tr class="total-row"><td>TOTAL GÉNÉRAL</td><td>'+fcfa(f.total)+'</td></tr>'
+'</table>'
+'<div class="paye-box">'
+'<div class="paye-row"><span>Avance(s) reçue(s)</span><span class="paye-green">'+fcfa(paye)+'</span></div>'
+'<div class="paye-row solde-row"><span>Reste à payer</span><span>'+fcfa(solde)+'</span></div>'
+'</div>'
+'</div>'
+'<div class="footer">Merci de votre confiance · '+etab+' · '+ville+(tel?' · Tél : '+tel:'')+'<br><span style="font-size:10px;color:#bbb">Facture générée par : '+(CU?CU.nom:'—')+'</span></div>'
+'</body></html>';
var w=window.open('','_blank');
if(w){w.document.write(html);w.document.close();setTimeout(function(){w.print();},500);}
else{alert('Veuillez autoriser les popups pour générer la facture.');}
}
function envoyerFactureWhatsApp(){
if(!selC){alert('Sélectionnez un dossier.');return;}
var cas='non';
var radios=document.querySelectorAll('input[name="cas-part"]');
for(var r=0;r<radios.length;r++){if(radios[r].checked){cas=radios[r].value;break;}}
var f=calcFAvecCas(selC,cas,v('red-type'),parseFloat(v('red-val'))||0,el('cp-nec').checked);
var paye=selC.pmts.reduce(function(s,p){return s+p;},0);
var solde=f.total-paye;
var etab=TARIFS.etab||'COLOMBE — Morgue NGE';
var tel=selC.dep&&selC.dep.tel?selC.dep.tel.replace(/\D/g,''):'';
var msg='*'+etab+'*\n'
+'━━━━━━━━━━━━━━━\n'
+'*FACTURE N° F-'+selC.num+'*\n'
+'━━━━━━━━━━━━━━━\n'
+'*Défunt :* '+selC.nom+' '+selC.pre+'\n'
+'*Arrivée :* '+fd(selC.arr)+'\n'
+'*Conservation :* '+jC(selC.arr,selC.dateRet)+' jour(s)\n'
+'━━━━━━━━━━━━━━━\n'
+(selC.nec!=='non'?'Nécessaires : '+(f.necExo?'Exonéré':fcfa(f.nec))+'\n':'')
+(selC.fml>0?'Formol ('+selC.fml+'L) : '+(f.fmlExo?'Exonéré':fcfa(f.ffml))+'\n':'')
+(selC.fml>0?'Injection : '+(f.injExo?'Exonéré':fcfa(f.finj))+'\n':'')
+'Conservation : '+(f.consExo?'Exonéré':fcfa(f.fcons))+'\n'
+'Complémentaires : '+(f.cplExo?'Exonéré':fcfa(f.fcpl))+'\n'
+(f.red>0?'Réduction : — '+fcfa(f.red)+'\n':'')
+'━━━━━━━━━━━━━━━\n'
+'*TOTAL : '+fcfa(f.total)+'*\n'
+'*Payé : '+fcfa(paye)+'*\n'
+'*Reste à payer : '+fcfa(solde)+'*\n'
+'━━━━━━━━━━━━━━━\n'
+'_Généré le '+now()+'_';
var url='https://wa.me/'+(tel?tel:'')+'?text='+encodeURIComponent(msg);
window.open(url,'_blank');
}
function calcFAvecCas(c,cas,redType,redVal,necInclus){
if(necInclus===undefined) necInclus=(c.nec!=='non');
var dateFinCalc=null;
if(c.st==='Retiré'){
if(c.dateRet){
dateFinCalc=c.dateRet;
}else{
for(var i=0;i<recettes.length;i++){
if(recettes[i].corpNum===c.num&&recettes[i].ret){
dateFinCalc=recettes[i].ret;break;
}
}
if(!dateFinCalc)dateFinCalc=today();
}
}
var j=jC(c.arr,dateFinCalc);
var consExo=(cas==='exo_cons'||cas==='gratuit');
var toutGratuit=(cas==='gratuit');
var fcons=consExo?0:(j<=10?j*TARIFS.j1:(10*TARIFS.j1+(j-10)*TARIFS.j11));
var nec=(!necInclus||toutGratuit)?0:TARIFS.nec;
var ffml=toutGratuit?0:(c.fml||0)*TARIFS.fml;
var finj=toutGratuit?0:(c.fml||0)*TARIFS.inj;
var fcpl=toutGratuit?0:TARIFS.cpl;
var brut=nec+ffml+finj+fcons+fcpl;
var red=0;
if(cas==='partiel'){
red=(redType==='pct')?Math.round(brut*(redVal/100)):(redVal||0);
}
if(cas==='non'&&(c.red||0)>0) red=c.red;
red=Math.min(red,brut);
var total=Math.max(0,brut-red);
return{nec:nec,ffml:ffml,finj:finj,fcons:fcons,fcpl:fcpl,red:red,total:total,
necExo:toutGratuit,fmlExo:toutGratuit,injExo:toutGratuit,consExo:consExo,cplExo:toutGratuit};
}
function calcF(c){
return calcFAvecCas(c,c.justice||'non',c.redType||'fixe',c.red||0);
}
function versF(num){
navTo('facturation',document.querySelector('[onclick="navTo(\'facturation\',this)"]'));
setTimeout(function(){ouvrF(num);},80);
}
function rdRec(){
var tj=today(),mois=tj.slice(0,7);
var rj=recettes.filter(function(r){return r.ret===tj;}).reduce(function(s,r){return s+r.paye;},0);
var rm=recettes.filter(function(r){return r.ret&&r.ret.startsWith(mois);}).reduce(function(s,r){return s+r.paye;},0);
sv('rec-j',fmt(rj));sv('rec-m',fmt(rm));
el('tbl-rec').innerHTML=recettes.length?recettes.map(function(r){
return'<tr><td class="mono">'+r.num+'</td><td>'+r.def+'</td><td>'+fd(r.arr)+'</td><td>'+fd(r.ret)+'</td>'
+'<td class="mono">'+fcfa(r.fac)+'</td><td class="mono">'+(r.red>0?'— '+fcfa(r.red):'—')+'</td>'
+'<td class="mono" style="color:var(--green)">'+fcfa(r.paye)+'</td>'
+'<td class="mono" style="color:'+(r.solde>0?'var(--orange)':'var(--text-dim)')+'">'+fcfa(r.solde)+'</td></tr>';
}).join(''):'<tr><td colspan="8" class="empty-state">Aucune recette</td></tr>';
}
function rdDep(){
el('tbl-dep').innerHTML=depenses.length?depenses.map(function(d){
var photoHtml='<span style="color:var(--muted);font-size:11px">—</span>';
if(d.photoData){photoHtml='<img src="'+d.photoData+'" onclick="voirPhoto(\''+d.num+'\',\'photo\')" style="height:28px;border-radius:4px;cursor:pointer;border:1px solid var(--border)" title="Voir la photo">';}
else if(d.captureData){photoHtml='<img src="'+d.captureData+'" onclick="voirPhoto(\''+d.num+'\',\'capture\')" style="height:28px;border-radius:4px;cursor:pointer;border:1px solid var(--border)" title="Voir la capture">';}
else if(d.photo){photoHtml='<span style="color:var(--green);font-size:11px">📷</span>';}
return'<tr><td class="mono">'+d.num+'</td><td>'+fd(d.date)+'</td><td class="mono" style="color:var(--red)">'+fcfa(d.mt)+'</td>'
+'<td>'+d.benef+(d.benefTel&&d.benefTel!=='—'?'<br><span style="color:var(--text-dim);font-size:11px">📞 '+d.benefTel+'</span>':'')+'</td><td style="color:var(--text-dim)">'+d.motif+'</td>'
+'<td><span class="badge badge-muted">'+d.mode+'</span></td><td>'+photoHtml+'</td></tr>';
}).join(''):'<tr><td colspan="7" class="empty-state">Aucune dépense</td></tr>';
}