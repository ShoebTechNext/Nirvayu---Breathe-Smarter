import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full rounded-3xl p-6 bg-slate-900 border border-teal-500/30 text-center space-y-4 shadow-xl">
        <div className="text-3xl font-extrabold text-teal-400">
          निर्वायु · NIRVAYU
        </div>
        <h1 className="text-lg font-bold">You are currently offline</h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Live AQI data requires an internet connection. While offline, remember
          to keep windows shut during morning and evening haze, wet-mop floors,
          and wear a fitted N95 mask when commuting.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold"
        >
          Retry Connection
        </Link>
      </div>
    </main>
  );
}
