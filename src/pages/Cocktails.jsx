import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Search, Filter, X, Star, Flame } from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'

export default function Cocktails() {
  const [cocktails, setCocktails] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSpicyOnly, setShowSpicyOnly] = useState(false)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)

  useEffect(() => {
    fetchCocktails()
  }, [])

  const fetchCocktails = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('categories.name', 'Cocktails')
        .order('featured', { ascending: false })
        .order('name')

      if (error) throw error
      setCocktails(data || [])
    } catch (error) {
      console.error('Error fetching cocktails:', error)
      // Fallback mock data
      setCocktails(mockCocktails)
    } finally {
      setLoading(false)
    }
  }

  const filterCocktails = () => {
    let filtered = cocktails
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q)
      )
    }
    if (showSpicyOnly) {
      filtered = filtered.filter(c => c.tags?.includes('spicy'))
    }
    if (showFeaturedOnly) {
      filtered = filtered.filter(c => c.featured)
    }
    return filtered
  }

  const filtered = filterCocktails()

  if (loading) return <PageLoader />

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
              onClick={() => setShowSpicyOnly(!showSpicyOnly)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                showSpicyOnly ? 'bg-red-600/30 text-red-400 border-red-600/50' : 'bg-white/5 text-smoke-300 hover:bg-white/10'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Spicy
            </button>
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                showFeaturedOnly ? 'bg-amber-600/30 text-amber-400 border-amber-600/50' : 'bg-white/5 text-smoke-300 hover:bg-white/10'
              }`}
            >
              <Star className="w-3.5 h-3.5" /> Featured
            </button>
            {(searchQuery || showSpicyOnly || showFeaturedOnly) && (
              <button onClick={() => { setSearchQuery(''); setShowSpicyOnly(false); setShowFeaturedOnly(false) }} className="px-4 py-2 text-smoke-400 hover:text-white">
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
                className="glass rounded-2xl overflow-hidden group hover:shadow-amber transition-all duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={cocktail.image_url || '/cocktail-placeholder.jpg'}
                    alt={cocktail.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {cocktail.featured && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-600/90 text-white px-2 py-1 rounded-full text-xs">
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
                  {cocktail.allergens?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {cocktail.allergens.map(a => (
                        <span key={a} className="text-2xs bg-white/5 px-2 py-0.5 rounded-full text-smoke-300">⚠️ {a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Mock data fallback
const mockCocktails = [
  { id: '1', name: 'Smoked Old Fashioned', description: 'Bourbon, demerara, angostura, smoked with cherry wood', price: 16, featured: true, tags: [], allergens: [], image_url: null },
  { id: '2', name: 'Veranda Spritz', description: 'Aperol, prosecco, soda, orange wheel', price: 14, featured: true, tags: [], allergens: [], image_url: null },
  { id: '3', name: 'Spicy Margarita', description: 'Tequila, lime, agave, jalapeño infusion', price: 15, featured: false, tags: ['spicy'], allergens: [], image_url: null },
]