const profileButton = document.querySelector('[data-account-menu-trigger]');
const userMenuList = document.getElementById('account-menu-list');

profileButton.addEventListener('click', () => {
    userMenuList.hidden = !userMenuList.hidden;
});