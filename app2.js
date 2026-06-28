+'<td>'+d.benef+(d.benefTel&&d.benefTel!=='—'?'<br><span style="color:var(--text-dim);font-size:11px">📞 '+d.benefTel+'</span>':'')+'</td><td style="color:var(--text-dim)">'+d.motif+'</td>'
+'<td><span class="badge badge-muted">'+d.mode+'</span></td><td>'+photoHtml+'</td></tr>';
}).join(''):'<tr><td colspan="7" class="empty-state">Aucune dépense</td></tr>';
}
function voirPhoto(num,type){
var d=null;for(var i=0;i<depenses.length;i++){if(depenses[i].num===num){d=depenses[i];break;}}
if(!d)return;
var src=type==='capture'?d.captureData:d.photoData;
if(!src){alert('Photo non disponible.');return;}
var w=window.open('','_blank');
w.document.write('<html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="'+src+'" style="max-width:100%;max-height:100vh"></body></html>');
w.document.close();
}
function ajoutDep(){
var date=v('dep-date'),mt=parseInt(v('dep-mt'))||0,benef=v('dep-benef').trim(),motif=v('dep-motif').trim(),benefTel=v('dep-benef-tel').trim();
if(!date||!mt||!benef){alert('Remplissez : Date,Montant,Bénéficiaire.');return;}
var d={num:depNum(),date:date,mt:mt,benef:benef,benefTel:benefTel||'—',motif:motif||'—',mode:v('dep-mode'),photo:false,photoData:null};
depN++;
var photoInput=el('dep-photo');
var captureInput=el('dep-capture');
var pending=0,loaded=0;
if(photoInput&&photoInput.files&&photoInput.files.length>0)pending++;
if(captureInput&&captureInput.files&&captureInput.files.length>0)pending++;
function apres(){
depenses.unshift(d);
addLog('Dépense',benef+' — '+fcfa(mt));
sauvegarder();
closeModal('modal-depense');rdDep();rdDash();rdRpts();
alert('✓ Dépense enregistrée.\n💾 Sauvegardée automatiquement.');
}
if(pending===0){apres();return;}
if(photoInput&&photoInput.files&&photoInput.files.length>0){
compressImage(photoInput.files[0],1280,0.72,function(dataUrl){d.photoData=dataUrl;d.photo=!!dataUrl;loaded++;if(loaded===pending)apres();});
}
if(captureInput&&captureInput.files&&captureInput.files.length>0){
compressImage(captureInput.files[0],1280,0.72,function(dataUrl){d.captureData=dataUrl;loaded++;if(loaded===pending)apres();});
}
}
function rdStk(){
var low=stocks.filter(function(s){return s.q<=s.min;}).length;
sv('badge-stock',low);
el('stock-list').innerHTML=stocks.map(function(s,i){
var pct=s.min===0?100:Math.min(100,s.q/(s.min*4)*100);
var col=s.q<=s.min?'#f85149':s.q<=s.min*2?'#d29922':'#3fb950';
var lbl=s.q<=s.min?'badge-red':s.q<=s.min*2?'badge-orange':'badge-green';
return'<div class="stock-item"><div><div style="font-size:13px;font-weight:500">'+s.a+'</div>'
+'<div class="progress-wrap"><div class="progress-bar" style="width:'+pct+'%;background:'+col+'"></div></div>'
+'<div style="font-size:10px;color:var(--text-dim);margin-top:2px">Seuil alerte : '+s.min+' '+s.u+'</div></div>'
+'<div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px">'
+'<div style="font-size:15px;font-weight:600;color:var(--white)">'+s.q+'</div>'
+'<div style="font-size:10px;color:var(--text-dim)">'+s.u+'</div>'
+'<div style="margin-top:3px"><span class="badge '+lbl+'">'+(s.q<=s.min?'⚠️ Bas':'OK')+'</span></div>'
+'<button class="btn btn-sm" style="margin-top:4px" onclick="ouvrModifStk('+i+')">✏️ Modifier</button>'
+'</div></div>';
}).join('');
var logEl=el('tbl-stk-log');
if(logEl){
logEl.innerHTML=stocksLog.length?stocksLog.map(function(l){
var couleur=l.qty>0?'var(--green)':'var(--red)';
var signe=l.qty>0?'+':'';
return'<tr><td class="mono" style="font-size:11px;white-space:nowrap">'+l.dt+'</td>'
+'<td><b>'+l.art+'</b></td>'
+'<td class="mono" style="color:'+couleur+'">'+signe+l.qty+'</td>'
+'<td style="color:var(--text-dim);font-size:11px">'+l.motif+'</td>'
+'<td style="font-size:11px">'+l.usr+'</td></tr>';
}).join(''):'<tr><td colspan="5" class="empty-state">Aucun mouvement enregistré</td></tr>';
}
}
function addStkLog(art,qty,motif){
stocksLog.unshift({dt:now(),art:art,qty:qty,motif:motif||'—',usr:CU?CU.nom:'—'});
}
var modifStkIdx=-1;
function ouvrModifStk(i){
modifStkIdx=i;
var s=stocks[i];
el('ms-art').textContent=s.a;
el('ms-qty').value=s.q;
el('ms-min').value=s.min;
el('ms-motif').value='';
openModal('modal-modif-stock');
}
function validerModifStk(){
if(modifStkIdx<0)return;
var s=stocks[modifStkIdx];
var newQ=parseFloat(el('ms-qty').value);
var newMin=parseFloat(el('ms-min').value)||0;
var motif=el('ms-motif').value.trim()||'Correction manuelle';
if(isNaN(newQ)||newQ<0){alert('Quantité invalide.');return;}
var diff=parseFloat((newQ-s.q).toFixed(2));
if(diff!==0) addStkLog(s.a,diff,motif);
s.q=newQ;s.min=newMin;
addLog('Modif stock',s.a+' → '+newQ+' ('+motif+')');
sauvegarder();closeModal('modal-modif-stock');rdStk();
}
function onStArtChange(sel){
var box=el('st-nouvel-art-box');
if(sel.value==='__nouveau__'){
box.style.display='block';
el('st-nouvel-art').focus();
}else{
box.style.display='none';
var unites={'Formol':'L','Alcool':'L','Gants':'paire','Chaussettes':'paire','Latex':'unité','Coton':'kg','Porpeline':'m','Voile':'m','Épingles':'boîte'};
el('st-unit').value=unites[sel.value]||'';
}
}
function ajoutStk(){
var art=v('st-art'),qty=parseFloat(v('st-qty'))||0;
if(art==='__nouveau__'){
art=v('st-nouvel-art').trim();
if(!art){alert('Veuillez saisir le nom du nouvel article.');return;}
}
if(!qty){alert('Quantité requise.');return;}
var unit=v('st-unit').trim();
var found=null;
for(var i=0;i<stocks.length;i++){if(stocks[i].a===art){found=stocks[i];break;}}
if(found){
found.q=parseFloat((found.q+qty).toFixed(2));
if(unit)found.u=unit;
}else{
stocks.push({a:art,u:unit||'unité',q:qty,alert:0});
var sel=el('st-art');
var newOpt=document.createElement('option');
newOpt.value=art;newOpt.textContent=art;
sel.insertBefore(newOpt,sel.options[sel.options.length-1]);
}
addStkLog(art,+qty,'Entrée manuelle'+(v('st-fourn')?' — '+v('st-fourn'):''));
addLog('Entrée stock',art+'+'+qty);
sauvegarder();
closeModal('modal-stock');
el('st-nouvel-art-box').style.display='none';
el('st-nouvel-art').value='';
rdStk();rdDash();
alert('✓ Stock mis à jour.\n💾 Sauvegardé.');
}
function rdPers(){
el('tbl-pers').innerHTML=personnel.length?personnel.map(function(p,i){
return'<tr><td><b>'+p.nom+'</b></td><td>'+p.fn+'</td><td class="mono">'+(p.tel||'—')+'</td><td class="mono">'+fcfa(p.sal)+'</td>'
+'<td><span class="badge '+(p.actif?'badge-green':'badge-muted')+'">'+(p.actif?'Actif':'Inactif')+'</span></td>'
+'<td><button class="btn btn-sm" onclick="togP('+i+')">'+(p.actif?'Désactiver':'Réactiver')+'</button></td></tr>';
}).join(''):'<tr><td colspan="6" class="empty-state">Aucun employé</td></tr>';
}
function togP(i){personnel[i].actif=!personnel[i].actif;addLog('Modif personnel',personnel[i].nom);sauvegarder();rdPers();}
function ajoutEmp(){
var nom=v('emp-nom').trim().toUpperCase();if(!nom){alert('Nom requis.');return;}
personnel.push({nom:nom+' '+v('emp-pre').toUpperCase().trim(),fn:v('emp-fn'),tel:v('emp-tel'),adr:v('emp-adr'),sal:parseInt(v('emp-sal'))||0,actif:true});
fillSalSel();addLog('Ajout employé',nom);sauvegarder();closeModal('modal-employe');rdPers();alert('✓ Employé ajouté.\n💾 Sauvegardé.');
}
function fillSalSel(){
var sel=el('sal-emp');if(!sel)return;
sel.innerHTML='<option value="">— Sélectionner —</option>'+personnel.filter(function(p){return p.actif;}).map(function(p){return'<option value="'+p.nom+'">'+p.nom+'</option>';}).join('');
}
function fillSal(){var p=null;for(var i=0;i<personnel.length;i++){if(personnel[i].nom===v('sal-emp')){p=personnel[i];break;}}if(p){el('sal-brut').value=p.sal;calcNet();}}
function calcNet(){
var net=(parseInt(v('sal-brut'))||0)+(parseInt(v('sal-prime'))||0)-(parseInt(v('sal-ret'))||0)-(parseInt(v('sal-av'))||0);
sv('sal-net',fcfa(net));
}
function rdSal(){
el('tbl-sal').innerHTML=salaires.length?salaires.map(function(s){
return'<tr><td>'+s.emp+'</td><td class="mono">'+s.mois+'</td><td class="mono">'+fcfa(s.brut)+'</td>'
+'<td class="mono" style="color:var(--green)">'+(s.prime>0?'+'+fcfa(s.prime):'—')+'</td>'
+'<td class="mono" style="color:var(--orange)">'+(s.av>0?'−'+fcfa(s.av):'—')+'</td>'
+'<td class="mono" style="color:var(--red)">'+(s.ret>0?'−'+fcfa(s.ret):'—')+'</td>'
+'<td class="mono"><b style="color:var(--white)">'+fcfa(s.net)+'</b></td>'
+'<td style="font-size:11px">'+fd(s.date)+'<span style="color:var(--text-dim)">'+s.mode+'</span></td></tr>';
}).join(''):'<tr><td colspan="8" class="empty-state">Aucun salaire enregistré</td></tr>';
}
function payerSal(){
var emp=v('sal-emp');if(!emp){alert('Sélectionnez un employé.');return;}
var brut=parseInt(v('sal-brut'))||0,prime=parseInt(v('sal-prime'))||0,av=parseInt(v('sal-av'))||0,ret=parseInt(v('sal-ret'))||0;
var net=brut+prime-ret-av,mois=v('sal-mois'),date=v('sal-date'),mode=v('sal-mode');
salaires.unshift({emp:emp,mois:mois,brut:brut,prime:prime,av:av,ret:ret,net:net,date:date,mode:mode});
depenses.unshift({num:depNum(),date:date,mt:net,benef:emp,motif:'Salaire '+mois,mode:mode,photo:false});
depN++;
addLog('Paiement salaire',emp+' — '+mois);
sauvegarder();
closeModal('modal-salaire');rdSal();rdDep();rdDash();rdRpts();
alert('✓ Salaire payé. Dépense créée automatiquement.\n💾 Sauvegardé.');
}
function getNextCorpsNum(){
var y=new Date().getFullYear();
var maxN=0;
for(var i=0;i<corps.length;i++){
var num=corps[i].num||'';
var prefix='C-'+y+'-';
if(num.indexOf(prefix)===0){
var n=parseInt(num.replace(prefix,''))||0;
if(n>maxN)maxN=n;
}
}
if(corpsN<=maxN)corpsN=maxN+1;
return'C-'+y+'-'+String(corpsN).padStart(3,'0');
}
function genNum(){var e=el('c-num');if(e)e.value=getNextCorpsNum();}
function checkFml(){
var q=parseFloat(v('c-formol'))||0;
var sf=null;for(var i=0;i<stocks.length;i++){if(stocks[i].a==='Formol'){sf=stocks[i];break;}}
el('fml-warn').textContent=(sf&&q>sf.q&&sf.q>0)?'⚠️ Stock insuffisant (disponible : '+sf.q+'L)':'';
}
async function enregCorps(){
var nom=v('c-nom').trim().toUpperCase(),pre=v('c-prenoms').trim(),date=v('c-date');
var fmlV=v('c-formol'),prov=v('c-provenance').trim(),age=v('c-age');
var dNom=v('d-nom').trim(),dPre=v('d-prenoms').trim(),dTel=v('d-tel').trim(),dAdresse=v('d-adresse').trim(),dDdn=v('d-ddn');
var manquants=[];
if(!nom)manquants.push('Nom du corps');
if(!pre)manquants.push('Prénoms du corps');
if(!date)manquants.push('Date d\'arrivée');
if(fmlV==='')manquants.push('Formol');
if(!prov)manquants.push('Provenance');
if(age==='')manquants.push('Âge du corps');
if(!dNom)manquants.push('Nom du déposant');
if(!dPre)manquants.push('Prénoms du déposant');
if(!dDdn)manquants.push('Date de naissance du déposant');
if(!dTel)manquants.push('Téléphone du déposant');
if(!dAdresse)manquants.push('Lieu de résidence');
if(!PHOTO_DATA['c-photo-piece'])manquants.push('Photo pièce d\'identité');
var morguier=v('c-morguier')||'';
if(manquants.length){alert('Veuillez remplir les champs obligatoires suivants :\n\n• '+manquants.join('\n• '));return;}
var fml=parseFloat(fmlV)||0;
var sf=null;for(var i=0;i<stocks.length;i++){if(stocks[i].a==='Formol'){sf=stocks[i];break;}}
if(sf&&sf.q>0&&fml>sf.q){alert('Stock insuffisant pour effectuer cette opération.');return;}
var numCorps=el('c-num').value;
for(var i=0;i<corps.length;i++){
if(corps[i].num===numCorps){
corpsN++;
numCorps=getNextCorpsNum();
el('c-num').value=numCorps;
}
}
var c={num:numCorps,nom:nom,pre:pre,sx:v('c-sexe')[0],age:parseInt(age)||0,
arr:date,h:v('c-heure'),prov:prov,cause:v('c-cause'),fml:fml,obs:v('c-obs'),
morguier:morguier,
nec:'oui',red:0,justice:'non',
st:'Conservé',pmts:[],
dep:{nom:dNom,pre:dPre,ddn:dDdn,prof:v('d-prof'),tel:dTel,adresse:dAdresse,lien:v('d-lien'),piece:v('d-piece'),pieceNum:v('d-piece-num')},
photos:{}};
if(PHOTO_DATA['c-photo-piece']){
var path=await uploadPhoto(PHOTO_DATA['c-photo-piece'],'corps/'+c.num+'/piece_identite');
if(path){c.photos.piece=path;}
else{
alert('⚠️ Upload photo échoué. La photo sera conservée localement uniquement.');
c.photos.piece=PHOTO_DATA['c-photo-piece'];
}
}
corps.unshift(c);corpsN++;
if(sf&&fml>0){sf.q=Math.max(0,parseFloat((sf.q-fml).toFixed(2)));addStkLog('Formol',-fml,'Enregistrement corps '+c.num);}
addLog('Enregistrement corps',c.num+' — '+nom+' '+pre);
sauvegarder();
closeModal('modal-corps');genNum();rdCorps();rdRetrait();rdFact();rdDash();rdStk();
alert('✓ Corps enregistré\nN° '+c.num+'\nDate limite légale : '+fd(ech(c.arr))+'\n\n💾 Données sauvegardées automatiquement.');
}
function voirD(num){
var c=null;for(var i=0;i<corps.length;i++){if(corps[i].num===num){c=corps[i];break;}}
if(!c)return;
var f=calcF(c),paye=c.pmts.reduce(function(s,p){return s+p;},0);
var justiceLib={non:'Cas ordinaire',exo_cons:'Sous main de justice (conservation exonérée)',gratuit:'Sous main de justice (GRATUIT)',partiel:'Sous main de justice (partiel)'};
alert('DOSSIER '+c.num+'\n\nDÉFUNT\n'+c.nom+' '+c.pre+'|'+c.age+' ans|'+(c.sx==='M'?'Masculin':'Féminin')+'\nArrivée : '+fd(c.arr)+(c.h?' à '+c.h:'')+'\nProvenance : '+(c.prov||'—')+'\nCause : '+(c.cause||'—')+'\nStatut : '+c.st+'\nJudiciaire : '+(justiceLib[c.justice||'non'])+'\nMorguier de garde : '+(c.morguier||'—')+'\n\nDÉPOSANT\n'+(c.dep?c.dep.nom+(c.dep.lien?' ('+c.dep.lien+')':'')+'\nTél : '+(c.dep.tel||'—'):'—')+'\n\nFACTURE\nNécessaires : '+fcfa(f.nec)+'\nFormol '+c.fml+'L : '+fcfa(f.ffml)+'\nInjection : '+fcfa(f.finj)+'\nConservation '+jC(c.arr,c.dateRet)+'j : '+fcfa(f.fcons)+'\nComplémentaires : '+fcfa(f.fcpl)+(f.red>0?'\nRéduction : — '+fcfa(f.red):'')+'\n──────\nTotal : '+fcfa(f.total)+'\nPayé : '+fcfa(paye)+'\nReste à payer : '+fcfa(f.total-paye));
}
function rdRpts(){
var totR=recettes.reduce(function(s,r){return s+r.paye;},0);
var totD=depenses.reduce(function(s,d){return s+d.mt;},0);
var totS=salaires.reduce(function(s,x){return s+x.net;},0);
var cons=corps.filter(function(c){return c.st==='Conservé';});
sv('rp-rec',fcfa(totR));sv('rp-dep','— '+fcfa(totD));sv('rp-sal','— '+fcfa(totS));sv('rp-sol',fcfa(totR-totD-totS));
sv('rp-tot',corps.length);sv('rp-ret',corps.filter(function(c){return c.st==='Retiré';}).length);
sv('rp-con',cons.length);sv('rp-al',cons.filter(function(c){return jR(c.arr)<=5&&jR(c.arr)>=0;}).length);
var dbEl=el('rp-debut'),dfEl=el('rp-fin');
if(dbEl&&!dbEl.value){var d=new Date();d.setMonth(d.getMonth()-1);dbEl.value=d.toISOString().slice(0,10);}
if(dfEl&&!dfEl.value)dfEl.value=today();
}
var rpData=null;
function onRpTypeChange(){
el('rp-result-wrap').style.display='none';
el('rp-empty').style.display='none';
el('rp-resume').style.display='none';
var type=v('rp-type');
var filtre=el('rp-agent-filter');
if(filtre){
if(type==='performance'){
filtre.style.display='block';
var sel=el('rp-agent-sel');
sel.innerHTML='<option value="">— Tous les agents —</option>';
var noms={};
journal.forEach(function(j){if(j.usr)noms[j.usr]=1;});
Object.keys(noms).sort().forEach(function(n){
sel.innerHTML+='<option value="'+n+'">'+n+'</option>';
});
}else{
filtre.style.display='none';
}
}
}
function filtrerParAgent(){
var agent=v('rp-agent-sel');
if(!PERF_DATA)return;
var debut=PERF_DATA.debut,fin=PERF_DATA.fin;
if(agent){
var usrs=[agent];
var parUsr=PERF_DATA.parUsr;
if(!parUsr[agent]){
el('rp-empty').style.display='block';
el('rp-result-wrap').style.display='none';
return;
}
var maxTotal=parUsr[agent].total||1;
var medailles=['🥇'];
el('rp-thead').innerHTML='<tr><th>#</th><th>Utilisateur</th><th>Corps enreg.</th><th>Retraits</th><th>Paiements</th><th>Montant encaissé</th><th>Activité totale</th><th></th></tr>';
el('rp-tbody').innerHTML='<tr style="cursor:pointer" onclick="voirDetailPerformance(\''+agent.replace(/'/g,"\\'")+'\')"><td>👤</td><td><b>'+agent+'</b></td>'
+'<td class="mono">'+parUsr[agent].corps+'</td>'
+'<td class="mono">'+parUsr[agent].retraits+'</td>'
+'<td class="mono">'+parUsr[agent].paiements+'</td>'
+'<td class="mono" style="color:var(--green)">'+fcfa(parUsr[agent].montantPaye)+'</td>'
+'<td><span class="mono">'+parUsr[agent].total+' actions</span></td>'
+'<td><button class="btn btn-sm" onclick="event.stopPropagation();voirDetailPerformance(\''+agent.replace(/'/g,"\\'")+'\')">Détail</button></td></tr>';
sv('rp-count','1 agent filtré');
el('rp-result-wrap').style.display='block';
el('rp-empty').style.display='none';
}else{
genRapportPerformance(debut,fin);
}
}
var PERF_DATA=null;
function genRapportPerformance(debut,fin){
var entries=journal.filter(function(j){
var d=j.dt?j.dt.split(' ')[0]:'';
if(d.indexOf('/')>=0){var p=d.split('/');d=p[2]+'-'+p[1]+'-'+p[0];}
return d>=debut&&d<=fin;
});
var parUsr={};
entries.forEach(function(j){
var u=j.usr||'—';
if(!parUsr[u])parUsr[u]={total:0,corps:0,retraits:0,paiements:0,montantPaye:0,depenses:0,montantDepense:0,stock:0,details:[]};
parUsr[u].total++;
parUsr[u].details.push(j);
if(j.act==='Enregistrement corps')parUsr[u].corps++;
else if(j.act==='Retrait corps')parUsr[u].retraits++;
else if(j.act==='Paiement'){
parUsr[u].paiements++;
var m=(j.det||'').match(/(\d[\d\s]*)\s*F/);
if(m)parUsr[u].montantPaye+=parseInt(m[1].replace(/\s/g,''))||0;
}
else if(j.act==='Dépense'){
parUsr[u].depenses++;
var m2=(j.det||'').match(/(\d[\d\s]*)\s*F/);
if(m2)parUsr[u].montantDepense+=parseInt(m2[1].replace(/\s/g,''))||0;
}
else if(j.act==='Entrée stock')parUsr[u].stock++;
});
var usrs=Object.keys(parUsr).sort(function(a,b){return parUsr[b].total-parUsr[a].total;});
PERF_DATA={debut:debut,fin:fin,parUsr:parUsr,usrs:usrs};
sv('rp-resume-titre','📅 Performance du personnel du '+fd(debut)+' au '+fd(fin));
el('rp-resume-stats').innerHTML='<div style="margin-right:20px"><span style="color:var(--text-dim)">Membres actifs :</span><b style="color:var(--blue)">'+usrs.length+'</b></div>'
+'<div><span style="color:var(--text-dim)">Total actions :</span><b style="color:var(--green)">'+entries.length+'</b></div>';
el('rp-resume').style.display='block';
if(usrs.length===0){
el('rp-result-wrap').style.display='none';
el('rp-empty').style.display='block';
return;
}
el('rp-empty').style.display='none';
el('rp-result-wrap').style.display='block';
sv('rp-count',usrs.length+' membre(s) du personnel');
el('rp-pdf-btn').style.display='none';
el('rp-csv-btn').style.display='none';
el('rp-pdf-btn').insertAdjacentHTML('afterend','<button class="btn btn-sm btn-primary" id="rp-perf-pdf-btn" onclick="exportPerformancePDF()">📄 Exporter classement (PDF)</button>');
var maxTotal=Math.max.apply(null,usrs.map(function(u){return parUsr[u].total;}));
var medailles=['🥇','🥈','🥉'];
el('rp-thead').innerHTML='<tr><th>#</th><th>Utilisateur</th><th>Corps enreg.</th><th>Retraits</th><th>Paiements</th><th>Montant encaissé</th><th>Activité totale</th><th></th></tr>';
el('rp-tbody').innerHTML=usrs.map(function(u,i){
var d=parUsr[u];
return'<tr style="cursor:pointer" onclick="voirDetailPerformance(\''+u.replace(/'/g,"\\'")+'\')">'
+'<td>'+(medailles[i]||(i+1))+'</td>'
+'<td><b>'+u+'</b></td>'
+'<td class="mono">'+d.corps+'</td>'
+'<td class="mono">'+d.retraits+'</td>'
+'<td class="mono">'+d.paiements+'</td>'
+'<td class="mono" style="color:var(--green)">'+fcfa(d.montantPaye)+'</td>'
+'<td><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;background:var(--border);border-radius:4px;height:6px;min-width:40px"><div style="width:'+(maxTotal?Math.round(d.total/maxTotal*100):0)+'%;background:var(--blue);height:6px;border-radius:4px"></div></div><span class="mono" style="font-size:11px">'+d.total+'</span></div></td>'
+'<td><button class="btn btn-sm" onclick="event.stopPropagation();voirDetailPerformance(\''+u.replace(/'/g,"\\'")+'\')">Détail</button></td>'
+'</tr>';
}).join('');
}
function voirDetailPerformance(usr){
if(!PERF_DATA||!PERF_DATA.parUsr[usr])return;
var d=PERF_DATA.parUsr[usr];
var icones={'Enregistrement corps':'📋','Retrait corps':'🚪','Paiement':'💳','Dépense':'💸','Entrée stock':'📦','Connexion':'🔓','Déconnexion':'🔒','Création utilisateur':'🔑','Modification tarifs':'⚙️'};
var detailsHtml=d.details.map(function(j){
return'<div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">'
+'<div style="font-size:16px;flex-shrink:0">'+(icones[j.act]||'📝')+'</div>'
+'<div style="flex:1;min-width:0">'
+'<div style="font-size:12px;font-weight:600;color:var(--white)">'+j.act+'</div>'
+(j.det?'<div style="font-size:11px;color:var(--text-dim);margin-top:1px">'+j.det+'</div>':'')
+'<div style="font-size:10px;color:var(--muted);margin-top:2px">'+j.dt+'</div>'
+'</div></div>';
}).join('');
var html='<div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:160;display:flex;align-items:center;justify-content:center;padding:16px" onclick="if(event.target===this)this.remove()">'
+'<div style="background:#161b22;border-radius:12px;max-width:480px;width:100%;max-height:85vh;display:flex;flex-direction:column;border:1px solid var(--border)">'
+'<div style="padding:16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">'
+'<div><b style="font-size:15px;color:var(--white)">👤 '+usr+'</b><div style="font-size:11px;color:var(--text-dim);margin-top:2px">'+fd(PERF_DATA.debut)+' au '+fd(PERF_DATA.fin)+'</div></div>'
+'<a href="#" onclick="this.closest(\'div[style*=fixed]\').remove();return false;" style="font-size:18px;color:var(--text-dim)">✕</a>'
+'</div>'
+'<div style="padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;border-bottom:1px solid var(--border)">'
+'<div style="background:var(--panel);border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--blue)">'+d.corps+'</div><div style="font-size:10px;color:var(--text-dim)">Corps enregistrés</div></div>'
+'<div style="background:var(--panel);border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--orange)">'+d.retraits+'</div><div style="font-size:10px;color:var(--text-dim)">Retraits</div></div>'
+'<div style="background:var(--panel);border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--green)">'+fcfa(d.montantPaye)+'</div><div style="font-size:10px;color:var(--text-dim)">Encaissé ('+d.paiements+' pmt)</div></div>'
+'<div style="background:var(--panel);border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--white)">'+d.total+'</div><div style="font-size:10px;color:var(--text-dim)">Actions totales</div></div>'
+'</div>'
+'<div style="overflow-y:auto;padding:0 16px;flex:1">'+detailsHtml+'</div>'
+'</div></div>';
var div=document.createElement('div');
div.innerHTML=html;
document.body.appendChild(div.firstChild);
}
function exportPerformancePDF(){
if(!PERF_DATA||PERF_DATA.usrs.length===0){alert('Aucune donnée à exporter.');return;}
var medailles=['🥇','🥈','🥉'];
var rows=PERF_DATA.usrs.map(function(u,i){
var d=PERF_DATA.parUsr[u];
return'<tr><td>'+(medailles[i]||(i+1))+'</td><td><b>'+u+'</b></td><td>'+d.corps+'</td><td>'+d.retraits+'</td><td>'+d.paiements+'</td><td>'+fcfa(d.montantPaye)+'</td><td>'+d.total+'</td></tr>';
}).join('');
var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Performance du personnel</title>'
+'<style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;color:#111;}'
+'h1{font-size:16px;margin-bottom:4px;}p{color:#666;margin-bottom:16px;font-size:11px;}'
+'table{width:100%;border-collapse:collapse;}th{background:#0d1117;color:#fff;padding:7px 10px;text-align:left;font-size:11px;}'
+'td{padding:6px 10px;border-bottom:1px solid #ddd;font-size:11px;}tr:nth-child(even)td{background:#f9f9f9;}'
+'.footer{margin-top:20px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:8px;}</style></head><body>'
+'<h1>'+(TARIFS.etab||'Mon établissement')+' — Performance du personnel</h1>'
+'<p>Période : '+fd(PERF_DATA.debut)+' au '+fd(PERF_DATA.fin)+' · Généré le '+now()+'</p>'
+'<table><thead><tr><th>#</th><th>Utilisateur</th><th>Corps enreg.</th><th>Retraits</th><th>Paiements</th><th>Montant encaissé</th><th>Activité totale</th></tr></thead><tbody>'
+rows+'</tbody></table>'
+'<div class="footer">'+(TARIFS.etab||'Mon établissement')+(TARIFS.tel?' — Tél : '+TARIFS.tel:'')+'</div>'
+'</body></html>';
var w=window.open('','_blank');
w.document.write(html);w.document.close();
setTimeout(function(){w.print();},400);
}
function genRapportPeriode(){
var debut=v('rp-debut'),fin=v('rp-fin'),type=v('rp-type');
if(!debut||!fin){alert('Veuillez saisir une date de début et une date de fin.');return;}
if(debut>fin){alert('La date de début doit être avant la date de fin.');return;}
el('rp-pdf-btn').style.display='';
el('rp-csv-btn').style.display='';
var oldBtn=el('rp-perf-pdf-btn');if(oldBtn)oldBtn.remove();
var libType={corps:'Corps enregistrés',conservation:'Corps en conservation actuellement',retires:'Corps retirés',factures:'Historique des factures',recettes:'Recettes',depenses:'Dépenses',salaires:'Salaires',stocks_hist:'Historique des stocks',performance:'Performance du personnel',morguier:'Corps par morguier de garde'};
var headers,rows,summary;
if(type==='corps'){
var data=corps.filter(function(c){return c.arr>=debut&&c.arr<=fin;});
headers=['N°','Nom','Prénoms','Arrivée','Statut','Jours','Déposant','Judiciaire'];
rows=data.map(function(c){var jl={non:'—',exo_cons:'Exo. cons.',gratuit:'Gratuit',partiel:'Partiel'};return[c.num,c.nom,c.pre,fd(c.arr),c.st,jC(c.arr,c.dateRet)+'j',c.dep?c.dep.nom:'—',jl[c.justice||'non']];});
var cons=data.filter(function(c){return c.st==='Conservé';}).length;
var ret=data.filter(function(c){return c.st==='Retiré';}).length;
summary='<div style="margin-right:20px"><span style="color:var(--text-dim)">Total :</span><b style="color:var(--blue)">'+data.length+'</b></div>'
+'<div style="margin-right:20px"><span style="color:var(--text-dim)">Conservés :</span><b style="color:var(--orange)">'+cons+'</b></div>'
+'<div><span style="color:var(--text-dim)">Retirés :</span><b style="color:var(--green)">'+ret+'</b></div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data};
}else if(type==='conservation'){
var data=corps.filter(function(c){return c.st==='Conservé';});
headers=['N°','Nom','Prénoms','Arrivée','Jours','Échéance','Reste à payer','Judiciaire'];
rows=data.map(function(c){var f=calcF(c),paye=c.pmts.reduce(function(s,p){return s+p;},0),solde=f.total-paye;var jl={non:'—',exo_cons:'Exo. cons.',gratuit:'Gratuit',partiel:'Partiel'};return[c.num,c.nom,c.pre,fd(c.arr),jC(c.arr,c.dateRet)+'j',fd(ech(c.arr)),fcfa(solde),jl[c.justice||'non']];});
var alerte=data.filter(function(c){return jR(c.arr)<=5&&jR(c.arr)>=0;}).length;
var depasses=data.filter(function(c){return jR(c.arr)<0;}).length;
summary='<div style="margin-right:20px"><span style="color:var(--text-dim)">Total en conservation :</span><b style="color:var(--blue)">'+data.length+'</b></div>'
+'<div style="margin-right:20px"><span style="color:var(--text-dim)">Proches échéance (≤5j) :</span><b style="color:var(--orange)">'+alerte+'</b></div>'
+'<div><span style="color:var(--text-dim)">Délai dépassé :</span><b style="color:var(--red)">'+depasses+'</b></div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data};
}else if(type==='retires'){
var data=corps.filter(function(c){return c.st==='Retiré';});
headers=['N°','Nom','Prénoms','Arrivée','Statut','Jours conservés','Déposant','Tel'];
rows=data.map(function(c){return[c.num,c.nom,c.pre,fd(c.arr),'Retiré',jC(c.arr,c.dateRet)+'j',c.dep?c.dep.nom:'—',c.dep?c.dep.tel||'—':'—'];});
summary='<div style="margin-right:20px"><span style="color:var(--text-dim)">Total retirés :</span><b style="color:var(--green)">'+data.length+'</b></div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data};
}else if(type==='factures'){
var data=corps.filter(function(c){
if(c.pmts&&c.pmts.length>0){
var rec=null;
for(var i=0;i<recettes.length;i++){if(recettes[i].corpNum===c.num){rec=recettes[i];break;}}
var datePmt=rec?rec.ret:c.arr;
return datePmt>=debut&&datePmt<=fin;
}
return false;
});
headers=['N° Dossier','Défunt','Arrivée','Date paiement','Jours','Total facturé','Payé','Reste à payer','Statut'];
rows=data.map(function(c){
var f=calcF(c);
var paye=c.pmts.reduce(function(s,p){return s+p;},0);
var solde=Math.max(0,f.total-paye);
var rec=null;
for(var i=0;i<recettes.length;i++){if(recettes[i].corpNum===c.num){rec=recettes[i];break;}}
var datePmt=rec?fd(rec.ret):'—';
return[c.num,c.nom+' '+c.pre,fd(c.arr),datePmt,jC(c.arr,c.dateRet)+'j',fcfa(f.total),fcfa(paye),fcfa(solde),solde<=0?'Soldé':'En attente'];
});
var totFac=data.reduce(function(s,c){return s+calcF(c).total;},0);
var totPaye=data.reduce(function(s,c){return s+c.pmts.reduce(function(a,p){return a+p;},0);},0);
summary='<div style="margin-right:20px"><span style="color:var(--text-dim)">Factures :</span><b style="color:var(--blue)">'+data.length+'</b></div>'
+'<div style="margin-right:20px"><span style="color:var(--text-dim)">Total facturé :</span><b style="color:var(--text)">'+fcfa(totFac)+'</b></div>'
+'<div style="margin-right:20px"><span style="color:var(--text-dim)">Encaissé :</span><b style="color:var(--green)">'+fcfa(totPaye)+'</b></div>'
+'<div><span style="color:var(--text-dim)">Reste à recouvrer :</span><b style="color:var(--orange)">'+fcfa(totFac-totPaye)+'</b></div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data};
}else if(type==='recettes'){
var data=recettes.filter(function(r){return r.ret&&r.ret>=debut&&r.ret<=fin;});
headers=['N° Reçu','Défunt','Arrivée','Retrait','Facturé','Réduction','Payé','Solde','Formol (L)','Cas du corps'];
rows=data.map(function(r){var jl={non:'Cas normal',exo_cons:'Exo. conservation',gratuit:'Cas social / gratuit',partiel:'Cas social / partiel',sous_justice:'Sous main de justice'};return[r.num,r.def,fd(r.arr),fd(r.ret),fcfa(r.fac),r.red>0?'— '+fcfa(r.red):'—',fcfa(r.paye),fcfa(r.solde),(r.fml!==undefined?r.fml:'—'),jl[r.justice||'non']||'Cas normal'];});
var totPaye=data.reduce(function(s,r){return s+r.paye;},0);
var totFac=data.reduce(function(s,r){return s+r.fac;},0);
summary='<div style="margin-right:20px"><span style="color:var(--text-dim)">Dossiers :</span><b style="color:var(--blue)">'+data.length+'</b></div>'
+'<div style="margin-right:20px"><span style="color:var(--text-dim)">Total facturé :</span><b style="color:var(--text)">'+fcfa(totFac)+'</b></div>'
+'<div><span style="color:var(--text-dim)">Total encaissé :</span><b style="color:var(--green)">'+fcfa(totPaye)+'</b></div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data};
}else if(type==='depenses'){
var data=depenses.filter(function(d){return d.date>=debut&&d.date<=fin;});
headers=['N°','Date','Montant','Bénéficiaire','Tél. bénéficiaire','Motif','Mode'];
rows=data.map(function(d){return[d.num,fd(d.date),fcfa(d.mt),d.benef,d.benefTel||'—',d.motif,d.mode];});
var totMt=data.reduce(function(s,d){return s+d.mt;},0);
summary='<div style="margin-right:20px"><span style="color:var(--text-dim)">Opérations :</span><b style="color:var(--blue)">'+data.length+'</b></div>'
+'<div><span style="color:var(--text-dim)">Total dépensé :</span><b style="color:var(--red)">'+fcfa(totMt)+'</b></div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data};
}else if(type==='salaires'){
var data=salaires.filter(function(s){return s.date&&s.date>=debut&&s.date<=fin;});
headers=['Employé','Mois','Brut','Prime','Avance','Retenue','Net payé','Date','Mode'];
rows=data.map(function(s){return[s.emp,s.mois,fcfa(s.brut),fcfa(s.prime),fcfa(s.av),fcfa(s.ret),fcfa(s.net),fd(s.date),s.mode];});
var totNet=data.reduce(function(s,x){return s+x.net;},0);
summary='<div style="margin-right:20px"><span style="color:var(--text-dim)">Paiements :</span><b style="color:var(--blue)">'+data.length+'</b></div>'
+'<div><span style="color:var(--text-dim)">Total versé :</span><b style="color:var(--orange)">'+fcfa(totNet)+'</b></div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data};
}else if(type==='stocks_hist'){
var data=stocksLog.filter(function(l){
var d=l.dt?l.dt.split(' ')[0]:'';
if(d.indexOf('/')>=0){var p=d.split('/');d=p[2]+'-'+p[1]+'-'+p[0];}
return d>=debut&&d<=fin;
});
headers=['Date&Heure','Article','Mouvement','Quantité','Motif','Utilisateur'];
rows=data.map(function(l){
return[l.dt,l.art,l.qty>0?'➕ Entrée':'➖ Sortie',(l.qty>0?'+':'')+l.qty,l.motif||'—',l.usr||'—'];
});
var parArticle={};
data.forEach(function(l){
if(!parArticle[l.art])parArticle[l.art]={entrees:0,sorties:0};
if(l.qty>0)parArticle[l.art].entrees+=l.qty;
else parArticle[l.art].sorties+=Math.abs(l.qty);
});
var summaryItems=Object.keys(parArticle).map(function(a){
return'<div style="margin-right:16px"><b>'+a+'</b>:+'+parArticle[a].entrees+' /-'+parArticle[a].sorties+'</div>';
}).join('');
summary=summaryItems||'<div>Aucun mouvement</div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data,parArticle:parArticle};
}else if(type==='performance'){
genRapportPerformance(debut,fin);
return;
}else if(type==='morguier'){
var data=corps.filter(function(c){
return c.arr>=debut&&c.arr<=fin;
});
var parMorg={};
data.forEach(function(c){
var m=c.morguier||'Non spécifié';
if(!parMorg[m])parMorg[m]={count:0,corps:[],totalFormol:0};
parMorg[m].count++;
parMorg[m].totalFormol+=c.fml||0;
parMorg[m].corps.push(c);
});
var morgs=Object.keys(parMorg).sort(function(a,b){return parMorg[b].count-parMorg[a].count;});
headers=['Rang','Morguier de garde','Corps reçus','Formol utilisé (L)','% du total'];
var total=data.length||1;
rows=morgs.map(function(m,i){
var d=parMorg[m];
return[i+1,m,d.count,d.totalFormol.toFixed(1)+'L',Math.round(d.count/total*100)+'%'];
});
summary='<div style="margin-right:20px"><span style="color:var(--text-dim)">Total corps :</span><b style="color:var(--blue)">'+data.length+'</b></div>'
+'<div><span style="color:var(--text-dim)">Morguiers actifs :</span><b style="color:var(--or,#C8973A)">'+morgs.length+'</b></div>';
rpData={type:type,debut:debut,fin:fin,headers:headers,rows:rows,data:data};
}
sv('rp-resume-titre','📅 '+libType[type]+' du '+fd(debut)+' au '+fd(fin));
el('rp-resume-stats').innerHTML=summary;
el('rp-resume').style.display='block';
if(rows.length===0){
el('rp-result-wrap').style.display='none';
el('rp-empty').style.display='block';
return;
}
el('rp-empty').style.display='none';
sv('rp-count',rows.length+' résultat(s) trouvé(s)');
el('rp-thead').innerHTML='<tr>'+headers.map(function(h){return'<th>'+h+'</th>';}).join('')+'</tr>';
el('rp-tbody').innerHTML=rows.map(function(r){return'<tr>'+r.map(function(c){return'<td>'+c+'</td>';}).join('')+'</tr>';}).join('');
el('rp-result-wrap').style.display='block';
}
function exportPDFperiode(){
if(!rpData||rpData.rows.length===0){alert('Aucune donnée à exporter.');return;}
var libType={corps:'Corps enregistrés',conservation:'Corps en conservation',retires:'Corps retirés',factures:'Historique des factures',recettes:'Recettes',depenses:'Dépenses',salaires:'Salaires',stocks_hist:'Historique des stocks'};
var titre=(libType[rpData.type]||rpData.type)+(rpData.debut&&rpData.fin?' — '+fd(rpData.debut)+' au '+fd(rpData.fin):'');
var ligneTotal='';
if(rpData.type==='factures'){
var totFac=rpData.data.reduce(function(s,c){return s+calcF(c).total;},0);
var totPaye=rpData.data.reduce(function(s,c){return s+c.pmts.reduce(function(a,p){return a+p;},0);},0);
var totSolde=totFac-totPaye;
ligneTotal='<tr style="background:#0d1117;color:#fff;font-weight:700;font-size:12px;">'
+'<td colspan="5" style="padding:8px;color:#fff">TOTAUX</td>'
+'<td style="padding:8px;color:#fff">'+fcfa(totFac)+'</td>'
+'<td style="padding:8px;color:#4ade80">'+fcfa(totPaye)+'</td>'
+'<td style="padding:8px;color:'+(totSolde>0?'#fb923c':'#4ade80')+'">'+fcfa(totSolde)+'</td>'
+'<td></td></tr>';
}else if(rpData.type==='recettes'){
var totFac2=rpData.data.reduce(function(s,r){return s+r.fac;},0);
var totPaye2=rpData.data.reduce(function(s,r){return s+r.paye;},0);
var totSolde2=rpData.data.reduce(function(s,r){return s+r.solde;},0);
ligneTotal='<tr style="background:#0d1117;color:#fff;font-weight:700;font-size:12px;">'
+'<td colspan="4" style="padding:8px;color:#fff">TOTAUX</td>'
+'<td style="padding:8px;color:#fff">'+fcfa(totFac2)+'</td>'
+'<td></td>'
+'<td style="padding:8px;color:#4ade80">'+fcfa(totPaye2)+'</td>'
+'<td style="padding:8px;color:'+(totSolde2>0?'#fb923c':'#4ade80')+'">'+fcfa(totSolde2)+'</td>'
+'<td colspan="2"></td></tr>';
}else if(rpData.type==='depenses'){
var totDep=rpData.data.reduce(function(s,d){return s+d.mt;},0);
ligneTotal='<tr style="background:#0d1117;color:#fff;font-weight:700;font-size:12px;">'
+'<td colspan="3" style="padding:8px;color:#fff">TOTAL DÉPENSES</td>'
+'<td style="padding:8px;color:#fb923c">'+fcfa(totDep)+'</td>'
+'<td colspan="3"></td></tr>';
}else if(rpData.type==='stocks_hist'&&rpData.parArticle){
var articlesResume=Object.keys(rpData.parArticle).map(function(a){
var pa=rpData.parArticle[a];
return'<tr style="background:#f0f0f0;font-weight:600;">'
+'<td colspan="2" style="padding:6px 8px">📦 '+a+'</td>'
+'<td style="padding:6px 8px;color:green">Entrées :+'+pa.entrees+'</td>'
+'<td style="padding:6px 8px;color:red">Sorties :-'+pa.sorties+'</td>'
+'<td style="padding:6px 8px;font-weight:700">Net : '+(pa.entrees-pa.sorties)+'</td>'
+'<td></td></tr>';
}).join('');
ligneTotal=articlesResume;
}
var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+titre+'</title>'
+'<style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}'
+'.rp-header{display:flex;align-items:center;gap:12px;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:14px;}'
+'.rp-logo{width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;}'
+'.rp-etab{font-size:16px;font-weight:800;color:#111;}'
+'.rp-sub{font-size:10px;color:#666;margin-top:1px;}'
+'h2{font-size:13px;margin:10px 0 2px;color:#333;}'
+'table{width:100%;border-collapse:collapse;}th{background:#0d1117;color:#fff;padding:6px 8px;text-align:left;font-size:10px;}'
+'td{padding:5px 8px;border-bottom:1px solid #e0e0e0;font-size:11px;}tr:nth-child(even)td{background:#f9f9f9;}'
+'.footer{margin-top:16px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:6px;text-align:center}</style></head><body>'
+'<div class="rp-header">'
+(TARIFS.logo?'<img class="rp-logo" src="'+TARIFS.logo+'">':'')
+'<div><div class="rp-etab">'+(TARIFS.etab||'Mon établissement')+'</div>'
+(TARIFS.adresse||TARIFS.ville?'<div class="rp-sub">'+[TARIFS.adresse,TARIFS.ville].filter(Boolean).join(' · ')+'</div>':'')
+(TARIFS.tel?'<div class="rp-sub">Tél : '+TARIFS.tel+'</div>':'')
+'</div></div>'
+'<h2>'+titre+'</h2>'
+'<p style="color:#666;margin-bottom:14px;font-size:11px">Généré le '+now()+'</p>'
+'<table><thead><tr>'+rpData.headers.map(function(h){return'<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>'
+rpData.rows.map(function(r){return'<tr>'+r.map(function(c){return'<td>'+c+'</td>';}).join('')+'</tr>';}).join('')
+ligneTotal
+'</tbody></table>'
+'<div class="footer">'+(TARIFS.etab||'Mon établissement')+(TARIFS.tel?' — Tél : '+TARIFS.tel:'')+'</div>'
+'</body></html>';
var w=window.open('','_blank');
w.document.write(html);w.document.close();
setTimeout(function(){w.print();},400);
}
function exportCSVperiode(){
if(!rpData||rpData.rows.length===0){alert('Aucune donnée à exporter.');return;}
var libType={corps:'corps',conservation:'conservation',retires:'retires',factures:'factures',recettes:'recettes',depenses:'depenses',salaires:'salaires',stocks_hist:'stocks_historique'};
var csv='\uFEFF'+rpData.headers.join(';')+'\r\n';
rpData.rows.forEach(function(r){csv+=r.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"';}).join(';')+'\r\n';});
var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
var url=URL.createObjectURL(blob);
var a=document.createElement('a');
a.href=url;a.download='COLOMBE_'+(libType[rpData.type]||rpData.type)+(rpData.debut?'_'+rpData.debut+'_au_'+rpData.fin:'')+'.csv';
document.body.appendChild(a);a.click();
document.body.removeChild(a);URL.revokeObjectURL(url);
alert('✓ Fichier CSV téléchargé.\nOuvrez-le avec Excel ou Google Sheets.');
}
function exportPDF(type){
var titre,headers,rows;
if(type==='corps'){
titre='Rapport — Corps enregistrés';
headers=['N°','Nom','Prénoms','Arrivée','Jours','Formol','Statut','Judiciaire'];
rows=corps.map(function(c){var jl={non:'—',exo_cons:'Exo. cons.',gratuit:'Gratuit',partiel:'Partiel'};return[c.num,c.nom,c.pre,fd(c.arr),jC(c.arr,c.dateRet)+'j',c.fml+'L',c.st,jl[c.justice||'non']];});
}else if(type==='conservation'){
titre='Rapport — Corps en conservation actuellement';
headers=['N°','Nom','Prénoms','Arrivée','Jours','Échéance','Reste à payer','Judiciaire'];
var data=corps.filter(function(c){return c.st==='Conservé';});
rows=data.map(function(c){var f=calcF(c),paye=c.pmts.reduce(function(s,p){return s+p;},0),solde=f.total-paye;var jl={non:'—',exo_cons:'Exo. cons.',gratuit:'Gratuit',partiel:'Partiel'};return[c.num,c.nom,c.pre,fd(c.arr),jC(c.arr,c.dateRet)+'j',fd(ech(c.arr)),fcfa(solde),jl[c.justice||'non']];});
}else if(type==='retires'){
titre='Rapport — Corps retirés';
headers=['N°','Nom','Prénoms','Arrivée','Jours conservés','Déposant','Téléphone'];
var data=corps.filter(function(c){return c.st==='Retiré';});
rows=data.map(function(c){return[c.num,c.nom,c.pre,fd(c.arr),jC(c.arr,c.dateRet)+'j',c.dep?c.dep.nom:'—',c.dep?c.dep.tel||'—':'—'];});
}else if(type==='recettes'){
titre='Rapport — Recettes';
headers=['N° Reçu','Défunt','Arrivée','Retrait','Facturé','Payé','Solde','Formol (L)','Cas du corps'];
rows=recettes.map(function(r){var jl={non:'Cas normal',exo_cons:'Exo. conservation',gratuit:'Cas social / gratuit',partiel:'Cas social / partiel',sous_justice:'Sous main de justice'};return[r.num,r.def,fd(r.arr),fd(r.ret),fcfa(r.fac),fcfa(r.paye),fcfa(r.solde),(r.fml!==undefined?r.fml:'—'),jl[r.justice||'non']||'Cas normal'];});
}else if(type==='depenses'){
titre='Rapport — Dépenses';
headers=['N°','Date','Montant','Bénéficiaire','Tél. bénéficiaire','Motif','Mode'];
rows=depenses.map(function(d){return[d.num,fd(d.date),fcfa(d.mt),d.benef,d.benefTel||'—',d.motif,d.mode];});
}else{
titre='Rapport — Salaires';
headers=['Employé','Mois','Brut','Prime','Avance','Retenue','Net payé','Date'];
rows=salaires.map(function(s){return[s.emp,s.mois,fcfa(s.brut),fcfa(s.prime),fcfa(s.av),fcfa(s.ret),fcfa(s.net),fd(s.date)];});
}
var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+titre+'</title>'
+'<style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;color:#111;}'
+'.rp-header{display:flex;align-items:center;gap:12px;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:14px;}'
+'.rp-logo{width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;}'
+'.rp-etab{font-size:16px;font-weight:800;color:#111;}'
+'.rp-sub{font-size:10px;color:#666;margin-top:1px;}'
+'h2{font-size:14px;margin:10px 0 4px;}'
+'table{width:100%;border-collapse:collapse;}th{background:#0d1117;color:#fff;padding:7px 10px;text-align:left;font-size:11px;}'
+'td{padding:6px 10px;border-bottom:1px solid #ddd;font-size:11px;}tr:nth-child(even)td{background:#f9f9f9;}'
+'.footer{margin-top:20px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:8px;text-align:center}'
+'</style></head><body>'
+'<div class="rp-header">'
+(TARIFS.logo?'<img class="rp-logo" src="'+TARIFS.logo+'">':'')
+'<div><div class="rp-etab">'+(TARIFS.etab||'Mon établissement')+'</div>'
+(TARIFS.adresse||TARIFS.ville?'<div class="rp-sub">'+[TARIFS.adresse,TARIFS.ville].filter(Boolean).join(' · ')+'</div>':'')
+(TARIFS.tel?'<div class="rp-sub">Tél : '+TARIFS.tel+'</div>':'')
+'</div></div>'
+'<h2>'+titre+'</h2>'
+'<p style="color:#666;margin-bottom:16px;font-size:11px">Généré le '+now()+'</p>'
+'<table><thead><tr>'+headers.map(function(h){return'<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>';
if(rows.length===0){
html+='<tr><td colspan="'+headers.length+'" style="text-align:center;color:#999;padding:20px;">Aucune donnée</td></tr>';
}else{
rows.forEach(function(r){html+='<tr>'+r.map(function(c){return'<td>'+c+'</td>';}).join('')+'</tr>';});
}
html+='</tbody></table><div class="footer">'+(TARIFS.etab||'Mon établissement')+(TARIFS.tel?' — Tél : '+TARIFS.tel:'')+'</div></body></html>';
var w=window.open('','_blank');
w.document.write(html);
w.document.close();
setTimeout(function(){w.print();},400);
}
function exportCSV(type){
var titre,headers,rows;
if(type==='corps'){
titre='corps';headers=['N°','Nom','Prénoms','Sexe','Age','Arrivée','Jours','Formol(L)','Statut','Judiciaire','Déposant','Tel Déposant'];
rows=corps.map(function(c){var jl={non:'—',exo_cons:'Exo. cons.',gratuit:'Gratuit',partiel:'Partiel'};return[c.num,c.nom,c.pre,c.sx,c.age,c.arr,jC(c.arr,c.dateRet),c.fml,c.st,jl[c.justice||'non'],c.dep?c.dep.nom:'',c.dep?c.dep.tel:''];});
}else if(type==='conservation'){
titre='conservation';headers=['N°','Nom','Prénoms','Sexe','Age','Arrivée','Jours','Échéance','Reste à payer(F)','Judiciaire','Déposant','Tel'];
var data=corps.filter(function(c){return c.st==='Conservé';});
rows=data.map(function(c){var f=calcF(c),paye=c.pmts.reduce(function(s,p){return s+p;},0),solde=f.total-paye;var jl={non:'—',exo_cons:'Exo. cons.',gratuit:'Gratuit',partiel:'Partiel'};return[c.num,c.nom,c.pre,c.sx,c.age,c.arr,jC(c.arr,c.dateRet),ech(c.arr),solde,jl[c.justice||'non'],c.dep?c.dep.nom:'',c.dep?c.dep.tel:''];});
}else if(type==='retires'){
titre='retires';headers=['N°','Nom','Prénoms','Sexe','Age','Arrivée','Jours conservés','Déposant','Tel'];
var data=corps.filter(function(c){return c.st==='Retiré';});
rows=data.map(function(c){return[c.num,c.nom,c.pre,c.sx,c.age,c.arr,jC(c.arr,c.dateRet),c.dep?c.dep.nom:'',c.dep?c.dep.tel:''];});
}else if(type==='recettes'){
titre='recettes';headers=['N° Reçu','Défunt','Arrivée','Retrait','Facturé','Réduction','Payé','Solde','Formol (L)','Cas du corps'];
rows=recettes.map(function(r){var jl={non:'Cas normal',exo_cons:'Exo. conservation',gratuit:'Cas social / gratuit',partiel:'Cas social / partiel',sous_justice:'Sous main de justice'};return[r.num,r.def,r.arr,r.ret,r.fac,r.red,r.paye,r.solde,(r.fml!==undefined?r.fml:''),jl[r.justice||'non']||'Cas normal'];});
}else if(type==='depenses'){
titre='depenses';headers=['N°','Date','Montant','Bénéficiaire','Tél. bénéficiaire','Motif','Mode'];
rows=depenses.map(function(d){return[d.num,d.date,d.mt,d.benef,d.benefTel||'—',d.motif,d.mode];});
}else{
titre='salaires';headers=['Employé','Mois','Brut','Prime','Avance','Retenue','Net','Date','Mode'];
rows=salaires.map(function(s){return[s.emp,s.mois,s.brut,s.prime,s.av,s.ret,s.net,s.date,s.mode];});
}
var csv='\uFEFF';
csv+=headers.join(';')+'\r\n';
rows.forEach(function(r){csv+=r.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"';}).join(';')+'\r\n';});
var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
var url=URL.createObjectURL(blob);
var a=document.createElement('a');
a.href=url;a.download='COLOMBE_'+titre+'_'+today()+'.csv';
document.body.appendChild(a);a.click();
document.body.removeChild(a);URL.revokeObjectURL(url);
alert('✓ Fichier '+titre+'.csv téléchargé.\nOuvrez-le avec Excel ou Google Sheets.');
}
var ACTIONS_NOTIFIABLES=['Enregistrement corps','Retrait corps','Paiement','Dépense','Entrée stock','Création utilisateur','Modification tarifs'];
var notifications=[];
function addLog(act,det){
journal.unshift({dt:now(),usr:CU?CU.nom:'—',act:act,det:det});
if(ACTIONS_NOTIFIABLES.indexOf(act)>=0){
notifications.unshift({dt:now(),usr:CU?CU.nom:'—',role:CU?CU.role:'',act:act,det:det,lu:false});
if(notifications.length>200)notifications.length=200;
updateBadgeNotifs();
}
}
function updateBadgeNotifs(){
var nonLues=notifications.filter(function(n){return!n.lu;}).length;
var b=el('badge-notifs');
if(b){
if(nonLues>0){b.textContent=nonLues>99?'99+':nonLues;b.style.display='flex';}
else{b.style.display='none';}
}
}
function toggleNotifPanel(){
var p=el('notif-panel');
var ov=el('notif-overlay');
if(p.style.display==='block'){
p.style.display='none';
if(ov)ov.style.display='none';
return;
}
p.style.display='block';
if(ov)ov.style.display='block';
rdNotifPanel();
}
function rdNotifPanel(){
var icones={'Enregistrement corps':'📋','Retrait corps':'🚪','Paiement':'💳','Dépense':'💸','Entrée stock':'📦','Création utilisateur':'🔑','Modification tarifs':'⚙️'};
el('notif-list').innerHTML=notifications.length?notifications.slice(0,50).map(function(n,i){
return'<div onclick="marquerNotifLue('+i+')" style="display:flex;gap:10px;padding:10px;border-radius:8px;cursor:pointer;background:'+(n.lu?'transparent':'rgba(59,130,246,.08)')+';margin-bottom:2px">'
+'<div style="font-size:18px;flex-shrink:0">'+(icones[n.act]||'🔔')+'</div>'
+'<div style="flex:1;min-width:0">'
+'<div style="font-size:12px;font-weight:600;color:var(--white)">'+n.act+(n.lu?'':'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--blue)"></span>')+'</div>'
+'<div style="font-size:11px;color:var(--text-dim);margin-top:1px">'+(n.det||'')+'</div>'
+'<div style="font-size:10px;color:var(--muted);margin-top:3px">'+n.usr+' · '+n.dt+'</div>'
+'</div></div>';
}).join(''):'<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:12px">Aucune notification</div>';
}
function marquerNotifLue(i){
if(notifications[i]){notifications[i].lu=true;updateBadgeNotifs();rdNotifPanel();sauvegarder();}
}
function marquerToutesNotifsLues(){
notifications.forEach(function(n){n.lu=true;});
updateBadgeNotifs();rdNotifPanel();sauvegarder();
}
function rdJnl(){
el('tbl-jnl').innerHTML=journal.length?journal.map(function(j){
return'<tr><td class="mono" style="font-size:11px;white-space:nowrap">'+j.dt+'</td><td>'+j.usr+'</td><td><span class="badge badge-blue">'+j.act+'</span></td><td style="color:var(--text-dim);font-size:11px">'+j.det+'</td></tr>';
}).join(''):'<tr><td colspan="4" class="empty-state">Aucune activité</td></tr>';
}
async function rdUsr(){
var r=await sb.from('profils').select('*').order('created_at');
if(r.error){console.warn(r.error);return;}
USERS_LIST=r.data;
el('tbl-usr').innerHTML=USERS_LIST.map(function(u){
var exp=pwExpired(u);
return'<tr><td class="mono">'+u.login+'</td><td>'+u.nom+'</td>'
+'<td><span class="badge '+(u.role==='Promoteur'?'badge-purple':u.role==='Gérant'?'badge-blue':'badge-muted')+'">'+u.role+'</span></td>'
+'<td style="font-size:11px;color:var(--text-dim)">'+(u.derniere_connexion?fd(u.derniere_connexion):'Jamais')+'</td>'
+'<td><span class="badge '+(u.actif?'badge-green':'badge-muted')+'">'+(u.actif?'Actif':'Inactif')+'</span>'
+(exp?'<span class="badge badge-orange">Mdp expiré</span>':'')+'</td>'
+'<td style="white-space:nowrap"><button class="btn btn-sm" onclick="resetPw(\''+u.id+'\',\''+u.login+'\')">Réinit. mdp</button><button class="btn btn-sm" onclick="togU(\''+u.id+'\','+u.actif+',\''+u.login+'\')">'+(u.actif?'Désactiver':'Réactiver')+'</button></td></tr>';
}).join('');
}
async function creerUser(){
var nom=v('u-nom').trim(),login=v('u-login').trim(),pass=v('u-pass'),role=v('u-role');
if(!nom||!login||!pass){alert('Remplissez tous les champs.');return;}
if(pass.length<4){alert('Le mot de passe doit contenir au moins 4 caractères.');return;}
var res=await sb.rpc('creer_utilisateur',{p_login:login,p_nom:nom,p_role:role,p_mdp:pass});
if(res.error){alert('Erreur : '+res.error.message);return;}
addLog('Création utilisateur',login+' ('+role+')');closeModal('modal-user');rdUsr();alert('✓ Utilisateur créé.');
}
async function togU(id,actif,login){
var res=await sb.from('profils').update({actif:!actif}).eq('id',id);
if(res.error){alert('Erreur : '+res.error.message);return;}
addLog('Modif utilisateur',login);rdUsr();
}
async function resetPw(id,login){
var p=prompt('Nouveau mot de passe pour '+login+' :');
if(!p||!p.trim())return;
if(p.trim().length<4){alert('Le mot de passe doit contenir au moins 4 caractères.');return;}
var res=await sb.rpc('reinitialiser_mdp',{p_user_id:id,p_nouveau_mdp:p.trim()});
if(res.error){alert('Erreur : '+res.error.message);return;}
addLog('Réinit. mdp',login);rdUsr();alert('✓ Mot de passe mis à jour.');
}
function saveTarifs(){
TARIFS.j1=parseInt(v('tar-j1'))||2000;TARIFS.j11=parseInt(v('tar-j11'))||2500;
TARIFS.nec=parseInt(v('tar-nec'))||25000;TARIFS.fml=parseInt(v('tar-fml'))||4000;
TARIFS.inj=parseInt(v('tar-inj'))||1500;TARIFS.cpl=parseInt(v('tar-cpl'))||11000;
addLog('Modification tarifs','');
sauvegarder();
alert('✓ Tarifs enregistrés.\n💾 Sauvegardé.');
}
function saveIdentite(){
TARIFS.etab=v('tar-etab').trim();
TARIFS.adresse=v('tar-adresse').trim();
TARIFS.ville=v('tar-ville').trim();
TARIFS.tel=v('tar-tel').trim();
applyIdentite();
addLog('Modification identité établissement','');
sauvegarder();
alert('✓ Identité de l\'établissement enregistrée.\n💾 Sauvegardé.');
}
function applyIdentite(){
var nom=TARIFS.etab||(CU?CU.nom:'')||'Mon établissement';
var ville=TARIFS.ville||'';
sv('sidebar-etab-nom',nom);
sv('sidebar-etab-ville',ville||'—');
if(el('tar-etab'))el('tar-etab').value=TARIFS.etab||'';
if(el('tar-adresse'))el('tar-adresse').value=TARIFS.adresse||'';
if(el('tar-ville'))el('tar-ville').value=TARIFS.ville||'';
if(el('tar-tel'))el('tar-tel').value=TARIFS.tel||'';
var logoHtml=TARIFS.logo?'<img src="'+TARIFS.logo+'" style="width:100%;height:100%;object-fit:cover">':'🏢';
var sideLogo=el('sidebar-logo-img');
if(sideLogo)sideLogo.innerHTML=logoHtml;
var preview=el('logo-preview');
if(preview)preview.innerHTML=logoHtml;
var removeBtn=el('logo-remove-btn');
if(removeBtn)removeBtn.style.display=TARIFS.logo?'block':'none';
}
function onLogoFileSelected(input){
var file=input.files&&input.files[0];
if(!file)return;
if(!file.type.startsWith('image/')){alert('Veuillez choisir un fichier image.');return;}
compressImage(file,300,0.8,function(dataUrl){
TARIFS.logo=dataUrl;
applyIdentite();
addLog('Modification logo établissement','');
sauvegarder();
alert('✓ Logo mis à jour.\n💾 Sauvegardé.');
});
input.value='';
}
function removeLogo(){
if(!confirm('Retirer le logo actuel ?'))return;
TARIFS.logo=null;
applyIdentite();
addLog('Suppression logo établissement','');
sauvegarder();
}
async function toutAZero(){
if(!confirm('⚠️ REMETTRE TOUT À ZÉRO\n\nCette action supprimera DÉFINITIVEMENT :\n• Tous les corps enregistrés\n• Toutes les factures\n• Toutes les recettes\n• Toutes les dépenses\n• Tous les salaires\n• Tout le journal d\'activités\n• Les quantités de stocks (remises à 0)\n\nLes utilisateurs et tarifs seront conservés.\n\nConfirmer ?'))return;
if(!confirm('⚠️ DERNIÈRE CONFIRMATION\n\nToutes les données seront effacées.\nCette action est IRRÉVERSIBLE.\n\nRemettre à zéro maintenant ?'))return;
corps=[];recettes=[];depenses=[];salaires=[];
journal=[{dt:now(),act:'Remise à zéro',det:'Effectuée par '+(CU?CU.nom:'—'),usr:CU?CU.nom:'—'}];
stocksLog=[];
corpsN=1;depN=1;selC=null;
PHOTO_DATA={};
stocks.forEach(function(s){s.q=0;});
try{localStorage.removeItem(LS_KEY);}catch(e){}
var donnees={
corps:[],
recettes:[],
depenses:[],
salaires:[],
personnel:personnel,
stocks:stocks,
stocksLog:[],
journal:journal,
corpsN:1,
depN:1,
tarifs:TARIFS,
savedAt:new Date().toISOString()
};
try{
var res=await sb.from('app_data').upsert({
organisation_id:ORG_ID,
donnees:donnees,
updated_by:CU?CU.id:null
});
if(res.error){
alert('⚠️ Erreur lors de la sauvegarde cloud : '+res.error.message+'\n\nLes données locales ont été effacées mais le cloud n\'a pas pu être mis à jour. Reconnectez-vous pour forcer la synchronisation.');
}else{
DERNIERE_SAUVEGARDE_TS=Date.now();
DERNIER_CLOUD_TS=Date.now();
var verif=await chargerCloud();
if(verif.ok){
DERNIER_CLOUD_TS=verif.ts;
}
}
}catch(e){
console.warn('Erreur sauvegarde zéro:',e);
alert('⚠️ Erreur réseau. Les données locales ont été effacées mais la synchronisation cloud a échoué.');
}
el('fact-panel').style.display='none';
el('fact-ph').style.display='block';
var pages=['dashboard','corps','retrait','facturation','recettes','depenses','stocks','personnel','salaires','journal','utilisateurs','rapports'];
pages.forEach(function(p){rp(p);});
genNum();
alert('✓ Toutes les données ont été remises à zéro avec succès,et confirmées dans le cloud.');
}
function openModal(id){
el(id).style.display='flex';
if(id==='modal-corps'){genNum();el('c-date').value=today();el('c-heure').value=new Date().toTimeString().slice(0,5);el('fml-warn').textContent='';
var selMorg=el('c-morguier');
if(selMorg){
selMorg.innerHTML='<option value="">— Sélectionner le morguier de garde —</option>';
if(CU){selMorg.innerHTML+='<option value="'+CU.nom+'" selected>'+CU.nom+' (connecté)</option>';}
personnel.filter(function(p){return p.actif&&(!CU||p.nom!==CU.nom);}).forEach(function(p){
selMorg.innerHTML+='<option value="'+p.nom+'">'+p.nom+'</option>';
});
}
['c-nom','c-prenoms','c-age','c-provenance','c-cause','c-constat','c-obs','d-nom','d-prenoms','d-prof','d-piece-num','d-adresse','d-tel'].forEach(function(id){var e=el(id);if(e)e.value='';});
resetPhotoField('c-photo-piece');
}
if(id==='modal-depense'){el('dep-date').value=today();['dep-mt','dep-benef','dep-benef-tel','dep-motif','dep-num'].forEach(function(i){var e=el(i);if(e)e.value='';});}
if(id==='modal-salaire'){el('sal-date').value=today();el('sal-mois').value=today().slice(0,7);sv('sal-net','—');
['sal-prime','sal-av','sal-ret'].forEach(function(i){var e=el(i);if(e)e.value='0';});
el('sal-emp').value='';if(el('sal-brut'))el('sal-brut').value='';
}
if(id==='modal-employe'){['emp-nom','emp-pre','emp-tel','emp-adr','emp-fn','emp-sal'].forEach(function(i){var e=el(i);if(e)e.value='';});}
if(id==='modal-user'){['u-nom','u-login','u-pass'].forEach(function(i){var e=el(i);if(e)e.value='';});}
if(id==='modal-stock'){['st-qty','st-unit','st-fourn','st-cout'].forEach(function(i){var e=el(i);if(e)e.value='';});}
}
function closeModal(id){el(id).style.display='none';}
function overlayClose(e,id){if(e.target===el(id))closeModal(id);}
function filterT(input,tid){
var q=input.value.toLowerCase();
document.querySelectorAll('#'+tid+' tr').forEach(function(tr){tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none';});
}
function startClock(){
setInterval(function(){
var d=new Date();
el('clock').textContent=d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
},1000);
}
function initAdmin(){
document.body.innerHTML=`
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{height:auto!important;overflow:auto!important;overflow-x:hidden;}
body{font-family:'IBM Plex Sans',sans-serif;background:#0d0d0d;color:#d4d0c8;font-size:clamp(12px,2vw,15px);}
#adm-login{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0d0d0d;z-index:100;padding:16px;overflow-y:auto;}
.adm-card{background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:clamp(24px,4vw,40px) clamp(16px,4vw,32px);width:100%;max-width:400px;text-align:center;}
.adm-card h1{font-size:clamp(16px,3vw,22px);font-weight:700;color:#f7f4ee;margin-bottom:6px;}
.adm-card p{font-size:clamp(11px,1.5vw,13px);color:#8b8b8b;margin-bottom:20px;}
.adm-field{margin-bottom:12px;text-align:left;}
.adm-field label{display:block;font-size:11px;color:#8b8b8b;margin-bottom:5px;font-weight:500;}
.adm-field input{width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:10px 12px;color:#f7f4ee;font-size:14px;outline:none;}
.adm-field input:focus{border-color:#C8973A;}
.btn-adm-gold{width:100%;background:#C8973A;color:#0d0d0d;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:8px;}
.adm-error{color:#f85149;font-size:12px;margin-top:8px;display:none;}
#adm-dashboard{display:none;}
.adm-topbar{background:#111;border-bottom:1px solid #2a2a2a;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}
.adm-topbar h2{font-size:clamp(13px,2vw,16px);font-weight:700;color:#f7f4ee;}
.adm-topbar h2 span{color:#C8973A;}
.btn-adm-logout{background:none;border:1px solid #2a2a2a;border-radius:6px;padding:5px 12px;color:#8b8b8b;font-size:11px;cursor:pointer;}
.adm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#2a2a2a;border-bottom:1px solid #2a2a2a;}
.adm-stat{background:#111;padding:clamp(8px,2vw,16px) 8px;text-align:center;}
.adm-stat-num{font-size:clamp(16px,3vw,22px);font-weight:700;color:#C8973A;}
.adm-stat-lbl{font-size:clamp(8px,1.2vw,10px);color:#8b8b8b;text-transform:uppercase;margin-top:3px;}
.adm-content{padding:clamp(10px,2vw,20px);}
.adm-section-title{font-size:11px;font-weight:600;color:#8b8b8b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
.adm-list{display:flex;flex-direction:column;gap:10px;padding-bottom:24px;}
.adm-struct{background:#111;border:1px solid #2a2a2a;border-radius:10px;padding:clamp(10px,2vw,14px);}
.adm-struct.essai{border-color:rgba(200,151,58,.3);}
.adm-struct.actif{border-color:rgba(63,185,80,.3);}
.adm-struct.expire{border-color:rgba(248,81,73,.3);}
.adm-struct-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;}
.adm-struct-name{font-size:clamp(13px,2vw,15px);font-weight:600;color:#f7f4ee;}
.adm-badge{font-size:9px;font-weight:600;padding:3px 7px;border-radius:20px;text-transform:uppercase;white-space:nowrap;}
.adm-badge.essai{background:rgba(200,151,58,.15);color:#C8973A;}
.adm-badge.actif{background:rgba(63,185,80,.15);color:#3fb950;}
.adm-badge.expire{background:rgba(248,81,73,.15);color:#f85149;}
.adm-meta{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px;}
.adm-meta-item{font-size:clamp(10px,1.5vw,12px);color:#8b8b8b;line-height:1.4;}
.adm-meta-item span{color:#d4d0c8;font-weight:500;}
.adm-actions{display:flex;gap:6px;flex-wrap:wrap;}
.btn-adm{font-size:clamp(11px,1.5vw,12px);padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;border:none;white-space:nowrap;}
.btn-adm-mensuel{background:rgba(200,151,58,.15);color:#C8973A;border:1px solid rgba(200,151,58,.3);}
.btn-adm-annuel{background:rgba(200,151,58,.25);color:#C8973A;border:1px solid rgba(200,151,58,.4);}
.btn-adm-desact{background:rgba(248,81,73,.1);color:#f85149;border:1px solid rgba(248,81,73,.2);}
.btn-adm-wa{background:#25D366;color:#fff;}
.btn-adm-refresh{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;padding:7px 14px;color:#d4d0c8;font-size:12px;cursor:pointer;margin-bottom:12px;}
.adm-loading{text-align:center;padding:30px;color:#8b8b8b;}
@media(min-width:600px){.adm-meta{grid-template-columns:repeat(3,1fr);}}
@media(min-width:900px){.adm-list{display:grid;grid-template-columns:repeat(2,1fr);}.adm-meta{grid-template-columns:repeat(2,1fr);}}
</style>
<div id="adm-login">
<div class="adm-card">
<div style="font-size:32px;margin-bottom:12px">🔐</div>
<h1>Admin</h1>
<p>Tableau de bord Gestion Funéraire</p>
<div class="adm-field">
<label>Mot de passe</label>
<input type="password" id="adm-pass" placeholder="Mot de passe admin" onkeydown="if(event.key==='Enter')admLogin()">
</div>
<button class="btn-adm-gold" onclick="admLogin()">Accéder →</button>
<div class="adm-error" id="adm-err">Mot de passe incorrect.</div>
</div>
</div>
<div id="adm-dashboard">
<div class="adm-topbar">
<h2>⚙️ Admin<span>Gestion Funéraire</span></h2>
<button class="btn-adm-logout" onclick="window.location.href=window.location.pathname">Quitter</button>
</div>
<div class="adm-stats">
<div class="adm-stat"><div class="adm-stat-num" id="adm-total">—</div><div class="adm-stat-lbl">Structures</div></div>
<div class="adm-stat"><div class="adm-stat-num" id="adm-essai" style="color:#C8973A">—</div><div class="adm-stat-lbl">Essai</div></div>
<div class="adm-stat"><div class="adm-stat-num" id="adm-actif" style="color:#3fb950">—</div><div class="adm-stat-lbl">Abonnés</div></div>
<div class="adm-stat"><div class="adm-stat-num" id="adm-expire" style="color:#f85149">—</div><div class="adm-stat-lbl">Expirés</div></div>
</div>
<div class="adm-content">
<button class="btn-adm-refresh" onclick="admCharger()">🔄 Actualiser</button>
<div class="adm-section-title">Toutes les structures</div>
<div class="adm-list" id="adm-list"><div class="adm-loading">Chargement...</div></div>
</div>
</div>
`;
document.documentElement.style.cssText='height:auto!important;overflow:auto!important;';
document.body.style.cssText='height:auto!important;overflow:auto!important;overflow-x:hidden!important;';
window.admLogin=function(){
var pass=document.getElementById('adm-pass').value;
if(pass==='C@sadepape1&B@s!le'){
document.getElementById('adm-login').style.display='none';
document.getElementById('adm-dashboard').style.display='block';
admCharger();
}else{
document.getElementById('adm-err').style.display='block';
}
};
window.admStatut=function(org){
if(org.abonnement_actif) return 'actif';
var debut=new Date(org.date_essai_debut||org.created_at);
var jours=Math.floor((Date.now()-debut.getTime())/(1000*60*60*24));
return jours>15?'expire':'essai';
};
window.admJours=function(org){
var debut=new Date(org.date_essai_debut||org.created_at);
var jours=Math.floor((Date.now()-debut.getTime())/(1000*60*60*24));
return Math.max(0,15-jours);
};
window.admCharger=async function(){
var list=document.getElementById('adm-list');
list.innerHTML='<div class="adm-loading">Chargement...</div>';
var res=await sb.from('organisations').select('*').order('created_at',{ascending:false});
if(res.error){list.innerHTML='<div class="adm-loading">Erreur: '+res.error.message+'</div>';return;}
var orgs=res.data;
var dataRes=await sb.from('app_data').select('*');
var appData=dataRes.data||[];
var profRes=await sb.from('profils').select('organisation_id,nom,login').eq('role','Promoteur');
var profils=profRes.data||[];
var total=orgs.length,essai=0,actif=0,expire=0;
orgs.forEach(function(o){var s=admStatut(o);if(s==='essai')essai++;else if(s==='actif')actif++;else expire++;});
document.getElementById('adm-total').textContent=total;
document.getElementById('adm-essai').textContent=essai;
document.getElementById('adm-actif').textContent=actif;
document.getElementById('adm-expire').textContent=expire;
if(!orgs.length){list.innerHTML='<div class="adm-loading">Aucune structure</div>';return;}
list.innerHTML=orgs.map(function(org){
var statut=admStatut(org);
var joursR=admJours(org);
var wa=(appData.find(function(d){return d.organisation_id===org.id&&d.cle==='contact_whatsapp';})||{}).valeur||'';
var pays=(appData.find(function(d){return d.organisation_id===org.id&&d.cle==='pays';})||{}).valeur||'—';
var promo=(profils.find(function(p){return p.organisation_id===org.id;})||{});
var dateIns=new Date(org.created_at).toLocaleDateString('fr-FR');
var badgeLbl=statut==='actif'?'Abonné':statut==='essai'?'Essai ('+joursR+'j)':'Expiré';
var waNum=wa.replace(/[^0-9]/g,'');
var waMsg=encodeURIComponent('Bonjour,concernant votre abonnement Gestion Funéraire ('+org.nom+')...');
return '<div class="adm-struct '+statut+'">'+
'<div class="adm-struct-head"><div class="adm-struct-name">'+org.nom+'</div><span class="adm-badge '+statut+'">'+badgeLbl+'</span></div>'+
'<div class="adm-meta">'+
'<div class="adm-meta-item">📅 Inscrit :<span>'+dateIns+'</span></div>'+
'<div class="adm-meta-item">🌍 Pays :<span>'+pays+'</span></div>'+
'<div class="adm-meta-item">👤 Login :<span>'+(promo.login||'—')+'</span></div>'+
'<div class="adm-meta-item">📱 WhatsApp :<span>'+(wa||'—')+'</span></div>'+
'<div class="adm-meta-item">💳 Type :<span>'+(org.type_abonnement||'essai')+'</span></div>'+
'<div class="adm-meta-item">🔌 Structure :<span style="color:'+(org.actif!==false?'#3fb950':'#f85149')+'">'+(org.actif!==false?'Active':'Désactivée')+'</span></div>'+
'</div>'+
'<div class="adm-actions">'+
(statut!=='actif'?
'<button class="btn-adm btn-adm-mensuel" onclick="admActiver(\''+org.id+'\',\'mensuel\')">✓ Mensuel</button>'+
'<button class="btn-adm btn-adm-annuel" onclick="admActiver(\''+org.id+'\',\'annuel\')">✓ Annuel</button>'
:'')+
(org.actif!==false?
'<button class="btn-adm btn-adm-desact" onclick="admTogActif(\''+org.id+'\',false)">🔴 Désactiver</button>'
:'<button class="btn-adm" style="background:rgba(63,185,80,.15);color:#3fb950;border:1px solid rgba(63,185,80,.3)" onclick="admTogActif(\''+org.id+'\',true)">🟢 Activer</button>')+
(waNum?'<button class="btn-adm btn-adm-wa" onclick="window.open(\'https://wa.me/'+waNum+'?text='+waMsg+'\',\'_blank\')">💬 WhatsApp</button>':'')+
'</div></div>';
}).join('');
};
window.admActiver=async function(id,type){
var fin=new Date();
if(type==='mensuel') fin.setMonth(fin.getMonth()+1);
else fin.setFullYear(fin.getFullYear()+1);
await sb.from('organisations').update({abonnement_actif:true,type_abonnement:type,date_fin_abonnement:fin.toISOString()}).eq('id',id);
admCharger();
};
window.admDesact=async function(id){
if(!confirm('Désactiver cet abonnement ?')) return;
await sb.from('organisations').update({abonnement_actif:false,type_abonnement:'essai'}).eq('id',id);
admCharger();
};
window.admTogActif=async function(id,activer){
var msg=activer?'Réactiver cette structure ?':'Désactiver cette structure ? Elle ne pourra plus se connecter.';
if(!confirm(msg)) return;
await sb.from('organisations').update({actif:activer}).eq('id',id);
if(!activer){
await sb.from('organisations').update({abonnement_actif:false}).eq('id',id);
}
admCharger();
};
}
if(window.location.search==='?admin'){
document.addEventListener('DOMContentLoaded',function(){initAdmin();});
}