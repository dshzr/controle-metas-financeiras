/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Target } from 'lucide-react';
import { authState } from '../lib/api';

interface AuthProps {
  onLogin: () => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      authState.setToken(data.token);
      onLogin();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center text-white mx-auto mb-6">
          <Target size={32} />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          GoalFlow
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          {isLogin ? 'Bem-vindo de volta às suas metas' : 'Comece a planejar seu futuro hoje'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-gray-700">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Senha</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all transform active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-70"
            >
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
            >
              {isLogin ? 'Ainda não tem conta? Clique para criar' : 'Já possui conta? Fazer login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
