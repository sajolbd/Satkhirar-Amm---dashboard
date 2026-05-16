"use client";

import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Edit3,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  PackagePlus,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

import { apiRequest, getApiError } from "../lib/api";

type ProductStatus = "স্টক আছে" | "স্টক কম" | "বন্ধ";

type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  sales: number;
  status: ProductStatus;
  color: string;
  image?: string;
  variety?: string;
  discountLabel?: string;
  shortNote?: string;
  isActive?: boolean;
  isFeatured?: boolean;
};

type ProductForm = Omit<Product, "id" | "sales">;

type Customer = {
  id: string;
  name: string;
  phone: string;
  district: string;
  orders: number;
  spent: number;
  status: "নিয়মিত" | "নতুন" | "ঝুঁকিপূর্ণ";
};

type Order = {
  id: string;
  customer: string;
  product: string;
  amount: number;
  payment: string;
  status: "কনফার্মড" | "প্রসেসিং" | "ডেলিভারিতে" | "সম্পন্ন";
  date: string;
};

type WebsiteOrder = {
  id: string;
  source: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    district: string;
    area: string;
    address: string;
    note?: string;
  };
  items: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
  payment: {
    method: string;
    paymentPhone?: string;
    transactionId?: string;
  };
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: string;
  date: string;
};

const DASHBOARD_ORDERS_STORAGE_KEY = "satkhirar-amm-dashboard-orders";
const DASHBOARD_USERS_STORAGE_KEY = "satkhirar-amm-dashboard-users";
const ADMIN_SESSION_STORAGE_KEY = "satkhirar-amm-dashboard-admin";

type WebsiteUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  joinedAt: string;
};

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin";
};

type AdminSession = {
  token: string;
  admin: AdminProfile;
};

const initialProducts: Product[] = [
  {
    id: "SA-M-101",
    name: "হিমসাগর আম",
    category: "আম",
    unit: "প্রতি ৫ কেজি বক্স",
    price: 1150,
    stock: 84,
    sales: 312,
    status: "স্টক আছে",
    color: "from-orange-300 to-amber-500",
  },
  {
    id: "SA-M-102",
    name: "ল্যাংড়া আম",
    category: "আম",
    unit: "প্রতি ৫ কেজি বক্স",
    price: 1250,
    stock: 42,
    sales: 276,
    status: "স্টক আছে",
    color: "from-lime-300 to-emerald-500",
  },
  {
    id: "SA-M-103",
    name: "আম্রপালি আম",
    category: "আম",
    unit: "প্রতি ৫ কেজি বক্স",
    price: 1350,
    stock: 18,
    sales: 198,
    status: "স্টক কম",
    color: "from-yellow-300 to-orange-500",
  },
  {
    id: "SA-G-201",
    name: "খেজুরের গুড়",
    category: "গুড়",
    unit: "প্রতি ১ কেজি প্যাক",
    price: 420,
    stock: 95,
    sales: 144,
    status: "স্টক আছে",
    color: "from-amber-700 to-orange-900",
  },
  {
    id: "SA-P-301",
    name: "আমের আচার",
    category: "আচার",
    unit: "প্রতি ৫০০ গ্রাম জার",
    price: 280,
    stock: 8,
    sales: 96,
    status: "স্টক কম",
    color: "from-red-300 to-orange-500",
  },
];

const customers: Customer[] = [
  {
    id: "CUS-001",
    name: "সাবিহা রহমান",
    phone: "০১৭১২৩৪৫৬৭৮",
    district: "ঢাকা",
    orders: 12,
    spent: 18400,
    status: "নিয়মিত",
  },
  {
    id: "CUS-002",
    name: "মাহমুদ হাসান",
    phone: "০১৯৯৮৭৬৫৪৩২",
    district: "চট্টগ্রাম",
    orders: 7,
    spent: 10650,
    status: "নিয়মিত",
  },
  {
    id: "CUS-003",
    name: "নুসরাত জাহান",
    phone: "০১৮৩৩৩৩২২১১",
    district: "খুলনা",
    orders: 2,
    spent: 2450,
    status: "নতুন",
  },
  {
    id: "CUS-004",
    name: "রায়হান করিম",
    phone: "০১৬৫৫৫৫৪৪৪৪",
    district: "সাতক্ষীরা",
    orders: 1,
    spent: 1150,
    status: "ঝুঁকিপূর্ণ",
  },
];

const orders: Order[] = [
  {
    id: "ORD-5021",
    customer: "সাবিহা রহমান",
    product: "হিমসাগর আম",
    amount: 3450,
    payment: "বিকাশ",
    status: "কনফার্মড",
    date: "০৯ মে ২০২৬",
  },
  {
    id: "ORD-5020",
    customer: "মাহমুদ হাসান",
    product: "ল্যাংড়া আম",
    amount: 2500,
    payment: "ক্যাশ অন ডেলিভারি",
    status: "ডেলিভারিতে",
    date: "০৯ মে ২০২৬",
  },
  {
    id: "ORD-5019",
    customer: "নুসরাত জাহান",
    product: "আমের আচার",
    amount: 840,
    payment: "নগদ",
    status: "প্রসেসিং",
    date: "০৮ মে ২০২৬",
  },
  {
    id: "ORD-5018",
    customer: "রাশেদুল ইসলাম",
    product: "খেজুরের গুড়",
    amount: 1680,
    payment: "রকেট",
    status: "সম্পন্ন",
    date: "০৮ মে ২০২৬",
  },
];

const revenueData = [
  { label: "রবি", value: 54000 },
  { label: "সোম", value: 78000 },
  { label: "মঙ্গল", value: 62000 },
  { label: "বুধ", value: 92000 },
  { label: "বৃহঃ", value: 106000 },
  { label: "শুক্র", value: 131000 },
  { label: "শনি", value: 118000 },
];

const emptyProductForm: ProductForm = {
  name: "",
  category: "আম",
  unit: "প্রতি ৫ কেজি বক্স",
  price: 0,
  stock: 0,
  status: "স্টক আছে",
  color: "from-orange-300 to-amber-500",
  image: "",
};

const menuItems = [
  { id: "overview", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "website-orders", label: "ওয়েবসাইট অর্ডার", icon: ClipboardList },
  { id: "signup-users", label: "সাইন আপ ইউজার", icon: Users },
  { id: "orders", label: "অর্ডার ম্যানেজমেন্ট", icon: ShoppingBag },
  { id: "products", label: "পণ্য তালিকা", icon: Boxes },
  { id: "customers", label: "গ্রাহক তালিকা", icon: Users },
  { id: "payments", label: "পেমেন্ট রিপোর্ট", icon: CreditCard },
  { id: "analytics", label: "অ্যানালিটিক্স", icon: BarChart3 },
  { id: "settings", label: "সেটিংস", icon: Settings },
] as const;

type MenuId = (typeof menuItems)[number]["id"];

export default function DashboardPage() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminLoginForm, setAdminLoginForm] = useState({
    email: "",
    password: "",
  });
  const [adminLoginError, setAdminLoginError] = useState("");
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuId>("overview");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [websiteOrders, setWebsiteOrders] = useState<WebsiteOrder[]>([]);
  const [websiteUsers, setWebsiteUsers] = useState<WebsiteUser[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);

  const totalSales = products.reduce((total, product) => total + product.sales, 0);
  const totalStock = products.reduce((total, product) => total + product.stock, 0);
  const lowStockCount = products.filter((product) => product.status === "স্টক কম").length;
  const websiteOrderTotal = websiteOrders.reduce(
    (total, order) => total + order.total,
    0
  );
  const totalRevenue =
    orders.reduce((total, order) => total + order.amount, 0) + websiteOrderTotal;

  useEffect(() => {
    const storedSession = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

    if (storedSession) {
      setAdminSession(JSON.parse(storedSession));
    }

    setIsAuthChecking(false);
  }, []);

  useEffect(() => {
    if (!adminSession) return;

    const loadProducts = async () => {
      try {
        const nextProducts = await apiRequest<Product[]>("/api/products");

        if (nextProducts.length > 0) {
          setProducts(nextProducts);
        }
      } catch {
        // keep seeded dashboard products as a local fallback
      }
    };

    void loadProducts();
  }, [adminSession]);

  useEffect(() => {
    if (!adminSession) return;

    const loadWebsiteOrders = async () => {
      try {
        const orders = await apiRequest<WebsiteOrder[]>("/api/orders");
        setWebsiteOrders(orders);
        window.localStorage.setItem(
          DASHBOARD_ORDERS_STORAGE_KEY,
          JSON.stringify(orders)
        );
        return;
      } catch {
        // local fallback
      }

      const ordersRaw = window.localStorage.getItem(DASHBOARD_ORDERS_STORAGE_KEY);
      setWebsiteOrders(ordersRaw ? JSON.parse(ordersRaw) : []);
    };

    void loadWebsiteOrders();
    const refreshTimer = window.setInterval(loadWebsiteOrders, 5000);
    const handleStorage = () => void loadWebsiteOrders();

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("storage", handleStorage);
    };
  }, [adminSession]);

  useEffect(() => {
    if (!adminSession) return;

    const loadWebsiteUsers = async () => {
      try {
        const users = await apiRequest<WebsiteUser[]>("/api/users");
        setWebsiteUsers(users);
        window.localStorage.setItem(
          DASHBOARD_USERS_STORAGE_KEY,
          JSON.stringify(users)
        );
        return;
      } catch {
        // local fallback
      }

      const usersRaw = window.localStorage.getItem(DASHBOARD_USERS_STORAGE_KEY);
      setWebsiteUsers(usersRaw ? JSON.parse(usersRaw) : []);
    };

    void loadWebsiteUsers();
    const refreshTimer = window.setInterval(loadWebsiteUsers, 5000);
    const handleStorage = () => void loadWebsiteUsers();

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("storage", handleStorage);
    };
  }, [adminSession]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      `${product.name} ${product.category} ${product.id}`.toLowerCase().includes(query)
    );
  }, [productSearch, products]);

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setIsProductFormOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price,
      stock: product.stock,
      status: product.status,
      color: product.color,
      image: product.image ?? "",
    });
    setIsProductFormOpen(true);
  };

  const updateProductForm = <Key extends keyof ProductForm>(
    key: Key,
    value: ProductForm[Key]
  ) => {
    setProductForm((current) => ({ ...current, [key]: value }));
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const savedProduct = await apiRequest<Product>(
        editingProduct ? `/api/products/${editingProduct.id}` : "/api/products",
        {
          method: editingProduct ? "PUT" : "POST",
          body: JSON.stringify(productForm),
        }
      );

      setProducts((current) =>
        editingProduct
          ? current.map((product) =>
              product.id === editingProduct.id ? savedProduct : product
            )
          : [savedProduct, ...current]
      );

      setIsProductFormOpen(false);
    } catch (error) {
      window.alert(getApiError(error, "Product save failed."));
    }
  };

  const handleProductImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateProductForm("image", String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleMenuClick = (menuId: MenuId) => {
    setActiveMenu(menuId);
    document.getElementById(menuId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const updateWebsiteOrderStatus = (orderId: string, status: string) => {
    setWebsiteOrders((current) => {
      const nextOrders = current.map((order) =>
        order.id === orderId ? { ...order, status } : order
      );

      window.localStorage.setItem(
        DASHBOARD_ORDERS_STORAGE_KEY,
        JSON.stringify(nextOrders)
      );

      return nextOrders;
    });

    void apiRequest<WebsiteOrder>(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
      .then((updatedOrder) => {
        setWebsiteOrders((current) =>
          current.map((order) => (order.id === orderId ? updatedOrder : order))
        );
      })
      .catch(() => undefined);
  };

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAdminLoggingIn(true);
    setAdminLoginError("");

    try {
      const session = await apiRequest<AdminSession>("/api/auth/admin/login", {
        method: "POST",
        body: JSON.stringify(adminLoginForm),
      });

      window.sessionStorage.setItem(
        ADMIN_SESSION_STORAGE_KEY,
        JSON.stringify(session)
      );
      setAdminSession(session);
      setAdminLoginForm({ email: "", password: "" });
    } catch (error) {
      setAdminLoginError(getApiError(error, "Admin login failed."));
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    setAdminSession(null);
  };

  if (isAuthChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf6] text-[#7c2d12]">
        <div className="rounded-2xl border border-[#fed7aa] bg-white px-5 py-4 text-sm font-bold shadow-soft">
          Loading dashboard
        </div>
      </main>
    );
  }

  if (!adminSession) {
    return (
      <AdminLoginPage
        form={adminLoginForm}
        error={adminLoginError}
        isSubmitting={isAdminLoggingIn}
        onSubmit={handleAdminLogin}
        onChange={(field, value) =>
          setAdminLoginForm((current) => ({ ...current, [field]: value }))
        }
      />
    );
  }

  const admin = adminSession.admin;

  return (
    <main className="min-h-screen bg-[#fffaf6]">
      <div className="grid min-h-screen lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="border-r border-[#fed7aa] bg-white px-5 py-5 lg:sticky lg:top-0 lg:h-screen">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-[#7c2d12]">
                সাতক্ষীরার আম
              </h1>
              <p className="text-xs font-semibold text-[#9a3412]">
                অ্যাডমিন ড্যাশবোর্ড
              </p>
            </div>
          </div>

          <nav className="mt-8 grid gap-2">
            {menuItems.map((item) => {
              const MenuIcon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMenuClick(item.id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeMenu === item.id
                      ? "bg-primary text-white shadow-soft"
                      : "text-[#7c2d12] hover:bg-[#fff7f1]"
                  }`}
                >
                  <MenuIcon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-[#fed7aa] bg-[#fff7f1] p-4">
            <p className="text-sm font-bold text-[#7c2d12]">আজকের কাজ</p>
            <p className="mt-2 text-sm leading-6 text-[#9a3412]">
              স্টক কম থাকা পণ্য রিভিউ করুন এবং নতুন অর্ডারগুলো ফোনে কনফার্ম করুন।
            </p>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">
                ই-কমার্স অপারেশন
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#7c2d12] sm:text-3xl">
                বিক্রি, অর্ডার, পণ্য ও গ্রাহক এক জায়গায়
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openAddProduct}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ea580c]"
              >
                <Plus className="h-4 w-4" />
                নতুন পণ্য
              </button>
              <button
                type="button"
                onClick={() => handleMenuClick("analytics")}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-5 py-3 text-sm font-semibold text-[#7c2d12]"
              >
                <BarChart3 className="h-4 w-4" />
                রিপোর্ট দেখুন
              </button>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-4 py-3 text-sm font-semibold text-[#7c2d12]">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {admin.name}
              </div>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#fed7aa] bg-white px-4 py-3 text-sm font-semibold text-[#7c2d12] transition hover:border-primary hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </header>

          <section id="overview" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="আজকের বিক্রি"
              value={`${toBanglaNumber(totalRevenue)} টাকা`}
              note="গতকালের চেয়ে ১৮% বেশি"
              icon={<CreditCard className="h-5 w-5" />}
            />
            <MetricCard
              title="মোট অর্ডার"
              value={toBanglaNumber(orders.length + websiteOrders.length)}
              note={`${toBanglaNumber(websiteOrders.length)}টি ওয়েবসাইট অর্ডার`}
              icon={<ShoppingBag className="h-5 w-5" />}
            />
            <MetricCard
              title="পণ্য বিক্রি"
              value={toBanglaNumber(totalSales)}
              note="এই মৌসুমে মোট বক্স"
              icon={<PackagePlus className="h-5 w-5" />}
            />
            <MetricCard
              title="সাইন আপ ইউজার"
              value={toBanglaNumber(websiteUsers.length)}
              note="ওয়েবসাইট থেকে রেজিস্ট্রেশন"
              icon={<Users className="h-5 w-5" />}
            />
          </section>

          <section
            id="analytics"
            className="mt-6 scroll-mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]"
          >
            <Panel title="বিক্রির গ্রাফ" action="সাপ্তাহিক">
              <AreaChart data={revenueData} />
            </Panel>

            <Panel title="অর্ডার স্ট্যাটাস" action="লাইভ">
              <div className="grid gap-5 sm:grid-cols-[150px_1fr] xl:grid-cols-1 2xl:grid-cols-[150px_1fr]">
                <StatusDonut />
                <div className="space-y-3">
                  {[
                    ["কনফার্মড", 38, "bg-[#16a34a]"],
                    ["প্রসেসিং", 26, "bg-[#f97316]"],
                    ["ডেলিভারিতে", 22, "bg-[#0ea5e9]"],
                    ["সম্পন্ন", 14, "bg-[#7c2d12]"],
                  ].map(([label, value, color]) => (
                    <div key={String(label)}>
                      <div className="mb-1 flex items-center justify-between text-sm font-semibold text-[#7c2d12]">
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                          {String(label)}
                        </span>
                        <span>{toBanglaNumber(Number(value))}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#fff1e8]">
                        <div
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: `${Number(value)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </section>

          <section id="website-orders" className="mt-6 scroll-mt-6">
            <Panel
              title="ওয়েবসাইট থেকে আসা অর্ডার"
              action={`${toBanglaNumber(websiteOrders.length)}টি নতুন`}
            >
              {websiteOrders.length > 0 ? (
                <div className="space-y-4">
                  {websiteOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-[#7c2d12]">
                              {order.id}
                            </h3>
                            <StatusBadge label={order.status} />
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary">
                              {order.date}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[#7c2d12]">
                            {order.customer.name} · {order.customer.phone}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#9a3412]">
                            {order.customer.area}, {order.customer.district} ·{" "}
                            {order.customer.address}
                          </p>

                          <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {order.items.map((item) => (
                              <div
                                key={`${order.id}-${item.id}`}
                                className="flex gap-3 rounded-2xl bg-white p-3"
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-12 w-12 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-xl bg-[#fff1e8]" />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#7c2d12]">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-[#9a3412]">
                                    {toBanglaNumber(item.quantity)} x{" "}
                                    {toBanglaNumber(item.price)} টাকা
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-sm font-semibold text-[#9a3412]">
                            পেমেন্ট
                          </p>
                          <p className="mt-1 font-bold text-[#7c2d12]">
                            {order.payment.method}
                          </p>
                          {order.payment.transactionId && (
                            <p className="mt-1 text-xs text-[#9a3412]">
                              Txn: {order.payment.transactionId}
                            </p>
                          )}
                          <div className="my-4 border-t border-[#ffedd5]" />
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#9a3412]">পণ্য</span>
                              <span className="font-semibold text-[#7c2d12]">
                                {toBanglaNumber(order.subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#9a3412]">ডেলিভারি</span>
                              <span className="font-semibold text-[#7c2d12]">
                                {toBanglaNumber(order.deliveryCharge)}
                              </span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-[#7c2d12]">
                              <span>মোট</span>
                              <span>{toBanglaNumber(order.total)} টাকা</span>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateWebsiteOrderStatus(order.id, "প্রসেসিং")
                              }
                              className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
                            >
                              প্রসেসিং করুন
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateWebsiteOrderStatus(order.id, "ডেলিভারিতে")
                              }
                              className="rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-4 py-2.5 text-sm font-semibold text-[#7c2d12]"
                            >
                              ডেলিভারিতে দিন
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#fed7aa] bg-[#fffaf6] px-5 py-8 text-center">
                  <ClipboardList className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-3 text-lg font-bold text-[#7c2d12]">
                    এখনো ওয়েবসাইট অর্ডার আসেনি
                  </h3>
                  <p className="mt-2 text-sm text-[#9a3412]">
                    ওয়েবসাইট থেকে অর্ডার সাবমিট হলে এখানে দেখা যাবে।
                  </p>
                </div>
              )}
            </Panel>
          </section>

          <section id="signup-users" className="mt-6 scroll-mt-6">
            <Panel
              title="ওয়েবসাইট সাইন আপ ইউজার"
              action={`${toBanglaNumber(websiteUsers.length)} জন`}
            >
              {websiteUsers.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {websiteUsers.map((user) => (
                    <div
                      key={user.email}
                      className="rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[#7c2d12]">
                            {user.name}
                          </h3>
                          <p className="mt-1 text-sm text-[#9a3412]">
                            {user.phone}
                          </p>
                        </div>
                        <StatusBadge label={user.status || "নতুন"} />
                      </div>
                      <div className="mt-4 space-y-2 rounded-2xl bg-white p-3 text-sm">
                        <p className="font-semibold text-[#7c2d12]">
                          {user.email}
                        </p>
                        <p className="text-[#9a3412]">
                          যোগ দিয়েছেন: {user.joinedAt}
                        </p>
                        <p className="text-xs font-bold text-primary">
                          Source: Website Signup
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#fed7aa] bg-[#fffaf6] px-5 py-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-3 text-lg font-bold text-[#7c2d12]">
                    এখনো কোনো সাইন আপ ইউজার নেই
                  </h3>
                  <p className="mt-2 text-sm text-[#9a3412]">
                    ওয়েবসাইটে কেউ সাইন আপ করলে এখানে দেখা যাবে।
                  </p>
                </div>
              )}
            </Panel>
          </section>

          <section
            id="orders"
            className="mt-6 scroll-mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]"
          >
            <Panel title="পণ্যভিত্তিক বিক্রি" action="টপ পণ্য">
              <BarGraph products={products.slice(0, 5)} />
            </Panel>

            <Panel title="সাম্প্রতিক অর্ডার" action="সব দেখুন">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-[#9a3412]">
                    <tr>
                      <th className="pb-3 font-semibold">অর্ডার</th>
                      <th className="pb-3 font-semibold">গ্রাহক</th>
                      <th className="pb-3 font-semibold">পেমেন্ট</th>
                      <th className="pb-3 font-semibold">স্ট্যাটাস</th>
                      <th className="pb-3 text-right font-semibold">বিল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ffedd5]">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-3 font-semibold text-[#7c2d12]">
                          {order.id}
                          <p className="text-xs font-normal text-[#9a3412]">
                            {order.date}
                          </p>
                        </td>
                        <td className="py-3 text-[#7c2d12]">{order.customer}</td>
                        <td className="py-3 text-[#9a3412]">{order.payment}</td>
                        <td className="py-3">
                          <StatusBadge label={order.status} />
                        </td>
                        <td className="py-3 text-right font-bold text-[#7c2d12]">
                          {toBanglaNumber(order.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
            <div id="products" className="scroll-mt-6">
            <Panel
              title="পণ্য তালিকা"
              action={`${toBanglaNumber(filteredProducts.length)} পণ্য`}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-[#fed7aa] bg-[#fffaf6] px-4">
                  <Search className="h-4 w-4 text-primary" />
                  <input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="পণ্য খুঁজুন"
                    className="h-full w-full bg-transparent text-sm text-[#7c2d12] outline-none placeholder:text-[#c2410c]/70"
                  />
                </div>
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  যোগ করুন
                </button>
              </div>

              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="grid gap-3 rounded-2xl border border-[#fed7aa] bg-white p-3 sm:grid-cols-[58px_1fr_auto] sm:items-center"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div
                        className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${product.color}`}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#7c2d12]">{product.name}</h3>
                        <StatusBadge label={product.status} />
                      </div>
                      <p className="mt-1 text-sm text-[#9a3412]">
                        {product.id} · {product.category} · {product.unit}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-primary">
                        {toBanglaNumber(product.price)} টাকা · স্টক{" "}
                        {toBanglaNumber(product.stock)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditProduct(product)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-4 py-2 text-sm font-semibold text-[#7c2d12]"
                    >
                      <Edit3 className="h-4 w-4" />
                      এডিট
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
            </div>

            <div id="customers" className="scroll-mt-6">
            <Panel title="গ্রাহক তালিকা" action="সেগমেন্ট">
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="rounded-2xl border border-[#fed7aa] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#7c2d12]">
                          {customer.name}
                        </h3>
                        <p className="mt-1 text-sm text-[#9a3412]">
                          {customer.phone} · {customer.district}
                        </p>
                      </div>
                      <StatusBadge label={customer.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-[#fff7f1] px-3 py-2">
                        <p className="text-[#9a3412]">অর্ডার</p>
                        <p className="font-bold text-[#7c2d12]">
                          {toBanglaNumber(customer.orders)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#fff7f1] px-3 py-2">
                        <p className="text-[#9a3412]">মোট ক্রয়</p>
                        <p className="font-bold text-[#7c2d12]">
                          {toBanglaNumber(customer.spent)} টাকা
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            </div>
          </section>

          <section
            id="payments"
            className="mt-6 scroll-mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
          >
            <Panel title="পেমেন্ট রিপোর্ট" action="আজ">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["বিকাশ", 3450, "কনফার্মড"],
                  ["নগদ", 840, "প্রসেসিং"],
                  ["রকেট", 1680, "সম্পন্ন"],
                  ["ক্যাশ অন ডেলিভারি", 2500, "ডেলিভারিতে"],
                ].map(([method, amount, status]) => (
                  <div
                    key={String(method)}
                    className="rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-4"
                  >
                    <p className="text-sm font-semibold text-[#9a3412]">
                      {String(method)}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-[#7c2d12]">
                      {toBanglaNumber(Number(amount))} টাকা
                    </h3>
                    <div className="mt-3">
                      <StatusBadge label={String(status)} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="ডেলিভারি ও পেমেন্ট সেটআপ" action="দ্রুত সেটিংস">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["ডেলিভারি চার্জ", "ঢাকা ১২০ টাকা, বাইরে ১৫০ টাকা"],
                  ["মার্চেন্ট নম্বর", "০১৭৭৯০২৪০৪৮"],
                  ["COD", "চালু আছে"],
                  ["পেমেন্ট লিংক", "SSLCommerz / Card link"],
                ].map(([title, value]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-[#fed7aa] bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-[#9a3412]">
                      {title}
                    </p>
                    <p className="mt-2 font-bold text-[#7c2d12]">{value}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section id="settings" className="mt-6 scroll-mt-6">
            <Panel title="সেটিংস" action="স্টোর">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["স্টোর নাম", "সাতক্ষীরার আম"],
                  ["সাপোর্ট নম্বর", "+৮৮০১৭৭৯০২৪০৪৮"],
                  ["অর্ডার নোটিফিকেশন", "SMS / WhatsApp চালু"],
                ].map(([title, value]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-4"
                  >
                    <p className="text-sm font-semibold text-[#9a3412]">
                      {title}
                    </p>
                    <p className="mt-2 font-bold text-[#7c2d12]">{value}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </section>
      </div>

      {isProductFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#2d1204]/50 px-4 py-6">
          <form
            onSubmit={saveProduct}
            className="max-h-[calc(100vh-3rem)] w-full max-w-[620px] overflow-y-auto rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-[0_30px_90px_rgba(45,18,4,0.25)] sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">
                  পণ্য ম্যানেজমেন্ট
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#7c2d12]">
                  {editingProduct ? "পণ্য এডিট করুন" : "নতুন পণ্য যোগ করুন"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProductFormOpen(false)}
                className="rounded-full border border-[#fed7aa] bg-[#fff7f1] p-2 text-[#7c2d12]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="পণ্যের নাম">
                <input
                  required
                  value={productForm.name}
                  onChange={(event) => updateProductForm("name", event.target.value)}
                  className="field"
                  placeholder="যেমন: হিমসাগর আম"
                />
              </Field>
              <Field label="ক্যাটাগরি">
                <select
                  value={productForm.category}
                  onChange={(event) =>
                    updateProductForm("category", event.target.value)
                  }
                  className="field"
                >
                  <option>আম</option>
                  <option>গুড়</option>
                  <option>চারা</option>
                  <option>আচার</option>
                  <option>তেল</option>
                  <option>মধু</option>
                </select>
              </Field>
              <Field label="ইউনিট">
                <input
                  required
                  value={productForm.unit}
                  onChange={(event) => updateProductForm("unit", event.target.value)}
                  className="field"
                />
              </Field>
              <Field label="দাম">
                <input
                  required
                  type="number"
                  min={0}
                  value={productForm.price}
                  onChange={(event) =>
                    updateProductForm("price", Number(event.target.value))
                  }
                  className="field"
                />
              </Field>
              <Field label="স্টক">
                <input
                  required
                  type="number"
                  min={0}
                  value={productForm.stock}
                  onChange={(event) =>
                    updateProductForm("stock", Number(event.target.value))
                  }
                  className="field"
                />
              </Field>
              <Field label="স্ট্যাটাস">
                <select
                  value={productForm.status}
                  onChange={(event) =>
                    updateProductForm("status", event.target.value as ProductStatus)
                  }
                  className="field"
                >
                  <option>স্টক আছে</option>
                  <option>স্টক কম</option>
                  <option>বন্ধ</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="পণ্যের ছবি">
                  <div className="grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
                    <div className="flex h-[130px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#fed7aa] bg-[#fffaf6]">
                      {productForm.image ? (
                        <img
                          src={productForm.image}
                          alt="পণ্যের ছবি"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-sm font-semibold text-[#9a3412]">
                          ছবি নেই
                        </div>
                      )}
                    </div>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-4 py-5 text-center text-[#7c2d12] transition hover:border-primary">
                      <ImagePlus className="h-7 w-7 text-primary" />
                      <span className="mt-2 text-sm font-bold">
                        ছবি আপলোড করুন
                      </span>
                      <span className="mt-1 text-xs text-[#9a3412]">
                        JPG, PNG অথবা WebP
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </Field>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsProductFormOpen(false)}
                className="rounded-2xl border border-[#fed7aa] bg-white px-5 py-3 font-semibold text-[#7c2d12]"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
              >
                <CheckCircle2 className="h-5 w-5" />
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function AdminLoginPage({
  form,
  error,
  isSubmitting,
  onSubmit,
  onChange,
}: {
  form: { email: string; password: string };
  error: string;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: "email" | "password", value: string) => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf6] px-4 py-8">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[440px] rounded-3xl border border-[#fed7aa] bg-white p-6 shadow-soft"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-primary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Admin Access</p>
            <h1 className="text-2xl font-bold text-[#7c2d12]">
              Dashboard Login
            </h1>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#7c2d12]">
              Email
            </span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              className="field"
              placeholder="admin@satkhiraramm.com"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#7c2d12]">
              Password
            </span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              className="field"
              placeholder="Admin password"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-[#fff1e8] px-4 py-3 text-sm font-semibold text-[#9a3412]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:bg-[#fdba74]"
        >
          <ShieldCheck className="h-5 w-5" />
          {isSubmitting ? "Signing in" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

function MetricCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-primary">
          {icon}
        </div>
        <span className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-bold text-[#166534]">
          লাইভ
        </span>
      </div>
      <p className="mt-5 text-sm font-semibold text-[#9a3412]">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-[#7c2d12]">{value}</h3>
      <p className="mt-2 text-sm text-[#9a3412]">{note}</p>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[#7c2d12]">{title}</h2>
        <span className="rounded-full bg-[#fff1e8] px-3 py-1 text-xs font-bold text-primary">
          {action}
        </span>
      </div>
      {children}
    </section>
  );
}

function AreaChart({ data }: { data: { label: string; value: number }[] }) {
  const width = 620;
  const height = 230;
  const padding = 28;
  const max = Math.max(...data.map((item) => item.value));
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (item.value / max) * (height - padding * 2);
    return { ...item, x, y };
  });
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${
    height - padding
  } Z`;

  return (
    <div className="overflow-hidden rounded-2xl bg-[#fffaf6] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((lineIndex) => {
          const y = padding + (lineIndex * (height - padding * 2)) / 3;
          return (
            <line
              key={lineIndex}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#fed7aa"
              strokeDasharray="6 7"
            />
          );
        })}
        <path d={area} fill="url(#revenueFill)" />
        <path d={line} fill="none" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="6" fill="#fff" stroke="#f97316" strokeWidth="4" />
            <text x={point.x} y={height - 7} textAnchor="middle" fontSize="15" fill="#9a3412">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function BarGraph({ products }: { products: Product[] }) {
  const max = Math.max(...products.map((product) => product.sales));

  return (
    <div className="grid h-[280px] grid-cols-5 items-end gap-3 rounded-2xl bg-[#fffaf6] p-4">
      {products.map((product) => (
        <div key={product.id} className="flex h-full flex-col justify-end gap-3">
          <div className="flex flex-1 items-end">
            <div
              className={`w-full rounded-t-2xl bg-gradient-to-t ${product.color} shadow-soft`}
              style={{ height: `${Math.max(18, (product.sales / max) * 100)}%` }}
            />
          </div>
          <div>
            <p className="truncate text-center text-xs font-bold text-[#7c2d12]">
              {product.name}
            </p>
            <p className="text-center text-xs text-[#9a3412]">
              {toBanglaNumber(product.sales)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusDonut() {
  return (
    <div className="mx-auto flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[conic-gradient(#16a34a_0_38%,#f97316_38%_64%,#0ea5e9_64%_86%,#7c2d12_86%_100%)]">
      <div className="flex h-[96px] w-[96px] flex-col items-center justify-center rounded-full bg-white text-center">
        <span className="text-2xl font-bold text-[#7c2d12]">১০০%</span>
        <span className="text-xs font-semibold text-[#9a3412]">অর্ডার</span>
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const tone =
    label === "স্টক আছে" || label === "কনফার্মড" || label === "নিয়মিত"
      ? "bg-[#dcfce7] text-[#166534]"
      : label === "স্টক কম" || label === "প্রসেসিং" || label === "নতুন"
        ? "bg-[#fff1e8] text-primary"
        : label === "বন্ধ" || label === "ঝুঁকিপূর্ণ"
          ? "bg-[#fee2e2] text-[#b91c1c]"
          : "bg-[#e0f2fe] text-[#0369a1]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
      {label}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#7c2d12]">
        {label}
      </span>
      {children}
    </label>
  );
}

function toBanglaNumber(value: number) {
  return value.toLocaleString("bn-BD");
}
