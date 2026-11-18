const DB_KEY="dmch_icu_cipher_v1", SALT_KEY="dmch_icu_salt_v1";
let cryptoKey=null, state={patients:[],reviews:[]};
const $=s=>document.querySelector(s);
const enc=new TextEncoder(), dec=new TextDecoder();
function b64(buf){return btoa(String.fromCharCode(...new Uint8Array(buf)))}
function unb64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function derive(password,salt){const base=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function encryptData(obj,key){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(JSON.stringify(obj)));return {iv:b64(iv),data:b64(ct)}}
async function decryptData(blob,key){const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(blob.iv)},key,unb64(blob.data));return JSON.parse(dec.decode(pt))}
function saveEncrypted(){return encryptData(state,cryptoKey).then(x=>localStorage.setItem(DB_KEY,JSON.stringify(x)))}
function setMessage(t){$("#lockMsg").textContent=t}
function showApp(){ $("#lock").classList.add("hidden");$("#app").classList.remove("hidden");renderAll(); }
async function initialize(){
 const stored=localStorage.getItem(DB_KEY), saltText=localStorage.getItem(SALT_KEY);
 if(!stored){$("#lock").classList.remove("hidden");$("#lock h2").textContent="Create your app password";$("#pass").placeholder="Create a strong password (8+ characters)";$("#unlockBtn").textContent="Create encrypted vault";setMessage("First use: create a password. Keep it safe; it cannot be recovered.");}
 else{$("#lock").classList.remove("hidden");$("#lock h2").textContent="Unlock your records";$("#pass").placeholder="Enter password";$("#unlockBtn").textContent="Unlock";}
}
$("#unlockBtn").onclick=async()=>{
 const p=$("#pass").value;if(p.length<8){setMessage("Password must be at least 8 characters.");return}
 try{
  let salt=localStorage.getItem(SALT_KEY);
  if(!localStorage.getItem(DB_KEY)){const s=crypto.getRandomValues(new Uint8Array(16));salt=b64(s);localStorage.setItem(SALT_KEY,salt);cryptoKey=await derive(p,s);await saveEncrypted();}
  else{cryptoKey=await derive(p,unb64(salt));state=await decryptData(JSON.parse(localStorage.getItem(DB_KEY)),cryptoKey);}
  $("#pass").value="";showApp();
 }catch(e){cryptoKey=null;setMessage("Could not unlock. Check your password. If this is a new browser, import your backup.");}
};
function activateTab(name){document.querySelectorAll(".view").forEach(x=>x.classList.add("hidden"));$("#"+name).classList.remove("hidden");document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===name));if(name==="followup")populatePatientSelect();if(name==="patients")renderPatients();if(name==="dashboard")renderDashboard();}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>activateTab(b.dataset.tab));
function formObj(form){return Object.fromEntries(new FormData(form).entries())}
function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random()}
async function persist(){await saveEncrypted();renderDashboard();renderPatients();renderReviews();}
$("#patientForm").onsubmit=async e=>{e.preventDefault();const p=formObj(e.target);p.id=id();p.created=new Date().toISOString();p.status="Active";state.patients.unshift(p);e.target.reset();await persist();alert("Patient record saved on this device.");};
function renderPatients(){const q=($("#patientSearch")?.value||"").toLowerCase(),icu=$("#icuFilter")?.value||"";const list=state.patients.filter(p=>(!icu||p.icu===icu)&&(`${p.name} ${p.uhid} ${p.bed}`.toLowerCase().includes(q)));$("#patientList").innerHTML=list.length?list.map(p=>`<div class="patient"><div><strong>${esc(p.name)}</strong><span class="muted">${esc(p.uhid||"No UHID")} · ${esc(p.icu)} · Bed ${esc(p.bed||"—")}</span></div><div class="actions"><button class="secondary" onclick="newReview('${p.id}')">Follow-up</button><button class="secondary" onclick="printPatient('${p.id}')">Print file</button><button class="danger" onclick="dischargePatient('${p.id}')">Discharge</button></div></div>`).join(""):"<p class='muted'>No matching patients.</p>";}
$("#patientSearch").oninput=renderPatients;$("#icuFilter").onchange=renderPatients;
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderDashboard(){$("#totalPatients").textContent=state.patients.length;$("#activePatients").textContent=state.patients.filter(p=>p.status==="Active").length;$("#totalReviews").textContent=state.reviews.length;$("#recentList").innerHTML=state.patients.slice(0,6).map(p=>`<div class="patient"><div><strong>${esc(p.name)}</strong><span class="muted">${esc(p.icu)} · ${esc(p.uhid||"No UHID")}</span></div><span class="pill">${esc(p.status)}</span></div>`).join("")||"No patients added yet.";}
function populatePatientSelect(){const s=$("#reviewPatient");const old=s.value;s.innerHTML='<option value="">Select patient</option>'+state.patients.filter(p=>p.status==="Active").map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.icu)} / ${esc(p.bed||"")}</option>`).join("");if(old)s.value=old;}
window.newReview=(pid)=>{activateTab("followup");$("#reviewPatient").value=pid;};
function recalc(){const f=$("#reviewForm");const v=n=>Number(f.elements[n].value||0);const g=["e","v","m"].every(n=>f.elements[n].value)?v("e")+v("v")+v("m"):"";f.elements.gcs.value=g;const bal=f.elements.intake.value!==""?v("intake")-v("urine")-v("otherOutput"):"";f.elements.balance.value=bal;}
["e","v","m","intake","urine","otherOutput"].forEach(n=>$("#reviewForm").elements[n].addEventListener("input",recalc));
$("#reviewForm").elements.datetime.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
$("#reviewForm").onsubmit=async e=>{e.preventDefault();const r=formObj(e.target);r.id=id();r.created=new Date().toISOString();state.reviews.unshift(r);await persist();e.target.reset();$("#reviewForm").elements.datetime.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);populatePatientSelect();alert("Follow-up saved.");};
function renderReviews(){const pid=$("#reviewPatient")?.value;if(!pid){$("#reviewList").innerHTML="Select a patient to view records.";return}const rows=state.reviews.filter(r=>r.patientId===pid);$("#reviewList").innerHTML=rows.length?rows.map(r=>`<div class="patient"><div><strong>${esc(r.datetime)}</strong><span class="muted">GCS ${esc(r.gcs||"—")} · BP ${esc(r.bp||"—")} · SpO₂ ${esc(r.spo2||"—")}</span></div><button class="secondary" onclick="printReview('${r.id}')">Print</button></div>`).join(""):"No follow-ups for this patient."; }
$("#reviewPatient").onchange=renderReviews;
function patientById(pid){return state.patients.find(p=>p.id===pid)}
function row(k,v){return `<tr><th>${esc(k)}</th><td>${esc(v||"—")}</td></tr>`}
function reviewHTML(r,p){return `<h2>DMCH ICU CARE — DAILY FOLLOW-UP</h2><p><b>Patient:</b> ${esc(p.name)} &nbsp; <b>UHID:</b> ${esc(p.uhid||"—")} &nbsp; <b>ICU:</b> ${esc(p.icu)} &nbsp; <b>Bed:</b> ${esc(p.bed||"—")}</p><table>${Object.entries({Date:r.datetime,"ICU day":r.icuDay,"Diagnosis":p.diagnosis,"GCS (E/V/M/Total)":`${r.e||"—"}/${r.v||"—"}/${r.m||"—"}/${r.gcs||"—"}`,"Pupil size":r.pupilSize,"Pupil reaction":r.pupilReaction,"Plantar":r.plantar,"BP":r.bp,"Pulse":r.pulse,"MAP":r.map,"Vasopressor":r.vasopressor,"SpO₂":r.spo2,"RR":r.rr,"O₂ support":r.oxygen,"Ventilator":`${r.ventMode||""} FiO₂ ${r.fio2||"—"}% PEEP ${r.peep||"—"} Vt ${r.vt||"—"} RR ${r.ventRR||"—"}`,"Chest":r.chest,"Temperature":r.temp,"RBS":r.rbs,"Intake":r.intake,"Urine output":r.urine,"Other output":r.otherOutput,"Fluid balance":r.balance,"Abdomen / bowel sounds":r.abdomen,"Tenderness":r.tenderness,"Other problems":r.problems,"Investigations":r.investigations,"Assessment":r.assessment,"Doctor's plan":r.plan,"Next review":r.nextReview,"Doctor":r.doctor}).map(([k,v])=>row(k,v)).join("")}</table><div class="signature"><span>Doctor's signature: __________________</span><span>Date: ______________</span></div>`}
window.printReview=(rid)=>{const r=state.reviews.find(x=>x.id===rid),p=patientById(r.patientId);$("#printArea").innerHTML=reviewHTML(r,p);$("#printArea").classList.remove("hidden");window.print();$("#printArea").classList.add("hidden");};
window.printPatient=(pid)=>{const p=patientById(pid),rs=state.reviews.filter(r=>r.patientId===pid);$("#printArea").innerHTML=`<h2>DMCH ICU CARE — PATIENT FILE</h2><p><b>${esc(p.name)}</b> · ${esc(p.uhid||"")} · ${esc(p.icu)} · Bed ${esc(p.bed||"")}</p><p>Age: ${esc(p.age)} · Sex: ${esc(p.sex)} · Admission: ${esc(p.admission)} · Diagnosis: ${esc(p.diagnosis)}</p><p>History: ${esc(p.history)}</p>${rs.map(r=>reviewHTML(r,p)).join("<hr>")}`;$("#printArea").classList.remove("hidden");window.print();$("#printArea").classList.add("hidden");};
window.dischargePatient=async pid=>{if(!confirm("Mark this patient as discharged? The record will be retained."))return;const p=patientById(pid);p.status="Discharged";await persist();};
$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({format:"DMCHICU1",salt:localStorage.getItem(SALT_KEY),cipher:JSON.parse(localStorage.getItem(DB_KEY))})],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="DMCH-ICU-encrypted-backup.json";a.click();URL.revokeObjectURL(a.href);};
$("#importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(obj.format!=="DMCHICU1")throw Error();const p=prompt("Enter the password used for this backup");const key=await derive(p,unb64(obj.salt));const restored=await decryptData(obj.cipher,key);if(!confirm("Replace current local records with backup?"))return;localStorage.setItem(SALT_KEY,obj.salt);localStorage.setItem(DB_KEY,JSON.stringify(obj.cipher));cryptoKey=key;state=restored;renderAll();alert("Backup restored.");}catch(err){alert("Backup could not be imported. Check file and password.");}e.target.value="";};
$("#changePassBtn").onclick=async()=>{const p=$("#newPass").value;if(p.length<8){alert("Use at least 8 characters.");return}const salt=crypto.getRandomValues(new Uint8Array(16));cryptoKey=await derive(p,salt);localStorage.setItem(SALT_KEY,b64(salt));await saveEncrypted();$("#newPass").value="";alert("Password changed. Keep it safe.");};
$("#lockBtn").onclick=()=>{cryptoKey=null;state={patients:[],reviews:[]};$("#app").classList.add("hidden");$("#lock").classList.remove("hidden");$("#lock h2").textContent="Unlock your records";$("#unlockBtn").textContent="Unlock";$("#pass").placeholder="Enter password";};
function renderAll(){renderDashboard();renderPatients();populatePatientSelect();renderReviews();}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
initialize();
