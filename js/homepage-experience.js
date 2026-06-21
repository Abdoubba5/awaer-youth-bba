/* ============================================================
   منصة وعي الشباب BBA - Homepage Experience Layer
   Interactive features: scroll reveals, particles, quiz,
   personalization, trust metrics, progress rings
   GPU-optimized, WCAG-accessible
   ============================================================ */
(function() {
  'use strict';

  var EXP = {};

  /* --- Utility --- */
  function byId(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }
  function isInViewport(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight - 80 && r.bottom > 0;
  }

  /* ============================================================
     1. SCROLL REVEAL ENGINE — GPU-optimized
     ============================================================ */
  EXP.ScrollReveal = function() {
    var revealEls = qsa('.reveal, .mosaic-tile, .article-card, .event-card, .testimonial-card, .achieve-card, .stat-card, .chart-card, .announcement-card');
    if (!revealEls.length) return;

    /* Set initial state */
    for (var i = 0; i < revealEls.length; i++) {
      var el = revealEls[i];
      if (!el.classList.contains('fade-in-up')) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
        el.style.willChange = 'opacity, transform';
      }
    }

    if (!window.IntersectionObserver) {
      /* Fallback: reveal all */
      for (var i = 0; i < revealEls.length; i++) {
        revealEls[i].style.opacity = '1';
        revealEls[i].style.transform = 'translateY(0)';
      }
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var el = entries[i].target;
          var delay = parseFloat(el.getAttribute('data-reveal-delay')) || 0;
          setTimeout(function() {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, delay * 1000);
          observer.unobserve(el);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    for (var i = 0; i < revealEls.length; i++) {
      observer.observe(revealEls[i]);
    }
  };

  /* ============================================================
     2. HERO BACKGROUND PARTICLES — Light floating orbs
     ============================================================ */
  EXP.HeroParticles = function() {
    var hero = qs('.hero');
    if (!hero) return;

    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    canvas.style.opacity = '0.3';

    var container = qs('.hero-bg');
    if (!container) return;

    /* Insert after hero-bg */
    container.parentNode.insertBefore(canvas, container.nextSibling);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var MAX = 25;
    var animFrameId = null;

    function resize() {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    for (var i = 0; i < MAX; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.1,
        r: 2 + Math.random() * 4,
        alpha: 0.08 + Math.random() * 0.12
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201, 168, 76, ' + p.alpha + ')';
        ctx.fill();
      }
      animFrameId = requestAnimationFrame(animate);
    }
    animate();

    /* Cleanup on navigation away — stop animation loop */
    window.addEventListener('pagehide', function() {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    });
  };

  /* ============================================================
     3. AWARENESS QUIZ — Interactive self-assessment
     ============================================================ */
  EXP.AwarenessQuiz = function() {
    var awarenessGrid = byId('awarenessGrid');
    if (!awarenessGrid) return;

    /* Insert quiz before the grid */
    var quizContainer = document.createElement('div');
    quizContainer.className = 'quiz-container';
    quizContainer.style.cssText = 'max-width:680px;margin:0 auto 2rem;display:none';
    quizContainer.innerHTML =
      '<div class="quiz-card" style="background:var(--surface-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:clamp(1.5rem,3vw,2rem);position:relative;overflow:hidden">' +
      '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:0.5"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">' +
      '<h3 style="color:var(--gold);font-size:1.1rem">🧠 اختبر وعيك</h3>' +
      '<button type="button" id="quizToggleBtn" style="background:var(--gold-light);border:1px solid var(--border-gold);color:var(--gold);padding:0.35rem 0.85rem;border-radius:100px;font-family:var(--font);font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.3s ease">ابدأ الاختبار</button>' +
      '</div>' +
      '<div id="quizContent" style="display:none">' +
      '<div id="quizProgress" style="display:flex;gap:0.35rem;margin-bottom:1.25rem;justify-content:center"></div>' +
      '<div id="quizQuestion" style="font-size:1rem;font-weight:600;color:var(--text);margin-bottom:1rem;min-height:3rem"></div>' +
      '<div id="quizOptions" style="display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1rem"></div>' +
      '<div id="quizFeedback" style="display:none;padding:0.75rem 1rem;border-radius:var(--radius-sm);margin-bottom:1rem;font-size:0.85rem"></div>' +
      '<div style="display:flex;gap:0.75rem">' +
      '<button type="button" id="quizNextBtn" class="btn btn-primary btn-sm" style="flex:1;justify-content:center;display:none">التالي ←</button>' +
      '</div>' +
      '</div>' +
      '</div>';
    awarenessGrid.parentNode.insertBefore(quizContainer, awarenessGrid);

    var toggleBtn = byId('quizToggleBtn');
    var quizContent = byId('quizContent');

    if (toggleBtn && quizContent) {
      toggleBtn.onclick = function() {
        var hidden = quizContent.style.display === 'none';
        quizContent.style.display = hidden ? 'block' : 'none';
        toggleBtn.textContent = hidden ? 'إخفاء الاختبار' : 'ابدأ الاختبار';
        toggleBtn.style.background = hidden ? 'var(--gold-light)' : 'transparent';
        if (hidden && typeof EXP.renderQuestion === 'function') {
          EXP.renderQuestion();
        }
      };
    }

    /* Quiz questions */
    EXP.questions = [
      {
        q: 'ما هي أفضل طريقة لرفض عرض تعاطي مادة ممنوعة؟',
        options: [
          { text: 'قول "لا" بثقة دون تبرير', correct: true, feedback: '✅ صحيح! الرفض المباشر والواثق هو الأكثر فعالية.' },
          { text: 'تقديم أعذار واهية', correct: false, feedback: '❌ الأعذار قد تضعف موقفك وتشجع على الإلحاح.' },
          { text: 'التظاهر بالقبول ثم المغادرة', correct: false, feedback: '❌ المغادرة فكرة جيدة لكن التظاهر بالقبول قد يخلق التباساً.' },
          { text: 'تجاهل الموقف بالكامل', correct: false, feedback: '❌ التجاهل قد لا يكون فعالاً في كل المواقف.' }
        ]
      },
      {
        q: 'ما هي أول علامة تحذيرية لتعاطي المخدرات لدى المراهقين؟',
        options: [
          { text: 'تغير مفاجئ في الأصدقاء والاهتمامات', correct: true, feedback: '✅ صحيح! تغير الأصدقاء والاهتمامات من أبرز العلامات المبكرة.' },
          { text: 'ظهور حب الشباب', correct: false, feedback: '❌ حب الشباب ظاهرة طبيعية في المراهقة وليست علامة تحذيرية.' },
          { text: 'النوم لفترات طويلة', correct: false, feedback: '❌ النوم الطويل قد يكون طبيعياً للمراهقين وليس بالضرورة علامة خطر.' },
          { text: 'كثرة استخدام الهاتف', correct: false, feedback: '❌ استخدام الهاتف بكثرة شائع بين المراهقين اليوم.' }
        ]
      },
      {
        q: 'متى يجب طلب المساعدة المهنية للصحة النفسية؟',
        options: [
          { text: 'عند استمرار الأعراض لأكثر من أسبوعين', correct: true, feedback: '✅ صحيح! استمرار الأعراض لأكثر من أسبوعين يستدعي استشارة مختص.' },
          { text: 'فقط عند الشعور بألم جسدي', correct: false, feedback: '❌ الصحة النفسية لا تقل أهمية عن الصحة الجسدية.' },
          { text: 'عندما يطلب الأهل ذلك فقط', correct: false, feedback: '❌ المبادرة بطلب المساعدة دليل قوة ووعي.' },
          { text: 'لا داعي أبداً، المشاعر تمر وحدها', correct: false, feedback: '❌ بعض المشاعر تحتاج إلى تدخل مهني لتجنب المضاعفات.' }
        ]
      },
      {
        q: 'ما هو البديل الصحي للتعامل مع الضغط النفسي؟',
        options: [
          { text: 'ممارسة الرياضة والتأمل', correct: true, feedback: '✅ ممتاز! الرياضة والتأمل من أفضل الطرق الصحية لإدارة التوتر.' },
          { text: 'تعاطي المهدئات بدون وصفة طبية', correct: false, feedback: '❌ تعاطي الأدوية بدون وصفة طبية خطير وقد يؤدي للإدمان.' },
          { text: 'العزلة التامة عن الجميع', correct: false, feedback: '❌ العزلة تزيد المشكلة سوءاً. التواصل مع الآخرين مهم.' },
          { text: 'الإفراط في تناول الطعام', correct: false, feedback: '❌ الأكل العاطفي قد يؤدي لمشاكل صحية إضافية.' }
        ]
      }
    ];

    EXP.currentQuestion = 0;
    EXP.score = 0;

    EXP.renderQuestion = function() {
      var q = EXP.questions[EXP.currentQuestion];
      if (!q) {
        EXP.showQuizResult();
        return;
      }

      var progress = byId('quizProgress');
      var questionEl = byId('quizQuestion');
      var optionsEl = byId('quizOptions');
      var feedbackEl = byId('quizFeedback');
      var nextBtn = byId('quizNextBtn');

      if (progress) {
        var html = '';
        for (var i = 0; i < EXP.questions.length; i++) {
          var cls = i < EXP.currentQuestion ? 'done' : (i === EXP.currentQuestion ? 'active' : '');
          html += '<div style="flex:1;height:4px;border-radius:2px;background:' +
            (cls === 'done' ? 'var(--gold)' : cls === 'active' ? 'var(--gold)' : 'var(--border-light)') +
            ';transition:background 0.3s ease"></div>';
        }
        progress.innerHTML = html;
      }

      if (questionEl) {
        questionEl.textContent = q.q;
      }

      if (optionsEl) {
        var oHtml = '';
        for (var i = 0; i < q.options.length; i++) {
          var opt = q.options[i];
          oHtml += '<button type="button" class="quiz-option" data-index="' + i + '" style="padding:0.75rem 1rem;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.85rem;cursor:pointer;transition:all 0.3s ease;text-align:right;display:flex;align-items:center;gap:0.5rem">' +
            '<span style="width:18px;height:18px;border-radius:50%;border:2px solid var(--muted);flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:0.6rem;transition:all 0.3s ease"></span>' +
            '<span>' + opt.text + '</span></button>';
        }
        optionsEl.innerHTML = oHtml;

        /* Wire options */
        var optBtns = optionsEl.querySelectorAll('.quiz-option');
        for (var i = 0; i < optBtns.length; i++) {
          (function(btn, idx) {
            btn.onclick = function() {
              /* Disable all */
              for (var j = 0; j < optBtns.length; j++) {
                optBtns[j].style.pointerEvents = 'none';
                optBtns[j].style.opacity = '0.5';
              }
              var opt = q.options[idx];
              var circle = btn.querySelector('span:first-child');
              if (opt.correct) {
                btn.style.borderColor = 'var(--success)';
                btn.style.background = 'var(--success-bg)';
                if (circle) {
                  circle.style.borderColor = 'var(--success)';
                  circle.style.background = 'var(--success)';
                  circle.innerHTML = '✓';
                  circle.style.color = '#fff';
                }
                EXP.score++;
              } else {
                btn.style.borderColor = 'var(--danger)';
                btn.style.background = 'var(--danger-bg)';
                if (circle) {
                  circle.style.borderColor = 'var(--danger)';
                  circle.style.background = 'var(--danger)';
                  circle.innerHTML = '✕';
                  circle.style.color = '#fff';
                }
                /* Highlight correct answer */
                for (var j = 0; j < optBtns.length; j++) {
                  if (q.options[j].correct) {
                    optBtns[j].style.borderColor = 'var(--success)';
                    optBtns[j].style.background = 'var(--success-bg)';
                    optBtns[j].style.opacity = '1';
                    var c = optBtns[j].querySelector('span:first-child');
                    if (c) {
                      c.style.borderColor = 'var(--success)';
                      c.style.background = 'var(--success)';
                      c.innerHTML = '✓';
                      c.style.color = '#fff';
                    }
                  }
                }
              }
              /* Show feedback */
              if (feedbackEl) {
                feedbackEl.style.display = 'block';
                feedbackEl.textContent = opt.feedback;
                feedbackEl.style.background = opt.correct ? 'var(--success-bg)' : 'var(--danger-bg)';
                feedbackEl.style.border = '1px solid ' + (opt.correct ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)');
              }
              /* Show next */
              if (nextBtn) nextBtn.style.display = 'flex';
            };
          })(optBtns[i], i);
        }
      }

      if (feedbackEl) feedbackEl.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';

      /* Wire next button */
      if (nextBtn) {
        nextBtn.onclick = function() {
          EXP.currentQuestion++;
          EXP.renderQuestion();
        };
      }
    };

    EXP.showQuizResult = function() {
      var total = EXP.questions.length;
      var pct = Math.round((EXP.score / total) * 100);
      var msg = pct >= 75 ? 'ممتاز! لديك وعي عالٍ جداً 🎉' :
               pct >= 50 ? 'جيد! يمكنك تحسين معلوماتك أكثر 📚' :
               'لا بأس! تصفح مقالات التوعية لتعزيز معلوماتك 💪';

      var content = byId('quizContent');
      if (!content) return;

      content.innerHTML =
        '<div style="text-align:center;padding:1rem">' +
        '<div style="font-size:3rem;margin-bottom:0.75rem">' + (pct >= 75 ? '🎉' : pct >= 50 ? '💪' : '📚') + '</div>' +
        '<h4 style="color:var(--gold);font-size:1.1rem;margin-bottom:0.5rem">' + msg + '</h4>' +
        '<div style="font-size:2rem;font-weight:700;color:var(--gold);margin-bottom:0.5rem">' + EXP.score + '/' + total + '</div>' +
        '<div style="width:100%;height:6px;background:var(--border-light);border-radius:3px;overflow:hidden;margin:0.5rem auto;max-width:200px">' +
        '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--gold),var(--gold-hover));border-radius:3px;transition:width 0.6s ease"></div></div>' +
        '<button type="button" id="quizResetBtn" class="btn btn-secondary btn-sm" style="margin-top:1rem">🔄 إعادة الاختبار</button>' +
        '</div>';

      var resetBtn = byId('quizResetBtn');
      if (resetBtn) {
        resetBtn.onclick = function() {
          EXP.currentQuestion = 0;
          EXP.score = 0;
          /* Rebuild quiz content */
          var parent = content.parentNode;
          var toggle = byId('quizToggleBtn');
          if (parent && toggle) {
            /* Remove quiz toggle button's onclick listener and reset */
            EXP.AwarenessQuiz();
          }
        };
      }
    };
  };

  /* ============================================================
     4. SMART PERSONALIZATION — Role-based homepage
     ============================================================ */
  EXP.SmartPersonalization = function() {
    var checkPersonalization = setInterval(function() {
      if (window.BBA && window.BBA.Auth) {
        clearInterval(checkPersonalization);
        var auth = window.BBA.Auth;
        var role = auth.getRole();
        var loggedIn = auth.isLoggedIn();

        /* Hero subtitle personalization */
        var subtitle = byId('heroSubtitle');
        var badge = byId('heroBadgeText');

        if (loggedIn && role) {
          if (role === 'psychologist' || role === 'super_admin') {
            if (subtitle) subtitle.textContent = 'مرحباً بالمستشار النفسي. منصتك لإدارة الاستشارات ومتابعة الحالات.' +
              subtitle.textContent.substring(subtitle.textContent.indexOf('منصة'));
            if (badge) badge.textContent = '👋 مرحباً أيها المستشار النفسي';
          } else if (role === 'admin') {
            if (subtitle) subtitle.textContent = 'مرحباً بالمسؤول. لوحة التحكم والإدارة في انتظارك.' +
              subtitle.textContent.substring(subtitle.textContent.indexOf('منصة'));
            if (badge) badge.textContent = '👋 مرحباً أيها المسؤول';
          } else if (role === 'volunteer' || loggedIn) {
            if (badge) badge.textContent = '👋 مرحباً أيها المتطوع';
          }
        } else {
          /* Anonymous — show trust messaging */
          if (badge) {
            var currentBadge = badge.textContent;
            if (currentBadge.indexOf('Dz Young Leaders') !== -1 || currentBadge.indexOf('مرحباً') === -1) {
              /* Keep default */
            }
          }
        }

        /* NOTE: Quick link visibility is handled by initAuthLinks() in index.html inline script.
           Only badge/subtitle personalization is done here to avoid duplicate logic conflicts. */
      }
    }, 800);
    setTimeout(function() { clearInterval(checkPersonalization); }, 12000);
  };

  /* ============================================================
     5. TRUST METRICS — Live activity ticker
     ============================================================ */
  EXP.TrustMetrics = function() {
    /* Show real-time metrics on stat cards */
    function refreshMetrics() {
      try {
        var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
        var consultations = JSON.parse(localStorage.getItem('bba_consultations') || '[]');
        var certs = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
        var activities = JSON.parse(localStorage.getItem('bba_activity_log') || '[]');

        /* Update hero stat labels with extra info */
        var volLabel = qs('#heroStatVolunteers .hero-stat-label');
        var conLabel = qs('#heroStatConsultations .hero-stat-label');
        var actLabel = qs('#heroStatActivities .hero-stat-label');
        var certLabel = qs('#heroStatCertificates .hero-stat-label');

        if (volLabel) volLabel.textContent = 'متطوع • ' + volunteers.length;
        if (conLabel) conLabel.textContent = 'استشارة • ' + consultations.length;
        if (actLabel) actLabel.textContent = 'نشاط • ' + activities.length;
        if (certLabel) certLabel.textContent = 'شهادة • ' + certs.length;
      } catch(e) {}
    }

    refreshMetrics();
    /* Refresh every 30s */
    setInterval(refreshMetrics, 30000);
  };

  /* ============================================================
     6. CIRCULAR PROGRESS RINGS — Premium data viz
     ============================================================ */
  EXP.CircularProgress = function() {
    var tiles = qsa('.mosaic-tile');
    for (var i = 0; i < tiles.length; i++) {
      var tile = tiles[i];
      if (tile.querySelector('.progress-ring-svg')) continue;
      var valueEl = tile.querySelector('.mosaic-tile-value');
      if (!valueEl) continue;
      var maxVal = parseInt(valueEl.textContent) || 100;
      if (maxVal < 5) continue;

      /* Create ring */
      var ringSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      ringSvg.setAttribute('class', 'progress-ring-svg');
      ringSvg.setAttribute('viewBox', '0 0 60 60');
      ringSvg.style.cssText = 'position:absolute;top:0.5rem;left:0.5rem;width:44px;height:44px;pointer-events:none;opacity:0.15';

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '30');
      circle.setAttribute('cy', '30');
      circle.setAttribute('r', '24');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', 'var(--gold)');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('stroke-linecap', 'round');
      circle.setAttribute('stroke-dasharray', '150.8');
      circle.setAttribute('stroke-dashoffset', '150.8');
      circle.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)';

      ringSvg.appendChild(circle);
      tile.appendChild(ringSvg);

      /* Animate on hover */
      tile.addEventListener('mouseenter', function(c) {
        return function() {
          c.setAttribute('stroke-dashoffset', '0');
          c.parentNode.style.opacity = '0.3';
        };
      }(circle));

      tile.addEventListener('mouseleave', function(c) {
        return function() {
          setTimeout(function() {
            c.setAttribute('stroke-dashoffset', '150.8');
            c.parentNode.style.opacity = '0.15';
          }, 500);
        };
      }(circle));
    }
  };

  /* ============================================================
     7. FIRST IMPRESSION ENHANCEMENT — Initial animation sequence
     ============================================================ */
  EXP.FirstImpression = function() {
    var heroContent = byId('heroContent');
    if (!heroContent) return;

    /* Ensure ALL hero content starts hidden — including badge */
    var children = heroContent.children;
    for (var i = 0; i < children.length; i++) {
      children[i].style.opacity = '0';
      children[i].style.transform = 'translateY(20px)';
    }

    /* Staggered entrance */
    var badge = heroContent.querySelector('.hero-badge');
    var h1 = heroContent.querySelector('h1');
    var p = heroContent.querySelector('p');
    var actions = heroContent.querySelector('.hero-actions');
    var stats = heroContent.querySelector('.hero-stats');

    var sequence = [
      { el: badge, delay: 200 },
      { el: h1, delay: 500 },
      { el: p, delay: 800 },
      { el: actions, delay: 1100 },
      { el: stats, delay: 1400 }
    ];

    for (var i = 0; i < sequence.length; i++) {
      var item = sequence[i];
      if (item.el) {
        item.el.style.transition = 'opacity 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
        item.el.style.willChange = 'opacity, transform';
        setTimeout(function(el) {
          return function() {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          };
        }(item.el), item.delay);
      }
    }

    /* Particles start after 1.5s */
    setTimeout(function() {
      if (EXP.HeroParticles) EXP.HeroParticles();
    }, 1500);
  };

  /* ============================================================
     8. WOW EFFECT — Scroll-triggered gradient glow on hero
     ============================================================ */
  EXP.WowEffect = function() {
    /* Skip on touch devices — no cursor to track */
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    /* Add cursor-reactive glow to hero */
    var hero = qs('.hero');
    if (!hero) return;

    var glow = document.createElement('div');
    glow.style.cssText = 'position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,0.04),transparent 70%);pointer-events:none;z-index:0;transition:transform 0.3s ease-out;will-change:transform;opacity:0';
    hero.appendChild(glow);

    var glowTimer;
    hero.addEventListener('mousemove', function(e) {
      var rect = hero.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      glow.style.transform = 'translate(' + (x - 150) + 'px, ' + (y - 150) + 'px)';
      glow.style.opacity = '1';
      clearTimeout(glowTimer);
      glowTimer = setTimeout(function() {
        glow.style.opacity = '0';
      }, 500);
    });
  };

  /* ============================================================
     INIT — Start all experience features
     ============================================================ */
  EXP.init = function() {
    /* Wait for DOM */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', EXP.run);
    } else {
      EXP.run();
    }
  };

  EXP.run = function() {
    /* 1. First impression — staggered hero entrance */
    EXP.FirstImpression();

    /* 2. Scroll reveal — after initial load delay */
    setTimeout(function() {
      EXP.ScrollReveal();
    }, 2000);

    /* 3. Personalization — wait for auth */
    EXP.SmartPersonalization();

    /* 4. Trust metrics */
    EXP.TrustMetrics();

    /* 5. Circular progress rings */
    setTimeout(function() {
      EXP.CircularProgress();
    }, 2500);

    /* 6. Awareness quiz */
    EXP.AwarenessQuiz();

    /* 7. Wow effect — cursor glow */
    EXP.WowEffect();
  };

  /* Export to window */
  window.BBA = window.BBA || {};
  window.BBA.Experience = EXP;

  /* Auto-init */
  EXP.init();
})();
