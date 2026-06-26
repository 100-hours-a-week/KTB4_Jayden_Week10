const accountMenus = document.querySelectorAll('[data-account-menu]');

function closeAccountMenu(menu) {
  const trigger = menu.querySelector('[data-account-menu-trigger]');
  const list = menu.querySelector('[data-account-menu-list]');
  if (!trigger || !list) return;

  list.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
}

function markCurrentAccountLink(menu) {
  const links = menu.querySelectorAll('[data-account-menu-list] a');
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');

  links.forEach((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/index\.html$/, '/');
    const isCurrent = linkPath === currentPath;
    link.classList.toggle('is-selected', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

accountMenus.forEach((menu) => {
  const trigger = menu.querySelector('[data-account-menu-trigger]');
  const list = menu.querySelector('[data-account-menu-list]');
  if (!trigger || !list) return;

  markCurrentAccountLink(menu);

  trigger.addEventListener('click', () => {
    const willOpen = list.hidden;
    accountMenus.forEach(closeAccountMenu);
    list.hidden = !willOpen;
    trigger.setAttribute('aria-expanded', String(willOpen));
  });

  list.addEventListener('click', () => closeAccountMenu(menu));
});

document.addEventListener('click', (event) => {
  accountMenus.forEach((menu) => {
    if (!menu.contains(event.target)) closeAccountMenu(menu);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  accountMenus.forEach(closeAccountMenu);
});
