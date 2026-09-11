const menuBtn=document.querySelector('.menu-btn');
const nav=document.querySelector('.nav');
const form=document.getElementById('contactForm');
const note=document.getElementById('formNote');

const SUPABASE_URL='https://ialobcshxbesmncngixx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_5fmGpjGAQm7qwUS1xtp-zg_CI4fenzN';

function closeMenu(){
  if(!nav||!menuBtn)return;
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.textContent='Menu';
}

if(menuBtn&&nav){
  menuBtn.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded',String(open));
    menuBtn.textContent=open?'Close':'Menu';
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  window.addEventListener('resize',()=>{if(innerWidth>900)closeMenu()});
}

document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const target=document.querySelector(a.getAttribute('href'));
  if(!target)return;
  e.preventDefault();
  window.scrollTo({top:target.getBoundingClientRect().top+scrollY-75,behavior:'smooth'});
}));

const sections=[...document.querySelectorAll('main section[id]')];
const links=[...document.querySelectorAll('.nav a[href^="#"]')];
if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{
    const current=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!current)return;
    links.forEach(a=>{
      const active=a.getAttribute('href')===`#${current.target.id}`;
      a.classList.toggle('active',active);
      active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');
    });
  },{rootMargin:'-25% 0px -60% 0px',threshold:[.1,.3]});
  sections.forEach(s=>observer.observe(s));
}

const interest=form?.querySelector('[name="interest"]');
document.querySelectorAll('[data-interest]').forEach(a=>a.addEventListener('click',()=>{
  if(interest)interest.value=a.dataset.interest;
}));

const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  "'":'&#39;',
  '"':'&quot;'
}[char]));

async function supabaseGet(table,select,filters=''){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filters}`,{
    headers:{apikey:SUPABASE_PUBLISHABLE_KEY}
  });
  if(!response.ok){
    throw new Error(await response.text()||`Unable to load ${table}`);
  }
  return response.json();
}

async function loadPublicPrograms(){
  const container=document.querySelector('#programs .cards');
  if(!container)return;
  try{
    const programs=await supabaseGet(
      'hmf_programs',
      'id,title,description,status,start_date,end_date,created_at',
      '&status=eq.active&order=start_date.asc.nullslast,created_at.asc'
    );
    if(!programs.length)return;
    container.innerHTML=programs.map((program,index)=>`
      <article class="program-card">
        <div class="program-index">${String(index+1).padStart(2,'0')}</div>
        <div class="program-body">
          <span class="kicker">Active programme</span>
          <h3>${escapeHtml(program.title)}</h3>
          <p>${escapeHtml(program.description||'Programme details will be published as implementation progresses.')}</p>
          <a class="text-link" href="#contact" data-interest="General enquiry">Programme enquiries</a>
        </div>
      </article>
    `).join('');
    container.querySelectorAll('[data-interest]').forEach(a=>a.addEventListener('click',()=>{
      if(interest)interest.value=a.dataset.interest;
    }));
  }catch(error){
    console.error('HM Foundation programme loading failed:',error);
  }
}

async function loadPublicPartners(){
  const container=document.querySelector('#partners .partner-types');
  if(!container)return;
  try{
    const partners=await supabaseGet(
      'hmf_partners',
      'id,organisation_name,partnership_type,status,created_at',
      '&status=eq.active&order=organisation_name.asc'
    );
    if(!partners.length)return;
    container.innerHTML=partners.map(partner=>{
      const type=partner.partnership_type?` · ${escapeHtml(partner.partnership_type)}`:'';
      return `<span>${escapeHtml(partner.organisation_name)}${type}</span>`;
    }).join('');
  }catch(error){
    console.error('HM Foundation partner loading failed:',error);
  }
}

async function submitEnquiry(data){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/hmf_enquiries`,{
    method:'POST',
    headers:{
      apikey:SUPABASE_PUBLISHABLE_KEY,
      'Content-Type':'application/json',
      Prefer:'return=minimal'
    },
    body:JSON.stringify({
      full_name:data.name.trim(),
      email:data.email.trim().toLowerCase(),
      enquiry_type:data.interest||'General enquiry',
      message:data.message.trim()
    })
  });
  if(!response.ok){
    const detail=await response.text();
    throw new Error(detail||'Unable to submit enquiry');
  }
}

if(form&&note){
  note.textContent='Enquiries are securely submitted to HM Foundation for review.';
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }
    const button=form.querySelector('button[type="submit"]');
    const data=Object.fromEntries(new FormData(form).entries());
    try{
      if(button){button.disabled=true;button.textContent='Submitting...';}
      note.classList.remove('success');
      note.textContent='Submitting your enquiry securely...';
      await submitEnquiry(data);
      note.textContent=`Thank you, ${data.name}. Your enquiry has been received by HM Foundation.`;
      note.classList.add('success');
      form.reset();
    }catch(error){
      console.error('HM Foundation enquiry submission failed:',error);
      note.classList.remove('success');
      note.textContent='We could not submit your enquiry right now. Please try again shortly.';
    }finally{
      if(button){button.disabled=false;button.textContent='Submit enquiry';}
    }
  });
  form.addEventListener('input',()=>note.classList.remove('success'));
}

Promise.allSettled([loadPublicPrograms(),loadPublicPartners()]);

const topButton=document.createElement('button');
topButton.className='back-to-top';
topButton.type='button';
topButton.setAttribute('aria-label','Back to top');
topButton.textContent='Top';
document.body.appendChild(topButton);
topButton.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
addEventListener('scroll',()=>topButton.classList.toggle('show',scrollY>700),{passive:true});