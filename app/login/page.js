'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TelkomLogo } from '../../components/TelkomBrand';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Username atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-200">
        
        {/* Sisi Kiri: Branding Banner TelkomGroup */}
        <div className="bg-gradient-to-br from-[#E4002B] via-[#B80022] to-slate-900 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-black/20 blur-2xl"></div>

          <div className="relative z-10">
            <TelkomLogo light />
          </div>

          <div className="relative z-10 my-10">
            <span className="inline-block bg-white/15 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase mb-3 border border-white/20">
              Enterprise & Business Service
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
              Accelerating Digital Business & Collection
            </h2>
            <p className="text-xs text-red-100 mt-3 leading-relaxed">
              Portal terpadu Account Manager untuk pemantauan status penawaran prospek, rekonsiliasi piutang, dan otomasi pelaporan harian.
            </p>
          </div>

          <div className="relative z-10 border-t border-white/15 pt-4 flex justify-between items-center text-[11px] text-red-100">
            <span className="font-bold tracking-wider">BUMN UNTUK INDONESIA</span>
            <span className="font-semibold opacity-80">EBS Portal v2.0</span>
          </div>
        </div>

        {/* Sisi Kanan: Form Login */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-800">Selamat Datang Kembali</h3>
            <p className="text-xs text-slate-500 mt-1">Silakan masuk menggunakan akun Account Manager terdaftar.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-[#E4002B] text-red-700 p-3 rounded-lg mb-5 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Username AM</label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#E4002B] to-[#B80022] text-white font-bold py-3.5 rounded-xl hover:from-[#c70025] hover:to-[#99001d] transition shadow-lg shadow-red-600/20 text-xs tracking-wider uppercase mt-2"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Portal EBS ➡️'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
