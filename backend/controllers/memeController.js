const Meme = require('../models/Meme');

// Advanced meme search with ranking
exports.searchMemes = async (req, res) => {
  try {
    const { q = '', category, limit = 12 } = req.query;
    const query = q.toLowerCase().trim();

    if (!query && !category) {
      // Return trending memes
      const trending = await Meme.find({ trending: true }).limit(Number(limit)).sort({ usageCount: -1 });
      return res.json({ memes: trending });
    }

    let memes = [];

    if (query) {
      // Step 1: Exact keyword match (highest rank)
      const exactMatch = await Meme.find({
        $or: [
          { keywords: query },
          { tags: query },
          { name: { $regex: `^${escapeRegex(query)}`, $options: 'i' } }
        ]
      }).limit(20);

      // Step 2: Partial match
      const partialMatch = await Meme.find({
        $or: [
          { keywords: { $regex: escapeRegex(query), $options: 'i' } },
          { tags: { $regex: escapeRegex(query), $options: 'i' } },
          { name: { $regex: escapeRegex(query), $options: 'i' } }
        ]
      }).limit(20);

      // Step 3: Token-based matching (split query into words)
      const tokens = query.split(/\s+/).filter(t => t.length > 1);
      let tokenMatch = [];
      if (tokens.length > 1) {
        tokenMatch = await Meme.find({
          $or: tokens.map(token => ({
            $or: [
              { keywords: { $regex: token, $options: 'i' } },
              { tags: { $regex: token, $options: 'i' } }
            ]
          }))
        }).limit(20);
      }

      // Merge and deduplicate with scoring
      const allMemes = new Map();
      exactMatch.forEach(m => {
        allMemes.set(m.id, { meme: m, score: 100 + m.usageCount });
      });
      partialMatch.forEach(m => {
        if (!allMemes.has(m.id)) allMemes.set(m.id, { meme: m, score: 50 + m.usageCount });
      });
      tokenMatch.forEach(m => {
        if (!allMemes.has(m.id)) allMemes.set(m.id, { meme: m, score: 25 + m.usageCount });
      });

      memes = Array.from(allMemes.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, Number(limit))
        .map(item => item.meme);
    }

    if (category) {
      const catMemes = await Meme.find({ category }).sort({ usageCount: -1 }).limit(Number(limit));
      memes = [...new Map([...memes, ...catMemes].map(m => [m.id, m])).values()].slice(0, Number(limit));
    }

    res.json({ memes });
  } catch (err) {
    console.error('Meme search error:', err);
    res.status(500).json({ message: 'Error searching memes' });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const memes = await Meme.find({}).sort({ usageCount: -1 }).limit(20);
    res.json({ memes });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching trending' });
  }
};

exports.getCategories = async (req, res) => {
  const categories = ['reaction', 'greeting', 'emotion', 'humor', 'relatable', 'savage', 'wholesome', 'college', 'gaming', 'work'];
  res.json({ categories });
};

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
