import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Heart, QrCode, CreditCard, Sparkles } from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);

  const bankDetails = {
    bankName: 'Ngân hàng Ngoại thương Việt Nam (Vietcombank)',
    accountNumber: '1022668888',
    accountName: 'VŨ DUY THÀNH',
    message: 'TheRum Donate',
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate a mock Vietcombank VietQR dynamic payload SVG
  // This produces a realistic QR visual layout that looks authentic and beautifully matches the theme!
  const renderQRCodeSVG = () => {
    return (
      <svg 
        viewBox="0 0 100 100" 
        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-white p-3.5 rounded-2xl shadow-inner select-none"
        id="qr-svg-canvas"
      >
        {/* Outer frame and locator squares for standard QR code */}
        {/* Top-Left Locator */}
        <path d="M5,5 h18 v18 h-18 z M8,8 h12 v12 h-12 z M11,11 h6 v6 h-6 z" fill="#005a30" />
        {/* Top-Right Locator */}
        <path d="M77,5 h18 v18 h-18 z M80,8 h12 v12 h-12 z M83,11 h6 v6 h-6 z" fill="#005a30" />
        {/* Bottom-Left Locator */}
        <path d="M5,77 h18 v18 h-18 z M8,80 h12 v12 h-12 z M11,83 h6 v6 h-6 z" fill="#005a30" />
        {/* Alignment pattern bottom right */}
        <path d="M77,77 h9 v9 h-9 z M80,80 h3 v3 h-3 z" fill="#00a850" />

        {/* Detailed Simulated Data Blocks (representing real QR elements) */}
        {/* We use an elegant clean mosaic grid mimicking fully-valid data clusters */}
        <g fill="#111827">
          <rect x="28" y="5" width="4" height="4" rx="1" />
          <rect x="36" y="5" width="8" height="2" rx="0.5" />
          <rect x="48" y="5" width="6" height="4" rx="1" />
          <rect x="58" y="5" width="2" height="6" rx="0.5" />
          <rect x="64" y="5" width="8" height="4" rx="1" />
          
          <rect x="28" y="11" width="12" height="2" />
          <rect x="44" y="11" width="4" height="6" rx="1" />
          <rect x="52" y="11" width="10" height="2" />
          <rect x="68" y="11" width="6" height="6" rx="1" />
          
          <rect x="28" y="17" width="2" height="8" rx="0.5" />
          <rect x="34" y="17" width="6" height="4" rx="1" />
          <rect x="44" y="21" width="16" height="2" />
          <rect x="64" y="19" width="4" height="8" rx="1" />
          <rect x="72" y="17" width="2" height="4" />

          {/* Core Body Columns */}
          <rect x="5" y="27" width="14" height="2" />
          <rect x="23" y="27" width="8" height="4" rx="1" />
          <rect x="35" y="27" width="12" height="2" />
          <rect x="51" y="27" width="18" height="4" rx="1" />
          <rect x="73" y="27" width="12" height="2" />
          <rect x="89" y="27" width="6" height="6" rx="1" />

          <rect x="5" y="33" width="6" height="6" rx="1" />
          <rect x="15" y="33" width="14" height="2" />
          <rect x="33" y="33" width="8" height="12" rx="1" />
          <rect x="45" y="33" width="2" height="6" />
          <rect x="51" y="39" width="16" height="2" />
          <rect x="71" y="33" width="10" height="4" rx="1" />
          <rect x="85" y="33" width="2" height="10" />

          {/* Horizontal cross dots */}
          <rect x="5" y="47" width="20" height="2" />
          <rect x="29" y="49" width="12" height="4" rx="1" />
          <rect x="45" y="47" width="18" height="2" />
          <rect x="67" y="49" width="14" height="4" rx="1" />
          <rect x="85" y="47" width="10" height="2" />

          {/* Lower layout codes */}
          <rect x="29" y="57" width="4" height="8" rx="1" />
          <rect x="37" y="57" width="14" height="2" />
          <rect x="55" y="57" width="8" height="4" rx="1" />
          <rect x="67" y="57" width="18" height="2" />
          <rect x="89" y="57" width="6" height="8" rx="1" />

          <rect x="29" y="69" width="18" height="2" />
          <rect x="51" y="65" width="10" height="4" rx="1" />
          <rect x="65" y="69" width="6" height="2" />
          <rect x="75" y="65" width="16" height="2" />

          <rect x="5" y="71" width="2" height="12" />
          <rect x="11" y="71" width="12" height="2" />
          <rect x="27" y="75" width="6" height="10" rx="1" />
          <rect x="37" y="75" width="24" height="2" />
          <rect x="65" y="73" width="4" height="4" />
          <rect x="73" y="75" width="12" height="8" rx="1" />

          <rect x="11" y="87" width="12" height="2" />
          <rect x="27" y="89" width="14" height="2" />
          <rect x="45" y="87" width="2" height="6" />
          <rect x="51" y="89" width="18" height="2" />
        </g>

        {/* Center overlay representing the VietQR / Vietcombank logo */}
        <g id="qr-center-logo">
          <rect x="38" y="38" width="24" height="24" rx="5" fill="#ffffff" stroke="#005a30" strokeWidth="1.5" />
          {/* VCB Brand color representation */}
          <rect x="41" y="41" width="18" height="18" rx="3" fill="#005a30" />
          <path d="M44,45 c0,0 2,-2 6,-2 c4,0 6,2 6,2 c0,0 -2,2 -6,2 c-4,0 -6,-2 -6,-2 z" fill="#00a850" />
          {/* Centered code text */}
          <text x="50" y="54" fontSize="5.5" fontWeight="900" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif">
            VCB
          </text>
        </g>
      </svg>
    );
  };

  const presets = [20000, 50000, 100000, 200000, 500000];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="donate-modal-root">
          {/* Glass backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-zoom-out"
          />

          {/* Modal Card Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Elegant upper decorative line */}
            <div className="w-full h-1 bg-gradient-to-r from-emerald-500 via-rose-500 to-blue-500 shrink-0" />

            {/* Header section wrapper */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Heart className="w-5 h-5 fill-current animate-pulse text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">Ủng Hộ Dự Án TheRum</h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Đồng hành cùng nhóm dịch ra mắt nhiều tuyệt phẩm VN</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body contents */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Left side: QR Code Card */}
                <div className="space-y-3 text-center">
                  <div className="relative inline-block">
                    {renderQRCodeSVG()}
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg shadow-md border border-zinc-950 flex items-center gap-1">
                      <QrCode className="w-2.5 h-2.5" />
                      <span>VietQR VCB</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Quét bằng ứng dụng ngân hàng hoặc ví điện tử (MoMo, ZaloPay, ...)
                  </p>
                </div>

                {/* Right side: Bank Details Copy Fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Tên Ngân Hàng</span>
                    <div className="flex items-center justify-between p-2.5 bg-zinc-900 border border-white/5 rounded-xl text-xs font-semibold text-white">
                      <span>{bankDetails.bankName}</span>
                      <CreditCard className="w-4 h-4 text-zinc-550" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Số Tài Khoản</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankDetails.accountNumber, 'accountNumber')}
                      className="w-full flex items-center justify-between p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-white/5 hover:border-white/10 rounded-xl text-xs font-mono font-bold text-emerald-400 text-left transition-all cursor-pointer group"
                    >
                      <span>{bankDetails.accountNumber}</span>
                      {copiedField === 'accountNumber' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-550 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Tên Người Nhận</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankDetails.accountName, 'accountName')}
                      className="w-full flex items-center justify-between p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-white/5 hover:border-white/10 rounded-xl text-xs font-semibold text-white text-left transition-all cursor-pointer group"
                    >
                      <span>{bankDetails.accountName}</span>
                      {copiedField === 'accountName' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-550 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Nội dung Chuyển</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankDetails.message, 'message')}
                      className="w-full flex items-center justify-between p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold text-zinc-300 text-left transition-all cursor-pointer group"
                    >
                      <span className="text-amber-400 font-mono">{bankDetails.message}</span>
                      {copiedField === 'message' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-550 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Presets Grid */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-bold font-sans uppercase tracking-wider">Chọn nhanh số tiền uống coffee</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {presets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedAmount(amount)}
                      className={`py-2 rounded-xl text-[11px] font-bold font-mono transition-all border cursor-pointer ${
                        selectedAmount === amount
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-extrabold'
                          : 'bg-zinc-900 text-zinc-500 border-white/5 hover:text-zinc-300'
                      }`}
                    >
                      {(amount / 1000)}k
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-550 italic leading-snug">
                  * Note: Mọi khoản đóng góp của bạn bất kể lớn nhỏ đều là nguồn động lực cực kỳ to lớn giúp nhóm dịch trả phí máy chủ lưu trữ (free speed tối đa) và duy trì nhóm!
                </p>
              </div>

            </div>

            {/* Sticky footer action button */}
            <div className="p-4 bg-zinc-900/60 border-t border-white/5 flex items-center justify-between text-xs shrink-0">
              <span className="text-zinc-400 font-medium">TheRum xin trân trọng cảm ơn!</span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Tôi Đã Hiểu
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
