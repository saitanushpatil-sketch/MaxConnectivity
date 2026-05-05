import { useState, useEffect, useRef, useCallback } from 'react';
import { memesAPI } from '../../utils/api';

const CATEGORIES = ['🔥 All', '😂 Reaction', '👋 Greeting', '😢 Emotion', '💀 Humor', '😬 Relatable', '😈 Savage', '🥰 Wholesome', '🎮 Gaming', '💼 Work', '🎓 College'];
const CAT_MAP = { '🔥 All': '', '😂 Reaction': 'reaction', '👋 Greeting': 'greeting', '😢 Emotion': 'emotion', '💀 Humor': 'humor', '😬 Relatable': 'relatable', '😈 Savage': 'savage', '🥰 Wholesome': 'wholesome', '🎮 Gaming': 'gaming', '💼 Work': 'work', '🎓 College': 'college' };

export default function MemePanel({ searchQuery = '', onSelectMeme, onClose }) {
  const [memes, setMemes] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('🔥 All');
  const [localSearch, setLocalSearch] = useState('');
  const debounceRef = useRef(null);
  const searchRef = useRef(null);

  // Auto-search from chat input
  useEffect(() => {
    if (searchQuery && searchQuery.length > 1) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadTrending();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMemes(localSearch, CAT_MAP[activeCategory]);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch, activeCategory]);

  const loadTrending = async () => {
    try {
      const { data } = await memesAPI.trending();
      setTrending(data.memes || []);
      setMemes(data.memes || []);
    } catch {}
  };

  const fetchMemes = async (q, category) => {
    if (!q && !category) {
      setMemes(trending);
      return;
    }
    setLoading(true);
    try {
      const { data } = await memesAPI.search(q, category, 20);
      setMemes(data.memes || []);
    } catch {
      setMemes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meme-panel bg-max-surface border-t border-max-border flex flex-col" style={{ maxHeight: '320px' }}>
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-max-border">
        <div className="flex-1 flex items-center gap-2 bg-max-card border border-max-border rounded-xl px-3 py-1.5">
          <span className="text-sm">🔍</span>
          <input
            ref={searchRef}
            type="text"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder="Search memes..."
            className="flex-1 bg-transparent text-max-text text-xs placeholder-max-muted outline-none"
          />
          {localSearch && (
            <button onClick={() => setLocalSearch('')} className="text-max-muted text-sm">×</button>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 text-max-muted hover:text-max-text text-sm">✕</button>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-max-border flex-shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-max-cyan text-max-bg'
                : 'bg-max-card text-max-muted border border-max-border hover:border-max-cyan/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Meme grid */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-max-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : memes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-3xl mb-2">🤔</span>
            <p className="text-max-muted text-xs">No memes found</p>
            <p className="text-max-muted text-[10px] mt-0.5">Try a different search</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {memes.map(meme => (
              <button
                key={meme.id || meme._id}
                onClick={() => onSelectMeme(meme)}
                className="relative group rounded-xl overflow-hidden bg-max-card border border-max-border hover:border-max-cyan transition-all duration-150 active:scale-95 aspect-square"
              >
                <img
                  src={meme.url}
                  alt={meme.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-max-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                  <span className="text-[9px] text-max-text text-left leading-tight line-clamp-2">{meme.name}</span>
                </div>
                {/* Trending badge */}
                {meme.trending && (
                  <div className="absolute top-1 right-1 bg-max-pink text-white text-[8px] px-1 py-0.5 rounded font-bold">
                    🔥
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick suggestion chips when search is active */}
      {localSearch && memes.length > 0 && (
        <div className="px-3 py-1.5 border-t border-max-border">
          <p className="text-[10px] text-max-muted">
            {memes.length} result{memes.length !== 1 ? 's' : ''} for "{localSearch}"
          </p>
        </div>
      )}
    </div>
  );
}
