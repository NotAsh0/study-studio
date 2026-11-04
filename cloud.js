(() => {
  const GUEST_KEY='study-studio-v1';
  let client,adapter,user=null,revision=0,lastSaved='',dirty=false,loading=false,timer,flight=null,conflict=false,ready=false,message='',switching=null;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=x=>structuredClone(x);
  const config=window.STUDY_CLOUD_CONFIG||{};
  function configured(){
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url||''))return false;
    if(/^sb_publishable_/.test(config.publishableKey||''))return true;
    try{return JSON.parse(atob(config.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{return false;}
  }
  function validWorkspace(v){return v&&v.version===1&&Array.isArray(v.profiles)&&v.profiles.length>0&&v.profiles.length<100&&v.profiles.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Array.isArray(p.courses)&&Array.isArray(p.statuses)&&p.statuses.length&&p.statuses.every(s=>typeof s==='string')&&p.progress&&typeof p.progress==='object'&&p.scores&&typeof p.scores==='object'&&Array.isArray(p.rules)&&p.courses.every(c=>c&&typeof c.code==='string'&&typeof c.name==='string'&&Number.isFinite(+c.credits)&&Array.isArray(c.units)&&c.units.every(u=>u&&typeof u.name==='string'&&Array.isArray(u.topics)&&u.topics.every(t=>typeof t==='string'))));}
  function status(text){message=text;const el=$('#cloud-status');if(el)el.textContent=text;const b=$('#accountButton');if(b)b.textContent=user?'My account':'Sign in';const label=$('#accountName');if(label)label.textContent=user?user.email:'Guest workspace';}
  function guest(){try{const v=JSON.parse(localStorage.getItem(GUEST_KEY));if(validWorkspace(v))return v;}catch{}return adapter.blank();}
  function cache(){if(user)sessionStorage.setItem('study-draft:'+user.id,JSON.stringify({workspace:adapter.read(),revision,dirty}));}
  function render(){adapter?.render();}
  async function loadAccount(session){
    if(!session?.user)return leaveAccount();
    if(user?.id===session.user.id&&ready)return;
    if(switching)return switching;
    switching=(async()=>{
      user=session.user;ready=false;loading=true;dirty=false;conflict=false;clearTimeout(timer);status('Loading your account…');render();
      try{
        const {data,error}=await client.from('study_workspaces').select('document,revision').eq('user_id',user.id).maybeSingle();
        if(error)throw error;
        let workspace=data?.document||adapter.blank();
        if(!validWorkspace(workspace))throw Error('The saved workspace has an unsupported format.');
        revision=data?.revision||0;lastSaved=JSON.stringify(workspace);
        let draft;try{draft=JSON.parse(sessionStorage.getItem('study-draft:'+user.id));}catch{}
        if(draft?.dirty&&validWorkspace(draft.workspace)){
          workspace=draft.workspace;dirty=true;
          if(draft.revision!==revision){conflict=true;status('Another session saved newer data. Review the sync conflict in My account.');}
        }
        ready=true;loading=false;adapter.replace(clone(workspace));cache();
        if(!conflict){status(dirty?'Unsaved changes restored':'Saved to your account');if(dirty||!data){dirty=true;timer=setTimeout(flush,500);}}
      }catch(error){loading=false;ready=false;status('Account data could not load. Open My account to retry.');showAccount(error.message||'Unable to load your saved data.');render();}
    })();
    try{await switching;}finally{switching=null;}
  }
  function leaveAccount(){
    clearTimeout(timer);if(user&&!dirty)sessionStorage.removeItem('study-draft:'+user.id);
    user=null;revision=0;lastSaved='';dirty=false;ready=false;loading=false;conflict=false;status('Saved in this browser');adapter.replace(guest());
  }
  function persist(workspace){
    if(!user){localStorage.setItem(GUEST_KEY,JSON.stringify(workspace));return;}
    if(!ready||loading)return;
    const serialized=JSON.stringify(workspace);if(serialized===lastSaved&&!dirty)return;
    dirty=true;cache();clearTimeout(timer);
    if(!conflict){status('Changes waiting to sync…');timer=setTimeout(flush,700);}
  }
  async function flush(){
    clearTimeout(timer);
    if(flight)return flight;
    if(!user||!ready||!dirty||conflict)return !dirty;
    const currentId=user.id,document=clone(adapter.read()),serialized=JSON.stringify(document),base=revision;
    status('Saving to your account…');
    flight=(async()=>{
      try{
        const {data,error}=await client.rpc('save_study_workspace',{p_document:document,p_expected_revision:base});
        if(error)throw error;
        if(user?.id!==currentId)return false;
        revision=Number(data);lastSaved=serialized;dirty=JSON.stringify(adapter.read())!==serialized;cache();status(dirty?'Changes waiting to sync…':'Saved to your account');
        return true;
      }catch(error){
        if(error.code==='40001'||String(error.message).includes('STUDY_CONFLICT')){conflict=true;status('Sync conflict — open My account to keep a backup and load the latest data.');}
        else status('Not synced — changes remain on this device. Open My account to retry.');
        cache();return false;
      }
    })();
    let result;try{result=await flight;}finally{flight=null;if(dirty&&!conflict&&message==='Changes waiting to sync…')timer=setTimeout(flush,300);}
    return result;
  }
  function close(){const el=$('#accountDialog');if(el){el.close();el.remove();}}
  function downloadDraft(){const blob=new Blob([JSON.stringify(adapter.read(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='study-studio-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function showAccount(notice=''){
    close();const dialog=document.createElement('dialog');dialog.id='accountDialog';dialog.className='account-dialog';
    dialog.innerHTML=`<div class="sectionhead"><div><div class="eyebrow">YOUR STUDY SPACE</div><h2>${user?'My account':'Welcome to Study Studio'}</h2></div><button class="icon close-account" aria-label="Close account window">×</button></div>${notice?`<p class="account-message" role="status">${esc(notice)}</p>`:''}
      ${!configured()?'<p class="muted">Online accounts are being set up. Your local workspace is available and stays saved in this browser.</p>':user?`
      <p class="muted">Signed in as <strong>${esc(user.email)}</strong>. Each account has its own profiles, topics and scores.</p><p class="result" role="status">${esc(message)}</p>
      <div class="toolbar"><button class="button retry-sync">${ready?'Sync now':'Retry loading account'}</button><button class="button secondary export-draft">Export backup</button>${conflict?'<button class="button secondary load-latest">Load latest account data</button>':''}</div>
      <p class="note">Unsynced changes stay on this device until saved. If another device has saved newer changes, export a backup before loading the latest account data.</p>
      <hr><h3>Bring your existing work</h3><p class="note">Copy this browser’s guest workspace into this account. This replaces this account’s current profiles after confirmation.</p><button class="button secondary import-guest" ${!ready||conflict?'disabled':''}>Copy guest workspace to my account</button><p><button class="button secondary sign-out">Sign out</button></p>`:`
      <p class="muted">Sign in to save your profiles and progress privately, and continue on another device.</p>
      ${config.githubEnabled?'<p><button class="button github-signin">Continue with GitHub</button></p>':''}
      ${config.emailEnabled!==false?'<form id="accountForm"><div class="field"><label for="accountEmail">Email</label><input id="accountEmail" type="email" autocomplete="username" required></div><div class="field"><label for="accountPassword">Password</label><input id="accountPassword" type="password" autocomplete="current-password" minlength="8" required></div><p id="authResult" class="account-message" role="status" aria-live="polite"></p><div class="toolbar section"><button class="button" type="submit">Sign in</button><button class="button secondary create-account" type="button">Create account</button></div><button class="text-button reset-password" type="button">Forgot your password?</button></form>':''}
      <p class="note">Guest tracking remains available without signing in. Signing in loads your account workspace; guest work can be copied in afterward.</p>`}`;
    document.body.append(dialog);dialog.showModal();dialog.querySelector('.close-account').onclick=close;
    if(!configured())return;
    if(user){
      dialog.querySelector('.retry-sync').onclick=async()=>{if(!ready){const {data}=await client.auth.getSession();await loadAccount(data.session);}else await flush();showAccount();};
      dialog.querySelector('.export-draft').onclick=downloadDraft;
      if(conflict)dialog.querySelector('.load-latest').onclick=async()=>{if(!confirm('Load the latest saved account data? Unsynced changes in this tab will be replaced. Export a backup first if you need to keep them.'))return;sessionStorage.removeItem('study-draft:'+user.id);ready=false;conflict=false;dirty=false;const {data}=await client.auth.getSession();await loadAccount(data.session);showAccount();};
      dialog.querySelector('.import-guest').onclick=async()=>{if(!confirm('Replace this account’s workspace with this browser’s guest workspace? Export a backup of the current account first if needed.'))return;adapter.replace(guest());persist(adapter.read());await flush();showAccount();};
      dialog.querySelector('.sign-out').onclick=async()=>{if(dirty&&!(await flush()))return showAccount('Your changes have not synced yet. Export a backup or resolve the sync issue before signing out.');const {error}=await client.auth.signOut({scope:'local'});if(error)return showAccount(error.message);leaveAccount();close();};
    }else{
      if(config.githubEnabled)dialog.querySelector('.github-signin').onclick=async()=>{
        const {error}=await client.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.href.split('#')[0]}});
        if(error)showAccount(error.message);
      };
      const form=dialog.querySelector('form');if(!form)return;const result=dialog.querySelector('#authResult');
      async function authenticate(create){
        if(!form.reportValidity())return;
        const email=form.querySelector('#accountEmail').value.trim(),password=form.querySelector('#accountPassword').value;
        form.querySelectorAll('button').forEach(b=>b.disabled=true);result.textContent=create?'Creating your account…':'Signing in…';
        try{
          const response=create?await client.auth.signUp({email,password,options:{emailRedirectTo:location.href.split('#')[0]}}):await client.auth.signInWithPassword({email,password});
          form.querySelector('#accountPassword').value='';
          if(response.error)throw response.error;
          if(response.data.session){close();await loadAccount(response.data.session);}
          else result.textContent='Check your email to confirm your account, then return here to sign in.';
        }catch(error){result.textContent=error.message||'Sign-in failed. Please try again.';}
        finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);}
      }
      form.onsubmit=e=>{e.preventDefault();authenticate(false);};form.querySelector('.create-account').onclick=()=>authenticate(true);
      form.querySelector('.reset-password').onclick=async()=>{const email=form.querySelector('#accountEmail');if(!email.reportValidity())return;const {error}=await client.auth.resetPasswordForEmail(email.value.trim(),{redirectTo:location.href.split('#')[0]});result.textContent=error?error.message:'If an account exists for this email, a password reset link will arrive shortly.';};
    }
  }
  function recovery(){close();const d=document.createElement('dialog');d.id='accountDialog';d.className='account-dialog';d.innerHTML='<h2>Set a new password</h2><form><div class="field"><label for="newAccountPassword">New password</label><input id="newAccountPassword" type="password" autocomplete="new-password" minlength="8" required></div><p class="account-message" role="status"></p><p><button class="button" type="submit">Save password</button></p></form>';document.body.append(d);d.showModal();d.querySelector('form').onsubmit=async e=>{e.preventDefault();const input=d.querySelector('input'),{error}=await client.auth.updateUser({password:input.value});input.value='';if(error)d.querySelector('[role="status"]').textContent=error.message;else{close();showAccount('Password updated.');}};}
  async function init(options){
    adapter=options;$('#accountButton').onclick=()=>showAccount();status('Saved in this browser');
    if(!configured())return;
    try{
      if(!window.supabase?.createClient)throw Error('Account service could not start. Refresh to retry.');
      client=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      client.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY')setTimeout(recovery,0);if(event==='SIGNED_IN')setTimeout(()=>loadAccount(session),0);if(event==='SIGNED_OUT'&&user)setTimeout(leaveAccount,0);});
      const {data,error}=await client.auth.getSession();if(error)throw error;if(data.session)await loadAccount(data.session);
    }catch(error){status('Account service unavailable — guest work is still saved locally.');}
    window.addEventListener('online',()=>{if(dirty&&!conflict)flush();});
    window.addEventListener('beforeunload',e=>{if(dirty){cache();e.preventDefault();e.returnValue='';}});
  }
  window.StudyCloud={init,persist,flush,validWorkspace,isLoading:()=>loading||(!!user&&!ready),showAccount};
})();
