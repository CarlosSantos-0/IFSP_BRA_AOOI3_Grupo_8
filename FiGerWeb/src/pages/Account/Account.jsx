import { useState } from 'react';
import { Dialog } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import WarningIcon from '@mui/icons-material/Warning';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch, readApiError } from '../../utils/api.js';
import styles from './Account.module.css';

const CONFIRM_WORD = 'EXCLUIR';

function Feedback({ feedback }) {
  if (!feedback?.text) return null;
  const isError = feedback.type === 'error';
  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={`${styles.feedback} ${isError ? styles.feedbackError : styles.feedbackSuccess}`}
    >
      {feedback.text}
    </p>
  );
}

function PanelHeader({ id, icon, title, subtitle, tone }) {
  return (
    <div className={styles.panelHeader}>
      <span className={`${styles.panelIcon} ${tone === 'danger' ? styles.panelIconDanger : ''}`}>
        {icon}
      </span>
      <div>
        <h2 id={id} className={styles.panelTitle}>{title}</h2>
        <p className={styles.panelSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, updateUser, logout } = useAuth();

  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileFeedback(null);

    try {
      setIsSavingProfile(true);
      const response = await apiFetch('/api/conta', {
        method: 'PUT',
        body: JSON.stringify({ nome: nome.trim(), email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível salvar os dados.'));
      }

      const nextUser = await response.json();
      updateUser(nextUser);
      setProfileFeedback({ type: 'success', text: 'Dados atualizados com sucesso.' });
    } catch (error) {
      setProfileFeedback({ type: 'error', text: error.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const closePasswordForm = () => {
    setShowPasswordForm(false);
    setSenhaAtual('');
    setNovaSenha('');
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (novaSenha.length < 8) {
      setPasswordFeedback({
        type: 'error',
        text: 'A nova senha precisa ter pelo menos 8 caracteres.',
      });
      return;
    }

    try {
      setIsSavingPassword(true);
      const response = await apiFetch('/api/conta/senha', {
        method: 'PUT',
        body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível alterar a senha.'));
      }

      closePasswordForm();
      setPasswordFeedback({ type: 'success', text: 'Senha alterada com sucesso.' });
    } catch (error) {
      setPasswordFeedback({ type: 'error', text: error.message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const openDeleteDialog = () => {
    setConfirmText('');
    setDeletePassword('');
    setDeleteError('');
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    if (!isDeleting) setIsDeleteOpen(false);
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    if (confirmText !== CONFIRM_WORD || !deletePassword) return;

    try {
      setIsDeleting(true);
      setDeleteError('');
      const response = await apiFetch('/api/conta', {
        method: 'DELETE',
        body: JSON.stringify({ senha: deletePassword }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível excluir a conta.'));
      }

      logout();
      window.location.replace('/login');
    } catch (error) {
      setDeleteError(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Minha conta</h1>
        <p className={styles.subtitle}>Gerencie seus dados e preferências.</p>
      </header>

      <div className={styles.panels}>
        {/* Dados pessoais */}
        <section className={styles.card} aria-labelledby="panel-profile">
          <PanelHeader
            id="panel-profile"
            icon={<PersonIcon fontSize="small" />}
            title="Dados pessoais"
            subtitle="Atualize suas informações de perfil."
          />

          <form onSubmit={handleSaveProfile} className={styles.form}>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.label}>Nome</span>
                <input
                  className={styles.input}
                  type="text"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>E-mail</span>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
            </div>

            <Feedback feedback={profileFeedback} />

            <div>
              <button type="submit" className={styles.primaryButton} disabled={isSavingProfile}>
                {isSavingProfile ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </section>

        {/* Segurança */}
        <section className={styles.card} aria-labelledby="panel-security">
          <PanelHeader
            id="panel-security"
            icon={<LockIcon fontSize="small" />}
            title="Segurança"
            subtitle="Mantenha sua conta protegida."
          />

          <div className={styles.securityRow}>
            <div>
              <p className={styles.rowTitle}>Senha</p>
              <p className={styles.rowText}>Use no mínimo 8 caracteres.</p>
            </div>
            {!showPasswordForm && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setPasswordFeedback(null);
                  setShowPasswordForm(true);
                }}
              >
                Alterar senha
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className={styles.form}>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Senha atual</span>
                  <input
                    className={styles.input}
                    type="password"
                    value={senhaAtual}
                    onChange={(event) => setSenhaAtual(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Nova senha</span>
                  <input
                    className={styles.input}
                    type="password"
                    value={novaSenha}
                    onChange={(event) => setNovaSenha(event.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    required
                  />
                </label>
              </div>

              <Feedback feedback={passwordFeedback} />

              <div className={styles.actions}>
                <button type="submit" className={styles.primaryButton} disabled={isSavingPassword}>
                  {isSavingPassword ? 'Salvando...' : 'Salvar nova senha'}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={closePasswordForm}
                  disabled={isSavingPassword}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!showPasswordForm && <Feedback feedback={passwordFeedback} />}
        </section>

        {/* Zona de perigo */}
        <section className={`${styles.card} ${styles.dangerCard}`} aria-labelledby="panel-danger">
          <PanelHeader
            id="panel-danger"
            icon={<WarningIcon fontSize="small" />}
            title="Zona de perigo"
            subtitle="Ações permanentes para sua conta."
            tone="danger"
          />

          <div className={styles.securityRow}>
            <div>
              <p className={styles.rowTitle}>Excluir minha conta e todos os meus dados</p>
              <p className={styles.rowText}>
                Essa ação é irreversível e atende ao seu direito de exclusão.
              </p>
            </div>
            <button type="button" className={styles.dangerButton} onClick={openDeleteDialog}>
              Excluir conta
            </button>
          </div>
        </section>
      </div>

      <Dialog
        open={isDeleteOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
        aria-labelledby="delete-title"
        slotProps={{ paper: { className: styles.dialogPaper } }}
      >
        <form onSubmit={handleDeleteAccount} className={styles.dialogBody}>
          <h2 id="delete-title" className={styles.dialogTitle}>
            Excluir conta?
          </h2>
          <p className={styles.dialogText}>
            Todos os seus dados, incluindo movimentações e categorias, serão apagados
            permanentemente. Para confirmar, digite <strong>{CONFIRM_WORD}</strong> e informe sua senha.
          </p>

          <input
            className={styles.input}
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            aria-label={`Digite ${CONFIRM_WORD} para confirmar`}
            autoComplete="off"
          />

          <input
            className={styles.input}
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            placeholder="Sua senha atual"
            aria-label="Digite sua senha para confirmar"
            autoComplete="current-password"
          />

          {deleteError && (
            <p role="alert" className={`${styles.feedback} ${styles.feedbackError}`}>
              {deleteError}
            </p>
          )}

          <div className={styles.dialogActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.dangerButton}
              disabled={confirmText !== CONFIRM_WORD || !deletePassword || isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}