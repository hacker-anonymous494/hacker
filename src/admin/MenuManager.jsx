import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Save, X, Upload, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MenuManager() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    featured: false,
    tags: [],
    allergens: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [allergenInput, setAllergenInput] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch categories separately
      const { data: cats, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order', { ascending: true })
      if (catError) throw catError
      setCategories(cats || [])

      // Fetch all menu items (no nested select)
      const { data: menuItems, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category_id')
        .order('name')
      if (itemsError) throw itemsError
      setItems(menuItems || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category_id: item.category_id,
        image_url: item.image_url || '',
        featured: item.featured || false,
        tags: item.tags || [],
        allergens: item.allergens || [],
      })
    } else {
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: categories[0]?.id || '',
        image_url: '',
        featured: false,
        tags: [],
        allergens: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      toast.success('Image uploaded')
    } catch (error) {
      console.error(error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }
  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }
  const addAllergen = () => {
    if (allergenInput.trim() && !formData.allergens.includes(allergenInput.trim())) {
      setFormData(prev => ({ ...prev, allergens: [...prev.allergens, allergenInput.trim()] }))
      setAllergenInput('')
    }
  }
  const removeAllergen = (allergen) => {
    setFormData(prev => ({ ...prev, allergens: prev.allergens.filter(a => a !== allergen) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
    }
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingItem.id)
        if (error) throw error
        toast.success('Item updated')
      } else {
        const { error } = await supabase.from('menu_items').insert([payload])
        if (error) throw error
        toast.success('Item added')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error('Save failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) {
      toast.error('Delete failed')
    } else {
      toast.success('Deleted')
      fetchData()
    }
  }

  const toggleFeatured = async (id, current) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ featured: !current })
      .eq('id', id)
    if (!error) fetchData()
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl">Menu Manager</h1>
        <button onClick={() => openModal()} className="btn-primary py-2 px-4 text-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="space-y-8">
        {categories.map(cat => {
          const catItems = items.filter(i => i.category_id === cat.id)
          if (catItems.length === 0) return null
          return (
            <div key={cat.id}>
              <h2 className="font-heading text-xl mb-3 border-l-4 border-amber-500 pl-3">{cat.name}</h2>
              <div className="grid grid-cols-1 gap-2">
                {catItems.map(item => (
                  <div key={item.id} className="glass rounded-xl p-3 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.image_url && <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-smoke-400 truncate">{item.description}</p>
                      </div>
                      <span className="text-amber-400 font-bold">${item.price}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleFeatured(item.id, item.featured)} className={`p-1.5 rounded ${item.featured ? 'text-amber-400' : 'text-smoke-500'}`}>
                        <Star className="w-4 h-4" />
                      </button>
                      <button onClick={() => openModal(item)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal – same as before, unchanged */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-smoke-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-smoke-900 p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="font-heading text-xl">{editingItem ? 'Edit Item' : 'New Item'}</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows="3" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Price *</label>
                    <input type="number" step="0.01" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Category</label>
                    <select value={formData.category_id} onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Image</label>
                  <div className="flex gap-3 items-center">
                    {formData.image_url && <img src={formData.image_url} alt="preview" className="w-16 h-16 object-cover rounded-lg" />}
                    <label className="btn-outline py-2 px-3 text-xs cursor-pointer">
                      <Upload className="w-4 h-4 inline mr-1" /> Upload
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                    {uploading && <span className="text-xs">Uploading...</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Tags (vegan, spicy, etc.)</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addTag()} className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm" placeholder="Add tag" />
                    <button type="button" onClick={addTag} className="px-3 py-1.5 bg-amber-600/20 rounded-lg text-amber-400 text-sm">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-xs">
                        {tag} <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Allergens (dairy, nuts, etc.)</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={allergenInput} onChange={e => setAllergenInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addAllergen()} className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm" placeholder="Add allergen" />
                    <button type="button" onClick={addAllergen} className="px-3 py-1.5 bg-red-600/20 rounded-lg text-red-400 text-sm">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.allergens.map(allergen => (
                      <span key={allergen} className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full text-xs">
                        {allergen} <X className="w-3 h-3 cursor-pointer" onClick={() => removeAllergen(allergen)} />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="featured" checked={formData.featured} onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="featured" className="text-sm">Featured item (shows on homepage)</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline py-2 px-4">Cancel</button>
                  <button type="submit" className="btn-primary py-2 px-4"><Save className="w-4 h-4" /> Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}