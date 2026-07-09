import { useState, useEffect, useMemo } from 'react';
import { Product, Order, InventoryItem, CartItem, OrderStatus, ShopConfig, Category } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_INVENTORY } from './data';
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';
import { supabase } from './supabaseClient';

export default function App() {
  // Navigation State
  const [view, setView] = useState<'customer' | 'admin'>('customer');

  // Core States เชื่อมต่อตรงกับ Backend Supabase
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('croffle_cart_v8');
    return saved ? JSON.parse(saved) : [];
  });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shopConfig, setShopConfig] = useState<ShopConfig>({
    isOpen: true,
    autoSchedule: false,
    openTime: "08:00",
    closeTime: "20:00"
  });

  // Visitor Tracking States
  const [totalViews, setTotalViews] = useState<number>(348);
  const [currentOnline, setCurrentOnline] = useState<number>(5);

  // Admin Credentials and login states
  const [adminUsername, setAdminUsername] = useState<string>('narongrit');
  const [adminPassword, setAdminPassword] = useState<string>('081144');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Auto-logout when switching back to customer view
  useEffect(() => {
    if (view === 'customer') {
      setIsAdminLoggedIn(false);
      setTotalViews(prev => prev + 1);
    }
  }, [view]);

  // บันทึกตะกร้าสินค้าชั่วคราวในเครื่องลูกค้า
  useEffect(() => {
    localStorage.setItem('croffle_cart_v8', JSON.stringify(cart));
  }, [cart]);

  // 🚀 1. ดึงข้อมูลทั้งหมดจาก Supabase เมื่อเปิดเว็บ (พร้อมระบบเติมข้อมูลเริ่มต้นอัตโนมัติ)
  useEffect(() => {
    const fetchDatabase = async () => {
      // 1.1 ดึงเมนูอาหาร
      const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
      if (prodData && prodData.length > 0) {
        setProducts(prodData);
      } else if (!prodErr) {
        // ถ้าตารางว่างเปล่า ให้เติมข้อมูลเริ่มต้นจาก INITIAL_PRODUCTS ลง Database ทันที
        await supabase.from('products').insert(INITIAL_PRODUCTS);
        setProducts(INITIAL_PRODUCTS);
      }

      // 1.2 ดึงสต็อกวัตถุดิบ
      const { data: invData, error: invErr } = await supabase.from('inventory').select('*');
      if (invData && invData.length > 0) {
        setInventory(invData);
      } else if (!invErr) {
        await supabase.from('inventory').insert(INITIAL_INVENTORY);
        setInventory(INITIAL_INVENTORY);
      }

      // 1.3 ดึงรายการออเดอร์ทั้งหมด
      const { data: orderData } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
      if (orderData) {
        setOrders(orderData);
      }

      // 1.4 ดึงสถานะเปิด-ปิดร้าน
      const { data: configData } = await supabase.from('shop_config').select('*').eq('id', 1).single();
      if (configData) {
        setShopConfig({
          isOpen: configData.isOpen,
          autoSchedule: configData.autoSchedule,
          openTime: configData.openTime || "08:00",
          closeTime: configData.closeTime || "20:00"
        });
      }
    };

    fetchDatabase();

    // 📡 2. เปิดระบบ Real-time คอยดักจับเมื่อมีออเดอร์ใหม่เข้ามาจากลูกค้า
    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
        // เมื่อมีข้อมูลเปลี่ยนแปลง ให้ดึงออเดอร์อัปเดตล่าสุดมาแสดงผลบนจอทันที
        const { data } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
        if (data) {
          setOrders(data);
          if (payload.eventType === 'INSERT') {
            alert("🔔 แจ้งเตือน: มีออเดอร์ใหม่เข้าครับ! กรุณาเช็คคิวในหน้าแอดมิน");
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, []);

  // Time-based check tick สำหรับเวลาเปิด-ปิดอัตโนมัติ
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

  // 📝 ฟังก์ชันลูกค้ากดสั่งซื้อ -> ส่งข้อมูลขึ้นเซิร์ฟเวอร์ Supabase จริง
  const handlePlaceOrder = async (customerName: string, phone: string, roomNo: string, note: string) => {
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
      note: note.trim() || undefined
    };

    // ส่งข้อมูลไปบันทึกลงฐานข้อมูล
    const { error } = await supabase.from('orders').insert([newOrder]);

    if (error) {
      alert("⚠️ เกิดข้อผิดพลาดในการส่งออเดอร์ กรุณาลองใหม่อีกครั้งครับ");
      console.error(error);
    } else {
      setCart([]);
      // สต็อกนมกับแป้งจะถูกอัปเดตผ่านฟังก์ชันฝั่งแอดมิน
    }
  };

  const handleUpdateAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
    alert("เปลี่ยนรหัสผ่านสำเร็จแล้วครับ!");
  };

  const handleResetDefaults = async () => {
    if (confirm("คุณต้องการล้างข้อมูลออเดอร์และรีเซ็ตเมนูกลับเป็นค่าเริ่มต้นใช่หรือไม่?")) {
      await supabase.from('orders').delete().neq('id', '0');
      await supabase.from('products').delete().neq('id', '0');
      await supabase.from('inventory').delete().neq('id', '0');
      
      await supabase.from('products').insert(INITIAL_PRODUCTS);
      await supabase.from('inventory').insert(INITIAL_INVENTORY);
      
      setProducts(INITIAL_PRODUCTS);
      setInventory(INITIAL_INVENTORY);
      setOrders([]);
      alert("รีเซ็ตระบบกลับสู่ค่าเริ่มต้นเรียบร้อยแล้วครับ!");
    }
  };

  // Wrapper สำหรับอัปเดต Products ลง Database
  const handleSetProducts: React.Dispatch<React.SetStateAction<Product[]>> = (val) => {
    setProducts(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      // อัปเดตข้อมูลขึ้น Database
      next.forEach(async (p) => {
        await supabase.from('products').upsert(p);
      });
      return next;
    });
  };

  // Wrapper สำหรับอัปเดต Orders ลง Database
  const handleSetOrders: React.Dispatch<React.SetStateAction<Order[]>> = (val) => {
    setOrders(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      next.forEach(async (o) => {
        await supabase.from('orders').upsert(o);
      });
      return next;
    });
  };

  // Wrapper สำหรับอัปเดต Inventory ลง Database
  const handleSetInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>> = (val) => {
    setInventory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      next.forEach(async (inv) => {
        await supabase.from('inventory').upsert(inv);
      });
      return next;
    });
  };

  // Wrapper สำหรับอัปเดต ShopConfig ลง Database
  const handleSetShopConfig: React.Dispatch<React.SetStateAction<ShopConfig>> = (val) => {
    setShopConfig(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      supabase.from('shop_config').update({
        isOpen: next.isOpen,
        autoSchedule: next.autoSchedule,
        openTime: next.openTime,
        closeTime: next.closeTime
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
          setProducts={handleSetProducts}
          orders={orders}
          setOrders={handleSetOrders}
          inventory={inventory}
          setInventory={handleSetInventory}
          onSwitchToCustomer={() => setView('customer')}
          onResetDefaults={handleResetDefaults}
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