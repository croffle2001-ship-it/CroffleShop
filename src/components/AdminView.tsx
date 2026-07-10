import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, ShoppingCart, Check, X, Shield, Eye, Edit2, 
  Settings, Coffee, Clock, Users, Activity, Lock, Unlock, Calendar, Download, Camera, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order, Category, OrderStatus, ShopConfig } from '../types';
import { supabase } from '../supabaseClient';

interface AdminViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onSwitchToCustomer: () => void;
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
  onSwitchToCustomer,
  shopConfig,
  setShopConfig,
  totalViews,
  currentOnline,
  isShopOpen,
  adminUsername,
  adminPassword,
  onUpdateAdminPassword
}: AdminViewProps) {
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

  const topSellingProducts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    orders.filter(o => o.status === 'Delivered').forEach(order => {
      order.items.forEach(item => {
        counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
      });
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 3);
  }, [orders]);

  const handleUploadAdminProfile = async (file: File) => {
    try {
      setIsUploadingProfile(true);
      const fileName = `admin-profile-${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('croffle-bucket').upload(`profiles/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('croffle-bucket').getPublicUrl(`profiles/${fileName}`);
      const newUrl = `${data.publicUrl}?t=${Date.now()}`;
      setAdminProfilePic(newUrl);
      localStorage.setItem('adminProfilePic', newUrl);
      setIsUploadingProfile(false);
    } catch (error) {
      setIsUploadingProfile(false);
      alert('⚠️ อัปโหลดรูปโปรไฟล์ไม่สำเร็จ');
    }
  };

  const handleExportAndClear = async () => {
    const activeOrders = orders.filter(o => o.status === 'Delivered');
    if (activeOrders.length === 0) {
      alert("ไม่มีข้อมูลออเดอร์ที่จัดส่งแล้วสำหรับส่งออกและล้างข้อมูลค่ะ");
      return;
    }
    handleExportSalesCSV();
    if (confirm("ส่งออกข้อมูลเรียบร้อย! ต้องการล้างออเดอร์ที่จัดส่งแล้วทิ้งเพื่อเริ่มวันใหม่เลยหรือไม่?")) {
      await supabase.from('orders').delete().eq('status', 'Delivered');
      setOrders(prev => prev.filter(o => o.status !== 'Delivered'));
      alert("ล้างคิวจัดส่งเรียบร้อยแล้วค่ะ!");
    }
  };

  const handleExportSalesCSV = () => {
    const rowsList: any[] = [];
    orders.filter(o => o.status !== 'Cancelled').forEach(order => {
      order.items.forEach(item => {
        rowsList.push({ dateTime: order.createdAt, menuName: item.productName, quantity: item.quantity, price: item.price * item.quantity });
      });
    });
    const csvContent = "\uFEFF" + ["วันที่/เวลา,เมนู,จำนวน,ราคา", ...rowsList.map(i => `${i.dateTime},${i.menuName},${i.quantity},${i.price}`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleUpdateOrderPhoto = async (orderId: string, file: File | undefined) => {
    if (!file) {
      await supabase.from('orders').update({ deliveryPhoto: null }).eq('id', orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryPhoto: undefined } : o));
      return;
    }
    try {
      const fileName = `delivery-${orderId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
      await supabase.storage.from('croffle-bucket').upload(`deliveries/${fileName}`, file);
      const { data } = supabase.storage.from('croffle-bucket').getPublicUrl(`deliveries/${fileName}`);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from('orders').update({ deliveryPhoto: publicUrl, status: 'Delivered' }).eq('id', orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryPhoto: publicUrl, status: 'Delivered' } : o));
    } catch (e) { alert('อัปโหลดล้มเหลว'); }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  };

  const handleToggleProductStock = async (productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    setProducts(prev => prev.map(prod => prod.id === productId ? { ...prod, inStock: !prod.inStock } : prod));
    await supabase.from('products').update({ inStock: !p.inStock }).eq('id', productId);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct = {
      id: `prod-${Date.now()}`,
      name: newProductName,
      price: parseFloat(newProductPrice),
      category: newProductCategory,
      description: newProductDescription || "เมนูอบร้อนหอมอร่อย",
      image: newProductImage || "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400",
      inStock: true,
      sweetnessLevels: ["หวานปกติ"],
      toppings: [{ name: "หน้าเดิม", price: 0 }]
    };
    setProducts(prev => [newProduct, ...prev]);
    await supabase.from('products').insert([newProduct]);
    setIsAddingProduct(false);
  };

  return (
    <div className="w-full h-[100dvh] md:max-w-[430px] mx-auto md:h-[880px] bg-[#fff8f6] text-[#231914] relative overflow-hidden flex flex-col md:rounded-[48px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] md:border-[10px] md:border-neutral-900 md:ring-1 md:ring-black/10">
      
      <header className="shrink-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md shadow-sm border-b border-[#f2dfd5] md:pt-9 pt-3">
        <div className="flex justify-between items-center px-4 py-3.5 w-full">
          <div className="flex items-center gap-2.5">
            <label className="w-10 h-10 rounded-full border-2 border-[#9b4500] overflow-hidden cursor-pointer relative group block">
              <img className="w-full h-full object-cover" src={adminProfilePic} alt="Admin" />
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadAdminProfile(e.target.files[0])} />
            </label>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-[#9b4500]">แอดมิน</h1>
              <p className="text-[10px] text-[#564338] font-semibold">ร้านครอฟเฟิลไอ้แว่น กม.44</p>
            </div>
          </div>
          <button onClick={onSwitchToCustomer} className="text-xs font-bold bg-[#feeae0] text-[#9b4500] px-3.5 py-2 rounded-full">ดูหน้าลูกค้า</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 scrollbar-none relative">
        {activeAdminTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[#ff8c42] to-[#9b4500] p-5 rounded-3xl text-white shadow-md">
              <span className="text-[10px] font-bold uppercase text-[#ffdbc9]">ยอดขายวันนี้</span>
              <h3 className="text-3xl font-extrabold mt-1.5">฿{orders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.totalPrice : sum, 0)}</h3>
              <button onClick={handleExportAndClear} className="mt-4 flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <Download size={14} /> ส่งออก & ล้างข้อมูลวันนี้
              </button>
            </div>

            <div className="bg-white p-4.5 rounded-3xl border border-[#ddc1b3]/30 shadow-sm flex flex-col gap-3.5">
              <h3 className="text-sm font-bold text-[#231914]">เมนูขายดีประจำวันนี้</h3>
              <div className="flex flex-col gap-3">
                {topSellingProducts.length > 0 ? topSellingProducts.map(([name, count]) => (
                  <div key={name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#564338]">{name}</span>
                      <span className="text-[#9b4500]">{count} ชิ้น</span>
                    </div>
                    <div className="w-full bg-[#f2dfd5]/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#ff8c42] h-full rounded-full" style={{ width: `${Math.min(count * 10, 100)}%` }} />
                    </div>
                  </div>
                )) : <p className="text-xs text-stone-400">ยังไม่มีข้อมูลการขายในวันนี้</p>}
              </div>
            </div>
          </div>
        )}
        {/* เพิ่ม Tab รายการออเดอร์ (orders) และ ตั้งค่าเมนู (menu_stock) ที่นี่ได้เลย */}
      </div>

      <nav className="absolute bottom-0 left-0 right-0 w-full bg-[#fff8f6] border-t border-[#f2dfd5] py-2">
        <div className="w-full flex justify-around items-center px-4">
          <button onClick={() => setActiveAdminTab('dashboard')} className="flex flex-col items-center text-xs font-bold text-[#9b4500]"><TrendingUp size={20}/>แดชบอร์ด</button>
          <button onClick={() => setActiveAdminTab('orders')} className="flex flex-col items-center text-xs font-bold text-[#897266]"><ShoppingCart size={20}/>คิวร้าน</button>
          <button onClick={() => setActiveAdminTab('menu_stock')} className="flex flex-col items-center text-xs font-bold text-[#897266]"><Coffee size={20}/>ตั้งค่าเมนู</button>
        </div>
      </nav>
    </div>
  );
}