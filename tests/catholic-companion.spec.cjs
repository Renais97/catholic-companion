const {test, expect}=require('@playwright/test');

// v92 regression suite: exercise the CURRENT navigation rather than stale Phase 4 labels.
const base=()=>'/';
async function home(page){await page.goto(base());await expect(page.locator('#home')).toHaveClass(/active/);}
async function picker(page){await home(page);await page.locator('.today-rosary-btn').click();await expect(page.locator('#picker')).toHaveClass(/active/);}
async function begin(page,mode='traditional'){
 await picker(page);
 await page.locator(mode==='scriptural'?'#cpcRosaryScriptural':'#cpcRosaryTraditional').click();
 await expect(page.locator('#prayer')).toHaveClass(/active/);
}

test('home, Rosary picker and four weekday-labelled sets',async({page})=>{
 await picker(page);
 await expect(page.locator('.cpc-rosary-set-tab')).toHaveCount(4);
 for(const [key,day] of [['joyful','Monday'],['sorrowful','Tuesday'],['glorious','Wednesday'],['luminous','Thursday']]){
  const btn=page.locator(`.cpc-rosary-set-tab[data-set="${key}"]`);
  await expect(btn).toContainText(day);
  await btn.click();
  await expect(page.locator('#cpcRosaryFiveList .cpc-rosary-mystery-row')).toHaveCount(5);
 }
});

test('Traditional and Scriptural Rosary start and display correctly',async({page})=>{
 await begin(page);
 await expect(page.locator('#prayerContent')).toContainText('Sign of the Cross');
 await page.evaluate('goHome()');
 await begin(page,'scriptural');
 await expect(page.locator('#prayerContent')).toContainText('Sign of the Cross');
 await expect.poll(()=>page.evaluate('state.mode')).toBe('scriptural');
});

test('all five Rosary decades complete; no extra advances past final prayer',async({page})=>{
 await begin(page);
 const actual=await page.evaluate(()=>{
  const milestones=[];
  const target=introSteps.length+25+endingSteps.length;
  for(let i=0;i<target;i++){
   if(rosaryBeadScreen()){while(advanceRosaryBead()){}milestones.push(state.hail);}
   next();
  }
  const finalStep=state.step;next();next();
  return {finalStep,again:state.step,expected:target,beadMax:Math.max(...milestones),decades:state.decade+1};
 });
 expect(actual.finalStep).toBe(actual.expected);
 expect(actual.again).toBe(actual.finalStep);
 expect(actual.beadMax).toBeLessThanOrEqual(10);
 expect(actual.decades).toBe(5);
 await expect(page.locator('#prayerContent')).toContainText('complete');
});

test('Scriptural Rosary offers a Scripture reference for each mystery',async({page})=>{
 await begin(page,'scriptural');
 const refs=await page.evaluate(()=>{
  const out=[];
  for(let i=0;i<5;i++){
   state.step=introSteps.length+i*5;
   renderPrayer();
   out.push(document.querySelector('#prayerContent .prayer-mystery-reference')?.textContent?.trim()||'');
  }
  return out;
 });
 expect(refs).toHaveLength(5);
 for(const ref of refs)expect(ref).toMatch(/\d/);
});

test('Rosary saves step and bead across a page reload',async({page})=>{
 await begin(page);
 const saved=await page.evaluate(()=>{
  state.step=introSteps.length+2;state.hail=4;save();
  return {step:state.step,hail:state.hail};
 });
 await page.reload();
 await expect(page.locator('#resumeStrip')).toBeVisible();
 await page.locator('#resumeStrip').click();
 const resumed=await page.evaluate(()=>({step:state.step,hail:state.hail}));
 expect(resumed).toEqual(saved);
});

test('Order of Mass, gesture cues, and seasonal Creed alternatives',async({page})=>{
 await home(page);
 await page.locator('#home button.card').filter({hasText:'Order of Mass'}).click();
 await expect(page.locator('#library')).toHaveClass(/active/);
 await expect(page.locator('#libraryContent')).toContainText('Liturgy of the Eucharist');
 const rules=await page.evaluate(()=>({
   lent:cpcMassCreedForDate(new Date(2027,1,20)).creed,
   ordinary:cpcMassCreedForDate(new Date(2027,5,10)).creed,
   annunciation:cpcIsAnnunciationObserved(new Date(2027,3,5)),
   oldDate:cpcIsAnnunciationObserved(new Date(2027,2,25)),
   gesture:cpcMassCreedGesture(new Date(2027,3,5)).includes('Genuflect')
 }));
 expect(rules).toEqual({lent:'apostles',ordinary:'nicene',annunciation:true,oldDate:false,gesture:true});
});

test('Singapore 2026/2027 special days and liturgical colours',async({page})=>{
 await home(page);
 const days=await page.evaluate(()=>({
  saints2026:liturgicalColour(null,new Date(2026,10,1)).label,
  souls2026:liturgicalColour(null,new Date(2026,10,2)).label,
  saints2027:liturgicalColour(null,new Date(2027,9,31)).label,
  monday2027:liturgicalColour({celebration:{name:'All Saints',type:'SOLEMNITY'}},new Date(2027,10,1)).label,
  name2027:cpcSingaporeCalendarData(null,new Date(2027,9,31)).celebration.name
 }));
 expect(days).toEqual({saints2026:'White / Gold',souls2026:'Violet',saints2027:'White / Gold',monday2027:'Green',name2027:'All Saints'});
});

test('speech auto-chain is cancelled when navigating away',async({page})=>{
 await begin(page);
 const cancelled=await page.evaluate(async()=>{
  autoAdvance.rosary=true;autoPlayNext.rosary=true;
  cpcScheduleAuto('rosary',()=>{window.__unexpectedAudioRun=true},100);
  goHome();
  await new Promise(resolve=>setTimeout(resolve,220));
  return {pending:autoChainTimer,invoked:!!window.__unexpectedAudioRun};
 });
 expect(cancelled).toEqual({pending:null,invoked:false});
});

test('readings error fallback and USCCB Bible navigation',async({page})=>{
 await home(page);
 // Block remote API to verify graceful offline fallback on the Readings screen.
 await page.route('https://cpbjr.github.io/**',route=>route.abort());
 await page.locator('#home button.card').filter({hasText:'Daily Mass Readings'}).click();
 await expect(page.locator('#devotionContent')).toContainText('Try again');
 await expect(page.locator('#devotionContent')).toContainText('CatholicSG');
 await page.evaluate('goHome()');
 await page.locator('#home button.card').filter({hasText:'Catholic Bible'}).click();
 await expect(page.locator('#cpcBibleOnlineChapter')).toBeVisible();
 await page.selectOption('#cpcBibleUSCCBBook','genesis');
 await page.fill('#cpcBibleUSCCBChapter','12');
 await page.locator('#cpcBibleUSCCBChapter').dispatchEvent('change');
 await expect(page.locator('#cpcBibleOnlineChapter')).toHaveAttribute('href',/genesis\/12$/);
});

test('small-screen and dark-mode layout does not overflow horizontally',async({page})=>{
 await home(page);
 await page.setViewportSize({width:320,height:568});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('#themeToggle').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('.today-rosary-btn').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Divine Mercy cannot advance beyond its completion screen',async({page})=>{
 await home(page);
 await page.locator('#home button.card').filter({hasText:'Divine Mercy'}).click();
 await expect(page.locator('#devotions')).toHaveClass(/active/);
 const result=await page.evaluate(()=>{for(let i=0;i<18;i++)mercyNext();return mercyState.step});
 expect(result).toBe(16);
 await expect(page.locator('#devotionContent')).toContainText('Chaplet complete');
});

test('Angelus and Regina Caeli have separate seasonal prayer sequences',async({page})=>{
 await home(page);
 const selected=await page.evaluate(()=>({name:window.currentMarianPrayerName(),steps:window.activeMarianSteps().length}));
 expect(selected.steps).toBe(selected.name==='Regina Caeli'?4:8);
 await page.locator('#home button.card').filter({hasText:'Angelus'}).click();
 await expect(page.locator('#devotions')).toHaveClass(/active/);
 expect(await page.locator('#devotionContent').innerText()).not.toBe('');
});
