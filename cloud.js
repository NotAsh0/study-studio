(() => {
  const GUEST_KEY='study-studio-v1';
  const AUTOSAVE_KEY='study-autosave:';
  let client,adapter,user=null,revision=0,lastSaved='',dirty=false,loading=false,timer,flight=null,conflict=false,ready=false,message='',switching=null;
  let revisionChannel=null,latestOtherRevision=0;
  let lastObserved='',savingSnapshot=null;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=x=>structuredClone(x);
  const snapshot=workspace=>JSON.stringify(workspace,(_,value)=>{
    if(value===null||typeof value!=='object'||Array.isArray(value))return value;
    return Object.fromEntries(Object.keys(value).sort().map(key=>[key,value[key]]));
  });
  const config=window.STUDY_CLOUD_CONFIG||{};
  const redirectUrl=()=>location.origin+location.pathname;
  const oauthProviders=[{id:'google',name:'Google',enabled:config.googleEnabled},{id:'github',name:'GitHub',enabled:config.githubEnabled}];
  function configured(){
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url||''))return false;
    if(/^sb_publishable_/.test(config.publishableKey||''))return true;
    try{return JSON.parse(atob(config.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{return false;}
  }
  function validWorkspace(v){return v&&v.version===1&&Array.isArray(v.profiles)&&v.profiles.length>0&&v.profiles.length<100&&v.profiles.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Array.isArray(p.courses)&&Array.isArray(p.statuses)&&p.statuses.length&&p.statuses.every(s=>typeof s==='string')&&p.progress&&typeof p.progress==='object'&&p.scores&&typeof p.scores==='object'&&Array.isArray(p.rules)&&p.courses.every(c=>c&&typeof c.code==='string'&&typeof c.name==='string'&&Number.isFinite(+c.credits)&&Array.isArray(c.units)&&c.units.every(u=>u&&typeof u.name==='string'&&Array.isArray(u.topics)&&u.topics.every(t=>typeof t==='string'))));}
  function status(text, localDraft=false){
    message=text;
    const warning=/conflict|not synced|could not load|unavailable/i.test(text);
    const pending=/waiting|saving|loading/i.test(text);
    const wrap=$('.account-status-wrap');
    if(wrap)wrap.dataset.sync=warning?'warning':pending||localDraft?'pending':user?'saved':'local';
    const summary=$('#syncSummary');
    if(summary)summary.textContent=warning?'Sync issue':localDraft?'Local draft':pending?'Syncing':user?'Saved':'Local';
    const indicator=$('#syncIndicator');
    if(indicator)indicator.setAttribute('aria-label','Sync status: '+text);
    const el=$('#cloud-status');
    if(el)el.textContent=text;
    const result=$('#accountDialog .sync-result');
    if(result)result.textContent=text;
    const button=$('#accountButton');
    if(button)button.textContent=user?'My account':'Sign in';
    const label=$('#accountName');
    if(label)label.textContent=user?user.email:'Guest workspace';
  }
  function autosaveEnabled(){return localStorage.getItem(AUTOSAVE_KEY+user.id)!=='off';}
  function showSyncState(){
    if(!dirty){
      status(revision?'Saved to your account':'Workspace ready',!revision);
    }else if(autosaveEnabled()){
      status('Changes waiting to sync…');
    }else{
      status('Draft saved in this tab. Select Sync now to save to your account.',true);
    }
  }
  function scheduleAutosave(delay=700){
    if(user&&ready&&dirty&&!conflict&&!flight&&autosaveEnabled())timer=setTimeout(()=>flush(),delay);
  }
  function applyAutosavePreference(){
    clearTimeout(timer);
    const checkbox=$('#accountDialog .autosave-toggle');
    if(checkbox)checkbox.checked=autosaveEnabled();
    if(!ready||conflict||flight)return;
    showSyncState();
    scheduleAutosave();
  }
  function guest(){try{const v=JSON.parse(localStorage.getItem(GUEST_KEY));if(validWorkspace(v))return v;}catch{}return adapter.blank();}
  function cache(){if(user)sessionStorage.setItem('study-draft:'+user.id,JSON.stringify({workspace:adapter.read(),revision,dirty}));}
  function render(){adapter?.render();}
  function flagSyncConflict(){
    clearTimeout(timer);
    conflict=true;
    status('Sync conflict — open My account to keep a backup and load the latest data.');
  }
  function watchWorkspaceRevisions(userId){
    revisionChannel?.close();
    revisionChannel=null;
    latestOtherRevision=0;
    if(!userId||typeof window.BroadcastChannel!=='function')return;
    const channel=new window.BroadcastChannel('study-workspace-revision:'+userId);
    revisionChannel=channel;
    channel.onmessage=({data:nextRevision})=>{
      if(revisionChannel!==channel||!Number.isSafeInteger(nextRevision)||nextRevision<=revision)return;
      latestOtherRevision=Math.max(latestOtherRevision,nextRevision);
      if(ready&&!flight)flagSyncConflict();
    };
  }
  async function loadAccount(session){
    if(!session?.user)return leaveAccount();
    if(user?.id===session.user.id&&ready)return;
    if(switching)return switching;
    switching=(async()=>{
      if(user?.id!==session.user.id){revision=0;watchWorkspaceRevisions(session.user.id);}
      user=session.user;ready=false;loading=true;dirty=false;conflict=false;clearTimeout(timer);status('Loading your account…');render();
      try{
        const {data,error}=await client.from('study_workspaces').select('document,revision').eq('user_id',user.id).maybeSingle();
        if(error)throw error;
        let workspace=data?.document||adapter.blank();
        if(!validWorkspace(workspace))throw Error('The saved workspace has an unsupported format.');
        revision=data?.revision||0;
        lastSaved=snapshot(workspace);
        lastObserved=lastSaved;
        let draft;
        try{draft=JSON.parse(sessionStorage.getItem('study-draft:'+user.id));}catch{}
        if(draft?.dirty&&validWorkspace(draft.workspace)){
          const restored=snapshot(draft.workspace);
          if(restored!==lastSaved){
            workspace=draft.workspace;
            lastObserved=restored;
            dirty=true;
            if(draft.revision!==revision){
              revision=Number.isSafeInteger(draft.revision)?draft.revision:-1;
              flagSyncConflict();
            }
          }
        }
        ready=true;loading=false;adapter.replace(clone(workspace));cache();
        if(latestOtherRevision>revision)flagSyncConflict();
        if(!conflict){
          showSyncState();
          scheduleAutosave();
        }
      }catch(error){loading=false;ready=false;status('Account data could not load. Open My account to retry.');showAccount(error.message||'Unable to load your saved data.');render();}
    })();
    try{await switching;}finally{switching=null;}
  }
  function leaveAccount(){
    clearTimeout(timer);if(user&&!dirty)sessionStorage.removeItem('study-draft:'+user.id);
    watchWorkspaceRevisions(null);
    user=null;revision=0;lastSaved='';lastObserved='';dirty=false;ready=false;loading=false;conflict=false;status('Saved in this browser');adapter.replace(guest());
  }
  function persist(workspace){
    if(!user){localStorage.setItem(GUEST_KEY,JSON.stringify(workspace));return;}
    if(!ready||loading)return;
    const observed=snapshot(workspace);
    if(observed===lastObserved)return;
    lastObserved=observed;
    dirty=observed!==lastSaved||(savingSnapshot!==null&&observed!==savingSnapshot);
    cache();
    clearTimeout(timer);
    if(conflict||flight)return;
    showSyncState();
    scheduleAutosave();
  }
  async function flush(manual=false){
    if(!user||!ready||conflict)return !dirty;
    if(!manual&&!autosaveEnabled())return !dirty;
    clearTimeout(timer);
    if(flight){
      if(!manual)return flight;
      if(!await flight)return false;
      return flush(true);
    }
    if(!dirty)return true;
    const currentId=user.id,base=revision,serialized=lastObserved;
    savingSnapshot=serialized;
    status('Saving to your account…');
    let saved=false;
    flight=(async()=>{
      try{
        const {data,error}=await client.rpc('save_study_workspace',{p_document:JSON.parse(serialized),p_expected_revision:base});
        if(error)throw error;
        if(user?.id!==currentId)return false;
        revision=Number(data);
        lastSaved=serialized;
        saved=true;
        revisionChannel?.postMessage(revision);
        return true;
      }catch(error){
        if(user?.id!==currentId)return false;
        if(error?.code==='PT409'||error?.code==='40001'||String(error?.message).includes('STUDY_CONFLICT'))flagSyncConflict();
        else status('Not synced — changes remain in this tab. Open My account to retry.');
        return false;
      }
    })();
    try{return await flight;}
    finally{
      flight=null;
      savingSnapshot=null;
      if(user?.id===currentId){
        dirty=lastObserved!==lastSaved;
        cache();
        if(!conflict&&latestOtherRevision>revision)flagSyncConflict();
        if(!conflict&&(saved||!dirty||lastObserved!==serialized)){
          showSyncState();
          scheduleAutosave();
        }
      }
    }
  }
  function close(){const el=$('#accountDialog');if(el){el.close();el.remove();}}
  function downloadDraft(){const blob=new Blob([JSON.stringify(adapter.read(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='study-studio-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function showAccount(notice=''){
    close();const dialog=document.createElement('dialog');dialog.id='accountDialog';dialog.className='account-dialog';
    dialog.innerHTML=`<div class="sectionhead"><div><div class="eyebrow">YOUR STUDY SPACE</div><h2>${user?'My account':'Welcome to Study Studio'}</h2></div><button class="icon close-account" aria-label="Close account window">×</button></div>${notice?`<p class="account-message" role="status">${esc(notice)}</p>`:''}
      ${!configured()?'<p class="muted">Online accounts are being set up. Your local workspace is available and stays saved in this browser.</p>':user?`
      <p class="muted">Signed in as <strong>${esc(user.email)}</strong>. Each account has its own profiles, topics and scores.</p><p class="result sync-result" role="status">${esc(message)}</p>
      <label><input type="checkbox" class="autosave-toggle" ${autosaveEnabled()?'checked':''}> Autosave to my account</label>
      <p class="note">Turn off autosave to keep drafts in this tab until you select Sync now. Export a backup before closing the tab with unsynced changes.</p>
      <div class="toolbar"><button class="button retry-sync">${ready?'Sync now':'Retry loading account'}</button><button class="button secondary export-draft">Export backup</button>${conflict?'<button class="button secondary load-latest">Load latest account data</button>':''}</div>
      <p class="note">If another device has saved newer changes, export a backup before loading the latest account data.</p>
      <hr><h3>Bring your existing work</h3><p class="note">Copy this browser’s guest workspace into this account. This replaces this account’s current profiles after confirmation.</p><button class="button secondary import-guest" ${!ready||conflict?'disabled':''}>Copy guest workspace to my account</button><p><button class="button secondary sign-out">Sign out</button></p>`:`
      <p class="muted">Sign in to save your profiles and progress privately, and continue on another device.</p>
      <div class="auth-providers">${oauthProviders.filter(p=>p.enabled||p.id==='google').map(p=>`<button class="button secondary oauth-signin ${p.id}-signin" data-provider="${p.id}" ${p.enabled?'':'disabled'}>Continue with ${p.name}${p.enabled?'':'<span class="provider-pending">Coming soon</span>'}</button>`).join('')}</div>${config.emailEnabled!==false?'<div class="auth-divider">OR USE EMAIL</div>':''}
      ${config.emailEnabled!==false?`<form id="accountForm"><div class="field"><label for="accountEmail">Email</label><input id="accountEmail" type="email" autocomplete="username" required></div><div class="field"><label for="accountPassword">Password</label><input id="accountPassword" type="password" autocomplete="current-password" minlength="8" maxlength="128" required></div><p id="authResult" class="account-message" role="status" aria-live="polite"></p><div class="toolbar section"><button class="button" type="submit">Sign in</button><button class="button secondary create-account" type="button" ${config.emailSignupEnabled===false?'disabled':''}>Create account</button></div><button class="text-button reset-password" type="button">Forgot your password?</button></form>`:''}
      ${config.emailSignupEnabled===false?'<p class="note">Email sign-in is available for existing password accounts. New email registration will open when email delivery is connected.</p>':''}<p class="note">Guest tracking remains available without signing in. Signing in loads your account workspace; guest work can be copied in afterward.</p>`}`;
    document.body.append(dialog);dialog.showModal();dialog.querySelector('.close-account').onclick=close;
    if(!configured())return;
    if(user){
      dialog.querySelector('.autosave-toggle').onchange=e=>{
        localStorage.setItem(AUTOSAVE_KEY+user.id,e.target.checked?'on':'off');
        applyAutosavePreference();
      };
      dialog.querySelector('.retry-sync').onclick=async e=>{
        e.currentTarget.disabled=true;
        if(!ready){const {data}=await client.auth.getSession();await loadAccount(data.session);}
        else await flush(true);
        showAccount();
      };
      dialog.querySelector('.export-draft').onclick=downloadDraft;
      if(conflict)dialog.querySelector('.load-latest').onclick=async()=>{if(!confirm('Load the latest saved account data? Unsynced changes in this tab will be replaced. Export a backup first if you need to keep them.'))return;sessionStorage.removeItem('study-draft:'+user.id);ready=false;conflict=false;dirty=false;const {data}=await client.auth.getSession();await loadAccount(data.session);showAccount();};
      dialog.querySelector('.import-guest').onclick=async()=>{if(!confirm('Replace this account’s workspace with this browser’s guest workspace? Export a backup of the current account first if needed.'))return;adapter.replace(guest());persist(adapter.read());if(autosaveEnabled())await flush();showAccount();};
      dialog.querySelector('.sign-out').onclick=async()=>{if(dirty&&autosaveEnabled()&&!(await flush()))return showAccount('Your changes have not synced yet. Export a backup or resolve the sync issue before signing out.');const {error}=await client.auth.signOut({scope:'local'});if(error)return showAccount(error.message);leaveAccount();close();};
    }else{
      dialog.querySelectorAll('.oauth-signin:not(:disabled)').forEach(button=>button.onclick=async()=>{
        button.disabled=true;
        const {error}=await client.auth.signInWithOAuth({provider:button.dataset.provider,options:{redirectTo:redirectUrl()}});
        if(error)showAccount(error.message);
      });
      const form=dialog.querySelector('form');if(!form)return;const result=dialog.querySelector('#authResult');
      async function authenticate(create){
        if(!form.reportValidity())return;
        const email=form.querySelector('#accountEmail').value.trim(),password=form.querySelector('#accountPassword').value;
        form.querySelectorAll('button').forEach(b=>b.disabled=true);result.textContent=create?'Creating your account…':'Signing in…';
        try{
          const response=create?await client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}}):await client.auth.signInWithPassword({email,password});
          form.querySelector('#accountPassword').value='';
          if(response.error)throw response.error;
          if(response.data.session){close();await loadAccount(response.data.session);}
          else result.textContent='Check your email to confirm your account, then return here to sign in. If you don’t see the email, check your spam or junk folder.';
        }catch(error){result.textContent=error.message||'Sign-in failed. Please try again.';}
        finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);}
      }
      form.onsubmit=e=>{e.preventDefault();authenticate(false);};form.querySelector('.create-account').onclick=()=>authenticate(true);
      form.querySelector('.reset-password').onclick=async()=>{const email=form.querySelector('#accountEmail');if(!email.reportValidity())return;const {error}=await client.auth.resetPasswordForEmail(email.value.trim(),{redirectTo:redirectUrl()});result.textContent=error?error.message:'If an account exists for this email, a password reset link will arrive shortly. Check your spam or junk folder if you don’t see it.';};
    }
  }
  function recovery(){close();const d=document.createElement('dialog');d.id='accountDialog';d.className='account-dialog';d.innerHTML='<h2>Set a new password</h2><form><div class="field"><label for="newAccountPassword">New password</label><input id="newAccountPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><p class="account-message" role="status"></p><p><button class="button" type="submit">Save password</button></p></form>';document.body.append(d);d.showModal();d.querySelector('form').onsubmit=async e=>{e.preventDefault();const input=d.querySelector('input'),{error}=await client.auth.updateUser({password:input.value});input.value='';if(error)d.querySelector('[role="status"]').textContent=error.message;else{close();showAccount('Password updated.');}};}
  async function init(options){
    adapter=options;$('#accountButton').onclick=()=>showAccount();$('#syncIndicator').onclick=()=>showAccount();status('Saved in this browser');
    if(!configured())return;
    try{
      if(!window.supabase?.createClient)throw Error('Account service could not start. Refresh to retry.');
      client=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      client.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY')setTimeout(recovery,0);if(event==='SIGNED_IN')setTimeout(()=>loadAccount(session),0);if(event==='SIGNED_OUT'&&user)setTimeout(leaveAccount,0);});
      const {data,error}=await client.auth.getSession();if(error)throw error;if(data.session)await loadAccount(data.session);
    }catch(error){status('Account service unavailable — guest work is still saved locally.');}
    window.addEventListener('online',()=>{if(dirty&&!conflict)flush();});
    window.addEventListener('storage',event=>{
      if(user&&event.key===AUTOSAVE_KEY+user.id)applyAutosavePreference();
    });
    window.addEventListener('beforeunload',e=>{if(dirty){cache();e.preventDefault();e.returnValue='';}});
  }
  window.StudyCloud={init,persist,flush,validWorkspace,isLoading:()=>loading||(!!user&&!ready),showAccount};
})();
