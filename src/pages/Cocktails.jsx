import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageLoader from '@/components/ui/PageLoader';

export default function Cocktails() {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCocktails = async () => {
      // Get category ID for Cocktails
      const { data: category, error: catError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('name', 'Cocktails')
        .single();
      
      if (catError || !category) {
        console.error('Cocktails category not found');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', category.id)
        .order('featured', { ascending: false })
        .order('name');
      
      if (error) {
        console.error('Error fetching cocktails:', error);
      } else {
        setCocktails(data || []);
      }
      setLoading(false);
    };
    fetchCocktails();
  }, []);

  if (loading) return ;

  return (
    
      
        Cocktails
        
        {cocktails.length === 0 ? (
          No cocktails found.

        ) : (
          
            {cocktails.map((cocktail) => (
              
                {cocktail.name}
                {cocktail.description}

                ${cocktail.price}

              

            ))}
          

        )}
      

    
  );
}
