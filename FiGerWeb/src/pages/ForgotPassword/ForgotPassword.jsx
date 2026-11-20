import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import { apiFetch, readApiError } from '../../utils/api';
import styles from '../../components/AuthLayout/AuthLayout.module.css';

// Passo 1 da recuperação: a pessoa informa o e-mail e a API envia um link
// com um token para /redefinir-senha (ver ResetPassword.jsx).
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsPending(true);

    try {
      const response = await apiFetch('/api/auth/esqueci-senha', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível enviar o link.'));
      }

      const { mensagem } = await response.json();
      setSuccessMessage(
        mensagem ?? 'Se existir uma conta com esse e-mail, enviaremos um link para redefinir a senha.',
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AuthLayout>
      <span className={styles.eyebrow}>REDEFINIR ACESSO</span>
      <h1 className={styles.title}>Recuperar senha</h1>
      <p className={styles.subtitle}>Informe seu e-mail e enviaremos um link para você.</p>

      {successMessage ? (
        <div className={styles.form}>
          <p className={styles.formSuccess} role="status">
            {successMessage} Confira também a caixa de spam.
          </p>
          <button
            type="button"
            className={styles.submit}
            onClick={() => setSuccessMessage('')}
          >
            Enviar para outro e-mail
          </button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="recuperar-email">E-mail</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon} aria-hidden="true">
                <EmailOutlinedIcon fontSize="small" />
              </span>
              <input
                id="recuperar-email"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          {errorMessage && (
            <p className={styles.formError} role="alert">
              {errorMessage}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar link'}
            {!isPending && <ArrowForwardIcon fontSize="small" />}
          </button>
        </form>
      )}

      <p className={styles.switch}>
        Lembrou sua senha? <Link to="/login">Voltar para o login</Link>
      </p>
    </AuthLayout>
  );
}
