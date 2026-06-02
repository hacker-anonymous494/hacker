import { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';

export default function TableViewer({ table, onClose }) {
  const [fullscreen, setFullscreen] = useState(false);
  
  // Use Google Street View static image if pano_id exists, else fallback
  const streetViewUrl = table.street_view_pano_id
    ? `https://maps.googleapis.com/maps/api/streetview?size=800x600&pano=${table.street_view_pano_id}&heading=0&pitch=0&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    : table.image_url || '/placeholder-table.jpg';

  return (
    <div className={`fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 ${fullscreen ? 'p-0' : ''}`}>
      <div className="relative max-w-5xl w-full bg-smoke-900 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="font-heading text-xl">{table.name} – 360° View</h2>
          <div className="flex gap-2">
            <button onClick={() => setFullscreen(!fullscreen)} className="p-2 rounded-lg hover:bg-white/10">
              <Maximize2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className={`relative ${fullscreen ? 'h-screen' : 'h-96'}`}>
          <img 
            src={streetViewUrl} 
            alt={`360 view of ${table.name}`}
            className="w-full h-full object-cover"
          />
          {!table.street_view_pano_id && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
              Interactive 360° coming soon
            </div>
          )}
        </div>
        <div className="p-4 text-sm text-smoke-300">
          <p><strong>Zone:</strong> {table.zone === 'inside' ? 'Indoor' : table.zone === 'outside' ? 'Outdoor Patio' : 'Rooftop'}</p>
          <p><strong>Capacity:</strong> {table.capacity} guests</p>
          <p><strong>Description:</strong> {table.description || 'Cozy spot with great ambiance.'}</p>
        </div>
      </div>
    </div>
  );
}