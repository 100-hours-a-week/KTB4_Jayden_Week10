export function setUiState(element, state, stateNames = ['is-loading', 'is-empty', 'is-error']) {
  element.classList.remove(...stateNames);
  if (state) element.classList.add(state);
  element.setAttribute('aria-busy', String(state === 'is-loading'));
}

export function showDialog(dialog) {
  dialog.showModal();
  dialog.classList.add('is-active');
}

export function hideDialog(dialog) {
  dialog.close();
  dialog.classList.remove('is-active');
}
