// Instalação do app (PWA).
//
// Chrome/Edge/Android disparam "beforeinstallprompt" quando o site pode ser
// instalado. Guardamos esse evento para chamar .prompt() quando a pessoa clicar
// no botão "Instalar app". O evento pode chegar antes de qualquer tela montar,
// por isso este arquivo é importado logo no main.jsx.
//
// iPhone/iPad (Safari) não têm esse evento: lá a instalação é manual, pelo
// botão Compartilhar > "Adicionar à Tela de Início".

export const INSTALL_STATE_EVENT = 'figer:install-state';

let deferredPrompt = null;

function notify() {
  window.dispatchEvent(new Event(INSTALL_STATE_EVENT));
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // não mostra o aviso automático; usamos o nosso botão
  deferredPrompt = event;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  notify();
});

export function isRunningAsApp() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // Safari no iPhone
  );
}

export function isIos() {
  const ua = window.navigator.userAgent;
  // iPadOS se apresenta como Mac, mas tem tela de toque
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

export function canPromptInstall() {
  return deferredPrompt !== null;
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  const event = deferredPrompt;
  deferredPrompt = null;
  event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome === 'accepted';
}
