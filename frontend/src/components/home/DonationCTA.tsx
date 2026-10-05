import { useState } from "react";
import {
  Heart,
  Gift,
  Zap,
  X,
  Copy,
  Check,
  ArrowUpRight,
  Shield,
  Layers,
  Star,
  HandHeart,
} from "lucide-react";

const DonationCTA = () => {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const accountDetails = {
    accountName: "Girls'-You Got It Charity Foundation",
    accountNumber: "0126935460",
    bank: "Wema Bank",
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const donationTiers = [
    {
      id: "supporter",
      name: "Supporter",
      amount: "$10",
      period: "/month",
      icon: Heart,
      color: "#EC4899",
    },
    {
      id: "champion",
      name: "Champion",
      amount: "$50",
      period: "/month",
      icon: Star,
      color: "#F59E0B",
    },
    {
      id: "catalyst",
      name: "Catalyst",
      amount: "$100",
      period: "/month",
      icon: Zap,
      color: "#8B5CF6",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-transparent py-20 sm:py-24 lg:py-28">
      {/* Texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #111827 1px, transparent 1px)",
          backgroundSize: "25px 25px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* MASTER VIEWPORT CONTAINER */}
        <div className="bg-white rounded-[36px] p-6 sm:p-8 lg:p-10 max-w-[1100px] mx-auto shadow-2xl border border-black/5">
          {/* HEADER */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <span className="w-8 h-0.5 bg-primary rounded-full"></span>
              Support Our Mission
              <span className="w-8 h-0.5 bg-primary rounded-full"></span>
            </span>
            <h2 className="text-3xl font-black leading-[1.02] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
              Make an <span className="text-primary">Impact</span> Today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Your support directly transforms lives through quality education.
            </p>
          </div>

          {/* BENTO GRID - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-6">
              {/* Protection Card */}
              <div className="bg-[#FAFAFA] rounded-[24px] p-5 sm:p-6 border border-[#F0F0F2] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    Protection
                  </h3>
                  <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white transition-colors duration-300">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  Ensure the resilience of your impact portfolio. Your donation
                  empowers girls across Africa with quality education.
                </p>
                <p className="text-xs text-gray-600 mb-5">
                  Help us shield their future and optimize their potential.
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-xs font-bold text-gray-900">
                      12/32
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1.5">
                      Programs funded
                    </span>
                  </div>
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="13"
                        stroke="#F3F4F6"
                        strokeWidth="3"
                        fill="none"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="13"
                        stroke="#c147e9"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="81.6"
                        strokeDashoffset="62"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-bold text-gray-700">
                      24%
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric Card */}
              <div className="bg-[#FAFAFA] rounded-[24px] p-5 border border-[#F0F0F2]">
                <div className="flex items-center gap-2 text-2xl font-black text-foreground">
                   96%
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  With GYGI's responsive programs, your donations will shine
                  across the continent.
                </p>
              </div>
            </div>

            {/* CENTER COLUMN */}
            <div className="flex flex-col items-center justify-center">
              {/* Card Container */}
              <div className="relative w-[280px] sm:w-[300px] h-[180px] sm:h-[190px]">
                <div className="absolute -top-3 left-4 right-4 h-full bg-primary rounded-[20px] shadow-sm z-0"></div>

                <div className="relative z-10 bg-[#121212] rounded-[20px] p-5 sm:p-6 text-white w-full h-full flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6 bg-amber-200/80 rounded-md border border-amber-400/40 flex items-center justify-center">
                        <div className="w-4 h-3 border border-amber-600/40 grid grid-cols-2 grid-rows-2"></div>
                      </div>
                      <span className="text-gray-400 text-xs">)))</span>
                    </div>
                    <span className="text-lg font-black text-primary">
                      GYGI
                    </span>
                  </div>

                  <div>
                    <div className="text-[9px] tracking-widest text-gray-400 uppercase font-mono">
                      Donation Impact
                    </div>
                    <div className="text-lg font-semibold tracking-wide text-white mt-0.5 flex items-center gap-2">
                      <HandHeart className="w-4.5 h-4.5 text-primary" />
                      Girls Empowered
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Score Readout */}
              <div className="text-center mt-6">
                <div className="text-sm font-medium text-gray-900">
                  Your impact create{" "}
                  <span className="font-bold text-primary">CHANGE</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Together, we’re creating opportunities and changing lives,
                </div>
              </div>

              {/* Equalizer Gauge */}
              <div className="flex items-end gap-1 h-8 mt-4">
                {[
                  12, 18, 24, 16, 28, 32, 22, 14, 26, 30, 18, 22, 12, 20, 28,
                  16, 24,
                ].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}px` }}
                    className={`w-1 rounded-full transition-all duration-300 ${i > 10 ? "bg-primary" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-6">
              {/* Donation Tiers */}
              <div className="bg-[#FAFAFA] rounded-[24px] p-5 border border-[#F0F0F2]">
                <div className="mb-3 flex items-center gap-2 text-xl font-black text-foreground">
                  <Gift className="w-5 h-5 text-primary" />
                  Donation Tiers
                </div>
                <div className="space-y-2">
                  {donationTiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setShowDonateModal(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <tier.icon
                          className="w-4 h-4"
                          style={{ color: tier.color }}
                        />
                        <span className="text-xs font-bold text-gray-800">
                          {tier.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-black"
                        style={{ color: tier.color }}
                      >
                        {tier.amount}
                        <span className="text-[9px] font-normal text-gray-400">
                          {tier.period}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Layers Card */}
              <div className="bg-[#FAFAFA] rounded-[24px] p-5 sm:p-6 border border-[#F0F0F2] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Layers className="w-4 h-4 text-primary" />
                    Multi-Layers
                  </h3>
                  <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white transition-colors duration-300">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                  Dive into unprecedented versatility. Your donation creates
                  multiple layers of positive change across Africa.
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-xs font-bold text-gray-900">
                      25/32
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1.5">
                      Communities reached
                    </span>
                  </div>
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="13"
                        stroke="#F3F4F6"
                        strokeWidth="3"
                        fill="none"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="13"
                        stroke="#c147e9"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="81.6"
                        strokeDashoffset="29.3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-bold text-gray-700">
                      64%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA BUTTON */}
          <div className="text-center mt-10">
            <button
              onClick={() => setShowDonateModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-primary/25"
            >
              <Heart className="w-5 h-5" />
              Donate Now
            </button>
          </div>
        </div>
      </div>

      {/* DONATION MODAL */}
      {showDonateModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDonateModal(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDonateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
                  <HandHeart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-foreground">
                  Bank Transfer Details
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Use the information below to make your donation
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Account Name
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {accountDetails.accountName}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(accountDetails.accountName, "name")
                    }
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    {copiedField === "name" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-primary" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Account Number
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {accountDetails.accountNumber}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(accountDetails.accountNumber, "number")
                    }
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    {copiedField === "number" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-primary" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="text-sm font-bold text-foreground">
                      {accountDetails.bank}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(accountDetails.bank, "bank")}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    {copiedField === "bank" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-primary" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                After making your transfer, please email proof of payment to{" "}
                <a
                  href="mailto:girlsyougotit25@gmail.com"
                  className="text-primary hover:underline"
                >
                  girlsyougotit25@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bounce Animation */}
      <style>{`
        @keyframes bounce-in {
          0% { opacity: 0; transform: translateY(60px) scale(0.7); }
          50% { opacity: 1; transform: translateY(-15px) scale(1.05); }
          70% { transform: translateY(5px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </section>
  );
};

export default DonationCTA;
