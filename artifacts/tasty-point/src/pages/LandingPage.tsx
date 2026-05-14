import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { UtensilsCrossed, QrCode, ChevronRight, Star, Clock, Shield } from "lucide-react";

const FEATURES = [
  { icon: QrCode, label: "Scan QR", desc: "Point your camera at the table QR code" },
  { icon: UtensilsCrossed, label: "Browse & Order", desc: "Explore the full menu and add to cart" },
  { icon: Clock, label: "Track Live", desc: "Watch your order status in real time" },
  { icon: Shield, label: "Pay Securely", desc: "UPI, cards or pay at counter" },
];

const float = {
  animate: { y: [0, -12, 0] },
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
};

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tableId = params.get("tableId");
    if (tableId) setLocation(`/menu?tableId=${tableId}`);
  }, [search, setLocation]);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-500/20 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Tasty Point</p>
              <p className="text-red-200 text-[10px] tracking-widest uppercase font-medium">Premium Dining</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full"
          >
            <Star className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
            <span className="text-white text-xs font-semibold">4.8 Rating</span>
          </motion.div>
        </header>

        <main className="relative z-10 px-6 pt-12 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="mx-auto w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl mb-8 border border-white/20"
              {...float}
            >
              <QrCode className="h-14 w-14 text-white" />
            </motion.div>

            <h1 className="text-4xl font-black text-white mb-3 leading-tight tracking-tight">
              Dine Smarter.<br />
              <span className="text-red-200">Order Better.</span>
            </h1>
            <p className="text-red-100 text-base max-w-xs mx-auto leading-relaxed mb-8">
              Scan your table QR code to explore our menu and place your order in seconds.
            </p>

            <motion.div
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-white text-red-700 font-bold px-6 py-3.5 rounded-2xl shadow-xl text-sm cursor-default select-none"
            >
              <QrCode className="h-4 w-4" />
              Scan Table QR to Begin
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </main>

        {/* Wave bottom */}
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" fill="white">
          <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" />
        </svg>
      </div>

      {/* Steps */}
      <section className="px-5 pt-10 pb-6 max-w-lg mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs font-bold text-red-600 tracking-widest uppercase mb-6"
        >
          How It Works
        </motion.p>

        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08, type: "spring", stiffness: 300 }}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 border border-red-100">
                <Icon className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Glass promo card */}
      <section className="px-5 pb-10 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-red-800 p-6 text-white shadow-xl"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
            </div>
            <p className="font-black text-lg leading-snug mb-1">
              Fresh. Fast. Delicious.
            </p>
            <p className="text-red-100 text-sm leading-relaxed">
              Every dish crafted with love. Served hot, straight from our kitchen to your table.
            </p>
          </div>
        </motion.div>
      </section>

      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        <p className="font-semibold text-gray-500">Tasty Point</p>
        <p className="mt-0.5">Quick · Fresh · Delicious</p>
      </footer>
    </div>
  );
}
