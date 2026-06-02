import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Heart, QrCode, CreditCard, Sparkles } from 'lucide-react';
import qrCodeUrl from '../../assets/qr_code.png';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);

  const bankDetails = {
    bankName: 'Ngân hàng Ngoại thương Việt Nam (Vietcombank)',
    accountNumber: '1033519370',
    accountName: 'VŨ DUY THÀNH',
    message: '[username] + [email] donate.',
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
                    <img
                      src={qrCodeUrl}
                      alt="VietQR Vietcombank Vũ Duy Thành"
                      className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-white p-2 rounded-2xl shadow-inner select-none object-contain"
                    />
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
              <div className="space-y-4 border-t border-white/5 pt-4">
                {/* <div className="flex items-center gap-1.5 text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-bold font-sans uppercase tracking-wider">Chọn nhanh số tiền uống coffee</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {presets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedAmount(amount)}
                      className={`py-2 rounded-xl text-[11px] font-bold font-mono transition-all border cursor-pointer ${selectedAmount === amount
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-extrabold'
                        : 'bg-zinc-900 text-zinc-500 border-white/5 hover:text-zinc-300'
                        }`}
                    >
                      {(amount / 1000)}k
                    </button>
                  ))}
                </div> */}

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                    Cảm ơn bạn đã muốn Donate/ủng hộ ❤️
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Để đăng ký tài khoản VIP, bạn cần donate <strong className="text-emerald-400 font-bold">36k</strong>. Hãy chụp màn hình thanh toán và gửi về page <a href="https://www.facebook.com/people/The-Rum/61590124352436/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-colors">TheRum</a> để admin xác nhận lên tài khoản VIP nhé 🫶
                  </p>
                  <p className="text-xs text-zinc-300 font-medium">Xin cảm ơn rất nhiều!</p>
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
