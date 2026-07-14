import { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Order, InventoryItem, CartItem, OrderStatus, ShopConfig, Category } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from './data';
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState<'customer' | 'admin'>('customer');
  
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('croffle_cart_v8');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [shopConfig, setShopConfig] = useState<ShopConfig>({
    isOpen: true,
    autoSchedule: false,
    openTime: "08:00",
    closeTime: "20:00"
  });

  const [totalViews, setTotalViews] = useState<number>(0);
  const [currentOnline, setCurrentOnline] = useState<number>(0);

  const [adminUsername, setAdminUsername] = useState<string>('narongrit');
  const [adminPassword, setAdminPassword] = useState<string>('081144');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (view === 'customer') {
      setIsAdminLoggedIn(false);
    }
  }, [view]);

  useEffect(() => {
    localStorage.setItem('croffle_cart_v8', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchDatabase = async () => {
      const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
      if (prodData && prodData.length > 0) {
        setProducts(prodData);
      } else if (!prodErr) {
        await supabase.from('products').insert(INITIAL_PRODUCTS);
        setProducts(INITIAL_PRODUCTS);
      }

      const { data: orderData } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
      if (orderData) {
        setOrders(orderData);
      }

      const { data: configData } = await supabase.from('shop_config').select('*').eq('id', 1).single();
      if (configData) {
        setShopConfig({
          isOpen: configData.isOpen,
          autoSchedule: configData.autoSchedule,
          openTime: configData.openTime || "08:00",
          closeTime: configData.closeTime || "20:00",
          qrCodeUrl: configData.qrCodeUrl,
          adminProfilePic: configData.adminProfilePic // เพิ่มดึงรูปโปรไฟล์
        });
      }

      // ระบบนับยอดวิว (ป้องกัน RLS บล็อกและจัดการ Error ให้ละเอียดขึ้น)
      try {
        const { data: viewsData, error: viewsErr } = await supabase.from('page_views').select('count').eq('id', 1).maybeSingle();
        
        let newCount = 1;
        if (viewsData) {
          newCount = (viewsData.count || 0) + 1;
          setTotalViews(newCount);
          await supabase.from('page_views').update({ count: newCount }).eq('id', 1);
        } else {
          setTotalViews(newCount); // เซ็ตเป็น 1 ไว้ก่อนให้หน้าเว็บอัปเดต
          if (!viewsErr) {
            await supabase.from('page_views').insert([{ id: 1, count: newCount }]);
          } else {
            console.error("⚠️ ไม่สามารถดึงยอดวิวจาก Supabase ได้ (รบกวนเช็คว่ามีตาราง page_views หรือปิด RLS แล้วหรือยัง):", viewsErr.message);
          }
        }
      } catch (err) {
        console.error("Error tracking views:", err);
        setTotalViews(prev => prev === 0 ? 1 : prev);
      }
    };

    fetchDatabase();

    const viewsSubscription = supabase
      .channel('public:page_views')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_views' }, (payload: any) => {
        if (payload.new && 'count' in payload.new) {
          setTotalViews(payload.new.count);
        }
      })
      .subscribe();

    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
        const { data } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
        if (data) {
          setOrders(data);
          if (payload.eventType === 'INSERT' && viewRef.current === 'admin') {
            alert("🔔 แจ้งเตือน: มีออเดอร์ใหม่เข้าครับ! กรุณาเช็คคิวในหน้าแอดมิน");
          }
        }
      })
      .subscribe();

    // ดักจับการเปลี่ยนแปลงการตั้งค่าร้าน (QR Code, โปรไฟล์, เปิด/ปิดร้าน)
    const configSubscription = supabase
      .channel('public:shop_config')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shop_config' }, (payload: any) => {
        if (payload.new) {
          setShopConfig({
            isOpen: payload.new.isOpen,
            autoSchedule: payload.new.autoSchedule,
            openTime: payload.new.openTime || "08:00",
            closeTime: payload.new.closeTime || "20:00",
            qrCodeUrl: payload.new.qrCodeUrl,
            adminProfilePic: payload.new.adminProfilePic
          });
        }
      })
      .subscribe();

    const sessionId = Math.random().toString(36).substring(2, 15);
    const userStatusChannel = supabase.channel('online-users', {
      config: { presence: { key: sessionId } }
    });
    channelRef.current = userStatusChannel;

    userStatusChannel
      .on('presence', { event: 'sync' }, () => {
        const state = userStatusChannel.presenceState();
        let customerCount = 0;
        for (const key in state) {
          const presences: any = state[key];
          if (presences && presences.length > 0 && presences[0].view === 'customer') {
            customerCount++;
          }
        }
        setCurrentOnline(customerCount);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await userStatusChannel.track({ view: viewRef.current, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(viewsSubscription);
      supabase.removeChannel(orderSubscription);
      supabase.removeChannel(userStatusChannel);
      supabase.removeChannel(configSubscription); // ล้าง channel เมื่อออก
    };
  }, []);

  useEffect(() => {
    if (channelRef.current && channelRef.current.state === 'joined') {
      channelRef.current.track({ view: view, online_at: new Date().toISOString() });
    }
  }, [view]);

  const [currentTimeTick, setCurrentTimeTick] = useState<string>("");
  useEffect(() => {
    const updateTick = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      setCurrentTimeTick(`${hh}:${mm}`);
    };
    updateTick();
    const timer = setInterval(updateTick, 10000);
    return () => clearInterval(timer);
  }, []);

  const isShopOpen = useMemo(() => {
    if (!shopConfig.autoSchedule) return shopConfig.isOpen;
    if (!currentTimeTick) return shopConfig.isOpen;
    return currentTimeTick >= shopConfig.openTime && currentTimeTick <= shopConfig.closeTime;
  }, [shopConfig, currentTimeTick]);

  const handlePlaceOrder = async (customerName: string, phone: string, roomNo: string, note: string, paymentSlipUrl?: string) => {
    const maxId = orders.reduce((max, o) => {
      const num = parseInt(o.id.replace('#', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 4402);
    const newOrderId = `#${maxId + 1}`;

    const formattedItems = cart.map(item => {
      const toppingsPrice = item.selectedToppings.length > 1 ? (item.selectedToppings.length - 1) * 5 : 0;
      const optionsArray = [];
      if (item.selectedToppings.length > 0) {
        optionsArray.push(...item.selectedToppings.map((t, idx) => idx > 0 ? `${t.name} (+฿5)` : t.name));
      }
      if (item.note) optionsArray.push(`โน้ต: "${item.note}"`);

      return {
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price + toppingsPrice,
        optionsSummary: optionsArray.join(', ')
      };
    });

    const totalCalculatedPrice = cart.reduce((total, item) => {
      const toppingsCost = item.selectedToppings.length > 1 ? (item.selectedToppings.length - 1) * 5 : 0;
      return total + ((item.product.price + toppingsCost) * item.quantity);
    }, 0);

    const newOrder: Order = {
      id: newOrderId,
      customerName,
      phone,
      roomNo,
      items: formattedItems,
      totalPrice: totalCalculatedPrice,
      status: 'Pending',
      createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' วันนี้',
      note: note.trim() || undefined,
      paymentSlipUrl
    };

    const { error } = await supabase.from('orders').insert([newOrder]);

    if (error) {
      alert("⚠️ เกิดข้อผิดพลาดในการส่งออเดอร์ กรุณาลองใหม่อีกครั้งครับ");
      console.error(error);
      return null; 
    } else {
      setCart([]);
      return newOrderId; 
    }
  };

  const handleUpdateAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
    alert("เปลี่ยนรหัสผ่านสำเร็จแล้วครับ!");
  };

  const handleSetShopConfig: React.Dispatch<React.SetStateAction<ShopConfig>> = (val) => {
    setShopConfig(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      supabase.from('shop_config').update({
        isOpen: next.isOpen,
        autoSchedule: next.autoSchedule,
        openTime: next.openTime,
        closeTime: next.closeTime,
        qrCodeUrl: next.qrCodeUrl,
        adminProfilePic: next.adminProfilePic // อัปเดตรูปโปรไฟล์ลงฐานข้อมูล
      }).eq('id', 1).then();
      return next;
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#fcf5f2] font-sans antialiased select-none flex flex-col items-center justify-center md:py-8 py-0">
      {view === 'customer' ? (
        <CustomerView 
          products={products}
          orders={orders}
          cart={cart}
          setCart={setCart}
          onPlaceOrder={handlePlaceOrder}
          onSwitchToAdmin={() => setView('admin')}
          isShopOpen={isShopOpen}
          shopConfig={shopConfig}
        />
      ) : !isAdminLoggedIn ? (
        <AdminLogin 
          onLoginSuccess={() => setIsAdminLoggedIn(true)}
          onBack={() => setView('customer')}
          correctUsername={adminUsername}
          correctPassword={adminPassword}
        />
      ) : (
        <AdminView 
          products={products}
          setProducts={setProducts} 
          orders={orders}
          setOrders={setOrders}     
          inventory={[]} 
          setInventory={() => {}} 
          onSwitchToCustomer={() => setView('customer')}
          onResetDefaults={() => {}} 
          shopConfig={shopConfig}
          setShopConfig={handleSetShopConfig}
          totalViews={totalViews}
          currentOnline={currentOnline}
          isShopOpen={isShopOpen}
          adminUsername={adminUsername}
          adminPassword={adminPassword}
          onUpdateAdminPassword={handleUpdateAdminPassword}
        />
      )}
    </div>
  );
}