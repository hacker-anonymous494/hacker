import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Upload, GripVertical, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GalleryManager() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('order', { ascending: true })
      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
    } else {
      toast.error('Please select an image file')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `gallery-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, selectedFile)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(fileName)

      const newOrder = images.length
      const { error: insertError } = await supabase
        .from('gallery_images')
        .insert([{
          image_url: publicUrl,
          caption: caption || null,
          order: newOrder,
        }])
      if (insertError) throw insertError

      toast.success('Image added to gallery')
      setIsModalOpen(false)
      setSelectedFile(null)
      setCaption('')
      fetchGallery()
    } catch (error) {
      console.error(error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, imageUrl) => {
    if (!confirm('Delete this image?')) return
    try {
      // Extract path from URL to delete from storage
      const path = imageUrl.split('/').pop()
      if (path) {
        await supabase.storage.from('gallery-images').remove([path])
      }
      const { error } = await supabase.from('gallery_images').delete().eq('id', id)
      if (error) throw error
      toast.success('Image deleted')
      fetchGallery()
    } catch (error) {
      console.error(error)
      toast.error('Delete failed')
    }
  }

  const reorderImages = async (newOrder) => {
    setImages(newOrder)
    // Update order in database
    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from('gallery_images')
        .update({ order: i })
        .eq('id', newOrder[i].id)
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl">Gallery Manager</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary py-2 px-4 text-sm">
          <Plus className="w-4 h-4" /> Add Image
        </button>
      </div>

      {images.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <ImageIcon className="w-12 h-12 text-smoke-600 mx-auto mb-3" />
          <p className="text-smoke-400">No images yet. Upload your first gallery photo.</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={images} onReorder={reorderImages} className="space-y-3">
          {images.map((img) => (
            <Reorder.Item key={img.id} value={img} className="glass rounded-xl p-3 flex items-center gap-4 cursor-move">
              <GripVertical className="w-4 h-4 text-smoke-500" />
              <img src={img.image_url} alt={img.caption || 'Gallery'} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{img.caption || 'Untitled'}</p>
                <p className="text-xs text-smoke-500">Order: {img.order}</p>
              </div>
              <button onClick={() => handleDelete(img.id, img.image_url)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-smoke-900 rounded-2xl max-w-md w-full">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="font-heading text-xl">Add Gallery Image</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Image *</label>
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => document.getElementById('fileInput').click()}>
                    {selectedFile ? (
                      <div>
                        <ImageIcon className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                        <p className="text-sm">{selectedFile.name}</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-smoke-500 mx-auto mb-2" />
                        <p className="text-sm text-smoke-400">Click to select image</p>
                      </div>
                    )}
                    <input id="fileInput" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Caption (optional)</label>
                  <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" placeholder="Describe this image..." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="btn-outline py-2 px-4">Cancel</button>
                  <button onClick={handleUpload} disabled={!selectedFile || uploading} className="btn-primary py-2 px-4">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}