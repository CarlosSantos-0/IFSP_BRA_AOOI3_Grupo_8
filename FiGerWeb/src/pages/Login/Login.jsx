import { useNavigate } from 'react-router-dom';
import PagePlaceholder from '../../components/PagePlaceholder/PagePlaceholder';
import { useAuth } from '../../hooks/useAuth';

// A tela de login fica fora do AppLayout (sem barra lateral).
// Por enquanto o acesso é simulado; a autenticação real entra quando as tabelas de usuário existirem.
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSimulateLogin = () => {
    login({ name: 'Gabriela Alves', email: 'gabriela@email.com' });
    navigate('/');
  };

  return (
    <PagePlaceholder title="Entrar" subtitle="Acesse sua conta para continuar.">
      <button type="button" onClick={handleSimulateLogin}>
        Simular acesso
      </button>
    </PagePlaceholder>
  );
}