
import React, { useState, useEffect } from 'react';
import { User, AdminSettings, Order, MedicinePrice } from './types';
import Login from './components/Login';
import UserPanel from './components/UserPanel';
import AdminDashboard from './components/AdminDashboard';
import { THEMES } from './constants';

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  homeHeaderBanner: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&h=300&q=80",
  homeFooterBanner: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&h=400&q=80",
  footerBannerText: "রিমন মাহমুদ রোমান, মোবাইল : 01617365471, ইমেইল: romantechgp@gmail.com",
  prescriptionHeader: "Medi Help Digital Medical Services",
  prescriptionFooter: "এটা একটি এআই দ্বারা জেনারেট প্রাথমিক ধারণা, তাই যেকোনো প্রয়োজনে ডাক্তারের সঙ্গে যোগাযোগ করুন",
  prescriptionTheme: "Standard",
  digitalSignature: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Signature_of_John_Hancock.png",
  welcomeBanner: {
    text: "সুস্বাগতম! আমরা আপনার সুস্বাস্থ্য কামনায় সর্বদা নিয়োজিত। আপনার যেকোনো সমস্যায় আমরা পাশে আছি।",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&h=400&q=80"
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [priceList, setPriceList] = useState<MedicinePrice[]>([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('mh_users');
    if (savedUsers) setUsers(JSON.parse(savedUsers));

    const savedSettings = localStorage.getItem('mh_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setAdminSettings({ ...DEFAULT_ADMIN_SETTINGS, ...parsed });
    }

    const savedOrders = localStorage.getItem('mh_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    const savedPrices = localStorage.getItem('mh_prices');
    if (savedPrices) setPriceList(JSON.parse(savedPrices));
  }, []);

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('mh_users', JSON.stringify(newUsers));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
  };

  if (!currentUser && !isAdmin) {
    return (
      <Login 
        users={users} 
        onLogin={(user) => {
          if (user.id === '2' && user.password === '2') {
            setIsAdmin(true);
          } else {
            setCurrentUser(user);
          }
        }} 
        onRegister={(user) => {
          saveUsers([...users, user]);
          setCurrentUser(user);
        }}
      />
    );
  }

  const currentTheme = THEMES[currentUser?.themeIndex || 0];

  return (
    <div className={`min-h-screen transition-all duration-700 animate-mesh bg-gradient-to-br ${isAdmin ? 'from-slate-800 to-slate-950' : currentTheme.class}`}>
      {isAdmin ? (
        <AdminDashboard 
          users={users}
          orders={orders}
          settings={adminSettings}
          priceList={priceList}
          setSettings={(s) => {
            setAdminSettings(s);
            localStorage.setItem('mh_settings', JSON.stringify(s));
          }}
          setPriceList={(p) => {
            setPriceList(p);
            localStorage.setItem('mh_prices', JSON.stringify(p));
          }}
          setOrders={(o) => {
            setOrders(o);
            localStorage.setItem('mh_orders', JSON.stringify(o));
          }}
          onLogout={handleLogout}
        />
      ) : (
        <UserPanel 
          user={currentUser!} 
          settings={adminSettings}
          priceList={priceList}
          orders={orders.filter(o => o.userId === currentUser?.id)}
          onUpdateUser={(updated, oldId) => {
            const targetId = oldId || updated.id;
            
            // Uniqueness check for ID change
            if (oldId && oldId !== updated.id) {
              const exists = users.find(u => u.id === updated.id);
              if (exists) {
                alert("এই ইউজার আইডিটি ইতিমধ্যে ব্যবহৃত হচ্ছে। অনুগ্রহ করে অন্য আইডি চেষ্টা করুন।");
                return;
              }
            }

            const newUsers = users.map(u => u.id === targetId ? updated : u);
            saveUsers(newUsers);
            setCurrentUser(updated);

            // Update orders if ID changed
            if (oldId && oldId !== updated.id) {
              const newOrders = orders.map(o => o.userId === oldId ? { ...o, userId: updated.id } : o);
              setOrders(newOrders);
              localStorage.setItem('mh_orders', JSON.stringify(newOrders));
            }
          }}
          onPlaceOrder={(order) => {
            const newOrders = [...orders, order];
            setOrders(newOrders);
            localStorage.setItem('mh_orders', JSON.stringify(newOrders));
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
