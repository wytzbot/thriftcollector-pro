import { DB, LIMITS, CURRENCIES, genId, now } from './data.js';
const { jsPDF } = window.jspdf;

let currentGroup=null, currentMember=null;
const $ = id => document.getElementById(id);

export function render(){
  const d=DB.get(); const app=$("app");
  if(!d.currentUser){ app.innerHTML=authHTML(); return; }
  app.innerHTML=`
  <header><h1>ThriftTrack Pro</h1><div>${d.isPro?'<span class=pro-tag>PRO</span>':''}<button onclick="logout()" style="background:none;border:none;color:white;margin-left:10px">Logout</button></div></header>
  ${!d.isPro?`<div class=banner>Free: ${d.groups.length}/${LIMITS.free.groupLimit} Groups <button onclick="show('upgrade')" style="background:var(--green);color:white;border:none;padding:6px 10px;border-radius:6px">Upgrade</button></div>`:''}
  <div class=content id=main></div>
  <button class=fab onclick="promptAddGroup()">+</button>
  ${allModals()}
  <footer><a href="#" onclick="showPage('about')">About</a><a href="#" onclick="showPage('privacy')">Privacy</a><a href="#" onclick="showPage('terms')">Terms</a><a href="#" onclick="showPage('contact')">Contact</a><br>© 2026 Wytz Technologies Ltd</footer>`;
  renderDashboard();
  loadAds();
}

function authHTML(){
  const options = Object.keys(CURRENCIES).map(code=>`<option value="${code}">${CURRENCIES[code].symbol} ${CURRENCIES[code].name}</option>`).join("");
  return `<div class=auth-screen><div class=logo>ThriftTrack Pro</div><p>Professional Group Tracker</p>
  <input id=authName class=input placeholder=Full Name>
  <input id=authEmail class=input placeholder=Email>
  <input id=authPass type=password class=input placeholder=Password>
  <select id=authCurrency class=input>${options}</select>
  <button class="btn btn-green" onclick="doSignup()">Create Free Account</button>
  <button class="btn btn-outline" onclick="doLogin()">Login</button></div>`;
}

window.doSignup = () => { const r=DB.signup(authName.value,authEmail.value,authPass.value,authCurrency.value); if(r.error)alert(r.error); else render(); }
window.doLogin = () => { const r=DB.login(authEmail.value,authPass.value); if(r.error)alert(r.error); else render(); }
window.logout = () => { DB.logout(); render(); }
window.promptAddGroup = () => { const name=prompt("Group Name:"); const amount=prompt("Contribution Amount:"); if(name&&amount){ const r=DB.addGroup(name,amount); if(r.error){alert(r.error);show('upgrade')} else renderDashboard(); }}

function renderDashboard(){
  const d=DB.get();
  let html =!d.isPro? `<div class=ad-slot><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="1234567890" data-ad-format="auto"></ins></div>` : '';
  html += d.groups.map(g=>`<div class=card onclick="openGroup(${g.id})"><b>${g.name}</b><br>${DB.formatAmount(g.amount)} ${g.freq} • ${g.members.length} Members<br><small>Created: ${g.created}</small></div>`).join("") || `<div class=card style=text-align:center;color:var(--muted)>No groups yet. Tap + to create</div>`;
  html +=!d.isPro? `<div class=ad-slot><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="0987654321" data-ad-format="auto"></ins></div>` : '';
  $("main").innerHTML = html;
}

window.openGroup = (id) => {
  currentGroup=DB.get().groups.find(g=>g.id===id);
  $("groupName").innerText=currentGroup.name;
  $("groupStats").innerText=`${DB.formatAmount(currentGroup.amount)} ${currentGroup.freq} • ${currentGroup.members.length} Members`;
  $("membersList").innerHTML=currentGroup.members.map(m=>`<div class=member onclick="openRecord(${m.id})"><div><b>${m.name}</b><br><small>${m.phone}</small></div><div class="${m.records.length?'status-done':'status-pending'}">${m.records.length?'Done':'Pending'}</div></div>`).join("");
  show('groupDetail');
}

window.openRecord = (id) => {
  currentMember=currentGroup.members.find(m=>m.id===id);
  $("memberName").innerText=currentMember.name;
  $("recordInfo").innerText=`Date: ${now()} | Record ID: ${genId()}`;
  show('recordModal');
}

window.markDone = () => {
  DB.addRecord(currentGroup.id, currentMember.id, $("recordNote").value);
  close('recordModal'); openGroup(currentGroup.id); alert("Record Saved");
}

window.showMessagePortal = () => {
  if(!DB.isPro()){show('upgrade');return;}
  $("memberCount").innerText=currentGroup.members.length;
  $("msgText").value=`Hello ${currentGroup.name} members,\n\nReminder: Your contribution of ${DB.formatAmount(currentGroup.amount)} is due for ${now()}.\n\n- ThriftTrack Pro`;
  show('messagePortal');
}

window.sendWhatsApp = () => {
  const numbers = currentGroup.members.map(m=>m.phone).filter(p=>p).join(",");
  window.open(`https://wa.me/?text=${encodeURIComponent($("msgText").value)}`);
  close('messagePortal');
}

window.exportPDF = () => {
  const doc = new jsPDF();
  doc.setFontSize(18); doc.text(currentGroup.name, 14, 22);
  doc.setFontSize(11); doc.text(`Amount: ${DB.formatAmount(currentGroup.amount)} | Date: ${now()}`, 14, 30);
  let y = 45;
  currentGroup.members.forEach((m,i)=>{
    doc.text(`${i+1}. ${m.name} - ${m.records.length?'Contributed':'Pending'}`, 14, y);
    y+=10;
  });
  doc.save(`${currentGroup.name}_Report.pdf`);
}

window.upgrade = () => { alert("Pro upgrade will be available via Google Play In-App Purchase"); DB.setPro(true); close('upgrade'); render(); }
window.show = id => $(id).classList.remove('hidden');
window.close = id => $(id).classList.add('hidden');

function allModals(){ return `
<div id=groupDetail class="modal hidden"><div class=modal-content><button class=close-btn onclick="close('groupDetail')">X</button><h2 id=groupName></h2><p id=groupStats></p><button class="btn btn-green" onclick="showMessagePortal()">📢 Message All on WhatsApp</button><button class="btn btn-outline" onclick="exportPDF()">📄 Export PDF Report</button><div id=membersList style="margin-top:16px"></div><button class="btn btn-green" onclick="let n=prompt('Member Name');let ph=prompt('Phone');if(n){let r=DB.addMember(currentGroup.id,n,ph);if(r.error)alert(r.error);else openGroup(currentGroup.id)}">+ Add Member</button></div></div>
<div id=recordModal class="modal hidden"><div class=modal-content><button class=close-btn onclick="close('recordModal')">X</button><h3 id=memberName></h3><p id=recordInfo></p><input id=recordNote class=input placeholder="Note: e.g. Week 3 Contribution"><button class="btn btn-green" onclick="markDone()">Mark as Contributed</button></div></div>
<div id=messagePortal class="modal hidden"><div class=modal-content><button class=close-btn onclick="close('messagePortal')">X</button><h3>WhatsApp Broadcast <span class=pro-tag>PRO</span></h3><p>To: <span id=memberCount></span> members</p><textarea id=msgText class=input rows=4></textarea><button class="btn btn-green" onclick="sendWhatsApp()">Open WhatsApp</button><p style="font-size:11px;color:var(--muted)">Get consent before messaging</p></div></div>
<div id=upgrade class="modal hidden"><div class=modal-content style=text-align:center><h2>Upgrade to Pro</h2><p>Unlock unlimited groups, no ads, and WhatsApp broadcast</p><button class="btn btn-green" onclick="upgrade()">Upgrade Now</button><button class="btn btn-outline" onclick="close('upgrade')">Later</button></div></div>`;}

function showPage(page){
  const tpl = $(page+'-page');
  document.body.innerHTML = tpl.content.cloneNode(true).children[0].outerHTML + `<div style="padding:16px"><button class=btn onclick="location.reload()">Back to App</button></div>`;
}

function loadAds(){
  if(DB.isPro()) return;
  if(typeof adsbygoogle!== 'undefined'){
    (adsbygoogle = window.adsbygoogle || []).push({});
    (adsbygoogle = window.adsbygoogle || []).push({});
  }
}
window.addEventListener('load', render);
