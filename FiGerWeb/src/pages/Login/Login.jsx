import { Link } from 'react-router-dom';
import PagePlaceholder from '../../components/PagePlaceholder/PagePlaceholder';

// A tela de login fica fora do AppLayout (sem barra lateral).
export default function Login() {
  return (
    <PagePlaceholder title="Entrar" subtitle="Acesse sua conta para continuar.">
      <Link to="/">Simular acesso</Link>
    </PagePlaceholder>
  );
}