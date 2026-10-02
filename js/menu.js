document.addEventListener('DOMContentLoaded', function () {
    var menu = document.querySelector('.menu[class*="menu--u-"]');
    if (!menu) return;
  
    var burger  = menu.querySelector('.menu__burger-button');
    var closeBtn = menu.querySelector('.menu__close-button');
    var overlay = menu.querySelector('.menu__overlay');
  
    function openMenu() {
      if (menu.classList.contains('is-opened')) return;
      menu.classList.add('is-opened');
      // общий счётчик блокировки скролла из app.js (попапы + меню)
      if (window.ttBodyLock) window.ttBodyLock(true);
      else document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      if (!menu.classList.contains('is-opened')) return;
      menu.classList.remove('is-opened');
      if (window.ttBodyLock) window.ttBodyLock(false);
      else document.body.style.overflow = '';
    }
  
    if (burger)   burger.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay)  overlay.addEventListener('click', closeMenu);
  
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-opened')) closeMenu();
    });
  
    menu.querySelectorAll('.menu__link-lvl1').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  });