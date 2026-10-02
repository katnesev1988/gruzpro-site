/* =========================================================================
 * app.js — восстановление интерактива лендинга (Taptop / do.js)
 * Чистый JS, без внешних библиотек.
 *
 * 1. Модальное окно: элементы [data-action-element="<id попапа>"] открывают
 *    попап по id; .pop-up__overlay / .pop-up__outside-close-button /
 *    .pop-up__inside-close-button закрывают; Escape тоже закрывает.
 *    Открытие = класс .is-opened (см. патч в css/app.css).
 *
 * 2. Мобильное меню и аккордеон FAQ уже обрабатываются js/menu.js и js/faq.js
 *    (переключают те же классы .is-opened), поэтому здесь они намеренно
 *    пропущены, чтобы двойные обработчики не отменяли друг друга.
 *
 * 3. Маска телефона для input[data-do-mask="+7 (___) ___-__-__"].
 *
 * 4. Валидация форм: обязательные поля .form__field[data-type-field]
 *    (кроме скрытых display:none) получают класс .is-error при пустом/
 *    некорректном значении — CSS показывает подсветку плейсхолдера.
 *    Отправка имитируется локально (сервер Taptop недоступен): через
 *    секунду форме добавляется .is-success (или .is-error), показывая
 *    встроенные блоки .form__state-success / .form__state-error.
 *
 * 5. Плавный скролл по якорям с учётом фиксированной шапки + кнопка «наверх».
 * ========================================================================= */
(function () {
  'use strict';

  var HIDDEN_OFFSET = 80;   // отступ под фиксированную шапку при скролле к якорю
  var UP_BTN_SHOW_AT = 500;  // вертикальный скролл, после которого видна кнопка «наверх»

  function isHiddenByCss(el) {
    return !el.offsetParent && getComputedStyle(el).position !== 'fixed';
  }

  /* ---------- 1. Модальные окна и мобильное меню ---------- */
  // единый счётчик блокировки прокрутки — его разделяют попапы и menu.js
  var lockCount = 0;
  function bodyLock(on) {
    lockCount += on ? 1 : -1;
    if (lockCount < 0) lockCount = 0;
    document.body.style.overflow = lockCount > 0 ? 'hidden' : '';
  }
  window.ttBodyLock = bodyLock; // доступ из menu.js

  function initPopups() {
    function openPopup(popup) {
      popup.classList.add('is-opened');
      bodyLock(true);
    }

    function closePopup(popup) {
      if (!popup.classList.contains('is-opened')) return;
      popup.classList.remove('is-opened');
      bodyLock(false);
    }

    // кнопки открытия: любой элемент с data-action-element="<id попапа>"
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-action-element]'),
      function (btn) {
        var targetId = btn.getAttribute('data-action-element');
        if (!targetId) return;
        var popup = document.getElementById(targetId);
        if (!popup || !popup.classList.contains('pop-up')) return;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          openPopup(popup);
        });
      }
    );

    // области закрытия внутри попапа
    Array.prototype.forEach.call(
      document.querySelectorAll('.pop-up'),
      function (popup) {
        ['.pop-up__overlay', '.pop-up__outside-close-button', '.pop-up__inside-close-button']
          .forEach(function (sel) {
            Array.prototype.forEach.call(popup.querySelectorAll(sel), function (el) {
              el.addEventListener('click', function () { closePopup(popup); });
            });
          });
      }
    );

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        Array.prototype.forEach.call(
          document.querySelectorAll('.pop-up.is-opened'),
          closePopup
        );
      }
    });
  }

  /* ---------- 3. Маска телефона ---------- */
  function applyPhoneMask(input) {
    var maskDigits = '+7__________'; // 10 цифр после кода страны
    function format(value) {
      var d = value.replace(/\D/g, '');
      if (d.indexOf('7') === 0) d = d.slice(1);       // убираем 7 из ввода
      if (d.indexOf('8') === 0) d = d.slice(1);       // 8 -> 7
      d = d.slice(0, 10);
      var out = '+7';
      if (d.length) out += ' (' + d.slice(0, 3);
      if (d.length >= 3) out += ')';
      if (d.length > 3) out += ' ' + d.slice(3, 6);
      if (d.length > 6) out += '-' + d.slice(6, 8);
      if (d.length > 8) out += '-' + d.slice(8, 10);
      return out;
    }
    function caretPos(str) {
      return str.replace(/\D/g, '').length;
    }
    function reformat(silentEvent) {
      var digitsBefore = caretPos(input.value);
      input.value = format(input.value);
      var digitsAfter = caretPos(input.value);
      try { input.setSelectionRange(digitsAfter, digitsAfter); } catch (err) {}
    }
    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7';
    });
    input.addEventListener('blur', function () {
      if (input.value === '+7' || caretPos(input.value) <= 1) input.value = '';
    });
    input.addEventListener('input', reformat);
    input.addEventListener('keydown', function (e) {
      // не даём вводить текст поверх маски стрелками/Home в конце
      if (e.key.length === 1 && !/^[0-9+]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    });
  }

  function initPhoneMasks() {
    Array.prototype.forEach.call(
      document.querySelectorAll('input[data-do-mask*="___"]'),
      applyPhoneMask
    );
  }

  /* ---------- 4. Формы: валидация + отправка ---------- */

  // чекбокс согласия: hidden-инпут может быть с readonly (мешает переключению)
  function initConsentCheckboxes() {
    Array.prototype.forEach.call(
      document.querySelectorAll('.form__checkbox[readonly]'),
      function (cb) {
        cb.removeAttribute('readonly');
        cb.addEventListener('click', function (e) {
          // label дублирует клик на input — не считаем дважды
          if (e.target !== cb) e.stopPropagation();
        });
      }
    );
  }

  function validateField(field) {
    var type = field.getAttribute('data-type-field');
    var ok = true;
    if (type === 'checkbox_group') {
      var boxes = field.querySelectorAll('input[type="checkbox"]');
      ok = boxes.length === 0;
      Array.prototype.forEach.call(boxes, function (b) { if (b.checked) ok = true; });
    } else {
      var control = field.querySelector('input, textarea, select');
      if (!control) return true;
      var val = control.value.trim();
      if (!val) ok = false;
      else if (type === 'email' || control.type === 'email') {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
      } else if (type === 'phone' || control.type === 'tel') {
        ok = control.value.replace(/\D/g, '').length >= 11;
      }
    }
    field.classList.toggle('is-error', !ok);
    return ok;
  }

  function initForms() {
    Array.prototype.forEach.call(
      document.querySelectorAll('.form form'),
      function (form) {
        var wrapper = form.closest('.form') || form;
        var fields = Array.prototype.filter.call(
          form.querySelectorAll('.form__field[data-type-field]'),
          function (f) {
            var t = f.getAttribute('data-type-field');
            if (t === 'input_hidden') return false;
            return !isHiddenByCss(f); // email/дата скрыты дизайном — не валидируем
          }
        );

        // снимаем ошибку при исправлении
        fields.forEach(function (field) {
          var control = field.querySelector('input, textarea, select');
          if (!control) return;
          var clear = function () { field.classList.remove('is-error'); };
          control.addEventListener('input', clear);
          control.addEventListener('change', clear);
        });

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (wrapper.classList.contains('is-sending')) return;

          var valid = true;
          fields.forEach(function (field) {
            if (!validateField(field)) valid = false;
          });

          if (!valid) {
            var firstError = form.querySelector('.form__field.is-error');
            if (firstError) {
              var c = firstError.querySelector('input, textarea, select');
              if (c) c.focus({ preventScroll: true });
              firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          }

          // серверных эндпоинтов do.js нет — имитируем успешную отправку
          wrapper.classList.add('is-sending');
          window.setTimeout(function () {
            wrapper.classList.remove('is-sending');
            wrapper.classList.add('is-success');
            form.reset();
            fields.forEach(function (f) { f.classList.remove('is-error'); });
            // через несколько секунд возвращаем форму в обычное состояние
            window.setTimeout(function () {
              wrapper.classList.remove('is-success');
            }, 6000);
          }, 900);
        });
      }
    );
  }

  /* ---------- 5. Плавный скролл по якорям ---------- */
  function scrollToTarget(target) {
    var rect = target.getBoundingClientRect();
    var y = rect.top + window.pageYOffset - HIDDEN_OFFSET;
    if (y < 0) y = 0;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function initSmoothAnchors() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href === '#') return;               // заглушки не трогаем
      var id = href.slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
      if (history.replaceState) history.replaceState(null, '', href);
    });
  }

  /* ---------- 5b. Кнопка «наверх» ---------- */
  function initUpButton() {
    var btn = document.createElement('div');
    btn.className = 'up-button';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Наверх');
    btn.innerHTML = '<span class="up-button__icon"></span><span>Наверх</span>';
    document.body.appendChild(btn);

    var ticking = false;
    function update() {
      btn.classList.toggle('is-visible', window.pageYOffset > UP_BTN_SHOW_AT);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- запуск ---------- */
  function init() {
    initPopups();
    initPhoneMasks();
    initConsentCheckboxes();
    initForms();
    initSmoothAnchors();
    initUpButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
