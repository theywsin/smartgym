import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  BookOpen, 
  Image, 
  Clock, 
  Tag, 
  User, 
  FileText,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { BlogPost, toPersianNums } from "../types";

interface BlogSettingsPanelProps {
  posts: BlogPost[];
  onSavePosts: (updatedPosts: BlogPost[]) => void;
}

export default function BlogSettingsPanel({ posts, onSavePosts }: BlogSettingsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("آموزش ورزشی");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [readTime, setReadTime] = useState("۵ دقیقه");

  const resetForm = () => {
    setTitle("");
    setCategory("آموزش ورزشی");
    setAuthor("");
    setExcerpt("");
    setContent("");
    setImageUrl("");
    setReadTime("۵ دقیقه");
    setEditId(null);
    setIsEditing(false);
    setErrorMsg("");
  };

  const startCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  const startEdit = (post: BlogPost) => {
    setTitle(post.title);
    setCategory(post.category);
    setAuthor(post.author);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setImageUrl(post.imageUrl || "");
    setReadTime(post.readTime);
    setEditId(post.id);
    setIsEditing(true);
    setErrorMsg("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !author || !excerpt || !content) {
      setErrorMsg("لطفا تمام فیلدهای ستاره‌دار (*) را تکمیل کنید.");
      return;
    }

    // Default high-quality placeholder if empty
    const img = imageUrl.trim() || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop";

    let updatedList: BlogPost[] = [];

    if (editId) {
      // Update
      updatedList = posts.map(post => {
        if (post.id === editId) {
          return {
            ...post,
            title,
            slug: title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-"),
            category,
            author,
            excerpt,
            content,
            imageUrl: img,
            readTime
          };
        }
        return post;
      });
      setSuccessMsg("مقاله با موفقیت ویرایش شد.");
    } else {
      // Create
      const newPost: BlogPost = {
        id: `post_${Date.now()}`,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-"),
        excerpt,
        content,
        author,
        category,
        imageUrl: img,
        publishedDate: "1405/04/10", // Persian mockup date
        readTime,
        likes: 0
      };
      updatedList = [newPost, ...posts];
      setSuccessMsg("مقاله جدید با موفقیت اضافه و منتشر شد.");
    }

    onSavePosts(updatedList);
    resetForm();

    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  const handleDelete = (postId: string) => {
    if (confirm("آیا از حذف این مقاله اطمینان دارید؟")) {
      const updatedList = posts.filter(post => post.id !== postId);
      onSavePosts(updatedList);
      setSuccessMsg("مقاله با موفقیت حذف شد.");
      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section with Action */}
      <div className="flex items-center justify-between bg-slate-900/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md text-right" dir="rtl">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            سیستم مدیریت وبلاگ و آموزش‌ها
          </h3>
          <p className="text-[11px] text-slate-400">
            مقالاتی که در این بخش ثبت می‌کنید بلافاصله در صفحه فرود اصلی (Landing) پلتفرم برای عموم بازدیدکنندگان منتشر می‌شوند.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            انتشار مقاله جدید
          </button>
        )}
      </div>

      {/* Success/Error Toast notification info */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs text-right animate-fade-in" dir="rtl">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid View */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-slate-900/60 rounded-3xl border border-white/10 p-6 space-y-6 text-right animate-fade-in" dir="rtl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              {editId ? "✍️ ویرایش مقاله موجود" : "✨ انتشار نوشته علمی جدید"}
            </h4>
            <button 
              type="button" 
              onClick={resetForm}
              className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs" dir="rtl">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">عنوان مقاله *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: اهمیت هیدراتاسیون در ورزش قدرتی"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all text-right"
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">نام نویسنده *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="مثال: استاد پوریا کریمی"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all text-right"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-auto right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">دسته‌بندی مقاله</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all text-right appearance-none"
                >
                  <option value="آموزش ورزشی">🏋️‍♂️ آموزش ورزشی و حرکات</option>
                  <option value="تغذیه و سلامت">🍎 تغذیه و سلامت</option>
                  <option value="فناوری ورزشی">🤖 فناوری ورزشی</option>
                  <option value="مدیریت باشگاه">⚙️ مدیریت باشگاه</option>
                  <option value="عمومی">📌 عمومی و انگیزشی</option>
                </select>
                <Tag className="w-4 h-4 text-slate-500 absolute left-auto right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Read Time estimation */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">زمان تقریبی مطالعه</label>
              <div className="relative">
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  placeholder="مثال: ۵ دقیقه"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all text-right"
                />
                <Clock className="w-4 h-4 text-slate-500 absolute left-auto right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Image Cover URL */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-300">آدرس تصویر کاور مقاله (اختیاری)</label>
              <div className="relative">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="مثال: https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all text-right"
                />
                <Image className="w-4 h-4 text-slate-500 absolute left-auto right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Short Excerpt */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-300">خلاصه مقاله (برای پیش‌نمایش کارت) *</label>
              <textarea
                required
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="خلاصه‌ای کوتاه در ۲ الی ۳ جمله..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all text-right"
              />
            </div>

            {/* Content body */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-300">متن کامل مقاله (فارسی و خوانا) *</label>
              <textarea
                required
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن کامل و جامع مقاله را در اینجا وارد کنید..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all text-right leading-loose whitespace-pre-wrap"
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button 
              type="button" 
              onClick={resetForm}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-5 py-2.5 rounded-xl transition-all border border-white/5"
            >
              انصراف
            </button>
            <button 
              type="submit" 
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              ذخیره و انتشار نوشته
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-900/30 rounded-3xl border border-white/5 overflow-hidden text-right" dir="rtl">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">هیچ مقاله‌ای یافت نشد. اولین نوشته خود را منتشر کنید!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/5">
                  <tr>
                    <th className="p-4">تصویر</th>
                    <th className="p-4">عنوان نوشته</th>
                    <th className="p-4">دسته‌بندی</th>
                    <th className="p-4">نویسنده</th>
                    <th className="p-4 text-center">پسندیدن‌ها</th>
                    <th className="p-4">تاریخ انتشار</th>
                    <th className="p-4 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4">
                        <img 
                          src={post.imageUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop"} 
                          alt="Cover" 
                          className="w-12 h-12 rounded-xl object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="p-4 font-extrabold text-slate-200 max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg font-bold text-[10px]">
                          {post.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-bold">{post.author}</td>
                      <td className="p-4 text-center text-rose-400 font-mono text-sm">{toPersianNums(post.likes)}</td>
                      <td className="p-4 text-slate-400 font-mono">{toPersianNums(post.publishedDate)}</td>
                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(post)}
                            className="p-2 rounded-lg bg-slate-950 border border-white/10 text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
                            title="ویرایش مقاله"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 rounded-lg bg-slate-950 border border-white/10 text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition-all"
                            title="حذف مقاله"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
