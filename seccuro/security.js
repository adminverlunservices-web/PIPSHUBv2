const blockContextMenu = (event) => {
  event.preventDefault();
};

export function enableClientProtection() {
  document.addEventListener('contextmenu', blockContextMenu);

  return () => {
    document.removeEventListener('contextmenu', blockContextMenu);
  };
}
