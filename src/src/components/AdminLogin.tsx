import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ChevronLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
  correctUsername: string;
  correctPassword: string;
}

export default function AdminLogin({
  onLoginSuccess,
  onBack,
  correctUsername,
  correctPassword
}: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วนค่ะ");
      return;
    }

    setIsSubmitting(true);

    // Add a tiny realistic network delay for feeling
    setTimeout(() => {
      setIsSubmitting(false);
      // Case-insensitive/trimmed comparison for convenience
      if (
        username.trim().toLowerCase() === correctUsername.toLowerCase() &&
        password === correctPassword
      ) {
        onLoginSuccess();
      } else {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้งค่ะ");
      }
    }, 600);
  };

  return (
    <div className="w-full h-[100dvh] md:max-w-[430px] mx-auto md:h-[880px] bg-[#fff8f6] text-[#231914] relative overflow-hidden flex flex-col md:rounded-[48px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] md:border-[10px] md:border-neutral-900 md:ring-1 md:ring-black/10 transition-all duration-300">
      
      {/* iPhone 16+ Dynamic Island Mockup on Desktop */}
      <div className="hidden md:flex absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-between px-3 shadow-inner">
        <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#231914]/40"></div>
        <div className="w-3.5 h-1 bg-[#1a1a1a] rounded-full"></div>
        <div className="w-2 h-2 rounded-full bg-[#050505] border border-neutral-800/20"></div>
      </div>

      {/* Back button header */}
      <header className="shrink-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md md:pt-11 pt-4 px-4 py-3 flex items-center justify-between border-b border-[#f2dfd5]/60">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold bg-[#feeae0]/60 hover:bg-[#feeae0] text-[#9b4500] px-3 py-1.5 rounded-full border border-[#ddc1b3]/20 transition-all duration-150 active:scale-95"
        >
          <ChevronLeft size={14} />
          <span>กลับหน้าหลัก</span>
        </button>
        <span className="text-[11px] font-extrabold text-[#9b4500]/70 tracking-wider">SECURE PORTAL</span>
        <div className="w-14"></div> {/* spacer */}
      </header>

      {/* Main Login content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-center gap-8">
        <div className="text-center flex flex-col items-center gap-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#9b4500] to-[#ff8c42] flex items-center justify-center shadow-lg text-white"
          >
            <ShieldCheck size={32} className="stroke-[2.2]" />
          </motion.div>
          
          <div className="flex flex-col gap-1 mt-2">
            <h2 className="text-xl font-extrabold text-[#231914] tracking-tight">เข้าสู่ระบบแอดมิน</h2>
            <p className="text-xs text-[#897266] font-medium max-w-[280px] mx-auto leading-relaxed">
              สำหรับผู้ดูแลร้านค้าเพื่อจัดการออเดอร์ เช็คสต็อก และแก้ไขข้อมูลระบบ
            </p>
          </div>
        </div>

        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-white p-5 rounded-3xl border border-[#ddc1b3]/30 shadow-sm"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200/60 rounded-2xl text-[11px] text-red-600 font-semibold leading-relaxed text-center"
            >
              ⚠️ {error}
            </motion.div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#564338] flex items-center gap-1">
              <User size={13} className="text-[#9b4500]" />
              <span>Username / Email</span>
            </label>
            <input 
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้งาน หรืออีเมล"
              className="px-3.5 py-2.5 rounded-xl border border-[#ddc1b3]/50 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-xs placeholder:text-[#897266]/40 bg-[#fff8f6]/50 text-[#231914]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#564338] flex items-center gap-1">
              <Lock size={13} className="text-[#9b4500]" />
              <span>Password (รหัสผ่าน)</span>
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านเข้าสู่ระบบ"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#ddc1b3]/50 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-xs placeholder:text-[#897266]/40 bg-[#fff8f6]/50 text-[#231914]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition p-1"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-2xl bg-[#9b4500] hover:bg-[#ff8c42] active:scale-98 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 disabled:bg-stone-300 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>เข้าสู่ระบบเพื่อจัดการร้าน</span>
            )}
          </button>
        </motion.form>

        <div className="text-center mt-auto">
          <p className="text-[10px] text-[#897266]/60 font-semibold">
            ระบบป้องกันความปลอดภัย ครอฟเฟิลไอ้แว่น กม.44
          </p>
        </div>
      </div>
    </div>
  );
}
