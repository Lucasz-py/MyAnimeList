import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Separamos los estados para mayor claridad
  const [identifier, setIdentifier] = useState(''); // Para Login (Email o Usuario)
  const [username, setUsername] = useState('');     // Para Registro (Solo Usuario)
  const [email, setEmail] = useState('');           // Para Registro (Solo Email)
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // --- LÓGICA DE INICIO DE SESIÓN (USER O EMAIL) ---
        let loginEmail = identifier;

        // Si el texto NO tiene una arroba (@), asumimos que es un nombre de usuario
        if (!identifier.includes('@')) {
          // Buscamos en la tabla profiles cuál es el correo de este usuario
          const { data, error: searchError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', identifier)
            .maybeSingle(); // maybeSingle no tira error si no encuentra nada, devuelve null

          if (searchError || !data || !data.email) {
            throw new Error('Usuario no encontrado.');
          }
          
          // Si lo encontramos, usamos ese correo para el login real
          loginEmail = data.email;
        }

        // Ejecutamos el login con el correo (ya sea el que escribió o el que encontramos)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (signInError) throw signInError;
        
        onClose();
        
      } else {
        // --- LÓGICA DE REGISTRO ---
        
        // 1. VERIFICACIÓN DE USUARIO ÚNICO
        // Consultamos si ya existe alguien con este username
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (existingUser) {
          throw new Error('Este nombre de usuario ya está en uso. Por favor, elige otro.');
        }

        // 2. Si está libre, procedemos a crear la cuenta
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            }
          }
        });

        if (signUpError) throw signUpError;

        setMessage('¡Cuenta creada! Revisa tu correo electrónico para confirmar tu cuenta.');
      }
    } catch (err: unknown) {
      let errorMessage = 'Ocurrió un error inesperado.';
      if (err instanceof Error) errorMessage = err.message;

      // Traducción de errores comunes para el usuario
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Contraseña incorrecta.');
      } else if (errorMessage.includes('User already registered')) {
        setError('Este correo ya está registrado.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setMessage(null);
    // Limpiamos todo al cambiar de pestaña
    setIdentifier('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-[#1C1C1C] w-full max-w-md p-8 rounded-3xl border border-neutral-800 shadow-2xl m-4 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} type="button" className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors bg-neutral-900/50 hover:bg-neutral-800 p-2 rounded-full">
          <X size={20} />
        </button>

        <div className="text-center mb-8 mt-2">
          <h2 className="text-3xl font-black text-white mb-2">{isLogin ? 'Bienvenido' : 'Crear Cuenta'}</h2>
          <p className="text-neutral-400 text-sm">{isLogin ? 'Inicia sesión en tu cuenta' : 'Únete a Kiroku para gestionar tu colección'}</p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">{error}</div>}
        {message && <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm text-center">{message}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* ----- CAMPOS SI ESTÁ INICIANDO SESIÓN ----- */}
          {isLogin ? (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Usuario o Correo Electrónico</label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="otaku_master o tu@email.com"
                required
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#D6685A] focus:ring-1 focus:ring-[#D6685A]/50 transition-all placeholder:text-neutral-600"
              />
            </div>
          ) : (
            /* ----- CAMPOS SI SE ESTÁ REGISTRANDO ----- */
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Nombre de Usuario (Único)</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: otaku_master"
                  required
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#D6685A] focus:ring-1 focus:ring-[#D6685A]/50 transition-all placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#D6685A] focus:ring-1 focus:ring-[#D6685A]/50 transition-all placeholder:text-neutral-600"
                />
              </div>
            </>
          )}

          {/* ----- CAMPO DE CONTRASEÑA (COMPARTIDO) ----- */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-neutral-300">Contraseña</label>
              {isLogin && <button type="button" className="text-xs text-[#D6685A] hover:underline font-medium">¿Olvidaste tu contraseña?</button>}
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#D6685A] focus:ring-1 focus:ring-[#D6685A]/50 transition-all placeholder:text-neutral-600"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#D6685A] text-white font-bold py-3.5 rounded-xl hover:bg-[#c25a4d] transition-all shadow-lg shadow-[#D6685A]/20 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-neutral-400">
          {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
          <button type="button" onClick={toggleMode} className="text-white font-bold hover:text-[#D6685A] transition-colors">
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </div>

      </div>
    </div>
  );
};