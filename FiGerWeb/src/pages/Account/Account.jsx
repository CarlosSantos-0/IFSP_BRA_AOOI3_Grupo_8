import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch, readApiError } from '../../utils/api.js';

export default function Account() {
  const { user, updateUser } = useAuth();

  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      setIsPending(true);
      const response = await apiFetch('/api/conta', {
        method: 'PUT',
        body: JSON.stringify({ nome: nome.trim(), email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível salvar os dados.'));
      }

      const nextUser = await response.json();
      updateUser(nextUser);
      setSuccessMessage('Dados atualizados com sucesso.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (novaSenha.length < 8) {
      setErrorMessage('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    try {
      setIsPending(true);
      const response = await apiFetch('/api/conta/senha', {
        method: 'PUT',
        body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível alterar a senha.'));
      }

      setSenhaAtual('');
      setNovaSenha('');
      setSuccessMessage('Senha alterada com sucesso.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '820px' }}>
      <section style={{ background: '#fff', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' }}>
        <h1 style={{ marginTop: 0 }}>Minha conta</h1>
        <p style={{ color: '#475569', marginTop: 0 }}>Atualize seus dados pessoais e sua senha.</p>

        {errorMessage && <p role="alert" style={{ color: '#b91c1c' }}>{errorMessage}</p>}
        {successMessage && <p role="status" style={{ color: '#15803d' }}>{successMessage}</p>}

        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span>Nome</span>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar dados'}
          </button>
        </form>
      </section>

      <section style={{ background: '#fff', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' }}>
        <h2 style={{ marginTop: 0 }}>Alterar senha</h2>

        <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span>Senha atual</span>
            <input
              type="password"
              value={senhaAtual}
              onChange={(event) => setSenhaAtual(event.target.value)}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span>Nova senha</span>
            <input
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </label>

          <button type="submit" disabled={isPending}>
            Alterar senha
          </button>
        </form>
      </section>
    </div>
  );
}