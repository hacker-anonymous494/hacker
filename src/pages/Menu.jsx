import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Search, Filter, X, ChefHat, Coffee, Wine, Pizza, Martini, Cake, Utensils } from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'

const categoryIcons = {
  'Pizza': Pizza,
  'Cocktails': Martini,
  'Wines': Wine,
  'Beers': Coffee,
  'Appetizers': Utensils,
  'Desserts': Cake,
  default: ChefHat
}

export default function Menu() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [dietaryFilters, setDietaryFilters] = useState({
    vegan: false,
    vegetarian: false,
    glutenFree: false,
    spicy: false
  })

  useEffect(() => {
    fetchMenuData()
  }, [])

  const fetchMenuData = async () => {
    setLoading(true)
    try {
      // Fetch categories
      const { data: cats, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order', { ascending: true })
      if (catError) throw catError
      if (cats) setCategories(cats)

      // Fetch all menu items
      const { data: menuItems, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category_id')
        .order('name')
      if (itemsError) throw itemsError
      if (menuItems) setItems(menuItems)
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper: get category name by category_id
  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat ? cat.name : 'Other'
  }

  const filterItems = () => {
    let filtered = items

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => getCategoryName(item.category_id) === activeCategory)
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      )
    }

    // Dietary filters
    if (Object.values(dietaryFilters).some(v => v === true)) {
      filtered = filtered.filter(item => {
        const tags = item.tags || []
        return (
          (!dietaryFilters.vegan || tags.includes('vegan')) &&
          (!dietaryFilters.vegetarian || tags.includes('vegetarian')) &&
          (!dietaryFilters.glutenFree || tags.includes('gluten-free')) &&
          (!dietaryFilters.spicy || tags.includes('spicy'))
        )
      })
    }

    return filtered
  }

  const filteredItems = filterItems()
  const groupedItems = filteredItems.reduce((acc, item) => {
    const catName = getCategoryName(item.category_id)
    if (!acc[catName]) acc[catName] = []
    acc[catName].push(item)
    return acc
  }, {})

  const toggleDietaryFilter = (key) => {
    setDietaryFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const clearFilters = () => {
    setActiveCategory('all')
    setSearchQuery('')
    setDietaryFilters({ vegan: false, vegetarian: false, glutenFree: false, spicy: false })
  }

  const hasActiveFilters = activeCategory !== 'all' || searchQuery !== '' || Object.values(dietaryFilters).some(v => v)

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Sip & Savor</span>
          <h1 className="font-display text-4xl md:text-5xl mt-2 mb-4">Our Menu</h1>
          <div className="w-20 h-0.5 bg-amber-500/50 mx-auto" />
          <p className="text-smoke-300 max-w-2xl mx-auto mt-4">
            Wood‑fired pizzas, craft cocktails, and seasonal small plates – made from the finest local ingredients.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-smoke-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-smoke-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border transition-colors ${showFilters ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-white/5 border-white/10 text-smoke-300 hover:text-white'}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-smoke-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
              <span>Clear all</span>
            </button>
          )}
        </div>

        {/* Dietary Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="glass rounded-xl p-5 flex flex-wrap gap-4">
                <span className="text-sm text-smoke-400 mr-2">Dietary:</span>
                {Object.entries(dietaryFilters).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleDietaryFilter(key)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 accent-amber-500"
                    />
                    <span className="text-sm capitalize">{key === 'glutenFree' ? 'Gluten Free' : key}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-amber-600 text-white shadow-lg' : 'bg-white/5 text-smoke-300 hover:bg-white/10'}`}
          >
            All
          </button>
          {categories.map(cat => {
            const Icon = categoryIcons[cat.name] || categoryIcons.default
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.name ? 'bg-amber-600 text-white shadow-lg' : 'bg-white/5 text-smoke-300 hover:bg-white/10'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Menu Items Display */}
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-smoke-400">No items match your filters.</p>
            <button onClick={clearFilters} className="mt-4 text-amber-400 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
              <div key={categoryName}>
                <h2 className="font-heading text-2xl md:text-3xl border-l-4 border-amber-500 pl-4 mb-6">{categoryName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      viewport={{ once: true }}
                      className="menu-card group flex flex-col sm:flex-row gap-4 p-4"
                    >
                      {item.image_url && (
                        <div className="sm:w-28 h-28 rounded-xl overflow-hidden shrink-0">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <h3 className="font-heading text-lg font-semibold">{item.name}</h3>
                          <span className="font-body text-amber-400 font-bold">${item.price}</span>
                        </div>
                        <p className="text-smoke-400 text-sm mt-1 mb-2">{item.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags?.map(tag => (
                            <span key={tag} className="text-2xs bg-white/5 px-2 py-0.5 rounded-full capitalize text-smoke-300">{tag}</span>
                          ))}
                          {item.allergens?.map(allergen => (
                            <span key={allergen} className="text-2xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{allergen}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}