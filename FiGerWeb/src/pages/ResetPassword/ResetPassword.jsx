import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import { apiFetch, readApiError } from '../../utils/api';
import styles from '../../components/AuthLayout/AuthLayout.module.css';

const MIN_PASSWORD_LENGTH = 8;

// Passo 2 da recuperação: a pessoa chega aqui pelo link do e-mail
// (/redefinir-senha?token=...) e escolhe a nova senha.
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (senha.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setErrorMessage('As senhas não são iguais.');
      return;
    }

    setIsPending(true);
    try {
      const response = await apiFetch('/api/auth/redefinir-senha', {
        method: 'POST',
        body: JSON.stringify({ token, nova_senha: senha }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível redefinir a senha.'));
      }

      setIsDone(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsPending(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <span className={styles.eyebrow}>REDEFINIR ACESSO</span>
        <h1 className={styles.title}>Link inválido</h1>
        <p className={styles.subtitle}>
          Este link de recuperação está incompleto. Peça um novo para continuar.
        </p>
        <p className={styles.switch}>
          <Link to="/recuperar-senha">Pedir novo link</Link>
        </p>
      </AuthLayout>
    );
  }

  if (isDone) {
    return (
      <AuthLayout>
        <span className={styles.eyebrow}>TUDO CERTO</span>
        <h1 className={styles.title}>Senha redefinida</h1>
        <p className={styles.subtitle}>Agora é só entrar com a sua nova senha.</p>
        <div className={styles.form}>
          <Link to="/login" className={styles.submit}>
            Ir para o login
            <ArrowForwardIcon fontSize="small" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <span className={styles.eyebrow}>REDEFINIR ACESSO</span>
      <h1 className={styles.title}>Nova senha</h1>
      <p className={styles.subtitle}>Escolha uma nova senha para a sua conta.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="redefinir-senha">Nova senha</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">
              <LockOutlinedIcon fontSize="small" />
            </span>
            <input
              id="redefinir-senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <VisibilityOffOutlinedIcon fontSize="small" />
              ) : (
                <VisibilityOutlinedIcon fontSize="small" />
              )}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="redefinir-confirmacao">Confirmar nova senha</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">
              <LockOutlinedIcon fontSize="small" />
            </span>
            <input
              id="redefinir-confirmacao"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              required
            />
          </div>
        </div>

        {errorMessage && (
          <p className={styles.formError} role="alert">
            {errorMessage}{' '}
            {errorMessage.includes('expirou') && <Link to="/recuperar-senha">Pedir novo link</Link>}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar nova senha'}
          {!isPending && <ArrowForwardIcon fontSize="small" />}
        </button>
      </form>

      <p className={styles.switch}>
        Lembrou sua senha? <Link to="/login">Voltar para o login</Link>
      </p>
    </AuthLayout>
  );
}
