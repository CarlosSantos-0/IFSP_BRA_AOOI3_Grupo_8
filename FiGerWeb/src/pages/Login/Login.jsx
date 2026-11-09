import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../components/AuthLayout/AuthLayout.module.css';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const destination = location.state?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  // Já está logado: não faz sentido ver o login
  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsPending(true);

    try {
      await login(email.trim(), senha);
      // Ao logar, o <Navigate> acima leva o usuário para a página de destino
    } catch (error) {
      setErrorMessage(error.message);
      setIsPending(false);
    }
  };

  return (
    <AuthLayout>
      <span className={styles.eyebrow}>BEM-VINDO DE VOLTA</span>
      <h1 className={styles.title}>Entrar</h1>
      <p className={styles.subtitle}>Acesse sua conta para continuar.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="login-email">E-mail</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">
              <EmailOutlinedIcon fontSize="small" />
            </span>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="login-senha">Senha</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">
              <LockOutlinedIcon fontSize="small" />
            </span>
            <input
              id="login-senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
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

        {errorMessage && (
          <p className={styles.formError} role="alert">
            {errorMessage}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={isPending}>
          {isPending ? 'Entrando...' : 'Entrar'}
          {!isPending && <ArrowForwardIcon fontSize="small" />}
        </button>
      </form>

      <p className={styles.switch}>
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </AuthLayout>
  );
}
