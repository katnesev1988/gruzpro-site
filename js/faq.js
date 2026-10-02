document.addEventListener('DOMContentLoaded', function () {
    var headers = document.querySelectorAll('.accordion__header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var item = header.closest('.accordion__item');
        if (!item) return;
        item.classList.toggle('is-opened');
      });
    });
  });