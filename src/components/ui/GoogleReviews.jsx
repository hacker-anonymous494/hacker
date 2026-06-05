export default function GoogleReviews() {
  const rating = 4.8;
  const totalReviews = 1058;
  const googleMapsUrl = "https://www.google.com/search?q=trifilia&lrd=0x135a57ec83c646f7:0x255a49da79946444,1,,,,";

  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center gap-2 mb-4 px-3 py-2 bg-amber-500/10 rounded-full border border-amber-500/30">
        <span className="text-xl text-amber-400">★</span>
        <span className="font-semibold text-white">{rating}</span>
        <span className="text-smoke-400">· {totalReviews.toLocaleString()} reviews</span>
      </div>

      <h3 className="font-heading text-2xl md:text-3xl mb-2">What Our Guests Say</h3>
      <p className="text-smoke-300 max-w-2xl mx-auto mb-6">
        Join thousands of happy guests who love our wood‑fired pizza, craft cocktails, and warm hospitality.
      </p>

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 btn-primary"
      >
        <span>★ Read verified reviews on Google</span>
      </a>
    </div>
  );
}
