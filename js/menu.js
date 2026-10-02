document.addEventListener('DOMContentLoaded', function () {
    var menu = document.querySelector('.menu[class*="menu--u-"]');
    if (!menu) return;
  
    var burger  = menu.querySelector('.menu__burger-button');
    var closeBtn = menu.querySelector('.menu__close-button');
    var overlay = menu.querySelector('.menu__overlay');
  
    function openMenu() {
      menu.classList.add('is-opened');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      menu.classList.remove('is-opened');
      document.body.style.overflow = '';
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