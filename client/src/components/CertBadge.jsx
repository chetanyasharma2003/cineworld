// Certification badge — supports Indian (U, U/A, A) and US (G, PG, PG-13, R, NC-17) ratings
const STYLES = {
  "U":     "bg-green-600/20  border-green-500/50  text-green-400",
  "U/A":   "bg-amber-600/20  border-amber-500/50  text-amber-400",
  "A":     "bg-red-600/20    border-red-500/50    text-red-400",
  "G":     "bg-green-600/20  border-green-500/50  text-green-400",
  "PG":    "bg-blue-600/20   border-blue-500/50   text-blue-400",
  "PG-13": "bg-amber-600/20  border-amber-500/50  text-amber-400",
  "R":     "bg-red-600/20    border-red-500/50    text-red-400",
  "NC-17": "bg-red-900/30    border-red-700/50    text-red-300",
};

export default function CertBadge({ cert, size = "sm" }) {
  if (!cert) return null;
  const style = STYLES[cert] ?? "bg-white/10 border-white/20 text-gray-300";
  const cls   = size === "lg"
    ? "px-2.5 py-0.5 text-xs font-black rounded tracking-widest"
    : "px-1.5 py-[1px] text-[10px] font-black rounded tracking-widest";
  return (
    <span className={`border ${style} ${cls}`}>{cert}</span>
  );
}

// Extract the best certification from TMDB release_dates response
// Prefers India (IN), then US, then first available
export function extractCert(releaseDatesData) {
  const results = releaseDatesData?.results ?? [];
  const priority = ["IN", "US", "GB"];
  for (const country of priority) {
    const entry = results.find(r => r.iso_3166_1 === country);
    if (!entry) continue;
    const cert = (entry.release_dates ?? [])
      .map(d => d.certification)
      .filter(Boolean)[0];
    if (cert) return cert;
  }
  // Fallback: first cert found anywhere
  for (const entry of results) {
    const cert = (entry.release_dates ?? []).map(d => d.certification).filter(Boolean)[0];
    if (cert) return cert;
  }
  return null;
}
