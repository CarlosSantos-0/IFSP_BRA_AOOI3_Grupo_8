import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../components/AuthLayout/AuthLayout.module.css';

const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const { register, isAuthenticated } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

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
      await register({ nome: nome.trim(), email: email.trim(), senha });
      // Conta criada e já logada: o <Navigate> acima leva para o Dashboard
    } catch (error) {
      setErrorMessage(error.message);
      setIsPending(false);
    }
  };

  return (
    <AuthLayout>
      <span className={styles.eyebrow}>COMECE AGORA</span>
      <h1 className={styles.title}>Criar conta</h1>
      <p className={styles.subtitle}>Leva menos de um minuto.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="cadastro-nome">Nome</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">
              <PersonOutlineOutlinedIcon fontSize="small" />
            </span>
            <input
              id="cadastro-nome"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              maxLength={45}
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="cadastro-email">E-mail</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">
              <EmailOutlinedIcon fontSize="small" />
            </span>
            <input
              id="cadastro-email"
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
          <label htmlFor="cadastro-senha">Senha</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">
              <LockOutlinedIcon fontSize="small" />
            </span>
            <input
              id="cadastro-senha"
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
          <label htmlFor="cadastro-confirmacao">Confirmar senha</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">
              <LockOutlinedIcon fontSize="small" />
            </span>
            <input
              id="cadastro-confirmacao"
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
            {errorMessage}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={isPending}>
          {isPending ? 'Criando conta...' : 'Criar conta'}
          {!isPending && <ArrowForwardIcon fontSize="small" />}
        </button>
      </form>

      <p className={styles.switch}>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  );
}
