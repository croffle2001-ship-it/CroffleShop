import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, ShoppingCart, Star, Package, RefreshCw, 
  Trash2, Plus, Check, X, Shield, Eye, Edit2, ToggleLeft, ToggleRight, Settings, Coffee, Utensils,
  Clock, Users, Activity, Lock, Unlock, Calendar, Download, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order, InventoryItem, Category, OrderStatus, ShopConfig } from '../types';
import { supabase } from '../supabaseClient';

interface AdminViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onSwitchToCustomer: () => void;
  onResetDefaults: () => void;
  shopConfig: ShopConfig;
  setShopConfig: React.Dispatch<React.SetStateAction<ShopConfig>>;
  totalViews: number;
  currentOnline: number;
  isShopOpen: boolean;
  adminUsername: string;
  adminPassword: string;
  onUpdateAdminPassword: (newPassword: string) => void;
}

export default function AdminView({
  products,
  setProducts,
  orders,
  setOrders,
  inventory,
  setInventory,
  onSwitchToCustomer,
  onResetDefaults,
  shopConfig,
  setShopConfig,
  totalViews,
  currentOnline,
  isShopOpen,
  adminUsername,
  adminPassword,
  onUpdateAdminPassword
}: AdminViewProps) {
  
  useEffect(() => {
    const fetchRealData = async () => {
      const { data: realProducts, error: pError } = await supabase.from('products').select('*');
      if (!pError && realProducts) {
        setProducts(realProducts);
      }
      const { data: realOrders, error: oError } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
      if (!oError && realOrders) {
        setOrders(realOrders);
      }
    };
    fetchRealData();
    // เอา Realtime Subscription ออกจากหน้านี้ เพราะ App.tsx ดึงข้อมูลทั้งหมดให้แบบเรียลไทม์อยู่แล้ว ป้องกันระบบชนกัน
  }, [setProducts, setOrders]); 

  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'orders' | 'menu_stock' | 'settings'>('dashboard');

  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<Category>('ขนม');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedFullPhoto, setSelectedFullPhoto] = useState<string | null>(null);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [adminProfilePic, setAdminProfilePic] = useState(() => {
    return localStorage.getItem('adminProfilePic') || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
  });

  const handleUploadAdminProfile = async (file: File) => {
    try {
      setIsUploadingProfile(true);
      const fileExt = file?.name?.split('.').pop() || 'jpg'; // ✅ แก้บั๊ก 2: กันแอพค้างตอนอัพภาพผ่านมือถือ
      const fileName = `admin-profile-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('croffle-bucket')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('croffle-bucket').getPublicUrl(filePath);
      const newUrl = `${data.publicUrl}?t=${Date.now()}`;
      setAdminProfilePic(newUrl);
      localStorage.setItem('adminProfilePic', newUrl);
      setIsUploadingProfile(false);
    } catch (error) {
      console.error(error);
      setIsUploadingProfile(false);
      alert('⚠️ ไม่สามารถอัปโหลดรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้งค่ะ');
    }
  };

  const handleUpdateOrderPhoto = async (orderId: string, file: File | undefined) => {
    if (!file) {
      const { error } = await supabase.from('orders').update({ deliveryPhoto: null }).eq('id', orderId);
      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryPhoto: undefined } : o));
      }
      return;
    }
    try {
      const fileExt = file?.name?.split('.').pop() || 'jpg'; // ✅ แก้บั๊ก 2: รองรับมือถือ
      const safeOrderId = orderId.replace(/[^a-zA-Z0-9]/g, ''); 
      const timestamp = Date.now();
      const fileName = `delivery-${safeOrderId}-${timestamp}.${fileExt}`;
      const filePath = `deliveries/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('croffle-bucket').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('croffle-bucket').getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?t=${timestamp}`;

      const { error: updateError } = await supabase.from('orders').update({ deliveryPhoto: publicUrl, status: 'Delivered' }).eq('id', orderId);
      if (updateError) throw updateError;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryPhoto: publicUrl, status: 'Delivered' } : o));
      alert('📸 อัปโหลดหลักฐานและอัปเดตสถานะออเดอร์เรียบร้อยแล้วค่ะ!');
    } catch (error) {
      console.error(error);
      alert('⚠️ เกิดข้อผิดพลาดในการอัปโหลดรูปภาพหลักฐาน กรุณาลองใหม่อีกครั้งค่ะ');
    }
  };

  const handleUploadProductImage = async (file: File) => {
    try {
      setIsUploadingImg(true);
      const fileExt = file?.name?.split('.').pop() || 'jpg'; // ✅ แก้บั๊ก 2: รองรับมือถือ
      const fileName = `product-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('croffle-bucket').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('croffle-bucket').getPublicUrl(filePath);
      setNewProductImage(data.publicUrl);
      setIsUploadingImg(false);
    } catch (error) {
      console.error(error);
      setIsUploadingImg(false);
      alert('⚠️ ไม่สามารถอัปโหลดรูปภาพเมนูได้ กรุณาลองใหม่อีกครั้งค่ะ');
    }
  };

  const stats = useMemo(() => {
    const dailySales = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalPrice, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const preparingOrders = orders.filter(o => o.status === 'Preparing').length;
    const completedOrders = orders.filter(o => o.status === 'Delivered').length;

    return {
      dailySales,
      totalOrdersCount: orders.length,
      pendingOrdersCount: pendingOrders + preparingOrders,
      completedCount: completedOrders
    };
  }, [orders]);

  const topSellers = useMemo(() => {
    const itemCounts: { [key: string]: number } = {};
    orders.filter(o => o.status !== 'Cancelled').forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.productName] = (itemCounts[item.productName] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [orders]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  };

  const handleToggleProductStock = async (productId: string) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;
    const nextStatus = !targetProduct.inStock;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, inStock: nextStatus } : p));
    await supabase.from('products').update({ inStock: nextStatus }).eq('id', productId);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้ออกจากร้านค้าชั่วคราว?")) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      await supabase.from('products').delete().eq('id', productId);
    }
  };

  const handleSaveProductPrice = async (productId: string) => {
    const numPrice = parseFloat(editingPriceValue);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert("กรุณากรอกราคาที่ถูกต้องด้วยค่ะ");
      return;
    }
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, price: numPrice } : p));
    setEditingProductId(null);
    await supabase.from('products').update({ price: numPrice }).eq('id', productId);
  };

  const handleExportSalesCSV = () => {
    const activeOrders = orders.filter(o => o.status !== 'Cancelled');
    if (activeOrders.length === 0) {
      alert("ไม่มีข้อมูลออเดอร์ที่ขายได้สำเร็จในวันนี้สำหรับส่งออกข้อมูลยอดขาย");
      return;
    }

    const rowsList: { dateTime: string; menuName: string; quantity: number; price: number }[] = [];
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const displayName = item.optionsSummary ? `${item.productName} (${item.optionsSummary})` : item.productName;
        rowsList.push({ dateTime: order.createdAt, menuName: displayName, quantity: item.quantity, price: item.price * item.quantity });
      });
    });

    const totalQty = rowsList.reduce((sum, item) => sum + item.quantity, 0);
    const grandTotal = rowsList.reduce((sum, item) => sum + item.price, 0);
    const headers = ["วันที่/เวลา", "เมนู", "จำนวน", "ราคา"];

    const escapeField = (field: string | number) => {
      const text = String(field ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = rowsList.map(item => [escapeField(item.dateTime), escapeField(item.menuName), escapeField(item.quantity), escapeField(item.price)].join(','));
    const allLines = [headers.join(','), ...rows, ",,,", [escapeField("สรุปยอดทั้งหมด"), "", escapeField(totalQty), escapeField(grandTotal)].join(',')];

    const csvContent = "\uFEFF" + allLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    link.setAttribute("href", url);
    link.setAttribute("download", `croffle_sales_summary_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newProductPrice);
    if (!newProductName.trim() || isNaN(priceNum) || priceNum <= 0) {
      alert("กรุณากรอกข้อมูลชื่อเมนูและราคาที่ถูกต้องด้วยค่ะ");
      return;
    }
    const imgUrl = newProductImage.trim() || "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400";
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProductName,
      price: priceNum,
      category: newProductCategory,
      description: newProductDescription.trim() || "เมนูอบร้อนหอมอร่อยสูตรพิเศษของทางร้าน",
      image: imgUrl,
      inStock: true,
      sweetnessLevels: newProductCategory === 'ขนม' ? ["หวานคาราเมลปกติ"] : ["หวานน้อย 50%", "หวานปกติ 100%"],
      toppings: [
        { name: "หน้าเดิม", price: 0 },
        { name: "อัลมอนด์อบกรอบ", price: 5 },
        { name: "โอริโอ้", price: 5 },
        { name: "บราวนี่", price: 10 }
      ]
    };

    setProducts(prev => [newProduct, ...prev]);
    await supabase.from('products').insert([newProduct]);
    setIsAddingProduct(false);
    setNewProductName(''); setNewProductPrice(''); setNewProductCategory('ขนม'); setNewProductDescription(''); setNewProductImage('');
  };

  return (
    <div className="w-full h-[100dvh] md:max-w-[430px] mx-auto md:h-[880px] bg-[#fff8f6] text-[#231914] relative overflow-hidden flex flex-col md:rounded-[48px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] md:border-[10px] md:border-neutral-900 md:ring-1 md:ring-black/10 transition-all duration-300">
      
      <div className="hidden md:flex absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-between px-3 shadow-inner">
        <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-neutral-800/40"></div>
        <div className="w-3.5 h-1 bg-[#1a1a1a] rounded-full"></div>
        <div className="w-2 h-2 rounded-full bg-[#050505] border border-neutral-800/20"></div>
      </div>

      <header className="shrink-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md shadow-sm border-b border-[#f2dfd5] md:pt-9 pt-3">
        <div className="flex justify-between items-center px-4 py-3.5 w-full">
          <div className="flex items-center gap-2.5">
            <label className="w-10 h-10 rounded-full border-2 border-[#9b4500] overflow-hidden flex-shrink-0 bg-[#f2dfd5] shadow-sm cursor-pointer relative group block">
              <img className={`w-full h-full object-cover transition-all ${isUploadingProfile ? 'opacity-50' : 'group-hover:opacity-70'}`} src={adminProfilePic} alt="โปรไฟล์แอดมิน"/>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"><Camera size={14} className="text-white" /></div>
              <input type="file" accept="image/*" className="hidden" disabled={isUploadingProfile} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUploadAdminProfile(file); }}/>
            </label>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-[#9b4500] flex items-center gap-1">แอดมิน <span className="text-[10px] bg-[#9b4500]/10 text-[#9b4500] font-bold px-1.5 py-0.5 rounded-full uppercase">Live</span></h1>
              <p className="text-[10px] text-[#564338] font-semibold">ร้านครอฟเฟิลไอ้แว่น กม.44</p>
            </div>
          </div>
          <button onClick={onSwitchToCustomer} className="flex items-center gap-1 text-xs font-bold bg-[#feeae0] hover:bg-[#f2dfd5] text-[#9b4500] px-3.5 py-2 rounded-full border border-[#ddc1b3]/20 transition-all duration-150 active:scale-95">
            <Eye size={14} /><span>ดูหน้าลูกค้า</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-28 scrollbar-none relative">
        
        {activeAdminTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="bg-white p-4.5 rounded-3xl border border-[#ddc1b3]/30 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#564338] flex items-center gap-1.5"><Activity size={14} className="text-[#9b4500] animate-pulse" /><span>สถิติผู้เข้าชมแบบสด (Live Traffic)</span></h3>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span><span>เรียลไทม์</span></span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#fffdfb] p-3 rounded-2xl border border-[#ddc1b3]/15 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100/70 flex items-center justify-center text-orange-600"><Users size={16} /></div>
                    <div><p className="text-[10px] text-stone-400 font-bold leading-tight">กำลังดูอยู่ตอนนี้</p><h4 className="text-sm font-black text-[#9b4500] mt-0.5">{currentOnline} <span className="text-[10px] font-bold text-[#897266]">คน</span></h4></div>
                  </div>
                  <div className="bg-[#fffdfb] p-3 rounded-2xl border border-[#ddc1b3]/15 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-600"><Eye size={16} /></div>
                    <div><p className="text-[10px] text-stone-400 font-bold leading-tight">ผู้เข้าชมทั้งหมด</p><h4 className="text-sm font-black text-[#9b4500] mt-0.5">{totalViews} <span className="text-[10px] font-bold text-[#897266]">คน</span></h4></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-3xl border border-[#ddc1b3]/30 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[#fff1eb] pb-2.5">
                  <div className="flex items-center gap-1.5"><Clock size={15} className="text-[#9b4500]" /><h3 className="text-xs font-bold text-[#231914]">สถานะ & เวลาเปิด-ปิดร้าน</h3></div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${isShopOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{isShopOpen ? '● ร้านกำลังเปิดอยู่' : '● ร้านปิดบริการอยู่'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div><h4 className="text-xs font-bold text-[#564338]">เปิด-ปิดร้านเองชั่วคราว (Manual)</h4><p className="text-[9px] text-[#897266]">สลับสถานะทันที (เมื่อต้องการปิดร้านด่วน)</p></div>
                  <button onClick={() => setShopConfig(prev => ({ ...prev, isOpen: !prev.isOpen }))} className="focus:outline-none transition-transform active:scale-95 duration-100">
                    {shopConfig.isOpen ? (<div className="flex items-center gap-1.5 bg-[#feeae0] text-[#9b4500] px-3.5 py-2 rounded-full border border-[#ff8c42]/20 font-bold text-[11px] hover:bg-[#f2dfd5]"><Unlock size={12} className="stroke-[2.5]" /><span>เปิดบริการปกติ</span></div>) : (<div className="flex items-center gap-1.5 bg-stone-100 text-stone-500 px-3.5 py-2 rounded-full border border-stone-200 font-bold text-[11px] hover:bg-stone-200"><Lock size={12} className="stroke-[2.5]" /><span>ปิดร้านชั่วคราว</span></div>)}
                  </button>
                </div>

                <div className="flex flex-col gap-3 bg-[#fffaf8] p-3.5 rounded-2xl border border-[#ddc1b3]/15">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><Calendar size={13} className="text-[#9b4500]" /><div><h4 className="text-xs font-bold text-[#564338]">ตั้งเวลาเปิด-ปิดอัตโนมัติ</h4><p className="text-[9px] text-[#897266]">สลับเป็นสไตล์อัตโนมัติรายวัน</p></div></div>
                    <button onClick={() => setShopConfig(prev => ({ ...prev, autoSchedule: !prev.autoSchedule }))} className="focus:outline-none transition-all duration-150 active:scale-95">{shopConfig.autoSchedule ? (<ToggleRight size={38} className="text-[#9b4500] transition-colors" />) : (<ToggleLeft size={38} className="text-stone-300 transition-colors" />)}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="flex flex-col gap-1"><span className="text-[10px] font-bold text-[#897266]">เวลาเปิดร้าน (เปิดเตา)</span><input type="time" value={shopConfig.openTime} disabled={!shopConfig.autoSchedule} onChange={(e) => { if (e.target.value) setShopConfig(prev => ({ ...prev, openTime: e.target.value })); }} className="px-2.5 py-1.5 rounded-xl border border-[#ddc1b3]/40 bg-white text-xs font-bold text-[#231914] focus:outline-none focus:ring-1 focus:ring-[#9b4500]/30 disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-stone-50" /></div>
                    <div className="flex flex-col gap-1"><span className="text-[10px] font-bold text-[#897266]">เวลาปิดร้าน (ปิดรับออเดอร์)</span><input type="time" value={shopConfig.closeTime} disabled={!shopConfig.autoSchedule} onChange={(e) => { if (e.target.value) setShopConfig(prev => ({ ...prev, closeTime: e.target.value })); }} className="px-2.5 py-1.5 rounded-xl border border-[#ddc1b3]/40 bg-white text-xs font-bold text-[#231914] focus:outline-none focus:ring-1 focus:ring-[#9b4500]/30 disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-stone-50" /></div>
                  </div>
                  {shopConfig.autoSchedule && (<div className="text-[9px] bg-amber-50 text-[#9b4500] p-2 rounded-xl font-medium leading-normal border border-amber-100 flex items-start gap-1"><Clock size={11} className="shrink-0 mt-0.5" /><span>เปิดรับออเดอร์อัตโนมัติในช่วง {shopConfig.openTime} น. ถึง {shopConfig.closeTime} น. นอกเหนือจากนี้ระบบจะแจ้งปิดออเดอร์ให้กับลูกค้า</span></div>)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-gradient-to-br from-[#ff8c42] to-[#9b4500] p-5 rounded-3xl text-white shadow-md relative overflow-hidden group">
                <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500"><TrendingUp size={100} /></div>
                <div className="flex justify-between items-start relative z-10">
                  <div><span className="text-[10px] font-bold uppercase tracking-wider text-[#ffdbc9]/90">ยอดขายวันนี้ (Daily Sales)</span><h3 className="text-3xl font-extrabold mt-1.5">฿{stats.dailySales}</h3></div>
                  <button onClick={handleExportSalesCSV} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-150 border border-white/10 shadow-sm cursor-pointer" title="ส่งออกรายงานออเดอร์และยอดขายวันนี้เป็นไฟล์ CSV"><Download size={13} className="stroke-[2.5]" /><span>ส่งออกข้อมูล (CSV)</span></button>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#ffdbc9] font-semibold mt-3"><TrendingUp size={14} /><span>+12.4% สูงขึ้นกว่าเฉลี่ยเมื่อวาน</span></div>
              </div>

              <div className="bg-[#fff1eb] p-4.5 rounded-2xl border border-[#ddc1b3]/30 flex flex-col justify-between shadow-sm">
                <div><span className="text-[10px] font-bold text-[#897266] uppercase tracking-wider">ออเดอร์ทั้งหมด</span><h4 className="text-2xl font-black text-[#9b4500] mt-1">{stats.totalOrdersCount} ออเดอร์</h4></div>
                <p className="text-[10px] text-[#564338]/80 font-semibold mt-3 flex items-center gap-1"><ShoppingCart size={11} className="text-[#9b4500]" /><span>{stats.pendingOrdersCount} รอเตรียมหน้าเตา</span></p>
              </div>

              <div className="bg-[#feeae0] p-4.5 rounded-2xl border border-[#ddc1b3]/30 flex flex-col justify-between shadow-sm">
                <div><span className="text-[10px] font-bold text-[#897266] uppercase tracking-wider">เมนูยอดนิยมวันนี้</span><h4 className="text-base font-extrabold text-[#231914] mt-1 leading-tight line-clamp-1">{topSellers.length > 0 ? topSellers[0].name : "ยังไม่มีข้อมูล"}</h4></div>
                <p className="text-[10px] text-[#9b4500] font-extrabold mt-3 flex items-center gap-1"><Star size={11} className="fill-[#9b4500]" /><span>อบร้อนขายดีที่สุด 🔥</span></p>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-3xl border border-[#ddc1b3]/30 shadow-sm flex flex-col gap-3.5">
              <h3 className="text-sm font-bold text-[#231914]">เมนูขายดีประจำสัปดาห์</h3>
              <div className="flex flex-col gap-3">
                {topSellers.length > 0 ? (
                  topSellers.slice(0, 3).map((item, index) => {
                    const maxSold = topSellers[0].count;
                    const widthPercent = Math.max((item.count / maxSold) * 100, 10);
                    const colors = ["bg-[#ff8c42]", "bg-[#ff8c42]/80", "bg-[#9b4500]/70"];
                    return (
                      <div key={index} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-semibold"><span className="text-[#564338]">{item.name}</span><span className="text-[#9b4500]">{item.count} ชิ้น</span></div>
                        <div className="w-full bg-[#f2dfd5]/40 h-2 rounded-full overflow-hidden"><div className={`${colors[index] || "bg-stone-300"} h-full rounded-full transition-all duration-500`} style={{ width: `${widthPercent}%` }}/></div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-stone-400 text-center py-2">ยังไม่มีข้อมูลการขาย</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeAdminTab === 'orders' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4.5">
            <div className="flex justify-between items-center"><h2 className="text-base font-bold text-[#231914]">รายการสั่งซื้อสดใหม่ ({orders.length} คิว)</h2><span className="text-xs text-[#897266] font-medium">สลับเปลี่ยนคิวเพื่ออัปเดตระบบลูกค้า</span></div>

            {orders.length === 0 ? (
              <div className="py-16 text-center text-[#897266] bg-white rounded-3xl border border-[#ddc1b3]/20 flex flex-col items-center gap-2"><ShoppingCart size={32} className="opacity-25" /><p className="text-sm font-bold">ไม่มีคิวสั่งซื้อเข้ามาในวันนี้ค่ะ</p></div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order) => {
                  return (
                    <div key={order.id} className="bg-white rounded-3xl p-4 border border-[#ddc1b3]/30 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start border-b border-[#fff1eb] pb-2.5">
                        <div><span className="text-[10px] text-stone-400 font-semibold">{order.createdAt}</span><h4 className="font-bold text-[#9b4500] text-sm">คิวที่ {order.id} - {order.customerName}</h4></div>
                        <div className="flex items-center gap-1">
                          <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)} className="text-xs font-bold px-2 py-1.5 rounded-xl border border-[#ddc1b3] focus:outline-none focus:ring-1 focus:ring-[#9b4500] bg-[#fff8f6] text-[#231914]">
                            <option value="Pending">Pending (รอดำเนินการ)</option>
                            <option value="Preparing">Preparing (กำลังเตรียม)</option>
                            <option value="Delivered">Delivered (จัดส่งเรียบร้อย)</option>
                            <option value="Cancelled">Cancelled (ยกเลิกออเดอร์)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5 py-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div><strong className="text-[#ff8c42]">{item.quantity}x</strong> <span className="font-semibold text-[#231914]">{item.productName}</span>{item.optionsSummary && (<p className="text-[10px] text-[#564338]/80 italic ml-5">{item.optionsSummary}</p>)}</div><span className="font-bold">฿{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div id={`order-addr-${order.id}`} className="text-xs bg-[#fff1eb]/50 p-3 rounded-xl border border-[#ddc1b3]/20 flex flex-col gap-1">
                        <p><strong>เบอร์ติดต่อ:</strong> <a href={`tel:${order.phone}`} className="text-[#9b4500] underline font-bold">{order.phone}</a></p><p><strong>ที่จัดส่ง:</strong> <span className="font-semibold text-[#231914]">{order.roomNo}</span></p>{order.note && (<p className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100"><strong>โน้ตพิเศษ:</strong> "{order.note}"</p>)}
                      </div>

                      <div id={`order-proof-sec-${order.id}`} className="mt-1 pb-1 flex flex-col gap-2 border-t border-[#fff1eb]/60 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#564338] flex items-center gap-1"><span>📸 หลักฐานจัดส่ง</span>{order.deliveryPhoto && (<span id={`proof-tag-success-${order.id}`} className="text-emerald-600 bg-emerald-50 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5"><Check size={10} className="stroke-[3]" /> แนบแล้ว</span>)}</span>
                          <label id={`btn-upload-photo-label-${order.id}`} className="cursor-pointer bg-[#9b4500]/10 hover:bg-[#9b4500]/20 text-[#9b4500] text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-150 active:scale-95 flex items-center gap-1">
                            <Camera size={12} /><span>{order.deliveryPhoto ? 'เปลี่ยนรูปภาพ' : 'ถ่ายรูป / แนบรูป'}</span>
                            <input id={`input-photo-${order.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { handleUpdateOrderPhoto(order.id, file); } }}/>
                          </label>
                        </div>
                        {order.deliveryPhoto ? (
                          <div id={`img-preview-container-${order.id}`} className="relative group rounded-xl overflow-hidden border border-[#ddc1b3]/30 bg-stone-50 max-h-48 flex items-center justify-center">
                            <img id={`img-preview-${order.id}`} src={order.deliveryPhoto} alt="หลักฐานจัดส่ง" className="w-full h-auto max-h-48 object-cover cursor-pointer hover:brightness-95 transition-all" onClick={() => setSelectedFullPhoto(order.deliveryPhoto || null)}/>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button id={`btn-zoom-${order.id}`} type="button" onClick={() => setSelectedFullPhoto(order.deliveryPhoto || null)} className="bg-white/90 hover:bg-white text-stone-900 p-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1 transition-all"><Eye size={14} /> ขยายดูรูป</button>
                              <button id={`btn-delete-photo-${order.id}`} type="button" onClick={() => handleUpdateOrderPhoto(order.id, undefined)} className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-all" title="ลบรูปภาพ"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center border border-dashed border-[#ddc1b3]/50 rounded-2xl bg-stone-50 text-[10px] text-stone-400 font-semibold">ไม่มีรูปภาพแนบจัดส่ง (หากส่งเรียบร้อยแล้ว แนะนำให้แนบรูปเพื่อยืนยัน)</div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#fff1eb]"><span className="text-[11px] text-[#897266] font-semibold">ยอดราคารวม</span><span className="text-base font-extrabold text-[#9b4500]">฿{order.totalPrice}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeAdminTab === 'menu_stock' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-[#231914]">จัดการเมนูร้านทั้งหมด ({products.length})</h2>
              <button onClick={() => setIsAddingProduct(!isAddingProduct)} className="bg-[#9b4500] hover:bg-[#ff8c42] text-white px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1 transition-all duration-150 active:scale-95 shadow-sm">
                {isAddingProduct ? <X size={14} /> : <Plus size={14} />}<span>{isAddingProduct ? 'ปิดแบบฟอร์ม' : 'เพิ่มเมนูใหม่'}</span>
              </button>
            </div>

            <AnimatePresence>
              {isAddingProduct && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handleCreateProduct} className="bg-white p-4.5 rounded-3xl border border-[#ddc1b3]/40 shadow-inner flex flex-col gap-3.5 overflow-hidden">
                  <h3 className="text-xs font-bold text-[#9b4500] border-b border-[#fff1eb] pb-1.5">ฟอร์มกรอกเมนูอาหารชิ้นใหม่ 🧇</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-[#564338]">ชื่อเมนูภาษาไทย *</label><input type="text" required value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="เช่น ครอฟเฟิล เนยกระเทียม" className="px-3 py-2 border border-[#ddc1b3]/50 rounded-xl text-xs bg-[#fff8f6] text-[#231914] focus:outline-none focus:ring-1 focus:ring-[#9b4500]"/></div>
                    <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-[#564338]">ราคา (บาท) *</label><input type="number" required value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder="เช่น 49" className="px-3 py-2 border border-[#ddc1b3]/50 rounded-xl text-xs bg-[#fff8f6] text-[#231914] focus:outline-none focus:ring-1 focus:ring-[#9b4500]"/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-[#564338]">หมวดหมู่เมนู *</label><select value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value as Category)} className="px-3 py-2 border border-[#ddc1b3]/50 rounded-xl text-xs bg-[#fff8f6] text-[#231914] focus:outline-none focus:ring-1 focus:ring-[#9b4500]"><option value="ขนม">ขนม</option><option value="เครื่องดื่ม">เครื่องดื่ม</option></select></div>
                    <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-[#564338]">รูปภาพเมนู (เลือกจากมือถือ/ถ่ายรูป)</label>
                      {newProductImage ? (
                        <div className="relative w-full h-[38px] rounded-xl overflow-hidden border border-[#ddc1b3]/50 flex items-center justify-between px-3.5 bg-[#fff8f6]">
                          <div className="flex items-center gap-2 overflow-hidden"><img src={newProductImage} alt="preview" className="w-6 h-6 rounded-md object-cover border border-[#ddc1b3]/30 flex-shrink-0"/><span className="text-[10px] text-[#564338] font-bold truncate max-w-[100px]">เลือกรูปภาพแล้ว</span></div>
                          <button type="button" onClick={() => setNewProductImage('')} className="text-rose-600 hover:text-rose-800 text-[10px] font-extrabold">ลบรูป</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer bg-[#fff8f6] hover:bg-[#feeae0]/40 text-[#9b4500] border border-[#ddc1b3]/50 border-dashed rounded-xl h-[38px] px-3.5 flex items-center justify-center gap-1.5 transition-all text-xs font-bold">
                          <Camera size={14} className="text-[#9b4500]" /><span>{isUploadingImg ? 'กำลังอัปโหลด...' : 'เลือกรูป/ถ่ายรูป'}</span>
                          <input type="file" accept="image/*" className="hidden" disabled={isUploadingImg} onChange={(e) => { const file = e.target.files?.[0]; if (file) { handleUploadProductImage(file); } }}/>
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-[#564338]">คำบรรยายความอร่อย</label><input type="text" value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} placeholder="เช่น ครอฟเฟิลเนยสดแท้ อบกระเทียมหอมฟินฉ่ำใจ" className="px-3 py-2 border border-[#ddc1b3]/50 rounded-xl text-xs bg-[#fff8f6] text-[#231914] focus:outline-none focus:ring-1 focus:ring-[#9b4500]"/></div>
                  <button type="submit" disabled={isUploadingImg} className="w-full mt-2 bg-[#9b4500] hover:bg-[#ff8c42] disabled:bg-stone-300 text-white py-2.5 rounded-full font-bold text-xs shadow-sm transition-all duration-150 active:scale-98">ยืนยันการเพิ่มเมนูเข้าร้านค้า</button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-3.5">
              {products.map((p) => {
                const isEditing = editingProductId === p.id;
                return (
                  <div key={p.id} className="bg-white p-3.5 rounded-3xl border border-[#ddc1b3]/20 shadow-sm flex gap-3.5 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 relative"><img src={p.image} alt={p.name} className={`w-full h-full object-cover ${!p.inStock ? 'grayscale-[60%]' : ''}`} referrerPolicy="no-referrer"/>{!p.inStock && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-[8px] bg-red-600 text-white font-bold px-1 py-0.5 rounded uppercase">หมด</span></div>)}</div>
                      <div className="flex flex-col"><h4 className="font-bold text-xs text-[#231914] flex items-center gap-1.5"><span>{p.name}</span><span className="text-[9px] bg-[#f2dfd5] text-[#9b4500] font-bold px-1.5 py-0.5 rounded-full">{p.category}</span></h4>
                        {isEditing ? (
                          <div className="flex items-center gap-1 mt-1"><input type="number" value={editingPriceValue} onChange={(e) => setEditingPriceValue(e.target.value)} className="px-2 py-0.5 border border-[#ddc1b3] rounded text-[10px] w-14 bg-[#fff8f6]"/><button onClick={() => handleSaveProductPrice(p.id)} className="bg-emerald-600 text-white p-1 rounded-md hover:bg-emerald-700"><Check size={10} /></button><button onClick={() => setEditingProductId(null)} className="bg-stone-200 text-stone-600 p-1 rounded-md hover:bg-stone-300"><X size={10} /></button></div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-0.5"><span className="text-xs font-bold text-[#9b4500]">฿{p.price}</span><button onClick={() => { setEditingProductId(p.id); setEditingPriceValue(p.price.toString()); }} className="p-1 rounded text-stone-400 hover:text-[#9b4500] hover:bg-[#fff1eb]"><Edit2 size={10} /></button></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleToggleProductStock(p.id)} className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${p.inStock ? 'bg-[#feeae0] text-[#9b4500] border-[#9b4500]/20' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>{p.inStock ? 'ของพร้อมขาย' : 'ของหมด'}</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-stone-300 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeAdminTab === 'settings' && (
          <div className="flex flex-col gap-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4 bg-white p-5 rounded-3xl border border-[#ddc1b3]/30 shadow-sm">
              <div className="border-b border-[#fff1eb] pb-3 text-center"><Lock className="text-[#9b4500] mx-auto mb-1" size={26} /><h2 className="text-sm font-bold text-[#231914]">ตั้งค่าความปลอดภัย / เปลี่ยนรหัสผ่าน</h2><p className="text-[10px] text-[#564338] mt-0.5">เปลี่ยนรหัสผ่านเพื่อเข้าสู่ระบบ (Username: <span className="font-extrabold underline text-[#9b4500]">{adminUsername}</span>)</p></div>
              <form onSubmit={(e) => {
                e.preventDefault();
                setPasswordStatus(null);
                const trimmedPass = newPasswordInput.trim();
                if (!trimmedPass) { setPasswordStatus({ type: 'error', text: 'กรุณากรอกรหัสผ่านใหม่ด้วยค่ะ' }); return; }
                if (trimmedPass.length < 4) { setPasswordStatus({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษรค่ะ' }); return; }
                if (trimmedPass !== confirmPasswordInput.trim()) { setPasswordStatus({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน กรุณาตรวจสอบอีกครั้งค่ะ' }); return; }
                onUpdateAdminPassword(trimmedPass);
                setPasswordStatus({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบแอดมินสำเร็จแล้วค่ะ!' });
                setNewPasswordInput(''); setConfirmPasswordInput('');
              }} className="flex flex-col gap-3.5">
                {passwordStatus && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-3 rounded-2xl text-[10px] font-bold text-center leading-normal ${passwordStatus.type === 'success' ? 'bg-emerald-50 border border-emerald-200/60 text-emerald-600' : 'bg-red-50 border border-red-200/60 text-red-600'}`}>{passwordStatus.type === 'success' ? '✅' : '⚠️'} {passwordStatus.text}</motion.div>
                )}
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-extrabold text-[#564338]">รหัสผ่านใหม่ (New Password)</label><input type="password" required value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} placeholder="กรอกรหัสผ่านใหม่ที่ต้องการ" className="px-3.5 py-2.5 border border-[#ddc1b3]/50 rounded-xl text-xs bg-[#fff8f6]/40 text-[#231914] focus:outline-none focus:ring-1 focus:ring-[#9b4500]"/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-extrabold text-[#564338]">ยืนยันรหัสผ่านใหม่อีกครั้ง (Confirm Password)</label><input type="password" required value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อความถูกต้อง" className="px-3.5 py-2.5 border border-[#ddc1b3]/50 rounded-xl text-xs bg-[#fff8f6]/40 text-[#231914] focus:outline-none focus:ring-1 focus:ring-[#9b4500]"/></div>
                <button type="submit" className="w-full mt-1.5 bg-[#9b4500] hover:bg-[#ff8c42] text-white text-xs font-bold py-3 rounded-2xl shadow-md transition-all duration-150 active:scale-98 flex items-center justify-center gap-1.5"><Check size={13} className="stroke-[2.5]" /><span>บันทึกรหัสผ่านใหม่</span></button>
              </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4 bg-white p-5 rounded-3xl border border-[#ddc1b3]/30 shadow-sm">
              <div className="border-b border-[#fff1eb] pb-3 text-center"><Camera className="text-[#9b4500] mx-auto mb-1" size={26} /><h2 className="text-sm font-bold text-[#231914]">ตั้งค่าช่องทางชำระเงิน (QR Code)</h2><p className="text-[10px] text-[#564338] mt-0.5">แนบรูป QR Code เพื่อให้ลูกค้าสแกนชำระเงินที่หน้าร้าน</p></div>
              <div className="flex flex-col items-center gap-3">
                {shopConfig.qrCodeUrl ? (
                  <div className="relative group">
                    <img src={shopConfig.qrCodeUrl} alt="QR Code ร้านค้า" className="w-32 h-32 object-contain rounded-xl border border-[#ddc1b3]/30 shadow-sm"/>
                    <button onClick={() => setShopConfig(prev => ({ ...prev, qrCodeUrl: undefined }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors" title="ลบ QR Code"><X size={14} /></button>
                  </div>
                ) : (
                  <label className="w-32 h-32 bg-[#fff8f6] border border-dashed border-[#ddc1b3]/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#feeae0]/40 transition-all">
                    <Camera size={24} className="text-[#9b4500] mb-2" /><span className="text-[10px] text-[#564338] font-bold">อัปโหลดรูป QR</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const fileExt = file?.name?.split('.').pop() || 'jpg'; // ✅ แก้บั๊ก 2: รองรับมือถือ
                          const fileName = `qr-payment-${Date.now()}.${fileExt}`;
                          const filePath = `settings/${fileName}`;

                          const { error: uploadError } = await supabase.storage.from('croffle-bucket').upload(filePath, file, { upsert: true });
                          if (uploadError) throw uploadError;

                          const { data } = supabase.storage.from('croffle-bucket').getPublicUrl(filePath);
                          // ✅ แก้บั๊ก 1: ใช้ setShopConfig ลง DB จริงผ่าน App.tsx ที่เพิ่งแก้
                          setShopConfig(prev => ({ ...prev, qrCodeUrl: `${data.publicUrl}?t=${Date.now()}` }));
                          alert('✅ อัปโหลด QR Code สำเร็จแล้วค่ะ!');
                        } catch (error) {
                          console.error(error);
                          alert('⚠️ เกิดข้อผิดพลาดในการอัปโหลด QR Code กรุณาลองใหม่อีกครั้ง');
                        }
                      }
                    }}/>
                  </label>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5 bg-white p-5 rounded-3xl border border-[#ddc1b3]/30 shadow-sm">
              <div className="border-b border-[#fff1eb] pb-3 text-center"><Shield className="text-[#9b4500] mx-auto mb-1" size={28} /><h2 className="text-sm font-bold text-[#231914]">จัดการระบบคิวและทำความสะอาดออเดอร์</h2><p className="text-[10px] text-[#564338] mt-0.5">ล้างข้อมูลออเดอร์ที่เสร็จสิ้นแล้วเพื่อเคลียร์พื้นที่การทำงาน</p></div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs py-2">
                  <div><p className="font-bold text-[#231914]">ล้างคิวออเดอร์ที่จัดส่งแล้ว</p><p className="text-[10px] text-stone-400 leading-tight font-medium text-amber-600">ประหยัดพื้นที่ คัดเลือกเฉพาะออเดอร์ที่เสร็จสมบูรณ์แล้ว</p></div>
                  <button 
                    onClick={async () => {
                      if (confirm("คุณแน่ใจหรือไม่ที่จะล้างออเดอร์ที่จัดส่งแล้วหรือยกเลิกทิ้งทั้งหมด?")) {
                        try {
                          const { error: err1 } = await supabase.from('orders').delete().eq('status', 'Delivered');
                          const { error: err2 } = await supabase.from('orders').delete().eq('status', 'Cancelled');
                          
                          if (err1 || err2) throw new Error("Database deletion failed");
                          
                          // ✅ บั๊ก 4 แก้ไขแล้ว เพราะเราใช้ setOrders ตัวแท้จาก App.tsx แทนการใช้ฟังก์ชันครอบ
                          setOrders(prev => prev.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled'));
                          alert("✅ ล้างคิวที่เสร็จสมบูรณ์เรียบร้อยแล้วค่ะ!");
                        } catch (error) {
                          console.error(error);
                          alert("⚠️ เกิดข้อผิดพลาด ไม่สามารถล้างคิวบนฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
                        }
                      }
                    }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm transition-all duration-150 active:scale-95 border border-[#ddc1b3]/30"
                  >
                    ล้างคิวเก่า
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-0 left-0 right-0 w-full bg-[#fff8f6] border-t border-[#f2dfd5] shadow-[0_-4px_12px_rgba(86,67,56,0.06)] py-2 pb-safe z-40">
        <div className="w-full flex justify-around items-center px-4">
          <button onClick={() => setActiveAdminTab('dashboard')} className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-150 ${activeAdminTab === 'dashboard' ? 'text-[#9b4500] font-bold scale-103' : 'text-[#897266]/80 font-semibold'}`}><TrendingUp size={20} className={activeAdminTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'} /><span className="text-[10px] mt-1">แดชบอร์ด</span></button>
          <button onClick={() => setActiveAdminTab('orders')} className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-150 relative ${activeAdminTab === 'orders' ? 'text-[#9b4500] font-bold scale-103' : 'text-[#897266]/80 font-semibold'}`}><ShoppingCart size={20} className={activeAdminTab === 'orders' ? 'stroke-[2.5]' : 'stroke-[1.8]'} /><span className="text-[10px] mt-1">คิวร้าน</span>{stats.pendingOrdersCount > 0 && (<span className="absolute -top-1 -right-1.5 w-5 h-5 bg-red-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow">{stats.pendingOrdersCount}</span>)}</button>
          <button onClick={() => setActiveAdminTab('menu_stock')} className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-150 relative ${activeAdminTab === 'menu_stock' ? 'text-[#9b4500] font-bold scale-103' : 'text-[#897266]/80 font-semibold'}`}><Coffee size={20} className={activeAdminTab === 'menu_stock' ? 'stroke-[2.5]' : 'stroke-[1.8]'} /><span className="text-[10px] mt-1">ตั้งค่าเมนู</span></button>
          <button onClick={() => setActiveAdminTab('settings')} className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-150 relative ${activeAdminTab === 'settings' ? 'text-[#9b4500] font-bold scale-103' : 'text-[#897266]/80 font-semibold'}`}><Settings size={20} className={activeAdminTab === 'settings' ? 'stroke-[2.5]' : 'stroke-[1.8]'} /><span className="text-[10px] mt-1">ตั้งค่าอื่นๆ</span></button>
        </div>
      </nav>

      <AnimatePresence>
        {selectedFullPhoto && (
          <motion.div id="full-photo-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedFullPhoto(null)}>
            <motion.div id="full-photo-modal-card" initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} className="bg-[#fcf5f2] rounded-3xl p-4.5 border border-[#ddc1b3]/30 max-w-md w-full relative flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-2 border-b border-[#fff1eb]"><h3 className="text-sm font-bold text-[#9b4500]">📸 รูปถ่ายหลักฐานจัดส่ง</h3><button id="btn-close-full-photo" onClick={() => setSelectedFullPhoto(null)} className="bg-stone-200 hover:bg-stone-300 text-stone-700 p-1 rounded-full transition"><X size={16} /></button></div>
              <div className="rounded-2xl overflow-hidden border border-[#ddc1b3]/30 bg-stone-50 max-h-[70vh] flex items-center justify-center shadow-inner"><img id="full-photo-modal-img" src={selectedFullPhoto} alt="ภาพหลักฐานจัดส่งความละเอียดเต็ม" className="w-full h-auto max-h-[70vh] object-contain"/></div>
              <button id="btn-close-full-photo-bottom" onClick={() => setSelectedFullPhoto(null)} className="w-full py-2.5 rounded-full bg-[#9b4500] hover:bg-[#ff8c42] active:scale-98 text-white text-xs font-bold transition shadow-sm">ปิดหน้าต่างนี้</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}