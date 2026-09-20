(function(){

  // ---------- Storage helpers ----------
  function saveLocal(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
  }
  function loadLocal(key, fallback){
    try{
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    }catch(e){ return fallback; }
  }

  // ---------- Navigation ----------
  var views = document.querySelectorAll('.view');
  var navBtns = document.querySelectorAll('[data-view]');
  function showView(name){
    views.forEach(function(v){ v.classList.toggle('active', v.id === 'view-' + name); });
    document.querySelectorAll('.navlink').forEach(function(b){ b.classList.toggle('active', b.dataset.view === name); });
    document.getElementById('navLinks').classList.remove('mobile-open');
    window.scrollTo({top:0, behavior:'instant'});
    if(name === 'plan') renderPlanView();
    if(name === 'result') {}
  }
  navBtns.forEach(function(b){ b.addEventListener('click', function(){ showView(b.dataset.view); }); });

  document.querySelectorAll('[data-scroll]').forEach(function(b){
    b.addEventListener('click', function(){
      var el = document.getElementById(b.dataset.scroll);
      if(el) el.scrollIntoView({behavior:'smooth'});
    });
  });

  document.getElementById('hamburgerBtn').addEventListener('click', function(){
    document.getElementById('navLinks').classList.toggle('mobile-open');
  });

  // ---------- Assessment data ----------
  var QUESTIONS = [
    {dim:'financial', text:"If you left your job today, how long could you comfortably cover your essential expenses?", options:[["Less than 1 month",0],["1–3 months",25],["3–6 months",50],["6–12 months",75],["More than 12 months",100]]},
    {dim:'financial', text:"Do you know your essential monthly expenses precisely?", options:[["Not really",0],["Roughly",50],["Yes, precisely",100]]},
    {dim:'financial', text:"How manageable is your current debt or fixed financial obligations?", options:[["Significant burden",0],["Some, but manageable",50],["Minimal or none",100]]},
    {dim:'financial', text:"Do you have a plan for covering the income gap while you transition?", options:[["No plan yet",0],["Some idea",50],["A clear plan",100]]},
    {dim:'financial', text:"Do you have a monthly budget you actually track?", options:[["No",0],["Somewhat",50],["Yes, in detail",100]]},

    {dim:'career', text:"Do you have a clear idea of what you want to do next?", options:[["Not yet",0],["I have some ideas",33],["I have a clear direction",66],["I already have a plan",100]]},
    {dim:'career', text:"How current is your CV or portfolio?", options:[["Quite outdated",0],["Needs some work",50],["Up to date",100]]},
    {dim:'career', text:"Have you identified specific target roles or companies?", options:[["None yet",0],["A few in mind",50],["Specific roles researched",100]]},
    {dim:'career', text:"How strong is your network in the direction you're considering?", options:[["Weak",0],["Some connections",50],["Strong network",100]]},

    {dim:'wellbeing', text:"How would you describe your energy at work lately?", options:[["Running on empty",0],["Up and down",50],["Generally good",100]]},
    {dim:'wellbeing', text:"How would you describe your stress level right now?", options:[["High",0],["Moderate",50],["Low",100]]},
    {dim:'wellbeing', text:"How is your work-life balance currently?", options:[["Poor",0],["Okay",50],["Good",100]]},
    {dim:'wellbeing', text:"Do you have people you can talk to about this decision?", options:[["No one",0],["A few people",50],["Strong support",100]]},
    {dim:'wellbeing', text:"How motivated do you feel about your current role day to day?", options:[["Not at all",0],["Somewhat",50],["Fairly motivated",100]]},

    {dim:'practical', text:"Do you know your notice period and contractual obligations?", options:[["No idea",0],["Roughly",50],["Exactly",100]]},
    {dim:'practical', text:"Are your important documents and personal files organized and backed up?", options:[["No",0],["Partially",50],["Yes",100]]},
    {dim:'practical', text:"Have you thought through how you'd hand over your responsibilities?", options:[["Not at all",0],["Some idea",50],["A clear plan",100]]},
    {dim:'practical', text:"Have you talked through the timing with anyone this decision affects (partner, family)?", options:[["Not yet / not applicable",50],["Somewhat",75],["Yes, fully",100]]}
  ];

  var DIM_LABEL = {financial:'Financial', career:'Career', wellbeing:'Well-being', practical:'Practical'};
  var DIM_COLOR = {financial:'#3FCF8E', career:'#16B674', wellbeing:'#DC7B18', practical:'#0A844E'};

  var qIndex = 0;
  var answers = new Array(QUESTIONS.length).fill(null);

  document.getElementById('startAssessBtn').addEventListener('click', function(){
    document.getElementById('assessIntro').style.display = 'none';
    document.getElementById('assessBody').style.display = 'block';
    qIndex = 0;
    renderQuestion();
  });

  function renderQuestion(){
    var q = QUESTIONS[qIndex];
    document.getElementById('progressFill').style.width = Math.round(((qIndex)/QUESTIONS.length)*100) + '%';
    document.getElementById('progressText').textContent = 'Question ' + (qIndex+1) + ' of ' + QUESTIONS.length;
    document.getElementById('progressDim').textContent = DIM_LABEL[q.dim];
    document.getElementById('qText').textContent = q.text;
    var opWrap = document.getElementById('qOptions');
    opWrap.innerHTML = '';
    q.options.forEach(function(opt){
      var b = document.createElement('button');
      b.className = 'option';
      b.textContent = opt[0];
      if(answers[qIndex] === opt[1]) b.classList.add('selected');
      b.addEventListener('click', function(){
        answers[qIndex] = opt[1];
        if(qIndex < QUESTIONS.length - 1){
          qIndex++;
          renderQuestion();
        } else {
          finishAssessment();
        }
      });
      opWrap.appendChild(b);
    });
    document.getElementById('backBtn').style.visibility = qIndex === 0 ? 'hidden' : 'visible';
  }

  document.getElementById('backBtn').addEventListener('click', function(){
    if(qIndex > 0){ qIndex--; renderQuestion(); }
  });
  document.getElementById('skipBtn').addEventListener('click', function(){
    if(qIndex < QUESTIONS.length - 1){ qIndex++; renderQuestion(); }
    else { finishAssessment(); }
  });

  function finishAssessment(){
    var sums = {financial:[], career:[], wellbeing:[], practical:[]};
    QUESTIONS.forEach(function(q, i){
      if(answers[i] !== null) sums[q.dim].push(answers[i]);
    });
    var scores = {};
    Object.keys(sums).forEach(function(dim){
      var arr = sums[dim];
      scores[dim] = arr.length ? Math.round(arr.reduce(function(a,b){return a+b;},0)/arr.length) : 0;
    });
    saveLocal('rr_scores', scores);
    renderResult(scores);
    showView('result');
  }

  function renderResult(scores){
    var order = ['financial','career','wellbeing','practical'];
    var avg = Math.round(order.reduce(function(a,d){return a+scores[d];},0)/order.length);
    var lede = document.getElementById('resultLede');
    if(avg >= 75) lede.textContent = "You're in a strong position — a few things left to tighten up.";
    else if(avg >= 45) lede.textContent = "You're making progress — but there are a few things to prepare first.";
    else lede.textContent = "You're at the start of this — and that's a fine place to begin.";

    var barsWrap = document.getElementById('resultBars');
    barsWrap.innerHTML = '';
    order.forEach(function(dim){
      var row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = '<div class="top"><span>'+DIM_LABEL[dim]+'</span><span class="pct">'+scores[dim]+'%</span></div>'+
        '<div class="bar-track"><div class="bar-fill" style="width:'+scores[dim]+'%; background:'+DIM_COLOR[dim]+';"></div></div>';
      barsWrap.appendChild(row);
    });

    var careNote = document.getElementById('careNote');
    if(scores.wellbeing < 30){
      careNote.style.display = 'block';
      careNote.textContent = "Your well-being answers suggest things may feel heavier than usual right now. Consider talking this through with a counselor, doctor, or trusted support service before making a major decision — separate from this planning tool.";
    } else {
      careNote.style.display = 'none';
    }

    var FOCUS_COPY = {
      financial: {title:'Build your financial buffer', desc:'Review your monthly essential expenses and grow your emergency savings.'},
      career: {title:'Clarify your next career direction', desc:'Explore roles that match your skills and interests, and start researching them.'},
      wellbeing: {title:'Give yourself space to reflect', desc:'Talk it through with someone you trust before deciding anything.'},
      practical: {title:'Prepare your exit logistics', desc:'Review your notice period, documents, and handover responsibilities.'}
    };
    var sorted = order.slice().sort(function(a,b){ return scores[a]-scores[b]; });
    var focusList = document.getElementById('focusList');
    focusList.innerHTML = '';
    sorted.slice(0,3).forEach(function(dim, i){
      var item = document.createElement('div');
      item.className = 'focus-item';
      item.innerHTML = '<div class="num">0'+(i+1)+'</div><div><h4>'+FOCUS_COPY[dim].title+'</h4><p>'+FOCUS_COPY[dim].desc+'</p></div>';
      focusList.appendChild(item);
    });
  }

  document.getElementById('buildPlanBtn').addEventListener('click', function(){ showView('plan'); });

  // Restore previous result if present
  var savedScores = loadLocal('rr_scores', null);
  if(savedScores) renderResult(savedScores);

  // ---------- Plan: checklist ----------
  var CHECKLIST = {
    Career: ['Update CV', 'Update portfolio', 'Prepare references', 'Research target roles'],
    Finance: ['Build emergency fund', 'Confirm monthly budget', 'Review outstanding debt', 'Review insurance and benefits'],
    Work: ['Confirm notice period', 'Plan handover', 'Gather important documents', 'Back up personal files'],
    Personal: ['Discuss timing with partner or family, if relevant', 'Plan time off between roles', 'Prepare your routine after leaving']
  };

  function checklistIds(){
    var ids = [];
    Object.keys(CHECKLIST).forEach(function(g){ CHECKLIST[g].forEach(function(item, i){ ids.push(g+'-'+i); }); });
    return ids;
  }

  function renderChecklist(){
    var checked = loadLocal('rr_checklist', {});
    var wrap = document.getElementById('checklistGroups');
    wrap.innerHTML = '';
    Object.keys(CHECKLIST).forEach(function(group){
      var section = document.createElement('div');
      section.className = 'check-group';
      var h = document.createElement('h3');
      h.textContent = group;
      section.appendChild(h);
      CHECKLIST[group].forEach(function(item, i){
        var id = group + '-' + i;
        var row = document.createElement('div');
        row.className = 'check-item' + (checked[id] ? ' checked' : '');
        row.innerHTML = '<input type="checkbox" id="chk-'+id+'" '+(checked[id] ? 'checked' : '')+'><label for="chk-'+id+'">'+item+'</label>';
        section.appendChild(row);
        row.querySelector('input').addEventListener('change', function(e){
          var c = loadLocal('rr_checklist', {});
          c[id] = e.target.checked;
          saveLocal('rr_checklist', c);
          row.classList.toggle('checked', e.target.checked);
          updateChecklistProgress();
        });
      });
      wrap.appendChild(section);
    });
    updateChecklistProgress();
  }

  function updateChecklistProgress(){
    var checked = loadLocal('rr_checklist', {});
    var ids = checklistIds();
    var done = ids.filter(function(id){ return checked[id]; }).length;
    var pct = ids.length ? Math.round((done/ids.length)*100) : 0;
    document.getElementById('checklistBarFill').style.width = pct + '%';
    document.getElementById('checklistAmt').textContent = done + ' of ' + ids.length + ' done';
  }

  // ---------- Plan: tabs ----------
  document.querySelectorAll('.tab').forEach(function(t){
    t.addEventListener('click', function(){
      document.querySelectorAll('.tab').forEach(function(x){ x.classList.remove('active'); });
      document.querySelectorAll('.tabpanel').forEach(function(x){ x.classList.remove('active'); });
      t.classList.add('active');
      document.getElementById('tab-' + t.dataset.tab).classList.add('active');
    });
  });

  // ---------- Plan: timeline ----------
  var TIMELINE_STAGES = ['Financial check','Career exploration','CV / Portfolio','Job search','Offer / next step','Resignation','Transition'];

  function renderTimeline(months){
    var wrap = document.getElementById('timelineList');
    wrap.innerHTML = '';
    var startNow = document.createElement('div');
    var totalDays = months > 0 ? months * 30 : null;
    TIMELINE_STAGES.forEach(function(stage, i){
      var item = document.createElement('div');
      item.className = 'tl-item';
      var when = 'Whenever you\'re ready';
      if(totalDays !== null){
        var dayOffset = Math.round((i/(TIMELINE_STAGES.length-1)) * totalDays);
        var d = new Date();
        d.setDate(d.getDate() + dayOffset);
        when = i === 0 ? 'Starting now' : d.toLocaleDateString(undefined, {month:'short', year:'numeric'});
      }
      item.innerHTML = '<div class="tl-dot-col"><div class="tl-dot"></div><div class="tl-line"></div></div>'+
        '<div class="tl-body"><h4>'+stage+'</h4><div class="when">'+when+'</div></div>';
      wrap.appendChild(item);
    });
  }

  document.querySelectorAll('.tf-opt').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.tf-opt').forEach(function(b){ b.classList.remove('selected'); });
      btn.classList.add('selected');
      var months = parseInt(btn.dataset.months, 10);
      saveLocal('rr_timeframe', btn.dataset.tf);
      renderTimeline(months);
    });
  });

  function renderPlanView(){
    renderChecklist();
    var savedTf = loadLocal('rr_timeframe', null);
    if(savedTf){
      var match = document.querySelector('.tf-opt[data-tf="'+savedTf+'"]');
      if(match){ match.click(); }
    } else {
      document.getElementById('timelineList').innerHTML = '<p style="color:var(--ink-faint); font-size:14.5px;">Choose a timeframe above to see a suggested timeline.</p>';
    }
  }

  // ---------- Financial calculator ----------
  document.getElementById('calcRunwayBtn').addEventListener('click', function(){
    var income = parseFloat(document.getElementById('finIncome').value) || 0;
    var expenses = parseFloat(document.getElementById('finExpenses').value) || 0;
    var savings = parseFloat(document.getElementById('finSavings').value) || 0;
    var debt = parseFloat(document.getElementById('finDebt').value) || 0;
    var nextIncome = parseFloat(document.getElementById('finNextIncome').value) || 0;
    var desiredOff = parseFloat(document.getElementById('finTimeOff').value) || 0;

    var monthlyBurn = Math.max(expenses + debt - nextIncome, 1);
    var runway = savings / monthlyBurn;
    runway = Math.round(runway * 10) / 10;

    var resultBox = document.getElementById('finResult');
    resultBox.classList.add('show');
    document.getElementById('finHeadline').textContent = 'Your current savings could cover approximately ' + runway + ' months of essential expenses.';

    var maxScale = Math.max(runway * 1.4, desiredOff * 1.4, 6);
    var pct = Math.min((runway / maxScale) * 100, 100);
    document.getElementById('finBarFill').style.width = pct + '%';
    document.getElementById('finMaxLabel').textContent = Math.round(maxScale) + ' months';

    var sub = '';
    if(desiredOff > 0){
      sub = runway >= desiredOff
        ? 'That covers your desired ' + desiredOff + ' month' + (desiredOff===1?'':'s') + ' off, with some room to spare.'
        : 'That falls short of your desired ' + desiredOff + ' month' + (desiredOff===1?'':'s') + ' off by about ' + (Math.round((desiredOff - runway)*10)/10) + ' months — worth building your buffer before you go.';
    } else {
      sub = 'This is based only on the numbers you entered — update them any time your situation changes.';
    }
    document.getElementById('finSubnote').textContent = sub;
    resultBox.scrollIntoView({behavior:'smooth', block:'nearest'});
  });

})();
