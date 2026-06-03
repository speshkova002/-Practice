var G = {};

function fresh() {
  return {
    charIdx:   0,        
    diffIdx:   1,        
    money:     0,        
    deposit:   0,        
    depProd:   'piggy',  
    frozen:    0,        
    xp:        0,        
    score:     0,        
    day:       1,        
    hp:        100,      
    bag:       [],       
    usedEvents:[],       
    usedMinis: [],       
    bankAmt:   0,        
    dayLog:    [],       
    storyFlags:[],       
    dayConseq: [],       
    dayRatings:[],       
    critMissStreak: {},  
    firstDay:  true,     
    calcTaskIdx: 0,      
    _acc:      false     
  };
}

G = fresh();

function show(id) {
  document.querySelectorAll('.sc').forEach(function(s) { s.classList.remove('on'); });
  document.getElementById(id).classList.add('on');
  window.scrollTo(0, 0);
}

function R(n) { return n + ' руб.'; }

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function find(arr, fn) {
  for (var i = 0; i < arr.length; i++) if (fn(arr[i])) return arr[i];
  return null;
}

function has(arr, val) { return arr.indexOf(val) >= 0; }

function shuffle(arr) {
  var b = arr.slice();
  for (var i = b.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = b[i]; b[i] = b[j]; b[j] = t;
  }
  return b;
}

function hpColor(hp) {
  return hp > 60 ? '#10b981' : hp > 30 ? '#f59e0b' : '#ef4444';
}

function hpLabel(hp) {
  return hp > 60 ? 'Хорошо' : hp > 30 ? 'Устал' : 'Плохо';
}

function updateHpPills() {
  var hp  = G.hp;
  var txt = '❤️ ' + hp + '% ' + hpLabel(hp);
  ['ds-hp-pill', 'sh-hp-pill', 'ev-hp-pill', 'bk-hp-pill'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  });
}

function pickChar(i) {
  G.charIdx = i;
  
  document.querySelectorAll('.cc').forEach(function(c, j) {
    c.classList.toggle('sel', j === i);
  });
  
  var ch     = CHARS[i];
  var box    = document.getElementById('char-info');
  var income = DIFF[G.diffIdx].income;
  var oblCost = ch.needs.reduce(function(s, n) { return s + n.cost; }, 0);
  var free   = income - oblCost;
  
  var bg  = ch.avStyle.split(';')[0].replace('background:', '').trim();
  var bor = ch.avStyle.split(';')[1] ? ch.avStyle.split(';')[1].replace('border-color:', '').trim() : '#ccc';

  box.style.display = 'block';
  box.innerHTML =
    '<div style="background:' + bg + ';border-radius:14px;padding:12px 14px;margin:4px 0;border:2px solid ' + bor + '">' +
      '<div style="font-size:13px;font-weight:800;color:#1e1b4b;margin-bottom:8px;line-height:1.5">' + ch.desc + '</div>' +
      '<div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px">Обязательные расходы ' + ch.nameGen + ' каждый день:</div>' +
      ch.needs.map(function(n) {
        return '<div style="font-size:12px;font-weight:700;color:#374151;padding:2px 0">' + n.em + ' ' + n.name + ' - ' + R(n.cost) + '</div>';
      }).join('') +
      
      '<div style="margin-top:10px;padding:10px 12px;background:rgba(255,255,255,.6);border-radius:10px;border:2px solid ' + bor + '">' +
        '<div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:4px">Мечта ' + ch.em + ':</div>' +
        '<div style="font-size:18px;font-weight:900;color:#92400e">' + ch.dream + '</div>' +
        '<div style="font-size:11px;color:#b45309;font-weight:700;margin-top:2px">Стоит ' + R(ch.dreamCost) + ' - именно ради этого ты играешь!</div>' +
      '</div>' +
      '<div style="margin-top:8px;font-size:12px;font-weight:700;color:#374151">' +
        '💰 Доход: ' + R(income) + ' - Обязательно: ' + R(oblCost) +
        ' - Свободно: <span style="color:' + (free >= 0 ? '#10b981' : '#ef4444') + '">' + R(free) + '</span>' +
      '</div>' +
    '</div>';
}

function pickDiff(i) {
  G.diffIdx = i;
  document.querySelectorAll('.dc').forEach(function(c, j) {
    c.classList.toggle('sel', j === i);
  });
  
  if (document.querySelector('.cc.sel')) pickChar(G.charIdx);
}

function startGame() {
  if (!document.querySelector('.cc.sel')) { alert('Сначала выбери персонажа!'); return; }
  
  var ci = parseInt(document.querySelector('.cc.sel').id.replace('ch', ''), 10);
  var di = parseInt(document.querySelector('.dc.sel').id.replace('df', ''), 10);
  G = fresh();
  G.charIdx = ci;
  G.diffIdx = di;
  G.money   = DIFF[di].income;
  showDS();
}

function showDS() {
  var ch = CHARS[G.charIdx];

  
  document.getElementById('ds-t').textContent = 'День ' + G.day + ' из 7';
  document.getElementById('ds-c').textContent = R(G.money);
  document.getElementById('ds-x').textContent = G.xp;
  document.getElementById('ds-av').textContent   = ch.em;
  document.getElementById('ds-av').style.cssText = ch.avStyle;
  updateHpPills();

  
  var acc = 0;
  if (G.deposit > 0 && G.depProd !== 'piggy' && !G._acc) {
    var pr = find(BANK_PRODS, function(x) { return x.id === G.depProd; });
    if (pr && G.frozen <= 0) {
      acc = Math.floor(G.deposit * pr.rate);
      G.deposit += acc;
    }
    if (G.frozen > 0) G.frozen--;
    G._acc = true;
  }

  
  var con = document.getElementById('ds-con');
  if (G.dayConseq.length) {
    con.innerHTML = '<div class="con-box">😬 Последствия вчерашнего дня:<br>' +
      G.dayConseq.map(function(m) { return '• ' + m; }).join('<br>') + '</div>';
    G.dayConseq = [];
  } else {
    con.innerHTML = '';
  }

  
  document.getElementById('ds-int').innerHTML = acc > 0
    ? '<div class="out og" style="margin:5px 0">💹 Проценты по вкладу: +' + R(acc) + '! Вклад теперь ' + R(G.deposit) + '</div>'
    : '';

  
  var pct = G.deposit >= ch.dreamCost ? 100 : Math.round(G.deposit / ch.dreamCost * 100);
  document.getElementById('ds-dream').innerHTML =
    '<div class="dream-big">' +
      '<div class="dream-big-icon">' + ch.dream.split(' ')[0] + '</div>' +
      '<div class="dream-big-text">' +
        '<div class="dream-big-title">Мечта ' + ch.nameGen + ': ' + ch.dream + '</div>' +
        '<div class="dream-big-sub">Накоплено: ' + R(G.deposit) + ' из ' + R(ch.dreamCost) + '</div>' +
        '<div class="dream-big-prog">' +
          '<div class="pb-w" style="margin:5px 0 2px"><div class="pb" style="width:' + pct + '%"></div></div>' +
          '<div style="font-size:11px;font-weight:700;color:#b45309">' + pct + '% к мечте!</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  
  document.getElementById('ds-obl').innerHTML =
    '<div class="out oy">' +
      '<b>📋 Обязательные покупки ' + ch.nameGen + ' сегодня:</b><br>' +
      ch.needs.map(function(n) { return n.em + ' ' + n.name + ' - ' + R(n.cost); }).join('<br>') +
    '</div>';

  
  var speeches = [
    'День 1! ' + ch.nameDat + ' дают ' + R(DIFF[G.diffIdx].income) + ' карманных денег. Сначала - магазин, потом работа и банк!',
    'День ' + G.day + '! В кошельке ' + ch.nameGen + ': ' + R(G.money) + '. Подумай хорошо что покупать в магазине!',
    'День ' + G.day + '! Следи за самочувствием ' + ch.nameGen + ' на верхней панели.',
    'День ' + G.day + '! Вклад в банке приносит ' + ch.nameDat + ' проценты каждое утро!'
  ];
  document.getElementById('ds-sp').textContent = speeches[Math.min(G.day - 1, speeches.length - 1)];

  
  renderDayFlow();

  show('s-ds');
}

function renderDayFlow() {
  var phases = [{em:'🛒',l:'Магазин'},{em:'💼',l:'Работа'},{em:'🏦',l:'Банк'},{em:'🏠',l:'Домой'}];
  var wrap   = document.getElementById('ds-flow');
  wrap.innerHTML = '';
  var row = document.createElement('div');
  row.className = 'dayflow';
  phases.forEach(function(p, i) {
    var s  = document.createElement('div'); s.className = 'dfs';
    var d  = document.createElement('div'); d.className = 'dfd lk'; d.textContent = p.em;
    var lb = document.createElement('div'); lb.className = 'dflbl'; lb.textContent = p.l;
    s.appendChild(d); s.appendChild(lb); row.appendChild(s);
    if (i < phases.length - 1) {
      var l = document.createElement('div'); l.className = 'dfl'; row.appendChild(l);
    }
  });
  wrap.appendChild(row);
}

function checkGameOver() {
  var ch = CHARS[G.charIdx];

  
  if (G.hp <= 0) {
    document.getElementById('over-title').textContent = 'Нужен отдых!';
    document.getElementById('over-msg').textContent =
      'Из-за неразумных трат ' + ch.nameDat + ' нужен отдых - начни игру сначала! ' +
      'Не забывай покупать еду и воду каждый день.';
    show('s-over');
    return true;
  }

  
  var critIds = ch.needs
    .filter(function(n) { return n.isCritical; })
    .map(function(n) { return n.id; });

  for (var i = 0; i < critIds.length; i++) {
    if ((G.critMissStreak[critIds[i]] || 0) >= 2) {
      document.getElementById('over-title').textContent = 'Нужен отдых!';
      document.getElementById('over-msg').textContent =
        'Из-за неразумных трат ' + ch.nameDat + ' нужен отдых - начни игру сначала! ' +
        'Два дня без еды или воды - это опасно!';
      show('s-over');
      return true;
    }
  }
  return false;
}

function goShop() {
  G.bag = [];  
  document.getElementById('sh-c').textContent = R(G.money);
  renderShop();
  updateHpPills();
  show('s-shop');
}

function bagTotal() {
  return G.bag.reduce(function(sum, id) {
    var n = find(CHARS[G.charIdx].needs,  function(x) { return x.id === id; });
    var w = find(SHOP_WANTS,              function(x) { return x.id === id; });
    return sum + (n ? n.cost : w ? w.cost : 0);
  }, 0);
}

function getNeedIds() {
  return CHARS[G.charIdx].needs.map(function(n) { return n.id; });
}

function renderShop() {
  var list    = document.getElementById('sh-list');
  var needIds = getNeedIds();
  var spent   = bagTotal();
  list.innerHTML = '';

  
  CHARS[G.charIdx].needs.forEach(function(need) {
    var inBag    = has(G.bag, need.id);
    var cantBuy  = !inBag && (G.money - spent < need.cost);
    var div = document.createElement('div');
    div.className = 'sh-item' + (inBag ? ' chosen' : cantBuy ? ' no-cash' : '');
    div.innerHTML =
      '<span style="font-size:22px">'  + need.em + '</span>' +
      '<div style="flex:1"><div style="font-size:13px;font-weight:800;color:#1e1b4b">' + need.name + '</div></div>' +
      '<span style="font-size:13px;font-weight:800;color:' + (inBag ? '#10b981' : cantBuy ? '#ef4444' : '#6b7280') + '">' + R(need.cost) + '</span>' +
      (inBag ? '<span style="font-size:16px">✅</span>' : '');
    div.onclick = (function(id) { return function() { toggleShop(id); }; })(need.id);
    list.appendChild(div);
  });

  
  var sep = document.createElement('div');
  sep.style.cssText = 'margin:10px 0 6px;font-size:11px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px';
  sep.textContent   = 'Ещё можно купить:';
  list.appendChild(sep);

  
  SHOP_WANTS.forEach(function(item) {
    var inBag   = has(G.bag, item.id);
    var cantBuy = !inBag && (G.money - spent < item.cost);
    var div = document.createElement('div');
    div.className = 'sh-item' + (inBag ? ' chosen' : cantBuy ? ' no-cash' : '');
    div.innerHTML =
      '<span style="font-size:22px">' + item.em + '</span>' +
      '<div style="flex:1"><div style="font-size:13px;font-weight:800;color:#1e1b4b">' + item.name + '</div></div>' +
      '<span style="font-size:13px;font-weight:800;color:' + (inBag ? '#10b981' : cantBuy ? '#ef4444' : '#6b7280') + '">' + R(item.cost) + '</span>' +
      (inBag ? '<span style="font-size:16px">✅</span>' : '');
    div.onclick = (function(id) { return function() { toggleShop(id); }; })(item.id);
    list.appendChild(div);
  });

  updateBag();
}

function toggleShop(id) {
  var idx = G.bag.indexOf(id);
  if (idx >= 0) {
    G.bag.splice(idx, 1);
  } else {
    var n    = find(CHARS[G.charIdx].needs, function(x) { return x.id === id; });
    var w    = find(SHOP_WANTS,             function(x) { return x.id === id; });
    var item = n || w;
    if (G.money - bagTotal() < item.cost) return;  
    G.bag.push(id);
  }
  renderShop();
}

function updateBag() {
  var box   = document.getElementById('sh-bag');
  var total = bagTotal();
  if (!G.bag.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  document.getElementById('sh-bag-e').textContent = G.bag.map(function(id) {
    var n = find(CHARS[G.charIdx].needs, function(x) { return x.id === id; });
    var w = find(SHOP_WANTS,             function(x) { return x.id === id; });
    return (n || w).em;
  }).join(' ');
  document.getElementById('sh-bag-t').textContent = R(total);
  document.getElementById('sh-bag-l').textContent = R(G.money - total);
  document.getElementById('sh-c').textContent     = R(G.money - total);
}

function doCheckout() {
  var ch      = CHARS[G.charIdx];
  var total   = bagTotal();
  
  var skipped = ch.needs.filter(function(n) { return !has(G.bag, n.id); });
  
  var pts = G.bag.reduce(function(s, id) {
    var w = find(SHOP_WANTS, function(x) { return x.id === id; });
    return s + (w ? w.pts : 0);
  }, 0);

  
  skipped.forEach(function(n) {
    G.hp = Math.max(0, G.hp - n.hpLoss);
    G.dayConseq.push(n.skipMsg);
    G.storyFlags.push(n.skipStory);
    if (n.isCritical) G.critMissStreak[n.id] = (G.critMissStreak[n.id] || 0) + 1;
  });
  
  ch.needs.filter(function(n) { return has(G.bag, n.id) && n.isCritical; })
          .forEach(function(n) { G.critMissStreak[n.id] = 0; });

  if (skipped.length === 0) pts += 8;  

  G.money  -= total;
  G.xp     += pts;
  G.score  += pts;
  G.dayLog.push('🛒 -' + R(total) + (skipped.length ? ' (пропущено ' + skipped.length + ')' : ''));

  updateHpPills();
  if (checkGameOver()) return;
  maybeEvent();
}

function maybeEvent() {
  
  var avail = EVENTS.filter(function(e) { return !has(G.usedEvents, e.id); });
  if (avail.length && G.day >= 1 && Math.random() > 0.4) {
    var ev = avail[Math.floor(Math.random() * avail.length)];
    G.usedEvents.push(ev.id);
    openEv(ev);
  } else {
    goWork();
  }
}

function openEv(ev) {
  G._ev = ev;
  document.getElementById('ev-t').textContent        = ev.title;
  document.getElementById('ev-av').textContent        = ev.avEm;
  document.getElementById('ev-av').style.cssText      = 'background:' + ev.avBg + ';border-color:' + ev.avBor;
  document.getElementById('ev-sp').style.cssText      = 'background:' + ev.spBg + ';color:' + ev.spC;
  document.getElementById('ev-sp').textContent        = ev.speech;
  document.getElementById('ev-c').textContent         = R(G.money);
  document.getElementById('ev-res').innerHTML         = '';
  document.getElementById('ev-nx').style.display      = 'none';

  var cont      = document.getElementById('ev-ch');
  cont.innerHTML = '';

  
  var allLocked = true;
  ev.opts.forEach(function(opt) {
    if (!(opt.cost > 0 && opt.cost > G.money)) allLocked = false;
  });

  
  if (allLocked) {
    var ch = CHARS[G.charIdx];
    document.getElementById('over-title').textContent = 'Закончились деньги!';
    document.getElementById('over-msg').textContent   =
      'У ' + ch.nameGen + ' не хватило денег ни на один вариант. ' +
      'Следи за расходами и не трать всё сразу! Начни игру сначала.';
    show('s-over');
    return;
  }

  ev.opts.forEach(function(opt, i) {
    var cantAfford = opt.cost > 0 && opt.cost > G.money;
    var card = document.createElement('div');
    card.className = 'card' + (cantAfford ? ' locked-opt' : '');
    if (cantAfford) {
      card.style.opacity        = '.35';
      card.style.pointerEvents  = 'none';
      card.style.cursor         = 'not-allowed';
    }
    card.innerHTML =
      '<span style="font-size:22px">' + opt.em + '</span>' +
      '<div style="flex:1">' +
        '<div style="font-size:13px;font-weight:800;color:#1e1b4b">' + opt.t + '</div>' +
        '<div style="font-size:11px;color:#9ca3af;font-weight:600">' +
          (cantAfford ? '⛔ Не хватает денег' : opt.s) +
        '</div>' +
      '</div>' +
      '<span style="font-size:12px;font-weight:800;' +
        (cantAfford ? 'color:#9ca3af' : opt.cost > 0 ? 'color:#ef4444' : 'color:#10b981') + '">' +
        (opt.cost > 0 ? '-' + R(opt.cost) : 'Бесплатно') +
      '</span>';
    if (!cantAfford) {
      card.onclick = (function(idx) { return function() { resolveEv(idx); }; })(i);
    }
    cont.appendChild(card);
  });

  updateHpPills();
  show('s-ev');
}

function resolveEv(idx) {
  var ev  = G._ev;
  var opt = ev.opts[idx];

  G.money = Math.max(0, G.money - opt.cost);
  if (opt.scam)   G.money = Math.floor(G.money / 2);  
  if (opt.hpLoss) G.hp = Math.max(0, G.hp - opt.hpLoss);
  if (opt.earn)   G.money += opt.earn;  

  G.xp    += opt.pts;
  G.score += opt.pts;
  document.getElementById('ev-c').textContent = R(G.money);
  updateHpPills();

  
  var cards = document.getElementById('ev-ch').querySelectorAll('.card');
  for (var i = 0; i < cards.length; i++) {
    if (i === idx) {
      cards[i].style.borderColor = opt.good ? '#22c55e' : '#ef4444';
      cards[i].style.background  = opt.good ? '#dcfce7' : '#fef2f2';
    } else {
      cards[i].style.opacity       = '.3';
      cards[i].style.pointerEvents = 'none';
    }
  }

  document.getElementById('ev-res').innerHTML =
    '<div class="out ' + (opt.good ? 'og' : 'ob') + '">' +
    (opt.good ? '✅' : '💡') + ' ' + opt.tip + '</div>';
  document.getElementById('ev-nx').style.display = 'inline-flex';

  G.dayLog.push(ev.title + ': «' + opt.t + '»');
  if (checkGameOver()) document.getElementById('ev-nx').style.display = 'none';
}

function afterEv() { goWork(); }

function goWork() {
  
  var avail = MINI_TYPES.filter(function(m) { return !has(G.usedMinis, m); });
  if (!avail.length) G.usedMinis = [];  
  avail = MINI_TYPES.filter(function(m) { return !has(G.usedMinis, m); });

  var type = avail[Math.floor(Math.random() * avail.length)];
  G.usedMinis.push(type);

  document.getElementById('wk-c').textContent       = R(G.money);
  document.getElementById('wk-body').innerHTML      = '';
  document.getElementById('wk-btns').innerHTML      = '';

  
  if      (type === 'sort')    startSort();
  else if (type === 'budget')  startBudget();
  else if (type === 'calc')    startCalc();
  else if (type === 'chain')   startChain();
  else if (type === 'catch')   startCatch();
  else if (type === 'grocery') startGrocery();

  show('s-work');
}

function startSort() {
  var items = [
    { em:'🍱', name:'Обед',    cat:'need' },
    { em:'🎮', name:'Игра',    cat:'want' },
    { em:'🚌', name:'Автобус', cat:'need' },
    { em:'🍬', name:'Конфеты', cat:'want' },
    { em:'💧', name:'Вода',    cat:'need' },
    { em:'🧸', name:'Игрушка', cat:'want' }
  ];
  shuffle(items);
  var idx = 0; var correct = 0;

  document.getElementById('wk-sp').textContent =
    'Степан Сыч: «Разложи карточки - это ВАЖНО или ЖЕЛАНИЕ? Заработаешь до 60 руб.»';

  function renderStep() {
    var body = document.getElementById('wk-body');
    var btns = document.getElementById('wk-btns');
    body.innerHTML = ''; btns.innerHTML = '';

    if (idx >= items.length) {
      
      var earned = correct * 10;
      G.money += earned; G.xp += correct * 5; G.score += correct * 8;
      document.getElementById('wk-c').textContent = R(G.money);
      G.dayLog.push('💼 Сортировка: +' + R(earned) + ' (' + correct + '/' + items.length + ')');
      body.innerHTML =
        '<div class="out ' + (correct >= 5 ? 'og' : correct >= 3 ? 'oi' : 'ob') + '">' +
        (correct === items.length ? '🏆 Идеально!' : correct >= 4 ? '👍 Хорошо!' : '📚 Попробуй ещё!') +
        ' ' + correct + ' из ' + items.length + ' верно. Заработано: <b>' + R(earned) + '</b></div>';
      btns.innerHTML = '<button class="btn g" onclick="goBank()">В банк 🏦</button>';
      return;
    }

    var cur = items[idx];
    
    var prog = document.createElement('div');
    prog.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#6b7280;margin-bottom:8px';
    prog.textContent = 'Карточка ' + (idx + 1) + ' из ' + items.length;
    body.appendChild(prog);

    
    var bigDiv = document.createElement('div');
    bigDiv.style.cssText = 'text-align:center;padding:18px;background:linear-gradient(135deg,#ede9fe,#dbeafe);border-radius:16px;margin-bottom:12px';
    bigDiv.innerHTML = '<div style="font-size:54px">' + cur.em + '</div><div style="font-size:16px;font-weight:900;color:#1e1b4b;margin-top:6px">' + cur.name + '</div>';
    body.appendChild(bigDiv);

    
    var row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px';
    [
      { cat:'need', em:'✅', lbl:'Важно!',   bg:'linear-gradient(135deg,#d1fae5,#a7f3d0)', bc:'#10b981', tc:'#065f46' },
      { cat:'want', em:'💜', lbl:'Желание',  bg:'linear-gradient(135deg,#ede9fe,#ddd6fe)', bc:'#8b5cf6', tc:'#5b21b6' }
    ].forEach(function(btn) {
      var b = document.createElement('div');
      b.style.cssText = 'background:' + btn.bg + ';border:2px solid ' + btn.bc + ';border-radius:14px;padding:14px;text-align:center;cursor:pointer;font-weight:800;color:' + btn.tc;
      b.innerHTML = '<div style="font-size:24px">' + btn.em + '</div><div style="font-size:13px;margin-top:4px">' + btn.lbl + '</div>';
      b.onclick = (function(cat) { return function() {
        var ok = cur.cat === cat;
        if (ok) correct++;
        var whyMap = { need: 'Без этого нельзя нормально жить!', want: 'Это желание - приятно, но можно обойтись.' };
        var fb = document.createElement('div');
        fb.className = 'out ' + (ok ? 'og' : 'ob');
        fb.style.marginTop = '8px';
        fb.innerHTML = (ok ? '✅ Верно! ' : '❌ Это ' + (cur.cat === 'need' ? 'важная покупка' : 'желание') + '! ') + whyMap[cur.cat];
        body.appendChild(fb);
        row.querySelectorAll('div').forEach(function(x) { x.style.pointerEvents = 'none'; });
        idx++;
        setTimeout(renderStep, 1300);
      }; })(btn.cat);
      row.appendChild(b);
    });
    body.appendChild(row);
  }

  renderStep();
}

function startBudget() {
  var total = DIFF[G.diffIdx].income;
  var slots = [
    { id:'food',  label:'🍱 Еда',          color:'#f59e0b' },
    { id:'trans', label:'🚌 Транспорт',     color:'#3b82f6' },
    { id:'save',  label:'🐷 Копилка',       color:'#10b981' },
    { id:'fun',   label:'🎉 Развлечения',   color:'#8b5cf6' }
  ];
  var vals = {}; slots.forEach(function(s) { vals[s.id] = 0; });

  document.getElementById('wk-sp').textContent =
    'Степан Сыч: «У тебя ' + R(total) + '. Раздели деньги с помощью ползунков! Заработаешь до 55 руб.»';

  var body = document.getElementById('wk-body');

  function render() {
    body.innerHTML = '';
    var used = slots.reduce(function(s, sl) { return s + vals[sl.id]; }, 0);
    var free = total - used;

    
    var fd = document.createElement('div');
    fd.id = 'bv-free';
    fd.style.cssText =
      'background:linear-gradient(135deg,' + (free >= 0 ? '#d1fae5,#a7f3d0' : '#fee2e2,#fecaca') + ')' +
      ';border-radius:12px;padding:10px 14px;margin-bottom:10px;font-size:14px;font-weight:800' +
      ';color:' + (free >= 0 ? '#065f46' : '#991b1b') + ';text-align:center';
    fd.textContent = 'Нераспределено: ' + R(free);
    body.appendChild(fd);

    slots.forEach(function(sl) {
      var row = document.createElement('div');
      row.className = 'bslider';
      row.innerHTML =
        '<div class="bslider-t"><span>' + sl.label + '</span>' +
        '<span id="bv-' + sl.id + '" style="font-weight:800;color:' + sl.color + '">' + R(vals[sl.id]) + '</span></div>' +
        '<input type="range" min="0" max="' + total + '" step="5" value="' + vals[sl.id] + '" style="accent-color:' + sl.color + '">';

      row.querySelector('input').oninput = (function(slId) { return function(e) {
        var v     = parseInt(e.target.value, 10);
        var other = slots.filter(function(x) { return x.id !== slId; })
                         .reduce(function(s, x) { return s + vals[x.id]; }, 0);
        if (other + v > total) { v = total - other; e.target.value = v; }
        vals[slId] = v;
        document.getElementById('bv-' + slId).textContent = R(v);
        var u = slots.reduce(function(s, x) { return s + vals[x.id]; }, 0);
        var fd2 = document.getElementById('bv-free');
        if (fd2) { fd2.textContent = 'Нераспределено: ' + R(total - u); fd2.style.color = (total - u >= 0) ? '#065f46' : '#991b1b'; }
      }; })(sl.id);

      body.appendChild(row);
    });

    document.getElementById('wk-btns').innerHTML = '';
    var btn = document.createElement('button');
    btn.className = 'btn g'; btn.textContent = 'Проверить! ✓';
    btn.onclick = function() {
      var foodOk = vals['food'] >= 30;
      var saveOk = vals['save'] >= 15;
      var good   = foodOk && saveOk;
      var earned = good ? 55 : Math.round(55 * 0.5);
      G.money += earned; G.xp += good ? 15 : 6; G.score += good ? 15 : 5;
      document.getElementById('wk-c').textContent = R(G.money);
      G.dayLog.push('💼 Бюджет: +' + R(earned));
      body.innerHTML =
        '<div class="out ' + (good ? 'og' : 'oy') + '">' +
        (good ? '✅ Отлично! Еда и копилка учтены.' : '💡 Не забывай откладывать на мечту и покупать еду!') +
        ' Заработано: <b>' + R(earned) + '</b></div>';
      document.getElementById('wk-btns').innerHTML = '<button class="btn g" onclick="goBank()">В банк 🏦</button>';
    };
    document.getElementById('wk-btns').appendChild(btn);
  }

  render();
}

function startCalc() {
  var taskIdx = G.calcTaskIdx % CALC_TASKS.length;
  G.calcTaskIdx++;
  var task   = CALC_TASKS[taskIdx];
  var answer = task.op === '-' ? task.a - task.b
             : task.op === '*' ? task.a * task.b
             : Math.round(task.a / task.b);

  document.getElementById('wk-sp').textContent =
    'Степан Сыч: «' + task.desc + ' Используй калькулятор! Заработаешь 40 руб.»';

  var attempts = 0;
  var answered = false;
  var numStr   = '';
  var disp     = '0';
  var body     = document.getElementById('wk-body');

  function render() {
    body.innerHTML =
      '<div class="calc-disp" id="calc-d">' + disp + '</div>' +
      '<div class="calc-btns" id="calc-b"></div>' +
      '<div id="calc-hint" style="font-size:12px;font-weight:700;min-height:22px;margin-top:6px;color:#ef4444"></div>';

    var btns = [['7','8','9','÷'],['4','5','6','×'],['1','2','3','-'],['C','0','=','+']];
    var grid = document.getElementById('calc-b');

    btns.forEach(function(row) {
      row.forEach(function(b) {
        var d = document.createElement('div');
        d.className = 'calc-btn' +
          (/[÷×+]/.test(b) ? ' op' : b === '=' ? ' eq' : b === 'C' ? ' clr' : '');
        d.textContent = b;
        d.onclick = function() {
          if (answered) return;
          if (b === 'C') { numStr = ''; disp = '0'; document.getElementById('calc-d').textContent = disp; return; }
          if (b === '=') {
            try {
              var safe   = numStr.replace(/÷/g, '/').replace(/×/g, '*');
              var result = Math.round(Function('"use strict";return (' + safe + ')')());
              disp       = String(result);
              document.getElementById('calc-d').textContent = disp;
              if (Math.abs(result - answer) <= 0.5) {
                
                answered = true;
                var earned = 40;
                G.money += earned; G.xp += 15; G.score += 15;
                document.getElementById('wk-c').textContent = R(G.money);
                G.dayLog.push('💼 Калькулятор: +' + R(earned));
                body.innerHTML = '<div class="out og">✅ Правильно! Ответ: ' + answer + '. Заработано: <b>' + R(earned) + '</b></div>';
                document.getElementById('wk-btns').innerHTML = '<button class="btn g" onclick="goBank()">В банк 🏦</button>';
              } else {
                
                attempts++;
                var hint = document.getElementById('calc-hint');
                if (attempts >= 2) {
                  hint.innerHTML = '❌ Неверно! Правильный ответ: <b>' + answer + ' руб.</b>';
                } else {
                  hint.textContent = '❌ Неверно! Попробуй ещё раз. (Попытка ' + attempts + ' из 2)';
                }
                numStr = ''; disp = '0';
                document.getElementById('calc-d').textContent = disp;
              }
            } catch(e) { disp = 'Ошибка'; document.getElementById('calc-d').textContent = disp; numStr = ''; }
            return;
          }
          
          if (/\d/.test(b)) { numStr += b; disp = numStr; }
          else {
            var opMap = {'÷':'/', '×':'*'};
            numStr += (opMap[b] || b);
            disp    = numStr;
          }
          document.getElementById('calc-d').textContent = disp || '0';
        };
        grid.appendChild(d);
      });
    });
  }

  render();
  document.getElementById('wk-btns').innerHTML = '';
}

function startChain() {
  var steps = [
    {
      q: 'Ты получил деньги. Что сделаешь первым?',
      opts: [
        { t:'Часть сразу в копилку!', em:'🐷', pts:10, good:true,  tip:'Правило «сначала заплати себе»!' },
        { t:'Куплю всё что хочу',     em:'🛍', pts:2,  good:false, tip:'Желания - потом, после нужного.' }
      ]
    },
    {
      q: 'Осталось немного денег. Еда или кино?',
      opts: [
        { t:'Купить обед', em:'🍱', pts:10, good:true,  tip:'Еда - нужда. Всегда покупаем сначала!' },
        { t:'Пойти в кино',em:'🎬', pts:2,  good:false, tip:'Кино - желание. Сначала нужное.' }
      ]
    },
    {
      q: 'В конце дня осталось 20 руб. Что делать?',
      opts: [
        { t:'В копилку!',   em:'🐷', pts:10, good:true,  tip:'Маленькие накопления складываются в большие!' },
        { t:'Куплю конфет', em:'🍬', pts:3,  good:false, tip:'Можно, но лучше копить!' }
      ]
    }
  ];

  document.getElementById('wk-sp').textContent =
    'Степан Сыч: «3 шага - 3 решения. Каждое влияет на следующее! Заработаешь до 60 руб.»';

  var totalPts = 0;

  function step(idx) {
    var body = document.getElementById('wk-body');
    var btns = document.getElementById('wk-btns');
    body.innerHTML = ''; btns.innerHTML = '';

    if (idx >= steps.length) {
      var earned = Math.round(60 * totalPts / (steps.length * 10));
      G.money += earned; G.xp += totalPts; G.score += totalPts;
      document.getElementById('wk-c').textContent = R(G.money);
      G.dayLog.push('💼 Цепочка: +' + R(earned));
      body.innerHTML =
        '<div class="out ' + (totalPts >= 25 ? 'og' : totalPts >= 15 ? 'oi' : 'ob') + '">' +
        (totalPts >= 25 ? '🏆 Отличные решения!' : totalPts >= 15 ? '👍 Неплохо!' : '📚 В следующий раз лучше!') +
        ' Заработано: <b>' + R(earned) + '</b></div>';
      btns.innerHTML = '<button class="btn g" onclick="goBank()">В банк 🏦</button>';
      return;
    }

    var s = steps[idx];

    
    var prog = document.createElement('div');
    prog.style.cssText = 'display:flex;gap:5px;margin-bottom:10px;align-items:center';
    for (var i = 0; i < steps.length; i++) {
      var d = document.createElement('div');
      d.style.cssText = 'width:28px;height:28px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;' +
        (i < idx  ? 'background:#d1fae5;border-color:#10b981;color:#065f46' :
         i === idx ? 'background:#ede9fe;border-color:#8b5cf6;color:#5b21b6' :
                     'background:#f3f4f6;border-color:#e5e7eb;color:#9ca3af');
      d.textContent = i < idx ? '✓' : i + 1;
      prog.appendChild(d);
      if (i < steps.length - 1) {
        var l = document.createElement('div');
        l.style.cssText = 'flex:1;height:2px;background:' + (i < idx ? '#10b981' : '#e5e7eb');
        prog.appendChild(l);
      }
    }
    body.appendChild(prog);

    var qd = document.createElement('div');
    qd.style.cssText = 'font-size:14px;font-weight:800;color:#1e1b4b;margin:10px 0 8px;line-height:1.5';
    qd.textContent = 'Шаг ' + (idx + 1) + ': ' + s.q;
    body.appendChild(qd);

    s.opts.forEach(function(opt) {
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<span style="font-size:24px">' + opt.em + '</span>' +
        '<div style="flex:1"><div style="font-size:13px;font-weight:800;color:#1e1b4b">' + opt.t + '</div></div>';
      card.onclick = (function(o) { return function() {
        totalPts += o.pts;
        card.style.borderColor = o.good ? '#22c55e' : '#ef4444';
        card.style.background  = o.good ? '#dcfce7' : '#fef2f2';
        var fb = document.createElement('div');
        fb.className = 'out ' + (o.good ? 'og' : 'ob');
        fb.style.marginTop = '8px';
        fb.textContent = (o.good ? '✅ ' : '💡 ') + o.tip;
        body.appendChild(fb);
        body.querySelectorAll('.card').forEach(function(c) { c.style.pointerEvents = 'none'; });
        var nb = document.createElement('button');
        nb.className = 'btn p';
        nb.textContent = idx + 1 < steps.length ? 'Следующий шаг →' : 'Завершить ✓';
        nb.onclick = function() { step(idx + 1); };
        btns.appendChild(nb);
      }; })(opt);
      body.appendChild(card);
    });
  }

  step(0);
}

function startCatch() {
  document.getElementById('wk-sp').textContent =
    'Степан Сыч: «Лови монеты и уворачивайся от бургеров! Управляй корзинкой мышкой или пальцем. Заработаешь до 70 руб.!»';

  var body = document.getElementById('wk-body');
  body.innerHTML = '';
  document.getElementById('wk-btns').innerHTML = '';

  
  var canvas = document.createElement('canvas');
  canvas.width  = 360;
  canvas.height = 220;
  canvas.style.cssText = 'width:100%;height:auto;border-radius:14px;background:linear-gradient(180deg,#dbeafe 0%,#ede9fe 100%);display:block;touch-action:none';
  body.appendChild(canvas);

  var scoreDiv = document.createElement('div');
  scoreDiv.style.cssText = 'text-align:center;font-size:14px;font-weight:800;color:#5b21b6;margin:6px 0';
  scoreDiv.id = 'catch-sc';
  scoreDiv.textContent = 'Монеты: 0';
  body.appendChild(scoreDiv);

  var ctx = canvas.getContext('2d');
  var W = 360, H = 220;
  var bw = 50, bh = 28;       
  var bx = W / 2 - bw / 2;   
  var by = H - 38;            
  var items   = [];
  var coins   = 0;
  var frames  = 0;
  var running = true;

  
  var ITYPE = [
    { em:'💰', good:true,  val:3 },
    { em:'🪙', good:true,  val:2 },
    { em:'🍔', good:false, val:0 },
    { em:'🍔', good:false, val:0 }
  ];

  
  function mv(cx) {
    var r = canvas.getBoundingClientRect();
    bx = clamp((cx - r.left) * (W / r.width) - bw / 2, 0, W - bw);
  }
  canvas.onmousemove = function(e) { mv(e.clientX); };
  canvas.ontouchmove = function(e) { e.preventDefault(); mv(e.touches[0].clientX); };

  function spawnItem() {
    var t = ITYPE[Math.floor(Math.random() * ITYPE.length)];
    items.push({ x: Math.random() * (W - 30) + 10, y: -30, vy: 2 + Math.random() * 2, type: t });
  }

  function loop() {
    if (!running) return;
    frames++;
    if (frames % 40 === 0) spawnItem();

    ctx.clearRect(0, 0, W, H);

    
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 8);
    else ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.font = '18px serif'; ctx.textAlign = 'center';
    ctx.fillText('🧺', bx + bw / 2, by + 22);

    
    items = items.filter(function(it) {
      it.y += it.vy;
      ctx.font = '24px serif'; ctx.textAlign = 'center';
      ctx.fillText(it.type.em, it.x, it.y);
      
      if (it.y > by && it.y < by + bh && it.x > bx && it.x < bx + bw) {
        if (it.type.good) coins += it.type.val || 1;
        else              coins  = Math.max(0, coins - 1);
        return false; 
      }
      return it.y < H + 30;
    });

    scoreDiv.textContent = 'Монеты: ' + coins;
    if (frames < 300) requestAnimationFrame(loop);
    else              finish();
  }

  function finish() {
    running = false;
    var earned = Math.min(70, coins * 5);
    G.money += earned; G.xp += coins * 3; G.score += earned;
    document.getElementById('wk-c').textContent = R(G.money);
    G.dayLog.push('💼 Игра: +' + R(earned) + ' (монеты:' + coins + ')');
    body.innerHTML =
      '<div class="out ' + (coins >= 8 ? 'og' : coins >= 4 ? 'oi' : 'ob') + '">' +
      (coins >= 8 ? '🏆 Отлично!' : coins >= 4 ? '👍 Неплохо!' : '📚 Тренируйся!') +
      ' Поймал монет: ' + coins + '. Заработано: <b>' + R(earned) + '</b></div>';
    document.getElementById('wk-btns').innerHTML = '<button class="btn g" onclick="goBank()">В банк 🏦</button>';
  }

  setTimeout(function() { requestAnimationFrame(loop); }, 300);
  setTimeout(function() { if (running) { running = false; finish(); } }, 10500);
}

function startGrocery() {
  var ch        = CHARS[G.charIdx];
  var listData  = GROCERY_LISTS[G.charIdx] || GROCERY_LISTS[0];
  var budget    = listData.budget;
  var cart      = {};   
  listData.momList.forEach(function(i)   { cart[i.id] = false; });
  listData.extraItems.forEach(function(i){ cart[i.id] = false; });

  document.getElementById('wk-sp').innerHTML =
    ch.em + ' ' + ch.name + ' идёт в магазин.<br>' +
    '<b>Мама дала задание</b> купить продукты и выдала <b>' + budget + ' руб.</b><br>' +
    'Сначала купи всё из списка мамы - потом реши что взять себе!';

  
  function findItem(id) {
    return find(listData.momList.concat(listData.extraItems), function(x) { return x.id === id; });
  }

  
  function calcSpent() {
    return Object.keys(cart).reduce(function(s, id) {
      return s + (cart[id] && findItem(id) ? findItem(id).cost : 0);
    }, 0);
  }

  function render() {
    var spent = calcSpent();
    var left  = budget - spent;
    var body  = document.getElementById('wk-body');
    var btns  = document.getElementById('wk-btns');
    body.innerHTML = ''; btns.innerHTML = '';

    
    var barPct   = Math.max(0, Math.round(left / budget * 100));
    var barColor = left > 80 ? '#10b981' : left > 30 ? '#f59e0b' : '#ef4444';
    body.innerHTML +=
      '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#6b7280;margin-bottom:3px">' +
        '<span>💰 Бюджет мамы</span>' +
        '<span style="color:' + barColor + '">Остаток: <b>' + left + ' руб.</b></span>' +
      '</div>' +
      '<div class="pb-w" style="margin-bottom:10px">' +
        '<div class="pb" style="width:' + barPct + '%;background:' + barColor + '"></div>' +
      '</div>';

    
    var bought = listData.momList.filter(function(i) { return cart[i.id]; }).length;
    var secMom = document.createElement('div');
    secMom.style.cssText = 'font-size:11px;font-weight:800;color:#f59e0b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px';
    secMom.innerHTML = '📋 Список мамы (' + bought + '/' + listData.momList.length + ' куплено):';
    body.appendChild(secMom);

    listData.momList.forEach(function(item) {
      var inCart   = cart[item.id];
      var cantAfford = !inCart && left < item.cost;
      var div = document.createElement('div');
      div.className = 'sh-item' + (inCart ? ' chosen' : cantAfford ? ' no-cash' : '');
      div.style.borderLeft = '4px solid #f59e0b';
      div.innerHTML =
        '<span style="font-size:22px">' + item.em + '</span>' +
        '<div style="flex:1">' +
          '<div style="font-size:13px;font-weight:800;color:#1e1b4b">' + item.name + '</div>' +
          '<div style="font-size:10px;font-weight:700;color:' + (inCart ? '#10b981' : '#f59e0b') + '">' +
            (inCart ? '✓ В корзине' : 'Мама просила купить') +
          '</div>' +
        '</div>' +
        '<span style="font-size:13px;font-weight:800;color:' + (inCart ? '#10b981' : cantAfford ? '#ef4444' : '#6b7280') + '">' + item.cost + ' руб.</span>' +
        (inCart ? '<span style="font-size:16px;margin-left:4px">✅</span>' : '');
      if (!cantAfford) {
        div.onclick = (function(id) { return function() { cart[id] = !cart[id]; render(); }; })(item.id);
      }
      body.appendChild(div);
    });

    
    var secExtra = document.createElement('div');
    secExtra.style.cssText = 'font-size:11px;font-weight:800;color:#8b5cf6;text-transform:uppercase;letter-spacing:.5px;margin:10px 0 6px';
    secExtra.innerHTML = '🎯 Себе (по желанию):';
    body.appendChild(secExtra);

    listData.extraItems.forEach(function(item) {
      var inCart     = cart[item.id];
      var cantAfford = !inCart && left < item.cost;
      var div = document.createElement('div');
      div.className = 'sh-item' + (inCart ? ' chosen' : cantAfford ? ' no-cash' : '');
      div.innerHTML =
        '<span style="font-size:22px">' + item.em + '</span>' +
        '<div style="flex:1">' +
          '<div style="font-size:13px;font-weight:800;color:#1e1b4b">' + item.name + '</div>' +
          '<div style="font-size:10px;font-weight:700;color:#8b5cf6">Для себя - необязательно</div>' +
        '</div>' +
        '<span style="font-size:13px;font-weight:800;color:' + (inCart ? '#10b981' : cantAfford ? '#ef4444' : '#6b7280') + '">' + item.cost + ' руб.</span>' +
        (inCart ? '<span style="font-size:16px;margin-left:4px">✅</span>' : '');
      if (!cantAfford) {
        div.onclick = (function(id) { return function() { cart[id] = !cart[id]; render(); }; })(item.id);
      }
      body.appendChild(div);
    });

    
    var boughtIds = Object.keys(cart).filter(function(id) { return cart[id]; });
    if (boughtIds.length > 0) {
      var sum = document.createElement('div');
      sum.className = 'out oy'; sum.style.marginTop = '10px';
      sum.innerHTML = '🛍 Корзина: ' + boughtIds.map(function(id) { return findItem(id).em; }).join(' ') +
        ' - <b>' + spent + ' руб.</b> | Сдача маме: <b>' + (budget - spent) + ' руб.</b>';
      body.appendChild(sum);
    }

    
    var doneBtn = document.createElement('button');
    doneBtn.className = 'btn g'; doneBtn.style.marginTop = '10px';
    doneBtn.textContent = 'Идти на кассу →';
    doneBtn.onclick = function() { finishGrocery(listData, cart, budget, calcSpent, findItem); };
    btns.appendChild(doneBtn);
  }

  render();
}

function finishGrocery(listData, cart, budget, calcSpentFn, findItemFn) {
  var spent       = calcSpentFn();
  var change      = budget - spent;
  var momMissed   = listData.momList.filter(function(i)   { return !cart[i.id]; });
  var extraBought = listData.extraItems.filter(function(i) { return cart[i.id]; });
  var allMomDone  = momMissed.length === 0;

  var pts = 0; var earned = 0; var cls = ''; var feedback = '';

  if (allMomDone && !extraBought.length) {
    
    pts = 20; earned = 70; cls = 'og';
    feedback = '🏆 Идеально! Ты купил всё из списка мамы и не потратил ни рубля на лишнее. ' +
      'Мама получила сдачу: <b>' + change + ' руб.</b><br>' +
      '<b>Урок:</b> сначала выполняй обязательное, потом думай о себе!';
  } else if (allMomDone && extraBought.length) {
    
    pts = 14; earned = 50; cls = 'oi';
    feedback = '👍 Молодец! Всё из списка мамы куплено. Ещё взял себе: ' +
      extraBought.map(function(i) { return i.em + ' ' + i.name; }).join(', ') +
      '. Сдача маме: <b>' + change + ' руб.</b><br>' +
      '<b>Урок:</b> желания можно покупать только когда выполнено всё обязательное!';
  } else if (!allMomDone && !extraBought.length) {
    
    pts = 5; earned = 20; cls = 'ob';
    feedback = '😕 Ты не купил всё из списка мамы. Забыл: <b>' +
      momMissed.map(function(i) { return i.em + ' ' + i.name; }).join(', ') + '</b>.<br>' +
      '<b>Урок:</b> сначала считай, хватит ли денег на обязательное!';
  } else {
    
    pts = 2; earned = 10; cls = 'ob';
    feedback = '❌ Не купил маме: <b>' +
      momMissed.map(function(i)   { return i.em + ' ' + i.name; }).join(', ') + '</b>, ' +
      'зато взял себе: ' +
      extraBought.map(function(i) { return i.em + ' ' + i.name; }).join(', ') +
      '. Мама расстроилась!<br>' +
      '<b>Урок:</b> желания никогда не должны быть важнее обязанностей!';
  }

  if (allMomDone) G.money += change;  
  G.money += earned;
  G.xp    += pts;
  G.score += pts;
  document.getElementById('wk-c').textContent = R(G.money);
  G.dayLog.push('💼 Список мамы: +' + R(earned) + (allMomDone ? ' ✅' : ' ⚠️'));

  document.getElementById('wk-body').innerHTML =
    '<div class="out ' + cls + '" style="font-size:13px;line-height:1.8">' + feedback +
    '<br><br>💰 Заработано: <b>' + R(earned) + '</b>' +
    (allMomDone ? '<br>💵 Сдача возвращена: <b>' + R(change) + '</b>' : '') +
    '</div>';
  document.getElementById('wk-btns').innerHTML = '<button class="btn g" onclick="goBank()">В банк 🏦</button>';
}

function goBank() {
  var ch  = CHARS[G.charIdx];
  var pct = G.deposit >= ch.dreamCost ? 100 : Math.round(G.deposit / ch.dreamCost * 100);

  document.getElementById('bk-c').textContent  = R(G.money);
  document.getElementById('bk-w').textContent  = R(G.money);
  document.getElementById('bk-d').textContent  = R(G.deposit);
  document.getElementById('bk-dl').textContent = ch.dream;
  document.getElementById('bk-dp').textContent = pct + '%';
  document.getElementById('bk-pb').style.width = pct + '%';
  document.getElementById('bk-dv').textContent = R(G.deposit) + ' из ' + R(ch.dreamCost);

  
  document.getElementById('bk-dream2').innerHTML =
    '<div class="dream-big">' +
      '<div class="dream-big-icon">' + ch.dream.split(' ')[0] + '</div>' +
      '<div class="dream-big-text">' +
        '<div class="dream-big-title">Мечта ' + ch.nameGen + ': ' + ch.dream + '</div>' +
        '<div class="dream-big-sub">Копим ради этого! ' + pct + '% готово.</div>' +
      '</div>' +
    '</div>';

  G.bankAmt = 0;

  
  var prods = document.getElementById('bk-prods');
  prods.innerHTML = '';
  BANK_PRODS.forEach(function(p) {
    var sel = G.depProd === p.id;
    var div = document.createElement('div');
    div.className = 'bank-opt' + (sel ? ' sel' : '');
    div.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<span style="font-size:13px;font-weight:800;color:#1e1b4b">' + p.em + ' ' + p.name + '</span>' +
        '<span style="font-size:11px;background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:8px;font-weight:800">' + p.rateLabel + '</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#6b7280;margin-top:3px;font-weight:600">' + p.desc + '</div>';
    div.onclick = (function(id, el) { return function() {
      G.depProd = id;
      document.querySelectorAll('.bank-opt').forEach(function(x) { x.classList.remove('sel'); });
      el.classList.add('sel');
      updateBkPrev();
    }; })(p.id, div);
    prods.appendChild(div);
  });

  
  var inp = document.getElementById('bk-input');
  inp.value = ''; inp.max = G.money;
  document.getElementById('bk-input-left').textContent = 'Макс: ' + R(G.money);
  document.getElementById('bk-prev').style.display = 'none';

  updateHpPills();
  show('s-bank');
}

function onBkInput() {
  var inp = document.getElementById('bk-input');
  var raw = inp.value.replace(/[^0-9]/g, '');
  var v   = raw === '' ? 0 : parseInt(raw, 10);
  if (isNaN(v)) v = 0;
  G.bankAmt = v;
  var left  = G.money - v;
  var lbl   = document.getElementById('bk-input-left');
  if      (v <= 0)       lbl.textContent = 'Макс: ' + R(G.money);
  else if (v > G.money)  lbl.innerHTML   = '<span style="color:#ef4444">⚠️ Превышает остаток!</span>';
  else                   lbl.textContent = 'Останется: ' + R(left);
  updateBkPrev();
}

function updateBkPrev() {
  var prev = document.getElementById('bk-prev');
  if (!G.bankAmt || G.bankAmt <= 0) { prev.style.display = 'none'; return; }
  var p = find(BANK_PRODS, function(x) { return x.id === G.depProd; });
  if (!p || p.rate === 0) { prev.style.display = 'none'; return; }
  prev.style.display = 'block';
  var total = G.deposit + G.bankAmt;
  var rows  = '<b>📈 Прогноз роста:</b>';
  for (var d = 1; d <= 5; d++) {
    total = Math.floor(total * (1 + p.rate));
    rows += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-top:3px;color:#065f46">' +
      '<span>Через ' + d + ' дн.</span><span>' + R(total) + ' (+' + R(total - G.deposit - G.bankAmt) + ')</span></div>';
  }
  prev.innerHTML = rows;
}

function doBank() {
  var amt = G.bankAmt || 0;
  if (amt > G.money) {
    document.getElementById('bk-input-left').innerHTML = '<span style="color:#ef4444">⚠️ Нельзя положить больше чем есть!</span>';
    return;
  }
  if (amt > 0) {
    var pct70 = Math.floor(G.money * 0.7);
    if (amt > pct70) {
      document.getElementById('bk-input-left').innerHTML =
        '<span style="color:#ef4444">⚠️ Оставь хотя бы 30% на обязательные покупки!</span>';
      return;
    }
    G.deposit += amt;
    G.money   -= amt;
    if (G.depProd === 'weekly') G.frozen = 3;
    G.xp    += 5;
    G.score += 5;
    G.dayLog.push('🏦 Вложено ' + R(amt));

    
    if (G.firstDay) {
      var pr = find(BANK_PRODS, function(x) { return x.id === G.depProd; });
      if (pr && pr.rate > 0) {
        var acc = Math.floor(G.deposit * pr.rate);
        G.deposit += acc;
        G.dayLog.push('💹 Проценты сразу в первый день: +' + R(acc));
      }
      G.firstDay = false;
    }
  }
  G._acc = false;
  openDE();
}

function openDE() {
  var ch  = CHARS[G.charIdx];
  var pct = G.deposit >= ch.dreamCost ? 100 : Math.round(G.deposit / ch.dreamCost * 100);
  var hp  = G.hp;

  document.getElementById('de-t').textContent = 'Итог дня ' + G.day;
  document.getElementById('de-c').textContent = R(G.money);
  document.getElementById('de-sp').textContent = G.day < 7
    ? 'День ' + G.day + ' для ' + ch.nameGen + ' позади! Завтра новый день и новые деньги!'
    : 'Неделя ' + ch.nameGen + ' завершена! Посмотрим итоги!';

  
  var todaySkipped = G.dayConseq.length;
  var rating       = todaySkipped === 0 ? 'green' : todaySkipped <= 1 ? 'orange' : 'red';
  G.dayRatings.push(rating);

  var rC = { green:'#dcfce7', orange:'#fef3c7', red:'#fee2e2'   };
  var rBr= { green:'#86efac', orange:'#fcd34d', red:'#fca5a5'   };
  var rTx= { green:'✅ Разумный день!', orange:'🟠 Средний день', red:'❌ Неразумный день' };

  var log = G.dayLog.length ? G.dayLog.join('<br>') : 'Тихий день.';
  G.dayLog = [];

  document.getElementById('de-body').innerHTML =
    '<div style="background:' + rC[rating] + ';border:2px solid ' + rBr[rating] + ';border-radius:12px;padding:10px 13px;margin:6px 0;font-weight:800;font-size:14px">' + rTx[rating] + '</div>' +
    '<div class="out oi" style="font-size:12px;line-height:1.9"><b>Сегодня:</b><br>' + log + '</div>' +
    '<div class="stats" style="margin-top:9px">' +
      '<div class="sbox" style="background:#dbeafe"><div class="sv" style="color:#1e40af">' + R(G.money)   + '</div><div class="sl" style="color:#3b82f6">Кошелёк</div></div>' +
      '<div class="sbox" style="background:#d1fae5"><div class="sv" style="color:#065f46">' + R(G.deposit) + '</div><div class="sl" style="color:#10b981">Вклад</div></div>'    +
      '<div class="sbox" style="background:#fce7f3"><div class="sv" style="color:' + hpColor(hp) + '">' + hp + '%</div><div class="sl" style="color:#ec4899">Здоровье</div></div>' +
      '<div class="sbox" style="background:#fef3c7"><div class="sv" style="color:#92400e">' + pct + '%</div><div class="sl" style="color:#f59e0b">К мечте</div></div>' +
    '</div>';

  document.getElementById('de-nx').textContent = G.day >= 7 ? 'Итоги →' : 'День ' + (G.day + 1) + ' →';
  show('s-de');
}

function nextDay() {
  if (G.day >= 7) { showFinal(); return; }
  G.day++;
  G.money += DIFF[G.diffIdx].income;
  G._acc   = false;
  showDS();
}

function showFinal() {
  var ch  = CHARS[G.charIdx];
  var sc  = clamp(G.score, 0, 100);
  var pct = G.deposit >= ch.dreamCost ? 100 : Math.round(G.deposit / ch.dreamCost * 100);

  document.getElementById('fn-sc').textContent = sc;
  document.getElementById('fn-st').textContent = sc >= 75 ? '⭐⭐⭐' : sc >= 45 ? '⭐⭐' : '⭐';
  document.getElementById('fn-ti').textContent = sc >= 75 ? 'Финансовый гений! 🎉' : sc >= 45 ? 'Хороший финансист! 👍' : 'Есть куда расти! 📚';
  document.getElementById('fn-su').textContent = ch.em + ' ' + ch.name + ' прожил(а) неделю! Здоровье: ' + G.hp + '%';

  document.getElementById('fn-w').textContent = R(G.money);
  document.getElementById('fn-d').textContent = R(G.deposit);
  document.getElementById('fn-h').textContent = G.hp + '%';
  document.getElementById('fn-h').style.color = hpColor(G.hp);
  document.getElementById('fn-p').textContent = pct + '%';

  
  var msgs = {
    tardy:'Саша опаздывал в школу',     fainted:'Саша падал в обморок',       kicked:'Саша пропускал секцию',
    dizzy:'Маша испытывала головокружение', thirsty:'Маша страдала от жажды',  sad:'Маша грустила без книги',
    fail:'Лёша получал двойки',           hungry:'Лёша не мог сосредоточиться', late:'Лёша опаздывал и мок под дождём'
  };
  var stEl = document.getElementById('fn-story');
  if (G.storyFlags.length) {
    
    var unique = [];
    G.storyFlags.forEach(function(f) { if (!has(unique, f)) unique.push(f); });
    stEl.innerHTML =
      '<div class="out ob"><b>Что случилось за неделю:</b><br>' +
      unique.map(function(f) { return '• ' + (msgs[f] || f); }).join('<br>') +
      '</div>';
  } else {
    var livedStr = ch.name === 'Маша' ? 'прожила' : 'прожил';
    stEl.innerHTML = '<div class="out og">⭐ ' + ch.name + ' ' + livedStr + ' неделю без проблем! Все обязательные покупки были сделаны!</div>';
  }

  
  var daysEl = document.getElementById('fn-days');
  daysEl.innerHTML = '';
  var rC  = { green:'#dcfce7', orange:'#fef3c7', red:'#fee2e2' };
  var rBr = { green:'#10b981', orange:'#f59e0b', red:'#ef4444' };
  var rTx = { green:'✅',       orange:'🟠',       red:'❌'       };
  for (var d = 0; d < 7; d++) {
    var r   = G.dayRatings[d] || 'green';
    var dot = document.createElement('div');
    dot.className       = 'ddot';
    dot.style.cssText   = 'background:' + rC[r] + ';border-color:' + rBr[r] + ';color:' + rBr[r];
    dot.textContent     = rTx[r];
    daysEl.appendChild(dot);
  }

  
  var tips = [
    pct >= 100
      ? '🎯 ' + ch.name + ' накопил(а) на мечту - ' + ch.dream + '!'
      : '💡 Откладывай в банк каждый день - даже маленькие суммы растут.',
    G.hp >= 80
      ? '❤️ Отличное самочувствие ' + ch.nameGen + '! Все обязательные покупки сделаны.'
      : '❤️ Самочувствие ' + ch.nameGen + ' пострадало. Обязательные покупки - сначала!',
    '🏦 Банковские проценты работают пока ты спишь - это и есть накопления!',
    '🛒 Нужда - это то без чего нельзя. Желание - приятно, но можно обойтись.',
    '🔒 Никогда не переходи по подозрительным ссылкам - это могут быть мошенники!'
  ];
  var ul = document.getElementById('fn-tips');
  ul.innerHTML = '';
  tips.forEach(function(t) {
    var li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });

  show('s-fin');
}

function resetGame() {
  G = fresh();
  
  document.querySelectorAll('.cc, .dc').forEach(function(c) { c.classList.remove('sel'); });
  
  document.getElementById('df1').classList.add('sel');
  
  document.getElementById('char-info').style.display = 'none';
  show('s-intro');
}
