/* ===== Helpers ===== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function imgUrl(u){
  if(!u) return '';
  const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600` : u;
}
function toast(msg){
  let t = $('#toast'); if(!t){ t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ===== বিভাগ → জেলা → উপজেলা ===== */
const Geo = {
  bind(dv, ds, up, ph = {}){
    const opt = (arr, t) => `<option value="">${t}</option>` + arr.map(x => `<option>${x}</option>`).join('');
    const fillU = () => {
      const d = DIVISIONS.find(x => x.name === dv.value), s = d && d.districts.find(x => x.name === ds.value);
      up.innerHTML = opt(s ? s.upazilas : [], ph.u || 'সব উপজেলা');
    };
    const fillD = () => {
      const d = DIVISIONS.find(x => x.name === dv.value);
      ds.innerHTML = opt(d ? d.districts.map(x => x.name) : [], ph.s || 'সব জেলা'); fillU();
    };
    dv.innerHTML = opt(DIVISIONS.map(d => d.name), ph.d || 'সব বিভাগ');
    dv.onchange = fillD; ds.onchange = fillU; fillD();
  }
};

/* ===== লগইন সেশন ও Google Sheet API ===== */
const Auth = {
  user(){ try{ return JSON.parse(localStorage.getItem('sh_user')); }catch(e){ return null; } },
  set(u){ localStorage.setItem('sh_user', JSON.stringify(u)); },
  out(){ localStorage.removeItem('sh_user'); location.href = 'index.html'; },
  async hash(t){ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join(''); }
};
async function api(action, data){
  if(!CONFIG.API_URL) return { ok:false, pending:true };
  try{
    const r = await fetch(CONFIG.API_URL, { method:'POST', body: JSON.stringify({ action, ...data }) }); // text/plain → CORS preflight লাগে না
    return await r.json();
  }catch(e){ return { ok:false, msg:'ইন্টারনেট সংযোগ বা সার্ভারে সমস্যা। আবার চেষ্টা করুন।' }; }
}

/* ===== স্ক্রল রিভিল, কাউন্টার ===== */
const Reveal = {
  io: null,
  scan(){
    if(!this.io) this.io = new IntersectionObserver(es => es.forEach(e => {
      if(!e.isIntersecting) return; e.target.classList.add('in'); this.io.unobserve(e.target);
      $$('[data-count]', e.target).forEach(Reveal.count); if(e.target.dataset.count) Reveal.count(e.target);
    }), { threshold: .12 });
    $$('.rv:not(.in)').forEach(el => this.io.observe(el));
  },
  count(el){
    const to = +el.dataset.count, d = 1500, t0 = performance.now();
    (function f(t){ const p = Math.min((t - t0) / d, 1); el.textContent = bn(Math.floor(to * (1 - Math.pow(1 - p, 3)))) + (el.dataset.plus ? '+' : ''); if(p < 1) requestAnimationFrame(f); })(t0);
  }
};

/* ===== ছবি লোড (কনফিগে লিংক থাকলে) ===== */
function loadImages(){
  $$('[data-img]').forEach(el => {
    const u = imgUrl(CONFIG.IMAGES[el.dataset.img]); if(!u) return;
    const im = new Image(); im.onload = () => { const bg = $('.imgbg', el); if(bg) bg.style.backgroundImage = `url("${u}")`; el.classList.add('has-img'); }; im.src = u;
  });
}

/* ===== হেডার, ফুটার, মেনু ===== */
const Layout = {
  init(active = ''){
    const NAV = [
  {h:'index.html',           i:'🏠', t:'হোম',                 a:'home'},
  {h:'index.html#specialty', i:'🩺', t:'কোন ডাক্তার দেখাবেন', a:'spec'},
  {h:'doctors.html',         i:'👨‍⚕️', t:'ডাক্তার খুঁজুন',      a:'doctors'},
  {h:'blood.html',           i:'🩸', t:'রক্তদান কর্নার',       a:'blood', red:1},
  {h:'help-request.html',    i:'🙏', t:'সহযোগিতা কর্নার',     a:'help-request', red:1}
];
const rest = SERVICES.filter(s => !['doctors','blood','help-request'].includes(s.k));
    const u = Auth.user();
    const loginBtn = u ? `<a href="login.html" class="btn btn-o btn-sm hl">👤 ${esc(u.name.split(' ')[0])}</a>` : `<a href="login.html" class="btn btn-g btn-sm hl">লগইন</a>`;
    const nums = [['৯৯৯','জাতীয় জরুরি সেবা'],['১৬২৬৩','স্বাস্থ্য বাতায়ন'],['১০৯','নারী ও শিশু সহায়তা'],['১০৯৮','শিশু হেল্পলাইন'],['৩৩৩','সরকারি তথ্য সেবা'],['১৬৪৩০','আইনি সহায়তা']];
    const tk = `<span class="tk">${nums.map(n => `<span>🚨 ${n[1]}: <b>${n[0]}</b></span>`).join('')}</span>`;

    $('#site-header').innerHTML = `
<div class="flagbar"></div>
<div class="ticker"><div class="ticker-in">${tk}${tk}</div></div>
<header class="header" id="hdr"><div class="container">
  <a href="index.html" class="brand"><img src="logo.svg" alt="সুস্থ হবো লোগো"><span><b>সুস্থ হবো</b></span></a>
  <nav class="nav">
    ${NAV.map(n => `<a href="${n.h}" class="${n.red?'red ':''}${active===n.a?'on':''}">${n.i} ${n.t}</a>`).join('')}
    <div class="more" id="more"><button type="button">আরও ▾</button>
      <div class="more-menu">${rest.map(s => `<a href="${s.k}.html">${s.i} ${s.t}</a>`).join('')}</div></div>
  </nav>
  <div class="h-act">${loginBtn}<button class="burger" id="burger" aria-label="মেনু">☰</button></div>
</div></header>`;

    const drawerLinks = [...NAV.map(n => ({h:n.h, i:n.i, t:n.t})), ...rest.map(s => ({h:s.k + '.html', i:s.i, t:s.t}))];
document.body.insertAdjacentHTML('beforeend', `
<div class="drawer" id="drawer"><div class="bk"></div><div class="pn">
  <div class="top"><b style="font-size:20px;color:var(--g)">✚ সুস্থ হবো</b><button class="x" id="dx">✕</button></div>
  ${drawerLinks.map(s => `<a href="${s.h}">${s.i} ${s.t}</a>`).join('')}
  <a href="login.html" style="background:var(--g);color:#fff;margin-top:10px;justify-content:center">লগইন / নিবন্ধন</a>
</div></div>
<nav class="bnav">
  <a href="index.html" class="${active==='home'?'on':''}"><i>🏠</i>হোম</a>
  <a href="doctors.html" class="${active==='doctors'?'on':''}"><i>👨‍⚕️</i>ডাক্তার</a>
  <a href="blood.html" class="mid"><i>🩸</i>রক্ত</a>
  <a href="help-request.html" class="${active==='help-request'?'on':''}"><i>🙏</i>সহযোগিতা</a>
  <a href="login.html" class="${active==='login'?'on':''}"><i>👤</i>${u ? 'প্রোফাইল' : 'লগইন'}</a>
</nav>
<button class="totop" id="totop" aria-label="উপরে যান">↑</button>`);

    const so = CONFIG.SOCIAL;
    $('#site-footer').innerHTML = `
    <footer class="footer"><div class="container">
      <div class="cols">
        <div><a href="index.html" class="brand"><img src="logo.svg" alt="" style="width:50px;height:50px"><span><b>সুস্থ হবো</b></span></a>
          <p>সঠিক ডাক্তার, সঠিক হাসপাতাল, জরুরি রক্ত ও চিকিৎসা সহযোগিতা — বাংলাদেশের প্রতিটি মানুষের জন্য, সম্পূর্ণ বাংলায়।</p>
          <div class="soc"><a href="${so.facebook}" target="_blank" rel="noopener" aria-label="Facebook">📘</a><a href="${so.youtube}" target="_blank" rel="noopener" aria-label="YouTube">▶️</a><a href="${so.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">💬</a><a href="mailto:${so.email}" aria-label="Email">✉️</a></div></div>
        <div><h4>সেবা</h4>${['doctors','hospitals','tests','ai','appointment'].map(k => { const s = SERVICES.find(x => x.k === k); return `<a href="${k}.html">${s.t}</a>`; }).join('')}</div>
        <div><h4>রক্ত ও সহযোগিতা</h4><a href="blood.html">রক্তদান কর্নার</a><a href="help-request.html">সহযোগিতা কর্নার</a><a href="ambulance.html">অ্যাম্বুলেন্স</a></div>
        <div><h4>জানুন</h4><a href="firstaid.html">প্রাথমিক চিকিৎসা</a><a href="tips.html">স্বাস্থ্য টিপস</a><a href="career.html">স্বাস্থ্য শিক্ষা ও ক্যারিয়ার</a><a href="emergency.html">জরুরি নম্বর</a></div>
      </div></div>
      <div class="disc2"><div class="container">⚠️ এই সাইটের তথ্য শুধু সাধারণ নির্দেশনার জন্য, এটি চিকিৎসকের পরামর্শের বিকল্প নয়। জরুরি অবস্থায় ৯৯৯-এ কল করুন বা নিকটস্থ হাসপাতালে যান।</div></div>
      <div class="container copy"><span>© ${bn(new Date().getFullYear())} সুস্থ হবো। সর্বস্বত্ব সংরক্ষিত।</span><span class="dev">Developed by <b>Akash</b> <span>❤</span></span></div>
    </footer>`;

    const hdr = $('#hdr'), tt = $('#totop');
    addEventListener('scroll', () => { hdr.classList.toggle('sc', scrollY > 10); tt.classList.toggle('show', scrollY > 500); }, { passive:true });
    tt.onclick = () => scrollTo({ top:0 });
    $('#burger').onclick = () => $('#drawer').classList.add('open');
    $('#dx').onclick = $('#drawer .bk').onclick = () => $('#drawer').classList.remove('open');
    $$('#drawer .pn a').forEach(a => a.addEventListener('click', () => $('#drawer').classList.remove('open')));
    $('#more button').onclick = e => { e.stopPropagation(); $('#more').classList.toggle('open'); };
    document.addEventListener('click', () => $('#more').classList.remove('open'));
    Reveal.scan(); loadImages();
  }
};

/* ===== "আসিতেছে" পেজ ===== */
const Page = {
  coming(key){
    const s = SERVICES.find(x => x.k === key); document.title = s.t + ' – সুস্থ হবো';
    Layout.init(key);
    $('#page').innerHTML = `
    <section class="cs-hero"><div class="container"><div class="cs-ic">${s.i}</div><span class="soon-badge">🚧 আসিতেছে (Upcoming)</span><h1>${s.t}</h1><p>${s.d}</p></div></section>
    <section class="container"><div class="cs-grid">
      <div class="card rv"><h3>🔜 যা যা থাকছে</h3><ul>${s.feat.map(f => `<li>${f}</li>`).join('')}</ul>
        <p class="small" style="margin-top:14px">কাজ চলছে — খুব শীঘ্রই চালু হবে।</p><div class="prog"><i></i></div>
        <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><a href="index.html" class="btn btn-g">🏠 হোমে ফিরুন</a><a href="login.html" class="btn btn-o">🔐 আগে একাউন্ট খুলুন</a></div></div>
      <div class="card rv" style="border-top:5px solid var(--r)"><h3>🚨 এখনই সাহায্য দরকার?</h3>
        <p style="margin-bottom:14px">জরুরি অবস্থায় অপেক্ষা করবেন না।</p>
        <a href="tel:999" class="btn btn-r btn-block" style="margin-bottom:10px">📞 জাতীয় জরুরি সেবা ৯৯৯</a>
        <a href="tel:16263" class="btn btn-o btn-block">🩺 স্বাস্থ্য বাতায়ন ১৬২৬৩</a></div>
    </div></section>
    <section class="section"><div class="container"><div class="sec-head"><h2 style="font-size:28px">অন্যান্য সেবা দেখুন</h2></div>
      <div class="grid g4 m2">${SERVICES.filter(x => x.k !== key).slice(0, 8).map(x => `<a class="svc ${x.red?'red':''}" href="${x.k}.html"><div class="ic">${x.i}</div><h3>${x.t}</h3></a>`).join('')}</div></div></section>`;
    Reveal.scan();
  }
};