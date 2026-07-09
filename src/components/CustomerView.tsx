import React, { useState, useMemo } from 'react';
import { 
  Search, Star, AlertTriangle, Plus, Minus, ShoppingCart, 
  Home, ClipboardList, Check, X, ShieldAlert, Heart, RefreshCw, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Order, Category, OrderStatus, ShopConfig } from '../types';

interface CustomerViewProps {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onPlaceOrder: (customerName: string, phone: string, roomNo: string, note: string) => void;
  onSwitchToAdmin: () => void;
  isShopOpen: boolean;
  shopConfig: ShopConfig;
}

export default function CustomerView({
  products,
  orders,
  cart,
  setCart,
  onPlaceOrder,
  onSwitchToAdmin,
  isShopOpen,
  shopConfig
}: CustomerViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'cart'>('home');
  
  // Filtering & Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all' | 'เมนูขายดี'>('all');
  
  // Selected product for customization drawer
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSweetness, setSelectedSweetness] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<{ name: string; price: number }[]>([]);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemNote, setItemNote] = useState<string>('');

  // Cart Form inputs
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [deliveryArea, setDeliveryArea] = useState<string>('');

  // List of all categories available
  const categories: (Category | 'all' | 'เมนูขายดี')[] = ['all', 'เมนูขายดี', 'ขนม', 'เครื่องดื่ม'];

  // Filter products based on search query and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesCategory = true;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'เมนูขายดี') {
          matchesCategory = !!p.isBestSeller;
        } else {
          matchesCategory = p.category === selectedCategory;
        }
      }
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Featured items for top carousel (Must Try! or isMustTry)
  const featuredProducts = useMemo(() => {
    return products.filter(p => p.name === 'วิปครีมบราวนี่');
  }, [products]);

  // Total items in cart
  const cartTotalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Total price in cart
  const cartTotalPrice = useMemo(() => {
    return cart.reduce((total, item) => {
      const toppingsCost = item.selectedToppings.length > 1 ? (item.selectedToppings.length - 1) * 5 : 0;
      return total + ((item.product.price + toppingsCost) * item.quantity);
    }, 0);
  }, [cart]);

  // Handle open customization drawer
  const handleOpenCustomization = (product: Product) => {
    if (!product.inStock) return;
    setSelectedProduct(product);
    setSelectedSweetness(product.sweetnessLevels ? product.sweetnessLevels[product.sweetnessLevels.length - 1] || '100% (หวานปกติ)' : 'หวานคาราเมลปกติ');
    setSelectedToppings([]);
    setItemQuantity(1);
    setItemNote('');
  };

  // Toggle topping selection
  const handleToggleTopping = (topping: { name: string; price: number }) => {
    if (selectedProduct?.name === 'ทูโทรน' || selectedProduct?.name === 'ทูโทน') return;
    setSelectedToppings(prev => {
      const exists = prev.some(t => t.name === topping.name);
      if (exists) {
        return prev.filter(t => t.name !== topping.name);
      } else {
        if (topping.name === 'หน้าเดิม') {
          // If selecting 'หน้าเดิม', clear other toppings
          return [topping];
        } else {
          // If selecting other toppings, remove 'หน้าเดิม' if it was selected
          const filtered = prev.filter(t => t.name !== 'หน้าเดิม');
          return [...filtered, topping];
        }
      }
    });
  };

  // Calculate customized total price for drawer
  const drawerItemTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    const toppingsPrice = selectedToppings.length > 1 ? (selectedToppings.length - 1) * 5 : 0;
    return (selectedProduct.price + toppingsPrice) * itemQuantity;
  }, [selectedProduct, selectedToppings, itemQuantity]);

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const toppingsSummary = selectedToppings.map(t => t.name).join(', ');
    const uniqueId = `${selectedProduct.id}-${selectedSweetness}-${toppingsSummary}-${itemNote}`;

    const newCartItem: CartItem = {
      id: uniqueId,
      product: selectedProduct,
      quantity: itemQuantity,
      selectedSweetness,
      selectedToppings,
      note: itemNote
    };

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === uniqueId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += itemQuantity;
        return updated;
      }
      return [...prevCart, newCartItem];
    });

    // Close drawer
    setSelectedProduct(null);
  };

  // Cart quantity controls
  const handleUpdateCartQuantity = (itemId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  };

  // Handle Checkout Submit
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !roomNo.trim()) {
      alert("กรุณากรอกข้อมูลผู้รับและที่อยู่จัดส่งให้ครบถ้วนค่ะ");
      return;
    }
    if (!deliveryArea) {
      alert("กรุณาเลือกพื้นที่จัดส่ง (ส่งเฉพาะ บ้านเอื้ออาทร กม.44 หรือ โครงการ MMC เท่านั้น)");
      return;
    }
    if (deliveryArea === 'โครงการ MMC' && !companyName.trim()) {
      alert("กรุณาระบุชื่อบริษัทสำหรับโครงการ MMC ค่ะ");
      return;
    }

    setIsSubmittingOrder(true);

    const fullAddress = deliveryArea === 'โครงการ MMC' 
      ? `${deliveryArea} - บริษัท ${companyName.trim()} - ${roomNo}`
      : `${deliveryArea} - ${roomNo}`;

    // Simulate short network delay
    setTimeout(() => {
      onPlaceOrder(customerName, phone, fullAddress, orderNote);
      setIsSubmittingOrder(false);
      setCart([]); // clear cart
      const newOrderId = `#${Math.floor(4400 + Math.random() * 500)}`;
      setOrderSuccess(newOrderId);
      setActiveTab('orders');

      // Clear form inputs
      setOrderNote('');
      setCompanyName('');
    }, 1200);
  };

  return (
    <div className="w-full h-[100dvh] md:max-w-[430px] mx-auto md:h-[880px] bg-[#fff8f6] text-[#231914] relative overflow-hidden flex flex-col md:rounded-[48px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] md:border-[10px] md:border-neutral-900 md:ring-1 md:ring-black/10 transition-all duration-300">
      
      {/* iPhone 16+ Dynamic Island Mockup on Desktop */}
      <div className="hidden md:flex absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-between px-3 shadow-inner">
        <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-neutral-800/40"></div>
        <div className="w-3.5 h-1 bg-[#1a1a1a] rounded-full"></div>
        <div className="w-2 h-2 rounded-full bg-[#050505] border border-neutral-800/20"></div>
      </div>

      {/* Dynamic Header */}
      <header className="shrink-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md shadow-sm border-b border-[#f2dfd5] md:pt-9 pt-3">
        <div className="flex justify-between items-center px-4 py-3 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-[#9b4500] overflow-hidden flex-shrink-0 bg-[#feeae0] shadow-sm">
              <img 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv_e9mcuFwa6h1Bn6IU67sO4MfR3PFrBhRPWJOiFBqAFYKxcP3SOwQSyBapH5fNLPnioGx5M550jo-Fz0AhIVcCnQtAczocsjjc8y5Sa4wh6LsDhQs13PZSBeYXVSNSYRm5RUL5wwkA9496hJJD9tOu8U7yGp7PwxVuBf0KdBeyiozngYb7xVMGe_9M03CJ8sRImzuIigdDA3aOJxP6vaIA6XI5PJepq9me0fAk57flk0fap9LCSFn94J8Nxo8dVr6nQPoQh15u_9W" 
                alt="ครอฟเฟิลไอ้แว่น Logo"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-[#9b4500] tracking-tight flex items-center gap-1">
                ครอฟเฟิลไอ้แว่น <span className="text-sm bg-[#ff8c42]/10 px-1.5 py-0.5 rounded text-[#9b4500] font-normal">กม.44</span>
              </h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isShopOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className="text-[11px] text-[#564338] font-bold">
                  {isShopOpen ? (
                    `เปิดให้บริการค่ะ (${shopConfig.autoSchedule ? `${shopConfig.openTime} - ${shopConfig.closeTime}` : 'เปิดเตาอบพร้อมขาย'})`
                  ) : (
                    `ปิดบริการชั่วคราวค่ะ (${shopConfig.autoSchedule ? `เปิด ${shopConfig.openTime} - ${shopConfig.closeTime}` : 'ปิดร้านชั่วคราว'})`
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch to Admin panel */}
            <button 
              onClick={onSwitchToAdmin}
              className="flex items-center gap-1 text-xs font-semibold bg-[#ffdbc9] hover:bg-[#ffb68d] text-[#331200] px-3 py-2 rounded-full border border-[#ff8c42]/20 transition-all duration-150 active:scale-95"
            >
              <ShieldAlert size={14} className="text-[#9b4500]" />
              <span>แอดมิน</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Containers */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-28 scrollbar-none relative">
        {activeTab === 'home' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Store Closed Banner Notice */}
            {!isShopOpen && (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl shadow-sm flex items-start gap-3 border border-rose-100">
                <span className="text-xl shrink-0">😴</span>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xs">ขณะนี้ร้านปิดทำการอยู่ชั่วคราว</span>
                  <span className="text-[11px] opacity-90 mt-0.5 leading-relaxed font-semibold">
                    คุณลูกค้าสามารถเลือกชมเมนูอาหารต่างๆ ได้ตามปกติ แต่จะไม่สามารถทำการสั่งซื้อและกดยืนยันออเดอร์ส่งตรงไปยังห้องครัวได้ค่ะ {shopConfig.autoSchedule ? `(ร้านจะเปิดอีกครั้งเวลา ${shopConfig.openTime} น.)` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Delivery Scope Warning Banner */}
            <div className="bg-gradient-to-r from-[#9b4500] to-[#ff8c42] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 border border-[#9b4500]/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛵</span>
                <div className="flex flex-col">
                  <span className="font-bold text-xs tracking-wide">ขอบเขตจัดส่งของเรา</span>
                  <span className="text-xs opacity-90 font-medium">จัดส่งเฉพาะ บ้านเอื้ออาทร กม.44 และ โครงการ MMC เท่านั้น</span>
                </div>
              </div>
              <span className="bg-white/15 px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0">ส่งด่วนอบใหม่</span>
            </div>

            {/* Elegant Search & Filter Bar */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#897266]" size={18} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเมนูครอฟเฟิลหรือเครื่องดื่มสุดโปรด..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#fff1eb] border border-[#ddc1b3]/40 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-sm placeholder:text-[#897266]/60 transition-all shadow-inner text-[#231914]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-[#f2dfd5] text-[#231914] hover:bg-[#ddc1b3]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Featured Slider - Only show when not searching specifically or filtering heavily */}
            {searchQuery === '' && selectedCategory === 'all' && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-base font-bold text-[#231914] flex items-center gap-1.5">
                    <Heart size={16} className="text-[#ba1a1a] fill-[#ba1a1a]" />
                    <span>เมนูแนะนำห้ามพลาด! (Must Try)</span>
                  </h3>
                  <span className="text-xs text-[#9b4500] font-semibold">เลื่อนชมเพื่อเติมรสชาติ ✨</span>
                </div>
                
                <div className="overflow-x-auto no-scrollbar flex gap-4 pb-2 snap-x snap-mandatory">
                  {featuredProducts.map((p) => {
                    const hasToppings = p.toppings && p.toppings.length > 0;
                    return (
                      <div 
                        key={`featured-${p.id}`}
                        onClick={() => handleOpenCustomization(p)}
                        className={`flex-shrink-0 w-[85%] snap-center rounded-3xl bg-[#feeae0] border border-[#ddc1b3]/20 overflow-hidden relative shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex ${!p.inStock ? 'opacity-65' : ''}`}
                      >
                        <div className="w-2/5 aspect-[4/5] relative bg-stone-100 flex-shrink-0">
                          <img 
                            className="w-full h-full object-cover" 
                            src={p.image} 
                            alt={p.name} 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-[#9b4500] text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md">
                            <Star size={10} className="fill-white text-white" />
                            <span>ยอดนิยม</span>
                          </div>
                        </div>
                        <div className="w-3/5 p-4 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-base text-[#231914] line-clamp-1">{p.name}</h4>
                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#f2dfd5] text-[#9b4500] text-[10px] font-bold">
                              {p.id === 'prod-1' ? 'สูตรลับเฉพาะทางร้าน ✨' : 'หอมอร่อยละมุนใจ'}
                            </span>
                            <p className="text-xs text-[#564338]/80 line-clamp-2 mt-1.5 leading-relaxed">{p.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 pt-1">
                            <span className="text-lg font-extrabold text-[#9b4500]">฿{p.price}</span>
                            {p.inStock ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCustomization(p);
                                }}
                                className="w-9 h-9 rounded-full bg-[#9b4500] hover:bg-[#ff8c42] text-white flex items-center justify-center shadow transition-transform active:scale-90"
                              >
                                <Plus size={16} />
                              </button>
                            ) : (
                              <span className="text-xs bg-[#f2dfd5] text-[#564338] px-2.5 py-1 rounded-full font-semibold">หมด</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ordering Terms/Info Box */}
            <div className="p-4 rounded-2xl bg-[#f2dfd5]/40 border border-[#ddc1b3]/30 shadow-sm">
              <div className="flex items-start gap-2.5 mb-2">
                <AlertTriangle className="text-[#9b4500] mt-0.5 flex-shrink-0 animate-bounce" size={18} />
                <h4 className="font-bold text-sm text-[#3a2e28]">เงื่อนไขการสั่งซื้อ (รบกวนอ่านก่อนนะคะ 💖)</h4>
              </div>
              <ul className="space-y-1.5 pl-7 list-disc text-xs text-[#564338]/90 font-medium leading-relaxed">
                <li>จัดส่งถึงหน้าห้อง <strong className="text-[#9b4500]">เฉพาะกรณีที่ได้รับอนุญาตให้เข้าตึกเท่านั้น</strong></li>
                <li>เวลาการผลิตต่อออเดอร์ประมาณ <span className="bg-[#ffdbc9] text-[#763300] px-1 py-0.5 rounded-md font-bold">15 - 20 นาที (+/-)</span></li>
                <li>ทางร้านรีบทำและตั้งใจจัดส่งให้ตามคิวอย่างประณีต งดเร่งออเดอร์หน้าเตานะคะ 🙏</li>
              </ul>
            </div>

            {/* Category selection horizontal bar */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold text-[#231914] px-1 flex items-center gap-2">
                <ClipboardList size={16} className="text-[#9b4500]" />
                <span>หมวดหมู่เมนู</span>
              </h3>
              
              <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-full font-bold text-xs transition-all duration-200 active:scale-95 ${
                      selectedCategory === cat 
                        ? 'bg-[#9b4500] text-white shadow-md' 
                        : 'bg-[#feeae0] text-[#564338] hover:bg-[#f2dfd5] border border-[#ddc1b3]/20'
                    }`}
                  >
                    {cat === 'all' ? 'เมนูทั้งหมด' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu items Grid */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-[#897266]">แสดง {filteredProducts.length} เมนูที่ถูกเลือก</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-[#897266] flex flex-col items-center gap-2">
                  <ClipboardList size={36} className="opacity-40" />
                  <p className="text-sm font-semibold">ขออภัยค่ะ ไม่พบเมนูที่คุณกำลังหาอยู่</p>
                  <button 
                    onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                    className="mt-2 text-xs font-bold text-[#9b4500] underline"
                  >
                    ล้างการค้นหาทั้งหมด
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredProducts.map((p) => {
                    const hasRank = typeof p.rank === 'number';
                    const hasTag = !!p.customTag;
                    return (
                      <div 
                        key={p.id}
                        onClick={() => handleOpenCustomization(p)}
                        className={`bg-[#fff1eb] rounded-3xl overflow-hidden shadow-sm flex flex-col group border border-[#ddc1b3]/10 hover:shadow-md transition-all duration-200 cursor-pointer relative ${
                          !p.inStock ? 'pointer-events-none opacity-80' : 'active:scale-98'
                        }`}
                      >
                        {/* Image area */}
                        <div className="relative aspect-square bg-[#feeae0]/30 overflow-hidden">
                          <img 
                            className={`w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ${!p.inStock ? 'grayscale-[40%]' : ''}`}
                            src={p.image} 
                            alt={p.name} 
                            referrerPolicy="no-referrer"
                          />

                          {/* Floating badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {hasRank && (
                              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow flex items-center gap-0.5">
                                อันดับ {p.rank} 👑
                              </span>
                            )}
                            {hasTag && (
                              <span className="bg-[#ff8c42] text-[#331200] px-2 py-0.5 rounded-full text-[9px] font-extrabold shadow flex items-center gap-0.5">
                                <Star size={8} className="fill-[#331200] text-transparent" />
                                {p.customTag}
                              </span>
                            )}
                          </div>

                          {/* Out of stock overlay */}
                          {!p.inStock && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3">
                              <span className="bg-black/70 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl border border-white/20 shadow-lg tracking-wider">
                                ของหมดชั่วคราว
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Text details area */}
                        <div className="p-3.5 text-center flex flex-col flex-grow bg-white/45">
                          <h4 className={`font-bold text-sm text-[#231914] line-clamp-1 ${!p.inStock ? 'text-stone-400' : ''}`}>
                            {p.name}
                          </h4>
                          <p className={`text-[10px] text-[#564338]/70 mt-1 line-clamp-1 px-1 ${!p.inStock ? 'text-stone-300' : ''}`}>
                            {p.description || 'ครอฟเฟิลพรีเมียมแสนอร่อย'}
                          </p>
                          <p className="font-extrabold text-[#9b4500] text-base mt-2.5">
                            ฿{p.price}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ACTIVE ORDERS HISTORY TAB */}
        {activeTab === 'orders' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#231914] flex items-center gap-2">
                <ClipboardList className="text-[#9b4500]" size={20} />
                <span>สถานะออเดอร์ของฉัน</span>
              </h2>
              <p className="text-xs text-[#564338]/80 mt-0.5">ติดตามคิวและสถานะการจัดส่งของคุณได้แบบเรียลไทม์</p>
            </div>

            {orderSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm flex flex-col items-center text-center gap-2 animate-pulse mb-1">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                  <Check size={22} className="stroke-[3]" />
                </div>
                <h4 className="font-bold text-sm">สั่งซื้ออาหารสำเร็จแล้วค่ะ!</h4>
                <p className="text-xs text-emerald-700 max-w-xs">
                  ออเดอร์หมายเลข <strong className="text-lg text-[#9b4500] bg-white px-2 py-0.5 rounded border border-emerald-100 mx-1 shadow-sm">{orderSuccess}</strong> ได้รับการยืนยันและส่งตรงไปยังเตาอบแอดมินแล้วค่ะ
                </p>
                <button 
                  onClick={() => setOrderSuccess(null)}
                  className="mt-1.5 text-xs font-bold text-emerald-600 underline hover:text-emerald-800"
                >
                  ตกลง รับทราบ
                </button>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="py-16 text-center text-[#897266] flex flex-col items-center gap-3 bg-white/50 rounded-3xl border border-[#ddc1b3]/20">
                <ClipboardList size={48} className="opacity-20" />
                <p className="text-sm font-semibold">คุณยังไม่มีประวัติการจัดส่งในเซสชั่นนี้ค่ะ</p>
                <p className="text-xs text-[#897266]/70 max-w-xs">เลือกดูเมนูครอฟเฟิลแสนอร่อย แล้วลองส่งออเดอร์ใบแรกเลย!</p>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="mt-2 bg-[#9b4500] text-white px-5 py-2 rounded-full font-bold text-xs shadow-sm hover:bg-[#ff8c42] transition-colors"
                >
                  สั่งอาหารเลย 😋
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order) => {
                  let statusBg = "bg-amber-50 text-amber-700 border-amber-200";
                  let statusThText = "รอดำเนินการ";
                  
                  if (order.status === "Preparing") {
                    statusBg = "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
                    statusThText = "กำลังอบร้อนเตา..";
                  } else if (order.status === "Delivered") {
                    statusBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    statusThText = "จัดส่งเรียบร้อย";
                  } else if (order.status === "Cancelled") {
                    statusBg = "bg-stone-50 text-stone-500 border-stone-200";
                    statusThText = "ยกเลิกออเดอร์";
                  }

                  return (
                    <div 
                      key={order.id}
                      className="bg-white rounded-3xl p-4 border border-[#ddc1b3]/30 shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-center border-b border-[#fff1eb] pb-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-[#897266] font-medium">{order.createdAt}</span>
                          <span className="font-bold text-sm text-[#231914]">คิวที่ {order.id}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBg}`}>
                          ● {statusThText}
                        </span>
                      </div>

                      {/* Items Ordered List */}
                      <div className="space-y-1.5 py-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs text-[#231914]">
                            <div className="flex-1">
                              <span className="font-bold text-[#9b4500]">{item.quantity}x</span>{' '}
                              <span className="font-semibold">{item.productName}</span>
                              {item.optionsSummary && (
                                <p className="text-[10px] text-[#564338]/70 ml-5 italic leading-tight">{item.optionsSummary}</p>
                              )}
                            </div>
                            <span className="font-semibold text-right">฿{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Address detail */}
                      <div className="text-xs bg-[#fff1eb]/60 p-2.5 rounded-xl border border-[#ddc1b3]/20 flex flex-col gap-1 text-[#564338]">
                        <p><strong>ผู้รับ:</strong> {order.customerName} ({order.phone})</p>
                        <p><strong>ที่อยู่:</strong> {order.roomNo}</p>
                        {order.note && <p className="text-[11px] text-[#ba1a1a]"><strong>โน้ตพิเศษ:</strong> {order.note}</p>}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#fff1eb]">
                        <span className="text-xs text-[#897266] font-medium">รวมราคาทั้งหมด</span>
                        <span className="text-base font-extrabold text-[#9b4500]">฿{order.totalPrice}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* CUSTOMER SHOPPING CART TAB */}
        {activeTab === 'cart' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#231914] flex items-center gap-2">
                <ShoppingCart className="text-[#9b4500]" size={20} />
                <span>ตะกร้าสินค้าของฉัน</span>
              </h2>
              <p className="text-xs text-[#564338]/80 mt-0.5">ตรวจสอบรายการและเพิ่มที่อยู่จัดส่งเพื่อความฟินถึงหน้าห้อง</p>
            </div>

            {/* Delivery Scope Info */}
            <div className="bg-[#ff8c42]/10 border border-[#ff8c42]/20 text-[#9b4500] px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <span>📍</span>
              <span>ส่งเฉพาะ <strong>บ้านเอื้ออาทร กม.44</strong> และ <strong>โครงการ MMC</strong> เท่านั้นค่ะ</span>
            </div>

            {cart.length === 0 ? (
              <div className="py-16 text-center text-[#897266] flex flex-col items-center gap-3 bg-white/50 rounded-3xl border border-[#ddc1b3]/20">
                <ShoppingCart size={48} className="opacity-20" />
                <p className="text-sm font-semibold">ตะกร้าของคุณว่างเปล่าค่ะ</p>
                <p className="text-xs text-[#897266]/70 max-w-xs">ไปเลือกช้อปครอฟเฟิลสูตรต้นตำรับ และเครื่องดื่มนมสด สตรอว์เบอร์รี่กันเลยค่ะ</p>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="mt-2 bg-[#9b4500] text-white px-5 py-2 rounded-full font-bold text-xs shadow-sm hover:bg-[#ff8c42] transition-colors"
                >
                  กลับไปหน้าเมนู 😋
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Cart Items list */}
                <div className="bg-white rounded-3xl p-4 border border-[#ddc1b3]/30 shadow-sm space-y-4">
                  {cart.map((item) => {
                    const toppingsTotal = item.selectedToppings.length > 1 ? (item.selectedToppings.length - 1) * 5 : 0;
                    const itemUnitPrice = item.product.price + toppingsTotal;

                    return (
                      <div 
                        key={item.id}
                        className="flex gap-3 pb-3 border-b border-[#fff1eb] last:border-b-0 last:pb-0"
                      >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm text-[#231914] leading-tight line-clamp-1">{item.product.name}</h4>
                              <span className="font-bold text-xs text-[#9b4500] ml-2">฿{itemUnitPrice * item.quantity}</span>
                            </div>
                            
                            <p className="text-[10px] text-[#564338] mt-1 flex flex-wrap gap-x-1.5 leading-none">
                              {item.selectedToppings.length > 0 && (
                                <span>
                                  <strong>ท็อปปิ้ง:</strong> {item.selectedToppings.map((t, idx) => idx > 0 ? `${t.name} (+฿5)` : t.name).join(', ')}
                                </span>
                              )}
                            </p>
                            {item.note && (
                              <p className="text-[10px] text-red-500 italic mt-0.5"><strong>คำขอเพิ่มเติม:</strong> "{item.note}"</p>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <span className="text-[11px] text-[#897266] font-medium">ราคาชิ้นละ ฿{itemUnitPrice}</span>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleUpdateCartQuantity(item.id, -1)}
                                className="w-6 h-6 rounded-full bg-[#feeae0] text-[#9b4500] hover:bg-[#f2dfd5] flex items-center justify-center transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateCartQuantity(item.id, 1)}
                                className="w-6 h-6 rounded-full bg-[#feeae0] text-[#9b4500] hover:bg-[#f2dfd5] flex items-center justify-center transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-[#564338]">ยอดรวมออเดอร์นี้</span>
                    <span className="text-lg font-extrabold text-[#9b4500]">฿{cartTotalPrice}</span>
                  </div>
                </div>

                {/* Delivery details form */}
                <form onSubmit={handleCheckout} className="bg-white rounded-3xl p-5 border border-[#ddc1b3]/30 shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-[#231914] border-b border-[#fff1eb] pb-2 flex items-center gap-1.5">
                    <span>ข้อมูลจัดส่งถึงตึกคอนโด / ที่พัก 🛵</span>
                  </h3>

                  {/* Delivery Area Picker */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#564338] flex items-center gap-1">
                      <span>เลือกพื้นที่จัดส่งของคุณ</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'baan', label: 'บ้านเอื้ออาทร กม.44' },
                        { id: 'mmc', label: 'โครงการ MMC' }
                      ].map((area) => {
                        const isSelected = deliveryArea === area.label;
                        return (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => setDeliveryArea(area.label)}
                            className={`px-3 py-2.5 rounded-xl text-center text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                              isSelected 
                                ? 'bg-[#feeae0] border-[#9b4500] text-[#9b4500] ring-1 ring-[#9b4500]' 
                                : 'bg-white border-[#ddc1b3]/30 text-[#564338] hover:bg-[#fff1eb]/40'
                            }`}
                          >
                            <span className="text-base">📍</span>
                            <span>{area.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {deliveryArea && (
                      <p className="text-[10px] text-emerald-700 font-semibold px-1 mt-0.5 flex items-center gap-1">
                        <span>✓ เลือกพื้นที่จัดส่งแล้ว</span>
                      </p>
                    )}
                    {!deliveryArea && (
                      <p className="text-[10px] text-[#ba1a1a] font-semibold px-1 mt-0.5">
                        ⚠️ จำเป็นต้องระบุขอบเขตพื้นที่จัดส่งเพื่อยืนยันออเดอร์
                      </p>
                    )}
                  </div>

                  {deliveryArea === 'โครงการ MMC' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-1.5 bg-[#feeae0]/30 p-3 rounded-2xl border border-[#ddc1b3]/20"
                    >
                      <label className="text-xs font-bold text-[#564338] flex items-center gap-1">
                        <span>ระบุชื่อบริษัท</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required={deliveryArea === 'โครงการ MMC'}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="ระบุชื่อบริษัท เช่น บริษัท บอช / ไดกิ้น / แคนนอน"
                        className="px-3.5 py-2.5 rounded-xl border border-[#ddc1b3]/50 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-xs placeholder:text-[#897266]/50 bg-white text-[#231914]"
                      />
                    </motion.div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#564338]">ชื่อผู้รับอาหาร <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="เช่น คุณส้มโอ / คุณแอน"
                      className="px-3.5 py-2.5 rounded-xl border border-[#ddc1b3]/50 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-xs placeholder:text-[#897266]/50 bg-[#fff8f6] text-[#231914]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#564338]">เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="เช่น 089-XXXXXXX"
                      className="px-3.5 py-2.5 rounded-xl border border-[#ddc1b3]/50 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-xs placeholder:text-[#897266]/50 bg-[#fff8f6] text-[#231914]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#564338]">เลขห้อง / อาคาร / ชั้นจัดส่ง <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      rows={2}
                      value={roomNo}
                      onChange={(e) => setRoomNo(e.target.value)}
                      placeholder="เช่น อาคาร A ชั้น 5 ห้อง 502 (กรณีตึกอนุญาตให้ขึ้นส่ง) หรือให้แขวนไว้ใต้ตึก"
                      className="px-3.5 py-2 rounded-xl border border-[#ddc1b3]/50 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-xs placeholder:text-[#897266]/50 bg-[#fff8f6] text-[#231914]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#564338]">โน้ตเพิ่มเติมสำหรับคนจัดส่ง</label>
                    <input 
                      type="text" 
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="เช่น ฝากวางที่ลิฟต์คอนโด / ขอน้ำตาลทรายแยกค่ะ"
                      className="px-3.5 py-2.5 rounded-xl border border-[#ddc1b3]/50 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-xs placeholder:text-[#897266]/50 bg-[#fff8f6] text-[#231914]"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingOrder || !isShopOpen}
                    className="w-full mt-2 bg-[#9b4500] hover:bg-[#ff8c42] disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-3.5 rounded-full font-bold text-sm shadow-md transition-all duration-150 flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>กำลังส่งคำสั่งซื้อเข้าร้าน...</span>
                      </>
                    ) : !isShopOpen ? (
                      <>
                        <ShieldAlert size={16} />
                        <span>ขณะนี้ร้านปิดให้บริการชั่วคราว</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>ยืนยันออเดอร์และเตาอบ (฿{cartTotalPrice})</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Item Customization Modal Drawer */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black z-50 pointer-events-auto"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 w-full bg-[#fff8f6] rounded-t-[2.5rem] shadow-2xl z-50 p-6 max-h-[85%] overflow-y-auto border-t border-[#f2dfd5]"
            >
              {/* Top Drag bar handle */}
              <div className="w-12 h-1.5 bg-[#f2dfd5] rounded-full mx-auto mb-4" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#231914]">{selectedProduct.name}</h3>
                  <p className="text-xs text-[#9b4500] font-bold mt-0.5">ราคาเริ่มต้น ฿{selectedProduct.price}</p>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-full bg-[#feeae0] text-[#9b4500] hover:bg-[#f2dfd5]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Product description */}
              <p className="text-xs text-[#564338] mb-5 leading-relaxed bg-[#fff1eb]/50 p-3 rounded-2xl border border-[#ddc1b3]/10">
                {selectedProduct.description || 'ครอฟเฟิลอบใหม่ สดกรอบนอกนุ่มในสไตล์วันมอารมณ์ดี'}
              </p>

              {/* Toppings Multi-Selector */}
              {selectedProduct.toppings && selectedProduct.toppings.length > 0 && selectedProduct.name !== 'ทูโทรน' && selectedProduct.name !== 'ทูโทน' && (
                <div className="mb-5 flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-[#231914] px-1">เปลี่ยนท็อปปิ้งบนหน้าครอฟเฟิล (ชิ้นแรกฟรี ชิ้นถัดไป +฿5):</h4>
                  <div className="flex flex-col gap-2 bg-white p-3 rounded-2xl border border-[#ddc1b3]/20">
                    {selectedProduct.toppings.map((top) => {
                      const isChecked = selectedToppings.some(t => t.name === top.name);
                      
                      let displayPriceText = 'ฟรี';
                      if (isChecked) {
                        const isFirstSelected = selectedToppings.length > 0 && selectedToppings[0].name === top.name;
                        displayPriceText = isFirstSelected ? 'ฟรี' : '+฿5';
                      } else {
                        displayPriceText = selectedToppings.length === 0 ? 'ฟรี' : '+฿5';
                      }

                      return (
                        <div 
                          key={top.name}
                          onClick={() => handleToggleTopping(top)}
                          className="flex justify-between items-center py-2 px-1 border-b border-[#fff1eb] last:border-b-0 cursor-pointer hover:bg-[#fff1eb]/20 rounded transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked ? 'bg-[#9b4500] border-[#9b4500] text-white' : 'border-[#ddc1b3] bg-white'
                            }`}>
                              {isChecked && <Check size={12} className="stroke-[3]" />}
                            </div>
                            <span className="text-xs font-semibold text-[#564338]">{top.name}</span>
                          </div>
                          <span className="text-xs font-bold text-[#9b4500]">
                            {displayPriceText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Note item text */}
              <div className="mb-6 flex flex-col gap-1.5">
                <h4 className="text-xs font-bold text-[#231914] px-1">คำขอเพิ่มเติม (ถ้ามี):</h4>
                <input 
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="เช่น แยกน้ำแข็ง, ขอช้อนส้อม, ไม่รับวิปครีม"
                  className="px-3.5 py-2.5 rounded-xl border border-[#ddc1b3]/40 focus:outline-none focus:ring-2 focus:ring-[#9b4500]/20 text-xs placeholder:text-[#897266]/50 bg-white text-[#231914]"
                />
              </div>

              {/* Quantity Selector and Confirm button */}
              <div className="flex items-center gap-4 border-t border-[#f2dfd5] pt-4">
                <div className="flex items-center gap-2.5 border border-[#ddc1b3]/30 px-3 py-2 bg-white rounded-2xl shadow-inner">
                  <button 
                    disabled={itemQuantity <= 1}
                    onClick={() => setItemQuantity(prev => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded-full bg-[#feeae0] text-[#9b4500] hover:bg-[#f2dfd5] disabled:opacity-40 flex items-center justify-center transition-colors font-bold"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{itemQuantity}</span>
                  <button 
                    onClick={() => setItemQuantity(prev => prev + 1)}
                    className="w-7 h-7 rounded-full bg-[#feeae0] text-[#9b4500] hover:bg-[#f2dfd5] flex items-center justify-center transition-colors font-bold"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  disabled={!isShopOpen}
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#9b4500] hover:bg-[#ff8c42] disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-3.5 rounded-full font-bold text-sm shadow-md transition-all duration-150 flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShoppingCart size={16} />
                  <span>{isShopOpen ? `ใส่ตะกร้า • ฿${drawerItemTotal}` : 'ขณะนี้ร้านปิดบริการอยู่'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* STICKY/ABSOLUTE FLOATING BOTTOM NAVIGATION */}
      <nav className="absolute bottom-0 left-0 right-0 w-full bg-[#fff8f6] border-t border-[#f2dfd5] shadow-[0_-4px_12px_rgba(86,67,56,0.06)] py-2 pb-safe z-40">
        <div className="w-full flex justify-around items-center px-4">
          <button 
            onClick={() => { setActiveTab('home'); setSelectedCategory('all'); setSearchQuery(''); }}
            className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-150 ${
              activeTab === 'home' 
                ? 'text-[#9b4500] font-bold scale-103' 
                : 'text-[#897266]/80 font-semibold'
            }`}
          >
            <Home size={20} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[10px] mt-1">หน้าหลัก</span>
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-150 relative ${
              activeTab === 'orders' 
                ? 'text-[#9b4500] font-bold scale-103' 
                : 'text-[#897266]/80 font-semibold'
            }`}
          >
            <ClipboardList size={20} className={activeTab === 'orders' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[10px] mt-1">ออเดอร์</span>
            {orders.length > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('cart')}
            className={`flex flex-col items-center justify-center w-20 py-2 rounded-2xl relative transition-all duration-150 ${
              activeTab === 'cart' 
                ? 'bg-[#feeae0] text-[#9b4500] font-bold scale-103 shadow-sm' 
                : 'text-[#897266]/80 font-semibold'
            }`}
          >
            <ShoppingCart size={20} className={activeTab === 'cart' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[10px] mt-1">ตะกร้า</span>
            {cartTotalItems > 0 && (
              <span className="absolute -top-1 -right-0.5 w-5 h-5 bg-[#ff8c42] text-[#331200] font-extrabold text-[10px] rounded-full flex items-center justify-center shadow">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
