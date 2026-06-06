import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Search, X, Flame, Star } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';

export default function Cocktails() {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSpicy, setShowSpicy] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);

  useEffect(() => {
    const fetchCocktails = async () => {
      const { data: category, error: catError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('name', 'Cocktails')
        .single();

      if (catError || !category) {
        console.error('Cocktails category not found');
        setCocktails([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', category.id)
        .order('featured', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching cocktails:', error);
        setCocktails([]);
      } else {
        setCocktails(data || []);
      }
      setLoading(false);
    };
    fetchCocktails();
  }, []);

  const filterCocktails = () => {
    let filtered = cocktails;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    if (showSpicy) {
      filtered = filtered.filter(c => c.tags?.includes('spicy'));
    }
    if (showFeatured) {
      filtered = filtered.filter(c => c.featured);
    }
    return filtered;
  };

  const filtered = filterCocktails();

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Liquid Artistry</span>
          <h1 className="font-display text-4xl md:text-5xl mt-2 mb-4">Cocktails</h1>
          <div className="w-20 h-0.5 bg-amber-500/50 mx-auto" />
          <p className="text-smoke-300 max-w-2xl mx-auto mt-4">
            Hand‑crafted elixirs using small‑batch spirits, fresh citrus, and house‑made syrups.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-smoke-400" />
            <input
              type="text"
              placeholder="Search cocktails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-smoke-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSpicy(!showSpicy)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                showSpicy ? 'bg-red-600/30 text-red-400 border border-red-600/50' : 'bg-white/5 text-smoke-300 hover:bg-white/10'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Spicy
            </button>
            <button
              onClick={() => setShowFeatured(!showFeatured)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                showFeatured ? 'bg-amber-600/30 text-amber-400 border border-amber-600/50' : 'bg-white/5 text-smoke-300 hover:bg-white/10'
              }`}
            >
              <Star className="w-3.5 h-3.5" /> Featured
            </button>
            {(searchQuery || showSpicy || showFeatured) && (
              <button onClick={() => { setSearchQuery(''); setShowSpicy(false); setShowFeatured(false); }} className="px-4 py-2 text-smoke-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cocktail Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-smoke-400">No cocktails match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((cocktail, idx) => (
              <motion.div
                key={cocktail.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="glass rounded-2xl overflow-hidden hover:shadow-amber transition-all duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={cocktail.image_url || '/cocktail-placeholder.jpg'}
                    alt={cocktail.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    loading="lazy"
                  />
                  {cocktail.featured && (
                    <div className="absolute top-3 left-3 bg-amber-600/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Signature
                    </div>
                  )}
                  {cocktail.tags?.includes('spicy') && (
                    <div className="absolute top-3 right-3 bg-red-600/90 text-white px-2 py-1 rounded-full text-xs">
                      🌶️ Spicy
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-heading text-xl font-semibold">{cocktail.name}</h3>
                    <span className="font-body text-amber-400 font-bold">${cocktail.price}</span>
                  </div>
                  <p className="text-smoke-400 text-sm mb-3">{cocktail.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}