import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  db
} from "../firebase/index.js";
import { CATEGORIES } from "../utils/constants.js";

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [showBefore, setShowBefore] = useState({});

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return galleryItems;
    return galleryItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, galleryItems]);

  const fetchGalleryItems = useCallback(async () => {
    try {
      const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGalleryItems(items);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Data fetching pattern - safe to call setState in effect for initial load
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGalleryItems();
  }, [fetchGalleryItems]);

  const handleImageClick = (item) => {
    setLightboxItem(item);
  };

  const closeLightbox = () => {
    setLightboxItem(null);
  };

  useEffect(() => {
    document.body.style.overflow = lightboxItem ? "hidden" : "unset";
    const handleEsc = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    if (lightboxItem) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [lightboxItem]);

  const toggleBefore = (id) => {
    setShowBefore((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-900 mb-4">
            Our{" "}
            <span className="text-gray-900 dark:text-gray-900 font-bold">
              Gallery
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-900 max-w-2xl mx-auto">
            Explore our collection of stunning 3D printed creations across
            various categories
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === "All"
                ? "bg-orange-600 text-gray-800 shadow-lg shadow-orange-600/30"
                : "bg-white dark:bg-gray-50 text-gray-700 dark:text-gray-900 hover:bg-orange-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-200"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? "bg-orange-600 text-gray-800 shadow-lg shadow-orange-600/30"
                  : "bg-white dark:bg-gray-50 text-gray-700 dark:text-gray-900 hover:bg-orange-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 dark:text-gray-800 text-lg">
              No gallery items found for this category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white dark:bg-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                onClick={() => handleImageClick(item)}
              >
                <div className="relative aspect-square overflow-hidden">
                  {item.beforeImageUrl && showBefore[item.id] ? (
                     <div className="grid grid-cols-2 gap-0.5 h-full">
                       <div className="relative">
                         <img
                           src={item.beforeImageUrl}
                           alt="Before"
                           className="w-full h-full object-cover"
                           onError={(e) => { e.target.style.display = 'none'; }}
                         />
                         <span className="absolute bottom-2 left-2 bg-white/60 text-gray-800 text-xs px-2 py-1 rounded">
                           Before
                         </span>
                       </div>
                       <div className="relative">
                         <img
                           src={item.imageUrl}
                           alt="After"
                           className="w-full h-full object-cover"
                           onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=No+Image'; }}
                         />
                         <span className="absolute bottom-2 right-2 bg-orange-600/80 text-gray-800 text-xs px-2 py-1 rounded">
                           After
                         </span>
                       </div>
                     </div>
                   ) : (
                     <img
                       src={item.imageUrl}
                       alt={item.title}
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                       onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=No+Image'; }}
                     />
                   )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="inline-block px-3 py-1 bg-orange-600/80 text-gray-800 text-xs rounded-full mb-2">
                        {item.category}
                      </span>
                      <h3 className="text-gray-800 text-xl font-bold mb-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-gray-200 text-sm line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {item.beforeImageUrl && (
                  <div className="p-3 flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBefore(item.id);
                      }}
                      className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                    >
                      {showBefore[item.id]
                        ? "Show After Only"
                        : "Compare Before/After"}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-gray-800/80 hover:text-gray-800 text-4xl z-10"
            >
              &times;
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
               {lightboxItem.beforeImageUrl && showBefore[lightboxItem.id] ? (
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                     <img
                       src={lightboxItem.beforeImageUrl}
                       alt="Before"
                       className="w-full rounded-lg"
                       onError={(e) => { e.target.style.display = 'none'; }}
                     />
                     <p className="text-center text-gray-300 mt-2 text-sm">
                       Before
                     </p>
                   </div>
                   <div>
                     <img
                       src={lightboxItem.imageUrl}
                       alt="After"
                       className="w-full rounded-lg"
                       onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Image'; }}
                     />
                     <p className="text-center text-gray-300 mt-2 text-sm">
                       After
                     </p>
                   </div>
                 </div>
               ) : (
                 <img
                   src={lightboxItem.imageUrl}
                   alt={lightboxItem.title}
                   className="w-full max-h-[80vh] object-contain rounded-lg"
                   onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Image'; }}
                 />
               )}
              <div className="text-center mt-4">
                <span className="inline-block px-4 py-1 bg-orange-600/80 text-gray-800 text-sm rounded-full mb-2">
                  {lightboxItem.category}
                </span>
                <h3 className="text-gray-800 text-2xl font-bold">
                  {lightboxItem.title}
                </h3>
                {lightboxItem.description && (
                  <p className="text-gray-300 mt-2">
                    {lightboxItem.description}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;








