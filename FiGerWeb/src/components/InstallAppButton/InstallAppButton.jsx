import { useState, useSyncExternalStore } from 'react';
import { Dialog } from '@mui/material';
import InstallMobileOutlinedIcon from '@mui/icons-material/InstallMobileOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import {
  INSTALL_STATE_EVENT,
  canPromptInstall,
  isIos,
  isRunningAsApp,
  promptInstall,
} from '../../utils/installPrompt';
import styles from './InstallAppButton.module.css';

function subscribe(callback) {
  window.addEventListener(INSTALL_STATE_EVENT, callback);
  return () => window.removeEventListener(INSTALL_STATE_EVENT, callback);
}

// Botão "Instalar app". Só aparece quando faz sentido:
//  - Android/Chrome/Edge: quando o navegador permite instalar
//  - iPhone/iPad: sempre (mostra o passo a passo do Safari)
//  - nunca dentro do próprio app já instalado
export default function InstallAppButton({ className = '' }) {
  const canPrompt = useSyncExternalStore(subscribe, canPromptInstall);
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (isRunningAsApp()) return null;

  const ios = isIos();
  if (!canPrompt && !ios) return null;

  const handleClick = () => {
    if (canPrompt) promptInstall();
    else setShowIosHelp(true);
  };

  return (
    <>
      <button type="button" className={`${styles.button} ${className}`} onClick={handleClick}>
        <InstallMobileOutlinedIcon fontSize="small" />
        <span>Instalar app</span>
      </button>

      <Dialog open={showIosHelp} onClose={() => setShowIosHelp(false)}>
        <div className={styles.help}>
          <h2>Instalar o FiGer no iPhone</h2>
          <p>No Safari:</p>
          <ol>
            <li>
              Toque em <strong>Compartilhar</strong>{' '}
              <IosShareIcon fontSize="inherit" aria-label="ícone de compartilhar" />
            </li>
            <li>
              Escolha <strong>Adicionar à Tela de Início</strong>{' '}
              <AddBoxOutlinedIcon fontSize="inherit" aria-hidden="true" />
            </li>
            <li>Toque em <strong>Adicionar</strong>.</li>
          </ol>
          <p className={styles.note}>
            O ícone do FiGer aparece na tela inicial e abre direto em “Nova movimentação”, mesmo
            sem internet.
          </p>
          <button type="button" className={styles.close} onClick={() => setShowIosHelp(false)}>
            Entendi
          </button>
        </div>
      </Dialog>
    </>
  );
}
