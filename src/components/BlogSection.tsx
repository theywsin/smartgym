import React, { useState } from "react";
import { 
  Search, 
  Calendar, 
  User, 
  Clock, 
  Heart, 
  ChevronRight, 
  X, 
  Sparkles,
  BookOpen,
  MessageSquare
} from "lucide-react";
import { BlogPost, toPersianNums } from "../types";

interface BlogSectionProps {
  posts: BlogPost[];
  onLike: (id: string) => void;
}

export default function BlogSection({ posts, onLike }: BlogSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [hasLiked, setHasLiked] = useState<{ [key: string]: boolean }>({});

  // Extract unique categories
  const categories = ["همه", ...Array.from(new Set(posts.map(p => p.category)))];

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "همه" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLikeClick = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!hasLiked[postId]) {
      onLike(postId);
      setHasLiked(prev => ({ ...prev, [postId]: true }));
    }
  };

  return (
    <div id="landing-blog" className="space-y-12 py-6">
      
      {/* Title & Subtitle */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          دانشنامه و مجله ورزشی اسمارت جیم
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100">
          آخرین مقالات و آموزش‌های تخصصی
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          جدیدترین مقالات مربیان برتر و کارشناسان تکنولوژی ورزشی درباره روش‌های بدنسازی، تغذیه هوشمند و اصول مدیریت مدرن باشگاه‌ها.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat 
                  ? "bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/20" 
                  : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="جستجو در مقالات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-all text-right"
            dir="rtl"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-auto right-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Articles Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/20 rounded-3xl border border-white/5">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">هیچ مقاله‌ای با مشخصات جستجو شده یافت نشد.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <div 
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden hover:border-blue-500/30 hover:bg-slate-900/60 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer"
            >
              {/* Cover Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img 
                  src={post.imageUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop"} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                <span className="absolute top-4 right-4 bg-blue-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  {post.category}
                </span>
              </div>

              {/* Body Content */}
              <div className="p-6 flex flex-col flex-grow space-y-4">
                <div className="flex items-center gap-4 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    {toPersianNums(post.publishedDate)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed">
                  {post.title}
                </h3>

                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    مطالعه در {toPersianNums(post.readTime)}
                  </span>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => handleLikeClick(e, post.id)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all ${
                        hasLiked[post.id] 
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-400 font-extrabold" 
                          : "bg-slate-950/50 border-white/5 hover:border-rose-500/20 text-slate-400 hover:text-rose-400"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked[post.id] ? "fill-current" : ""}`} />
                      <span>{toPersianNums(post.likes)}</span>
                    </button>

                    <span className="text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      مطالعه مقاله
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Reading Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-right" dir="rtl">
            
            {/* Modal Hero Header image */}
            <div className="relative h-60 sm:h-72 w-full bg-slate-950">
              <img 
                src={selectedPost.imageUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop"} 
                alt={selectedPost.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/30"></div>
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 left-4 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="absolute bottom-4 right-6 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-lg">
                {selectedPost.category}
              </span>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Meta information row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400 border-b border-white/5 pb-4">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-500" />
                  نویسنده: <strong className="text-slate-200">{selectedPost.author}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  منتشر شده در: <strong className="text-slate-200">{toPersianNums(selectedPost.publishedDate)}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  زمان مطالعه: <strong className="text-slate-200">{toPersianNums(selectedPost.readTime)}</strong>
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-100 leading-snug">
                {selectedPost.title}
              </h3>

              {/* Excerpt panel */}
              <p className="text-slate-300 text-xs sm:text-sm font-medium bg-slate-950/40 border-r-4 border-blue-500 p-4 rounded-xl leading-relaxed">
                {selectedPost.excerpt}
              </p>

              {/* Full Paragraphs Content */}
              <div className="text-slate-400 text-xs sm:text-sm leading-loose space-y-4 whitespace-pre-line">
                {selectedPost.content}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <button 
                  onClick={(e) => handleLikeClick(e, selectedPost.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                    hasLiked[selectedPost.id]
                      ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                      : "bg-slate-950/40 border-white/10 hover:border-rose-500/20 text-slate-300 hover:text-rose-400"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${hasLiked[selectedPost.id] ? "fill-current animate-bounce" : ""}`} />
                  <span>پسندیدن مقاله ({toPersianNums(selectedPost.likes)})</span>
                </button>

                <button 
                  onClick={() => setSelectedPost(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-white/5"
                >
                  بستن و بازگشت
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
