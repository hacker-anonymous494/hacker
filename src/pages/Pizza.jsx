import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Search, Filter, X, Flame, Heart, Wheat, Leaf } from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'

export default function Pizza() {
  const [pizzas, setPizzas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dietaryFilter, setDietaryFilter] = useState('all') // all, vegetarian, gluten-free

  useEffect(() => {
    fetchPizzas()
  }, [])

    const fetchPizzas = async () => {
      const { data: category, error: catError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('name', 'Pizza')
        .single()

      if (catError || !category) {
        setPizzas([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', category.id)
        .order('featured', { ascending: false })
        .order('name', { ascending: true })

      if (!error && data) setPizzas(data)
      else if (error) setPizzas([])
      setLoading(false)
    }

  const filterPizzas = () => {
    let filtered = pizzas
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    if (dietaryFilter === 'vegetarian') {
      filtered = filtered.filter(p => p.tags?.includes('vegetarian'))
    }
    if (dietaryFilter === 'gluten-free') {
      filtered = filtered.filter(p => p.tags?.includes('gluten-free'))
    }
    return filtered
  }

  const filtered = filterPizzas()

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Wood‑Fired Perfection</span>
          <h1 className="font-display text-4xl md:text-5xl mt-2 mb-4">Artisan Pizza</h1>
          <div className="w-20 h-0.5 bg-amber-500/50 mx-auto" />
          <p className="text-smoke-300 max-w-2xl mx-auto mt-4">
            Hand‑stretched, 48‑hour fermented dough, topped with the finest ingredients and fired at 900°F.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-smoke-400" />
            <input
              type="text"
              placeholder="Search pizza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-smoke-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${dietaryFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-white/5 text-smoke-300 hover:bg-white/10'}`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter('vegetarian')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${dietaryFilter === 'vegetarian' ? 'bg-green-600/30 text-green-400 border border-green-600/50' : 'bg-white/5 text-smoke-300 hover:bg-white/10'}`}
            >
              <Leaf className="w-3.5 h-3.5" /> Vegetarian
            </button>
            <button
              onClick={() => setDietaryFilter('gluten-free')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${dietaryFilter === 'gluten-free' ? 'bg-blue-600/30 text-blue-400 border border-blue-600/50' : 'bg-white/5 text-smoke-300 hover:bg-white/10'}`}
            >
              <Wheat className="w-3.5 h-3.5" /> Gluten Free
            </button>
            {(searchQuery || dietaryFilter !== 'all') && (
              <button onClick={() => { setSearchQuery(''); setDietaryFilter('all') }} className="px-4 py-2 text-smoke-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pizza Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-smoke-400">No pizzas match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map((pizza, idx) => (
              <motion.div
                key={pizza.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="group flex flex-col sm:flex-row gap-5 glass rounded-2xl p-4 hover:shadow-amber transition-all duration-300"
              >
                <div className="sm:w-36 h-36 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={pizza.image_url || '/pizza-placeholder.jpg'}
                    alt={pizza.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-1">
                    <h3 className="font-heading text-xl font-semibold">{pizza.name}</h3>
                    <span className="font-body text-amber-400 font-bold text-lg">${pizza.price}</span>
                  </div>
                  <p className="text-smoke-400 text-sm mb-2">{pizza.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {pizza.featured && (
                      <span className="badge bg-amber-600/80 text-white border-none">
                        <Flame className="w-3 h-3 mr-1" /> Chef's Special
                      </span>
                    )}
                    {pizza.tags?.includes('vegetarian') && (
                      <span className="badge bg-green-600/80 text-white border-none">Vegetarian</span>
                    )}
                    {pizza.tags?.includes('gluten-free') && (
                      <span className="badge bg-blue-600/80 text-white border-none">Gluten Free</span>
                    )}
                    {pizza.tags?.includes('spicy') && (
                      <span className="badge bg-red-600/80 text-white border-none">Spicy</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const mockPizzas = [
  { id: '1', name: 'Margherita', description: 'San Marzano tomatoes, fresh mozzarella, basil, EVOO', price: 16, featured: true, tags: ['vegetarian'], allergens: ['dairy', 'gluten'], image_url: null },
  { id: '2', name: 'Pepperoni', description: 'Tomato sauce, mozzarella, spicy pepperoni, oregano', price: 19, featured: false, tags: [], allergens: ['dairy', 'gluten'], image_url: null },
]