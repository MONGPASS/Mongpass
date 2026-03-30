'use client';

import { ArrowLeft, Share2, Menu, AlertCircle, ChevronDown, Megaphone, Edit3, Ticket, ShoppingBag, Camera, Home, PlusSquare, MessageCircle, Settings, X, Send, Truck, CreditCard, Plus, Edit2, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function BizProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("Нүүр");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [shopName, setShopName] = useState("Жишээ Дэлгүүр / Эмнэлэг");
  const [isSaved, setIsSaved] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  interface Product {
    id: number;
    category: string;
    name: string;
    desc: string;
    price: string;
    image: string | null;
  }

  const [products, setProducts] = useState<Product[]>([
    { id: 1, category: "Үхрийн мах", name: 'Үхрийн цул мах (1кг)', desc: 'Шинэ, ясгүй цул мах', price: '22,000₩', image: null },
    { id: 2, category: "Үхрийн мах", name: 'Үхрийн ястай мах (1кг)', desc: 'Шөлний ястай', price: '18,500₩', image: null }
  ]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formImage, setFormImage] = useState<string | null>(null);

  interface FeedPost {
    id: number;
    title: string;
    text: string;
    image: string | null;
    date: string;
  }
  
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([
    {
      id: 1,
      title: "Шинэ мах ирлээ!",
      text: "Өнөөдөр шинэ үхрийн мах ирлээ! Маш гоё шинэхэн байна шүү.",
      image: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=600&h=600&fit=crop",
      date: "2026.03.21 14:30"
    }
  ]);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState<string | null>(null);

  interface Order {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    date: string;
    orderTime: string;
    items: { image: string; category: string; name: string; qty: string; price: string; total: string }[];
    total: string;
    status: 'Хүлээгдэж буй' | 'Төлбөр төлөгдсөн' | 'Хүргэлтэнд гарсан' | 'Хүргэгдсэн' | 'Цуцлагдсан';
  }

  const [orders, setOrders] = useState<Order[]>([
    {
       id: "#ORD-0039",
       customerName: "Сүхбат",
       customerPhone: "010-2179-7911",
       customerEmail: "sukhbatsukhbat33@gmail.com",
       customerAddress: "경기도 포천시 가산면 가산로 240 번길 3-1",
       date: "2026. 3. 21.",
       orderTime: "12:35",
       items: [
         { image: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=100&h=100&fit=crop", category: "Үхрийн мах", name: "Хөрөөдсөн хавирга", qty: "1 кг", price: "₩10,000", total: "₩10,000" },
         { image: "https://images.unsplash.com/photo-1551028719-00100b73c3f2?w=100&h=100&fit=crop", category: "Үхрийн мах", name: "Үхрийн гуяны цул", qty: "2 кг", price: "₩17,000", total: "₩34,000" },
         { image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop", category: "Тахианы мах", name: "Тахианы цээж мах", qty: "2 кг", price: "₩8,000", total: "₩16,000" },
         { image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100&h=100&fit=crop", category: "Тахианы мах", name: "Тахианы гуяны цул", qty: "2 кг", price: "₩9,000", total: "₩18,000" },
         { image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=100&h=100&fit=crop", category: "Хүнс", name: "Амтад банш", qty: "5 кг", price: "₩14,000", total: "₩70,000" }
       ],
       total: "₩154,000",
       status: "Төлбөр төлөгдсөн"
    }
  ]);

  const [orderFilter, setOrderFilter] = useState<string>('Бүгд');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    alert(`Захиалгын төлөв амжилттай өөрчлөгдлөө: ${newStatus}`);
  };

  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{text: string; time: string; from: 'me' | 'them'}[]>([]);
  const [productCategory, setProductCategory] = useState("Үхрийн мах");
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleListImageUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProducts(products.map(p => p.id === id ? { ...p, image: url } : p));
    }
  };

  const handleFormImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormImage(url);
    }
  };

  const handleSaveProduct = () => {
    if (!formName || !formPrice) return alert("Бүтээгдэхүүний нэр болон үнийг оруулна уу.");
    
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? {
        ...p, name: formName, desc: formDesc, price: formPrice, image: formImage
      } : p));
      setEditingProduct(null);
    } else {
      const newProduct: Product = {
        id: Date.now(), category: productCategory, name: formName, desc: formDesc, price: formPrice, image: formImage
      };
      setProducts([...products, newProduct]);
      setIsAddingProduct(false);
    }
  };

  const handleEditClick = (p: Product) => {
    setFormName(p.name);
    setFormDesc(p.desc);
    setFormPrice(p.price);
    setFormImage(p.image);
    setEditingProduct(p);
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm('Устгахдаа итгэлтэй байна уу?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handlePostImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(URL.createObjectURL(file));
    }
  };

  const handleSavePost = () => {
    if (!postTitle.trim() && !postText.trim() && !postImage) return alert("Гарчиг, зураг эсвэл текст оруулна уу.");
    
    if (editingPost) {
      setFeedPosts(feedPosts.map(p => p.id === editingPost.id ? { ...p, title: postTitle, text: postText, image: postImage } : p));
      setEditingPost(null);
    } else {
      const newPost: FeedPost = {
        id: Date.now(),
        title: postTitle,
        text: postText,
        image: postImage,
        date: new Date().toLocaleDateString('ko-KR') + " " + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setFeedPosts([newPost, ...feedPosts]);
      setIsAddingPost(false);
    }
    setPostTitle("");
    setPostText("");
    setPostImage(null);
  };

  const handleEditPost = (p: FeedPost) => {
    setPostTitle(p.title || "");
    setPostText(p.text);
    setPostImage(p.image);
    setEditingPost(p);
    setIsAddingPost(true);
  };

  const handleDeletePost = (id: number) => {
    if (confirm("Устгахдаа итгэлтэй байна уу?")) {
      setFeedPosts(feedPosts.filter(p => p.id !== id));
    }
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    setChatMessages(prev => [...prev, { text: chatMessage, time, from: 'me' }]);
    setChatMessage("");
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'chat') {
      setActiveTab('Чат');
      setIsEditingProfile(true);
    }
  }, [searchParams]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setShopImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setShopImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Dummy State for input fields mapped to Shop Detail attributes
  const [formData, setFormData] = useState({
    hours: "Даваа - Баасан: 09:00 - 18:00",
    phone: "010-1234-5678",
    facebook: "",
    instagram: "",
    address: "Сөүл хот, Тусгай дүүрэг, 12-3",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const tabs = ["Нүүр", "Мэдээлэл", "Бараа/Үйлчилгээ", "Сэтгэгдэл", "Зураг"];

  return (
    <div className="w-full min-h-screen bg-gray-50 relative pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-900 active:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={28} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-4 text-gray-900">
          <button><Share2 size={24} strokeWidth={1.5} /></button>
          <button><Menu size={26} strokeWidth={1.5} /></button>
        </div>
      </div>

      {isEditingProfile && (
        <>
          {/* Warning Banner */}
          {(() => {
            const missingFields: string[] = [];
            if (!shopName.trim()) missingFields.push("Дэлгүүрийн нэр");
            if (!formData.hours.trim()) missingFields.push("Цагийн хуваарь");
            if (!formData.phone.trim()) missingFields.push("Утасны дугаар");
            if (!formData.facebook.trim()) missingFields.push("Facebook холбоос");
            if (!formData.instagram.trim()) missingFields.push("Instagram холбоос");
            if (!formData.address.trim()) missingFields.push("Хаяг / Байршил");
            if (shopImages.length === 0) missingFields.push("Дэлгүүрийн зураг");

            return missingFields.length > 0 ? (
              <div className="bg-red-50 px-5 py-3 flex gap-3 text-red-600">
                <AlertCircle size={18} className="shrink-0 mt-0.5 fill-red-600 text-white" />
                <div>
                  <p className="text-[13px] font-medium leading-snug mb-1.5">
                    Дараах мэдээллийг оруулна уу:
                  </p>
                  <ul className="text-[12px] font-medium list-disc list-inside flex flex-col gap-0.5 mb-1.5">
                    {missingFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-red-400">Үйлчлүүлэгчдэд харагдахгүй байна</p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 px-5 py-3 flex gap-3 text-green-700">
                <p className="text-[13px] font-bold leading-snug">
                  ✅ Бүх мэдээлэл бүрэн оруулсан байна!
                </p>
              </div>
            );
          })()}

          <div className="bg-white p-5 border-b border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-end gap-2 mt-1 mb-1">
                  <h1 className="text-[22px] font-bold text-gray-900 leading-none">{shopName}</h1>
                  <button 
                    onClick={() => {
                      setIsEditingProfile(false);
                    }} 
                    className={`flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-md transition-colors shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-200`}
                  >
                    <ArrowLeft size={12} strokeWidth={2.5} /> Гарах
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="bg-white sticky top-[60px] z-40 border-b border-gray-200 overflow-x-auto hide-scroll flex px-2 pt-2 shadow-sm">
            {tabs.map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-[14px] font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* Content Form Edit Area */}
      <div className="bg-gray-50 min-h-[50vh] pb-8 pt-2">
        {activeTab === "Нүүр" && (
          <>
            {isEditingProfile ? (
              <div className="bg-white mt-2 p-5 border-y border-gray-100 flex flex-col gap-5">
                
                <div className="flex flex-col gap-2 mb-2">
                  <label className="text-[14px] font-bold text-gray-900">Дэлгүүрийн зураг оруулах</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
                    {shopImages.map((src, i) => (
                      <div key={i} className="relative shrink-0 w-[100px] h-[100px] rounded-xl overflow-hidden border border-gray-200">
                        <img src={src} alt={`shop-${i}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 w-[100px] h-[100px] bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <Camera size={22} strokeWidth={1.5} />
                      <span className="text-[11px] font-medium">Зураг +</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">Олон зураг нэг дор оруулах боломжтой</p>
                </div>

                <hr className="border-gray-100" />

                <h3 className="font-bold text-gray-900 text-[16px] mt-1 mb-1">Дэлгэрэнгүй мэдээлэл оруулах</h3>
                
                {/* Дэлгүүрийн нэр */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-gray-700">Дэлгүүрийн нэр</label>
                    {isSaved && editingField !== 'name' && (
                      <button onClick={() => setEditingField('name')} className="text-[11px] font-bold text-primary">Засах</button>
                    )}
                  </div>
                  {!isSaved || editingField === 'name' ? (
                    <div className="flex gap-2">
                      <input 
                        name="name"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-900"
                      />
                      {editingField === 'name' && (
                        <button onClick={() => setEditingField(null)} className="bg-gray-900 text-white text-[12px] font-bold px-3 rounded-xl whitespace-nowrap">Хадгалах</button>
                      )}
                    </div>
                  ) : (
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] font-bold text-gray-900">{shopName}</p>
                  )}
                </div>

                {/* Цагийн хуваарь */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-gray-700">Цагийн хуваарь</label>
                    {isSaved && editingField !== 'hours' && (
                      <button onClick={() => setEditingField('hours')} className="text-[11px] font-bold text-primary">Засах</button>
                    )}
                  </div>
                  {!isSaved || editingField === 'hours' ? (
                    <div className="flex gap-2">
                      <input 
                        name="hours"
                        value={formData.hours}
                        onChange={handleChange}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                        placeholder="Жнь: Даваа - Баасан 09:00 - 18:00"
                      />
                      {editingField === 'hours' && (
                        <button onClick={() => setEditingField(null)} className="bg-gray-900 text-white text-[12px] font-bold px-3 rounded-xl whitespace-nowrap">Хадгалах</button>
                      )}
                    </div>
                  ) : (
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] text-gray-800">{formData.hours || '-'}</p>
                  )}
                </div>

                {/* Утасны дугаар */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-gray-700">Утасны дугаар</label>
                    {isSaved && editingField !== 'phone' && (
                      <button onClick={() => setEditingField('phone')} className="text-[11px] font-bold text-primary">Засах</button>
                    )}
                  </div>
                  {!isSaved || editingField === 'phone' ? (
                    <div className="flex gap-2">
                      <input 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                        placeholder="010-0000-0000"
                      />
                      {editingField === 'phone' && (
                        <button onClick={() => setEditingField(null)} className="bg-gray-900 text-white text-[12px] font-bold px-3 rounded-xl whitespace-nowrap">Хадгалах</button>
                      )}
                    </div>
                  ) : (
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] text-gray-800">{formData.phone || '-'}</p>
                  )}
                </div>

                {/* Facebook */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-gray-700">Facebook холбоос</label>
                    {isSaved && editingField !== 'facebook' && (
                      <button onClick={() => setEditingField('facebook')} className="text-[11px] font-bold text-primary">Засах</button>
                    )}
                  </div>
                  {!isSaved || editingField === 'facebook' ? (
                    <div className="flex gap-2">
                      <input 
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleChange}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                        placeholder="https://facebook.com/..."
                      />
                      {editingField === 'facebook' && (
                        <button onClick={() => setEditingField(null)} className="bg-gray-900 text-white text-[12px] font-bold px-3 rounded-xl whitespace-nowrap">Хадгалах</button>
                      )}
                    </div>
                  ) : (
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] text-gray-800">{formData.facebook || '-'}</p>
                  )}
                </div>

                {/* Instagram */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-gray-700">Instagram холбоос</label>
                    {isSaved && editingField !== 'instagram' && (
                      <button onClick={() => setEditingField('instagram')} className="text-[11px] font-bold text-primary">Засах</button>
                    )}
                  </div>
                  {!isSaved || editingField === 'instagram' ? (
                    <div className="flex gap-2">
                      <input 
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                        placeholder="https://instagram.com/..."
                      />
                      {editingField === 'instagram' && (
                        <button onClick={() => setEditingField(null)} className="bg-gray-900 text-white text-[12px] font-bold px-3 rounded-xl whitespace-nowrap">Хадгалах</button>
                      )}
                    </div>
                  ) : (
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] text-gray-800">{formData.instagram || '-'}</p>
                  )}
                </div>

                {/* Хаяг / Байршил */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-gray-700">Хаяг / Байршил</label>
                    {isSaved && editingField !== 'address' && (
                      <button onClick={() => setEditingField('address')} className="text-[11px] font-bold text-primary">Засах</button>
                    )}
                  </div>
                  {!isSaved || editingField === 'address' ? (
                    <div className="flex gap-2">
                      <input 
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                        placeholder="Хаяг оруулах"
                      />
                      {editingField === 'address' && (
                        <button onClick={() => setEditingField(null)} className="bg-gray-900 text-white text-[12px] font-bold px-3 rounded-xl whitespace-nowrap">Хадгалах</button>
                      )}
                    </div>
                  ) : (
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] text-gray-800">{formData.address || '-'}</p>
                  )}
                </div>
                
                {!isSaved ? (
                  <button 
                    onClick={() => { setIsSaved(true); setEditingField(null); }}
                    className="w-full mt-4 bg-gray-900 text-white font-bold py-3.5 rounded-xl text-[15px] shadow-md hover:bg-gray-800 transition-colors active:scale-[0.98]">
                    Хадгалах
                  </button>
                ) : (
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => { setIsSaved(false); setEditingField(null); }}
                      className="flex-1 bg-gray-100 text-gray-900 font-bold py-3.5 rounded-xl text-[15px] hover:bg-gray-200 transition-colors active:scale-[0.98]">
                      Засах
                    </button>
                    <button 
                      onClick={() => { setIsSaved(true); setEditingField(null); }}
                      className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-xl text-[15px] shadow-md hover:bg-gray-800 transition-colors active:scale-[0.98]">
                      Хадгалах
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white mt-2 p-5 border-y border-gray-100 flex flex-col gap-5">
                <h3 className="font-bold text-gray-900 text-[16px]">Хяналтын самбар (Dashboard)</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[12px] text-gray-500 font-bold mb-1">Нийт хандалт</p>
                    <p className="text-[22px] font-black text-gray-900">1,245</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[12px] text-blue-600 font-bold mb-1">Шинэ захиалга</p>
                    <p className="text-[22px] font-black text-blue-700">12</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[12px] text-gray-500 font-bold mb-1">Шинэ дагагч</p>
                    <p className="text-[22px] font-black text-gray-900">+34</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[12px] text-orange-600 font-bold mb-1">Сэтгэгдэл</p>
                    <p className="text-[22px] font-black text-orange-700">89</p>
                  </div>
                </div>

                <div className="mt-2 border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-[14px] text-gray-800">Хийх ажлын жагсаалт</h4>
                    <span className="text-[11px] font-bold text-gray-400">Өнөөдөр</span>
                  </div>
                  <ul className="text-[13px] text-gray-600 flex flex-col gap-3">
                    <li className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> 3 шинэ захиалга байна
                      </div>
                      <ChevronDown size={14} className="text-gray-400 rotate-[-90deg]" />
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div> Баталгаажуулалт хүлээгдэж байна
                      </div>
                      <ChevronDown size={14} className="text-gray-400 rotate-[-90deg]" />
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
        
        {activeTab === "Мэдээлэл" && (
          <div className="bg-gray-50 mt-2 min-h-screen">
            <div className="bg-white p-5 border-y border-gray-100 mb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-[16px]">Дэлгүүрийн мэдээлэл</h3>
                {!isAddingPost && !editingPost && (
                  <button onClick={() => { setPostText(""); setPostImage(null); setIsAddingPost(true); }} className="text-primary text-[13px] font-bold flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                    <Plus size={14} /> Мэдээ нэмэх
                  </button>
                )}
              </div>

              {(isAddingPost || editingPost) && (
                <div className="mb-5 border border-gray-200 rounded-2xl p-4 shadow-sm relative">
                  <h4 className="font-bold text-gray-900 text-[14px] mb-3">
                    {editingPost ? "Мэдээ засах" : "Шинэ мэдээ оруулах"}
                  </h4>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Гарчиг (заавал биш)"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[13px] font-bold outline-none focus:ring-1 focus:ring-primary/30 mb-2"
                  />
                  <textarea 
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="Үйлчлүүлэгчиддээ юу хуваалцмаар байна?"
                    className="w-full h-24 bg-gray-50 border border-gray-100 rounded-xl p-4 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 resize-none mb-3"
                  />
                  
                  {postImage ? (
                    <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-100">
                      <img src={postImage} alt="post preview" className="w-full object-cover" />
                      <button onClick={() => setPostImage(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <input type="file" accept="image/*" className="hidden" id="postImageInput" onChange={handlePostImageUpload} />
                      <label htmlFor="postImageInput" className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <Camera size={18} className="text-gray-500" />
                        <span className="text-[13px] font-medium text-gray-700">Зураг хавсаргах</span>
                      </label>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => {setIsAddingPost(false); setEditingPost(null);}} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl text-[13px] active:scale-[0.98]">
                      Цуцлах
                    </button>
                    <button onClick={handleSavePost} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl text-[13px] shadow-sm hover:bg-blue-600 active:scale-[0.98]">
                      Нийтлэх
                    </button>
                  </div>
                </div>
              )}

              {feedPosts.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center border border-gray-100 border-dashed rounded-2xl bg-gray-50">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                    <Megaphone size={20} className="text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-[13px]">Одоогоор мэдээ оруулаагүй байна.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {feedPosts.map(post => (
                    <div key={post.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-4 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-blue-600">Дэл</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-gray-900 leading-tight">Манай дэлгүүр</p>
                            <p className="text-[10px] text-gray-400">{post.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleEditPost(post)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeletePost(post.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {post.image && (
                        <div className="w-full border-b border-gray-50 bg-gray-50">
                          <img src={post.image} alt="post image" className="w-full h-auto max-h-[400px] object-cover" />
                        </div>
                      )}
                      
                      <div className="p-4 bg-white">
                        {post.title && (
                          <h4 className="font-bold text-gray-900 text-[15px] mb-1.5">{post.title}</h4>
                        )}
                        {post.text && (
                          <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{post.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs can be similarly mocked */}
        {["Сэтгэгдэл", "Зураг"].includes(activeTab) && (
          <div className="bg-white mt-2 p-5 border-y border-gray-100 flex flex-col items-center justify-center py-16 text-gray-500 text-[14px]">
            {activeTab} хэсэг тун удахгүй нэмэгдэнэ.
          </div>
        )}

        {/* Захиалга (Orders) tab */}
        {activeTab === "Захиалга" && (
          <div className="bg-gray-50 mt-2 min-h-screen">
            <div className="bg-white p-5 border-y border-gray-100 flex flex-col gap-4">
              <h3 className="font-bold text-gray-900 text-[16px]">Захиалгууд</h3>
              <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 -mt-1">
                {['Бүгд', 'Хүлээгдэж буй', 'Төлбөр төлөгдсөн', 'Хүргэлтэнд гарсан', 'Хүргэгдсэн'].map(status => (
                  <button 
                    key={status} 
                    onClick={() => setOrderFilter(status)}
                    className={`px-4 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap active:scale-95 transition-all ${
                      orderFilter === status 
                        ? 'bg-gray-900 border-gray-900 text-white shadow-sm' 
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4 mt-2">
                {orders.filter(o => orderFilter === 'Бүгд' || o.status === orderFilter).length > 0 ? (
                  orders.filter(o => orderFilter === 'Бүгд' || o.status === orderFilter).map(order => {
                    const isExpanded = expandedOrderId === order.id;
                    return (
                      <div key={order.id} className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-200">
                        {/* Header (Always Visible) */}
                        <div 
                          className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        >
                          <div className="flex flex-col justify-center">
                            <p className="text-[13px] font-bold text-gray-900 pt-1">Захиалга #{order.id}</p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm transition-all duration-300 ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                              <span className="text-[11px] font-bold tracking-tight">{isExpanded ? 'Хаах' : 'Нээх'}</span>
                              <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-gray-700' : 'text-gray-400'}`} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Area */}
                        {isExpanded && (
                          <div className="animate-in slide-in-from-top-2 duration-200 ease-out">
                            <div className="p-4 border-b border-gray-100 bg-white space-y-5">
                              {/* Section 1: Захиалгын мэдээлэл */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-[13px] font-bold text-gray-900 ml-1">Захиалгын мэдээлэл</h4>
                                </div>
                                <div className="bg-gray-50/80 rounded-xl p-3.5 flex flex-col gap-2.5 text-[12px] border border-gray-100">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium tracking-tight">Захиалгын ID:</span>
                                    <span className="font-bold text-gray-900">{order.id}</span>
                                  </div>
                                  <div className="h-[1px] bg-gray-200/60 my-0.5"></div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium tracking-tight">Төлөв өөрчлөх:</span>
                                    <select 
                                        className="bg-white border border-gray-200 rounded-md px-2 py-1 font-bold text-gray-900 outline-none text-[11px] shadow-sm focus:border-blue-400 transition-colors"
                                        value={order.status}
                                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                                      >
                                        <option value="Хүлээгдэж буй">Хүлээгдэж буй</option>
                                        <option value="Төлбөр төлөгдсөн">Төлбөр төлөгдсөн</option>
                                        <option value="Хүргэлтэнд гарсан">Хүргэлтэнд гарсан</option>
                                        <option value="Хүргэгдсэн">Хүргэгдсэн</option>
                                        <option value="Цуцлагдсан">Цуцлагдсан</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                   
                              {/* Section 2: Харилцагчийн мэдээлэл */}
                              <div>
                                <div className="flex justify-between items-end mb-2">
                                  <h4 className="text-[13px] font-bold text-gray-900 ml-1">Харилцагч</h4>
                                </div>
                                <div className="bg-gray-50/80 rounded-xl p-3.5 flex flex-col gap-2.5 text-[12px] border border-gray-100">
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="text-gray-500 font-medium tracking-tight shrink-0">Захиалсан цаг:</span>
                                    <span className="font-bold text-gray-900 text-right">{order.date} {order.orderTime}</span>
                                  </div>
                                  <div className="h-[1px] bg-gray-200/60 my-0.5"></div>
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="text-gray-500 font-medium tracking-tight shrink-0">Харилцагчын нэр:</span>
                                    <div className="font-bold text-gray-900 text-right flex items-center justify-end flex-wrap mt-[1px]">
                                      {order.customerName}
                                    </div>
                                  </div>
                                  <div className="h-[1px] bg-gray-200/60 my-0.5"></div>
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="text-gray-500 font-medium tracking-tight shrink-0 min-w-[36px]">Утас:</span>
                                    <span className="font-bold text-gray-900 text-right">{order.customerPhone}</span>
                                  </div>
                                  <div className="h-[1px] bg-gray-200/60 my-0.5"></div>
                                  <div className="flex justify-between items-start gap-3 flex-col sm:flex-row">
                                    <span className="text-gray-500 font-medium tracking-tight shrink-0">Хаяг:</span>
                                    <span className="font-bold text-gray-900 leading-relaxed text-right sm:text-left">{order.customerAddress}</span>
                                  </div>
                                </div>
                              </div>
                   
                              {/* Section 3: Бүтээгдэхүүн */}
                              <div>
                                <h4 className="text-[13px] font-bold text-gray-900 mb-2 ml-1">Бүтээгдэхүүн</h4>
                                <div className="bg-gray-50/80 rounded-xl p-3.5 flex flex-col gap-3.5 border border-gray-100">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-center border-b border-gray-200/60 pb-3.5 last:border-0 last:pb-0">
                                       <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-white" />
                                       <div className="flex-1 min-w-0">
                                         <p className="font-bold text-[12px] text-gray-900 leading-[1.3] mb-0.5 line-clamp-2">{item.name}</p>
                                         <p className="text-[10px] text-gray-500 font-medium">{item.category}</p>
                                       </div>
                                       <div className="text-right shrink-0">
                                         <p className="font-bold text-[13px] text-[#5C95FF]">{item.total}</p>
                                         <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{item.qty} × {item.price}</p>
                                       </div>
                                    </div>
                                  ))}
                                  <div className="h-[1px] bg-gray-200"></div>
                                  <div className="flex justify-between items-center text-[14px]">
                                    <span className="font-bold text-gray-900">Нийт төлөх дүн</span>
                                    <span className="font-black text-[#5C95FF] text-[16px]">{order.total}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons inside Expanded Area */}
                            <div className="p-3 bg-gray-50/50">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setExpandedOrderId(null); 
                                }} 
                                className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-[14px] shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                              >
                                Хаах
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center border border-gray-100 border-dashed rounded-2xl bg-gray-50">
                    <p className="text-gray-400 text-[13px]">{orderFilter !== 'Бүгд' ? `${orderFilter} төлөвтэй захиалга алга.` : 'Одоогоор захиалга алга байна.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Goods/Services preview tab */}
        {activeTab === "Бараа/Үйлчилгээ" && (
          <div className="bg-gray-50 mt-2 min-h-screen">
            <div className="bg-white p-5 border-y border-gray-100">
              <h3 className="font-bold text-gray-900 text-[16px] mb-4">Бүтээгдэхүүн, Үйлчилгээ</h3>
              {products.length > 0 ? (
                Array.from(new Set(products.map(p => p.category))).map(category => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h4 className="font-bold text-gray-800 text-[14px] mb-3">{category}</h4>
                    <div className="flex flex-col gap-3">
                      {products.filter(p => p.category === category).map(prod => (
                        <div key={prod.id} className="flex gap-3 items-stretch border border-gray-100 bg-white p-3 rounded-2xl shadow-sm">
                          <div className="w-20 bg-gray-50 flex items-center justify-center rounded-xl shrink-0 border border-gray-100 overflow-hidden">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-gray-300 text-[10px] text-center max-w-[50px] leading-tight">Зураггүй</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                            <h4 className="font-bold text-gray-900 text-[14px] leading-tight mb-1 break-words">{prod.name}</h4>
                            <p className="text-[12px] text-gray-500 mb-1.5 break-words line-clamp-2">{prod.desc}</p>
                            <p className="text-[14px] font-bold text-gray-900">{prod.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                  <p className="text-gray-400 text-[13px] leading-relaxed">Одоогоор бүтээгдэхүүн нэмэгдээгүй байна.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Бүтээгдэхүүн tab (Meat Shop Example) */}
        {activeTab === "Бүтээгдэхүүн" && (
          <div className="flex flex-col gap-2 bg-gray-50">
            {/* Global Settings */}
            <div className="bg-white border-y border-gray-100 transition-all">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full px-5 py-4 flex items-center justify-between text-left active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <Settings size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[14px]">Дэлгүүрийн тохиргоо</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Хүргэлт болон дансны мэдээлэл</p>
                  </div>
                </div>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown size={18} />
                </div>
              </button>

              {isSettingsOpen && (
                <div className="px-5 pb-5 pt-3 border-t border-gray-50">
                  <h3 className="font-bold text-gray-900 text-[14px] mb-4 flex items-center gap-2">
                    <Truck size={16} className="text-gray-500" /> Хүргэлтийн тохиргоо
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Үндсэн хүргэлтийн үнэ (₩)</label>
                      <input type="text" placeholder="5,000" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-1 focus:ring-primary/30" defaultValue="5000" />
                    </div>
                  </div>

                  <div className="h-[1px] bg-gray-100 my-5"></div>

                  <h3 className="font-bold text-gray-900 text-[14px] mb-4 flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-500" /> Дансны мэдээлэл
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Банк сонгох</label>
                      <div className="relative">
                        <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-1 focus:ring-primary/30 appearance-none">
                          <option>국민은행</option>
                          <option>신한은행</option>
                          <option>우리은행</option>
                          <option>하나은행</option>
                          <option>농협은행</option>
                          <option>기업은행</option>
                          <option>카카오뱅크</option>
                          <option>토스뱅크</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Дансны дугаар</label>
                      <input type="text" placeholder="5000 0000 0000" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-1 focus:ring-primary/30" defaultValue="5123456789" />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Дансны нэр</label>
                      <input type="text" placeholder="Батболд" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-1 focus:ring-primary/30" defaultValue="Батболд" />
                    </div>
                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full mt-3 bg-gray-900 text-white font-bold py-3.5 rounded-xl text-[14px] shadow-sm hover:bg-gray-800 transition-colors active:scale-[0.98]"
                    >
                      Тохиргоо хадгалах
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Product List Section */}
            <div className="bg-white border-y border-gray-100 pb-20">
              <div className="p-5 pb-0">
                <h3 className="font-bold text-gray-900 text-[16px] mb-4">Бүтээгдэхүүний жагсаалт</h3>
              </div>
              
              {/* Category Toggles */}
              <div className="overflow-x-auto hide-scroll px-5 pb-4">
                <div className="flex gap-2 min-w-max">
                  {["Үхрийн мах", "Хонины мах", "Гахайн мах", "Тахианы мах", "Бусад хүнс"].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setProductCategory(cat)}
                      className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${productCategory === cat ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Button */}
              {!isAddingProduct && !editingProduct && (
                <div className="px-5 mb-4">
                  <button 
                    onClick={() => {
                      setFormName(""); setFormDesc(""); setFormPrice(""); setFormImage(null);
                      setIsAddingProduct(true);
                    }} 
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 bg-primary/5 text-primary font-bold py-4 rounded-xl text-[14px] hover:bg-primary/10 transition-colors active:scale-[0.98]"
                  >
                    <Plus size={18} /> Шинэ бүтээгдэхүүн нэмэх
                  </button>
                </div>
              )}

              {/* Add/Edit Product Form */}
              {(isAddingProduct || editingProduct) && (
                <div className="px-5 mb-5 relative">
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <h4 className="font-bold text-gray-900 text-[15px] mb-4">
                      {editingProduct ? "Бүтээгдэхүүн засах" : "Шинэ бүтээгдэхүүн"}
                    </h4>

                    {/* Image Upload for Product Form */}
                    <div className="mb-4 flex flex-col items-center">
                       <input type="file" accept="image/*" className="hidden" id="productFormImageInput" onChange={handleFormImageUpload} />
                       <label htmlFor="productFormImageInput" className="w-24 h-24 bg-gray-50 border border-gray-200 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden">
                          {formImage ? (
                            <img src={formImage} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <Camera size={20} className="text-gray-400 mb-1" />
                              <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">Зураг<br/>оруулах</span>
                            </>
                          )}
                       </label>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Бүтээгдэхүүний нэр</label>
                        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="ex: Үхрийн цул мах (1кг)" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:ring-1 focus:ring-primary/30" />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Тайлбар</label>
                        <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="ex: Шинэ, ясгүй цул мах" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:ring-1 focus:ring-primary/30" />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">1кг үнэ (₩)</label>
                        <input type="text" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="ex: 22,000₩" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:ring-1 focus:ring-primary/30" />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5">
                      <button onClick={() => {setIsAddingProduct(false); setEditingProduct(null);}} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl text-[14px] active:scale-[0.98]">
                        Цуцлах
                      </button>
                      <button onClick={handleSaveProduct} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl text-[14px] shadow-md hover:bg-blue-600 active:scale-[0.98]">
                        Хадгалах
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Product List */}
              <div className="px-5 flex flex-col gap-3">
                {products.filter(p => p.category === productCategory).length > 0 ? (
                  products.filter(p => p.category === productCategory).map(prod => (
                    <div key={prod.id} className="flex gap-3 items-stretch border border-gray-100 bg-white p-3 rounded-2xl shadow-sm">
                      <input type="file" accept="image/*" className="hidden" id={`img-upload-${prod.id}`} onChange={(e) => handleListImageUpload(prod.id, e)} />
                      <label 
                        htmlFor={`img-upload-${prod.id}`}
                        className="w-20 bg-gray-50 flex flex-col items-center justify-center rounded-xl shrink-0 border border-gray-100 border-dashed hover:bg-gray-100 transition-colors overflow-hidden cursor-pointer"
                      >
                        {prod.image ? (
                          <img src={prod.image} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Camera size={18} className="text-gray-400 mb-1" />
                            <span className="text-[9px] font-medium text-gray-500 text-center leading-tight">Зураг<br/>оруулах</span>
                          </>
                        )}
                      </label>
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                        <h4 className="font-bold text-gray-900 text-[14px] truncate leading-tight mb-1">{prod.name}</h4>
                        <p className="text-[12px] text-gray-500 mb-1.5 truncate">{prod.desc}</p>
                        <p className="text-[15px] font-bold text-primary">{prod.price}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 border-l border-gray-100 pl-3 justify-center">
                        <button 
                          onClick={() => handleEditClick(prod)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed mt-2">
                    <p className="text-gray-400 text-[13px] leading-relaxed">Одоогоор {productCategory.toLowerCase()} ангилалд<br/>бүтээгдэхүүн байхгүй байна.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Чат tab */}
        {activeTab === "Чат" && (
          <div className="bg-white mt-2 border-y border-gray-100">
            {!selectedChat ? (
              <>
                <div className="px-5 pt-4 pb-2">
                  <h3 className="font-bold text-gray-900 text-[16px]">Чат жагсаалт</h3>
                </div>
                
                {/* Chat conversation list */}
                <div className="flex flex-col">
                  <button onClick={() => setSelectedChat('Батболд')} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-[14px] font-bold text-blue-600">Б</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[14px] font-bold text-gray-900 truncate">Батболд</p>
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">14:32</span>
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">Сайн байна уу, үнэ асуух гэсэн...</p>
                    </div>
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white">2</span>
                    </div>
                  </button>

                  <button onClick={() => setSelectedChat('Оюунаа')} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <span className="text-[14px] font-bold text-orange-600">О</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[14px] font-bold text-gray-900 truncate">Оюунаа</p>
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">Өчигдөр</span>
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">Захиалга өгөх гэсэн байна шүү</p>
                    </div>
                  </button>

                  <button onClick={() => setSelectedChat('Сарангэрэл')} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <span className="text-[14px] font-bold text-green-600">С</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[14px] font-bold text-gray-900 truncate">Сарангэрэл</p>
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">03.19</span>
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">Баярлалаа, маш их баярлалаа!</p>
                    </div>
                  </button>

                  <button onClick={() => setSelectedChat('Дэлгэрмаа')} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-[14px] font-bold text-purple-600">Д</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[14px] font-bold text-gray-900 truncate">Дэлгэрмаа</p>
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">03.18</span>
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">Өнөөдөр очих боломжтой юу?</p>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              /* Chat detail view */
              <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
                  <button onClick={() => setSelectedChat(null)} className="p-1 -ml-1 text-gray-600 active:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} strokeWidth={2} />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold text-blue-600">{selectedChat[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 truncate">{selectedChat}</p>
                    <p className="text-[11px] text-green-500">Идэвхтэй</p>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 px-4 py-4 flex flex-col gap-3 bg-gray-50 overflow-y-auto w-full">
                  {/* Date divider */}
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">Өнөөдөр</span>
                  </div>

                  {/* Incoming messages */}
                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-[10px] font-bold text-blue-600">{selectedChat[0]}</span>
                    </div>
                    <div>
                      <div className="bg-white rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm border border-gray-100">
                        <p className="text-[13px] text-gray-800">Сайн байна уу!</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 ml-1">14:30</span>
                    </div>
                  </div>

                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-7 h-7 shrink-0"></div>
                    <div>
                      <div className="bg-white rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm border border-gray-100">
                        <p className="text-[13px] text-gray-800">Үнэ асуух гэсэн байна. Үйлчилгээний хөлс хэд вэ?</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 ml-1">14:30</span>
                    </div>
                  </div>

                  {/* Outgoing messages (shop admin) */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%]">
                      <div className="bg-primary rounded-2xl rounded-tr-md px-3.5 py-2.5">
                        <p className="text-[13px] text-white">Сайн байна уу! Бидний үйлчилгээ сонирхож байгаад баярлалаа 😊</p>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-[10px] text-gray-400 mt-0.5 mr-1">14:31</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[80%]">
                      <div className="bg-primary rounded-2xl rounded-tr-md px-3.5 py-2.5">
                        <p className="text-[13px] text-white">Үйлчилгээний төрлийн хүснэгтийг илгээж байна. Өөр юу асуух зүйл байвал чөлөөтэй ирээрэй!</p>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-[10px] text-gray-400 mt-0.5 mr-1">14:32</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-[10px] font-bold text-blue-600">{selectedChat[0]}</span>
                    </div>
                    <div>
                      <div className="bg-white rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm border border-gray-100">
                        <p className="text-[13px] text-gray-800">Баярлалаа! Өнөөдөр очих боломжтой юу?</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 ml-1">14:32</span>
                    </div>
                  </div>
                  
                  {/* Dynamically sent messages */}
                  {chatMessages.map((msg, i) => (
                    msg.from === 'me' ? (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[80%]">
                          <div className="bg-primary rounded-2xl rounded-tr-md px-3.5 py-2.5">
                            <p className="text-[13px] text-white">{msg.text}</p>
                          </div>
                          <div className="flex justify-end">
                            <span className="text-[10px] text-gray-400 mt-0.5 mr-1">{msg.time}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="flex gap-2 max-w-[80%]">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                          <span className="text-[10px] font-bold text-blue-600">{selectedChat?.[0]}</span>
                        </div>
                        <div>
                          <div className="bg-white rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm border border-gray-100">
                            <p className="text-[13px] text-gray-800">{msg.text}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-0.5 ml-1">{msg.time}</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>

                {/* Message input */}
                <div className="px-3 py-3 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                      placeholder="Мессеж бичих..."
                      className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button onClick={sendMessage} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform">
                      <Send size={18} className="text-white ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Bottom Nav */}
      <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-200 pb-safe z-50">
        <div className="flex justify-between items-center h-[65px] px-1 overflow-x-auto hide-scroll">
          <button 
            onClick={() => { setIsEditingProfile(false); setActiveTab("Нүүр"); }}
            className={`flex flex-col items-center justify-center min-w-[55px] h-full gap-1 transition-colors ${activeTab === 'Нүүр' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <Home size={21} strokeWidth={activeTab === 'Нүүр' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-tight text-center ${activeTab === 'Нүүр' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>Нүүр</span>
          </button>
          
          <button 
            onClick={() => { setIsEditingProfile(false); setActiveTab("Чат"); }}
            className={`flex flex-col items-center justify-center min-w-[55px] h-full gap-1 transition-colors ${activeTab === 'Чат' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <MessageCircle size={21} strokeWidth={activeTab === 'Чат' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-tight text-center ${activeTab === 'Чат' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>Чат</span>
          </button>
          
          <button 
            onClick={() => { setIsEditingProfile(false); setActiveTab("Захиалга"); }}
            className={`flex flex-col items-center justify-center min-w-[55px] h-full gap-1 transition-colors ${activeTab === 'Захиалга' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <ShoppingBag size={21} strokeWidth={activeTab === 'Захиалга' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-tight text-center ${activeTab === 'Захиалга' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>Захиалга</span>
          </button>
          
          <button 
            onClick={() => { setIsEditingProfile(false); setActiveTab("Бүтээгдэхүүн"); }}
            className={`flex flex-col items-center justify-center min-w-[65px] h-full gap-1 px-0.5 transition-colors ${activeTab === 'Бүтээгдэхүүн' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <PlusSquare size={21} strokeWidth={activeTab === 'Бүтээгдэхүүн' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-[1.1] text-center ${activeTab === 'Бүтээгдэхүүн' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>Бүтээгдэхүүн<br/>оруулах</span>
          </button>
          
          <button 
            onClick={() => { setIsEditingProfile(false); setActiveTab("Мэдээлэл"); }}
            className={`flex flex-col items-center justify-center min-w-[60px] h-full gap-1 px-0.5 transition-colors ${activeTab === 'Мэдээлэл' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <Edit3 size={21} strokeWidth={activeTab === 'Мэдээлэл' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-[1.1] text-center ${activeTab === 'Мэдээлэл' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>Мэдээлэл<br/>оруулах</span>
          </button>

          <button 
            onClick={() => { setIsEditingProfile(true); setActiveTab('Нүүр'); }}
            className={`flex flex-col items-center justify-center min-w-[50px] h-full gap-1 transition-colors ${isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <Settings size={21} strokeWidth={isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-tight text-center ${isEditingProfile ? 'font-bold' : 'font-medium'}`}>Засах</span>
          </button>
        </div>
      </div>

    </div>
  );
}
