"use client";

import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Edit3,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageSquare,
  PackagePlus,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

import { apiRequest, getApiError } from "../lib/api";

type ProductStatus = "স্টক আছে" | "স্টক কম" | "শীঘ্রই আসছে" | "বন্ধ";

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

type ReviewStatus = "pending" | "published" | "hidden";

type ReviewMedia = {
  type: "image" | "video";
  url: string;
  name?: string;
  contentType?: string;
  size?: number;
};

type WebsiteReview = {
  id: string;
  name: string;
  phone?: string;
  location?: string;
  title?: string;
  message: string;
  rating: number;
  media?: ReviewMedia;
  status: ReviewStatus;
  source?: string;
  date?: string;
  createdAt?: string;
};

type ReviewForm = {
  name: string;
  phone: string;
  location: string;
  title: string;
  message: string;
  rating: number;
  status: ReviewStatus;
  media?: ReviewMedia | null;
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
    courierOffice?: string;
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

type WebsiteUser = {
  id: string;
  name: string;
  email?: string;
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

type MenuId = "overview" | "orders" | "users" | "reviews" | "products" | "analytics" | "settings";

const ADMIN_SESSION_STORAGE_KEY = "satkhirar-amm-dashboard-admin";
const DASHBOARD_ORDERS_STORAGE_KEY = "satkhirar-amm-dashboard-orders";
const DASHBOARD_USERS_STORAGE_KEY = "satkhirar-amm-dashboard-users";
const DASHBOARD_REVIEWS_STORAGE_KEY = "satkhirar-amm-dashboard-reviews";
const PHONE_AUTH_EMAIL_DOMAIN = "phone.satkhirar-amm.local";
const MAX_REVIEW_MEDIA_SIZE = 8 * 1024 * 1024;

const emptyProductForm: ProductForm = {
  name: "",
  category: "আম",
  unit: "প্রতি ৫ কেজি বক্স",
  price: 0,
  stock: 0,
  status: "স্টক আছে",
  color: "from-orange-300 to-amber-500",
  image: "",
  variety: "",
  discountLabel: "",
  shortNote: "",
  isActive: true,
  isFeatured: true,
};

const emptyReviewForm: ReviewForm = {
  name: "",
  phone: "",
  location: "",
  title: "",
  message: "",
  rating: 5,
  status: "published",
  media: undefined,
};

const menuItems: { id: MenuId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "ওভারভিউ", icon: LayoutDashboard },
  { id: "orders", label: "অর্ডার", icon: ClipboardList },
  { id: "users", label: "ইউজার", icon: Users },
  { id: "reviews", label: "রিভিউ", icon: MessageSquare },
  { id: "products", label: "প্রোডাক্ট", icon: Boxes },
  { id: "analytics", label: "অ্যানালিটিক্স", icon: BarChart3 },
  { id: "settings", label: "সেটিংস", icon: Settings },
];

function toBanglaNumber(value: number) {
  return Number(value || 0).toLocaleString("bn-BD");
}

function compactTextParts(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ");
}

function getDeliveryAddress(customer: WebsiteOrder["customer"]) {
  return compactTextParts([
    customer.courierOffice || customer.address,
    customer.area,
    customer.district,
  ]);
}

function getDisplayUserEmail(email?: string) {
  const normalizedEmail = String(email || "").trim();

  if (normalizedEmail.toLowerCase().endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`)) {
    return "";
  }

  return normalizedEmail;
}

function getPaymentDetails(payment: WebsiteOrder["payment"]) {
  return compactTextParts([
    payment.paymentPhone ? `নম্বর: ${payment.paymentPhone}` : undefined,
    payment.transactionId ? `ট্রানজেকশন আইডি: ${payment.transactionId}` : undefined,
  ]);
}

function getReviewStatusLabel(status: ReviewStatus) {
  if (status === "published") return "প্রকাশিত";
  if (status === "hidden") return "লুকানো";
  return "অপেক্ষমাণ";
}

function formatFileSize(size?: number) {
  if (!size) return "";

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getProductImageSrc(image?: string) {
  if (!image) return "";
  return image;
}

function isLowStock(product: Product) {
  return product.status !== "শীঘ্রই আসছে" && (product.status === "স্টক কম" || Number(product.stock || 0) <= 10);
}

export default function DashboardPage() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminLoginForm, setAdminLoginForm] = useState({ email: "", password: "" });
  const [adminLoginError, setAdminLoginError] = useState("");
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuId>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [websiteOrders, setWebsiteOrders] = useState<WebsiteOrder[]>([]);
  const [websiteUsers, setWebsiteUsers] = useState<WebsiteUser[]>([]);
  const [websiteReviews, setWebsiteReviews] = useState<WebsiteReview[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<WebsiteReview | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm>(emptyReviewForm);
  const [loadError, setLoadError] = useState("");
  const [reviewLoadError, setReviewLoadError] = useState("");

  const totalRevenue = websiteOrders.reduce((total, order) => total + Number(order.total || 0), 0);
  const totalSales = products.reduce((total, product) => total + Number(product.sales || 0), 0);
  const totalStock = products.reduce((total, product) => total + Number(product.stock || 0), 0);
  const lowStockCount = products.filter(isLowStock).length;
  const publishedReviewCount = websiteReviews.filter((review) => review.status === "published").length;

  const paymentSummary = useMemo(() => {
    const summary = new Map<string, { count: number; total: number }>();

    websiteOrders.forEach((order) => {
      const method = order.payment?.method || "Unknown";
      const current = summary.get(method) ?? { count: 0, total: 0 };
      summary.set(method, {
        count: current.count + 1,
        total: current.total + Number(order.total || 0),
      });
    });

    return Array.from(summary.entries()).map(([method, value]) => ({
      method,
      ...value,
    }));
  }, [websiteOrders]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      `${product.name} ${product.category} ${product.id}`.toLowerCase().includes(query)
    );
  }, [productSearch, products]);

  const filteredReviews = useMemo(() => {
    const query = reviewSearch.trim().toLowerCase();

    if (!query) return websiteReviews;

    return websiteReviews.filter((review) =>
      `${review.name} ${review.phone ?? ""} ${review.location ?? ""} ${review.title ?? ""} ${review.message} ${review.id}`
        .toLowerCase()
        .includes(query)
    );
  }, [reviewSearch, websiteReviews]);

  useEffect(() => {
    const storedSession = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

    if (storedSession) {
      setAdminSession(JSON.parse(storedSession));
    }

    setIsAuthChecking(false);
  }, []);

  useEffect(() => {
    if (!adminSession) return;

    window.localStorage.removeItem(DASHBOARD_ORDERS_STORAGE_KEY);

    const loadDashboardData = async () => {
      try {
        setLoadError("");
        const [nextProducts, nextOrders, nextUsers] = await Promise.all([
          apiRequest<Product[]>("/api/products"),
          apiRequest<WebsiteOrder[]>("/api/orders"),
          apiRequest<WebsiteUser[]>("/api/users"),
        ]);

        setProducts(nextProducts);
        setWebsiteOrders(nextOrders);
        setWebsiteUsers(nextUsers);
        window.localStorage.setItem(DASHBOARD_USERS_STORAGE_KEY, JSON.stringify(nextUsers));
      } catch (error) {
        setLoadError(getApiError(error, "Dashboard data load failed."));
        setWebsiteOrders([]);

        const usersRaw = window.localStorage.getItem(DASHBOARD_USERS_STORAGE_KEY);
        if (usersRaw) {
          setWebsiteUsers(JSON.parse(usersRaw));
        }
      }

      try {
        setReviewLoadError("");
        const nextReviews = await apiRequest<WebsiteReview[]>("/api/reviews");
        setWebsiteReviews(nextReviews);
        window.localStorage.setItem(DASHBOARD_REVIEWS_STORAGE_KEY, JSON.stringify(nextReviews));
      } catch (error) {
        setReviewLoadError(getApiError(error, "Review data load failed."));
        const reviewsRaw = window.localStorage.getItem(DASHBOARD_REVIEWS_STORAGE_KEY);
        if (reviewsRaw) {
          setWebsiteReviews(JSON.parse(reviewsRaw));
        } else {
          setWebsiteReviews([]);
        }
      }
    };

    void loadDashboardData();
    const refreshTimer = window.setInterval(loadDashboardData, 8000);

    return () => window.clearInterval(refreshTimer);
  }, [adminSession]);

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAdminLoggingIn(true);
    setAdminLoginError("");

    try {
      const session = await apiRequest<AdminSession>("/api/auth/admin/login", {
        method: "POST",
        body: JSON.stringify(adminLoginForm),
      });

      window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
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
      variety: product.variety ?? "",
      discountLabel: product.discountLabel ?? "",
      shortNote: product.shortNote ?? "",
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? true,
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
          ? current.map((product) => (product.id === editingProduct.id ? savedProduct : product))
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
    reader.onload = () => updateProductForm("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const openAddReview = () => {
    setEditingReview(null);
    setReviewForm(emptyReviewForm);
    setIsReviewFormOpen(true);
  };

  const openEditReview = (review: WebsiteReview) => {
    setEditingReview(review);
    setReviewForm({
      name: review.name,
      phone: review.phone ?? "",
      location: review.location ?? "",
      title: review.title ?? "",
      message: review.message,
      rating: review.rating || 5,
      status: review.status || "pending",
      media: review.media,
    });
    setIsReviewFormOpen(true);
  };

  const updateReviewForm = <Key extends keyof ReviewForm>(
    key: Key,
    value: ReviewForm[Key]
  ) => {
    setReviewForm((current) => ({ ...current, [key]: value }));
  };

  const saveReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const savedReview = await apiRequest<WebsiteReview>(
        editingReview ? `/api/reviews/${editingReview.id}` : "/api/reviews",
        {
          method: editingReview ? "PUT" : "POST",
          body: JSON.stringify(reviewForm),
        }
      );

      setWebsiteReviews((current) =>
        editingReview
          ? current.map((review) => (review.id === editingReview.id ? savedReview : review))
          : [savedReview, ...current]
      );

      setIsReviewFormOpen(false);
    } catch (error) {
      window.alert(getApiError(error, "Review save failed."));
    }
  };

  const handleReviewMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const mediaType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "";

    if (!mediaType) {
      window.alert("শুধু ছবি বা ভিডিও আপলোড করুন।");
      return;
    }

    if (file.size > MAX_REVIEW_MEDIA_SIZE) {
      window.alert("রিভিউ মিডিয়া ৮ MB-এর মধ্যে রাখুন।");
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      updateReviewForm("media", {
        type: mediaType,
        url: String(reader.result),
        name: file.name,
        contentType: file.type,
        size: file.size,
      });
    reader.readAsDataURL(file);
  };

  const clearReviewMedia = () => {
    updateReviewForm("media", null);
  };

  const updateWebsiteReviewStatus = (reviewId: string, status: ReviewStatus) => {
    setWebsiteReviews((current) =>
      current.map((review) => (review.id === reviewId ? { ...review, status } : review))
    );

    void apiRequest<WebsiteReview>(`/api/reviews/${reviewId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
      .then((updatedReview) => {
        setWebsiteReviews((current) =>
          current.map((review) => (review.id === reviewId ? updatedReview : review))
        );
      })
      .catch(() => undefined);
  };

  const deleteWebsiteReview = async (reviewId: string) => {
    const shouldDelete = window.confirm(`Review ${reviewId} delete korben?`);

    if (!shouldDelete) return;

    const previousReviews = websiteReviews;
    setWebsiteReviews((current) => current.filter((review) => review.id !== reviewId));

    try {
      await apiRequest<{ ok: boolean; review: WebsiteReview }>(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
    } catch (error) {
      setWebsiteReviews(previousReviews);
      window.alert(getApiError(error, "Review delete failed."));
    }
  };

  const updateWebsiteOrderStatus = (orderId: string, status: string) => {
    setWebsiteOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order))
    );

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

  const deleteWebsiteOrder = async (orderId: string) => {
    const shouldDelete = window.confirm(`Order ${orderId} delete korben?`);

    if (!shouldDelete) return;

    const previousOrders = websiteOrders;
    setWebsiteOrders((current) => current.filter((order) => order.id !== orderId));

    try {
      await apiRequest<{ ok: boolean; order: WebsiteOrder }>(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
    } catch (error) {
      setWebsiteOrders(previousOrders);
      window.alert(getApiError(error, "Order delete failed."));
    }
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
      <div className="grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
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
                Admin Dashboard
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
                  onClick={() => setActiveMenu(item.id)}
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
            <p className="text-sm font-bold text-[#7c2d12]">Logged in</p>
            <p className="mt-1 truncate text-sm text-[#9a3412]">{admin.email}</p>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#fed7aa] bg-white px-4 py-2.5 text-sm font-semibold text-[#7c2d12]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Operations</p>
              <h2 className="mt-1 text-2xl font-bold text-[#7c2d12] sm:text-3xl">
                {menuItems.find((item) => item.id === activeMenu)?.label}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {activeMenu === "reviews" ? (
                <button
                  type="button"
                  onClick={openAddReview}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ea580c]"
                >
                  <Plus className="h-4 w-4" />
                  নতুন রিভিউ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ea580c]"
                >
                  <Plus className="h-4 w-4" />
                  নতুন প্রোডাক্ট
                </button>
              )}
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-4 py-3 text-sm font-semibold text-[#7c2d12]">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {admin.name}
              </div>
            </div>
          </header>

          {loadError && (
            <div className="mt-5 rounded-2xl border border-[#fed7aa] bg-[#fff1e8] px-4 py-3 text-sm font-semibold text-[#9a3412]">
              {loadError}
            </div>
          )}

          {activeMenu === "overview" && (
            <section className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <MetricCard title="মোট বিক্রি" value={`${toBanglaNumber(totalRevenue)} টাকা`} note="রিয়েল অর্ডার থেকে" icon={<BarChart3 className="h-5 w-5" />} />
                <MetricCard title="অর্ডার" value={toBanglaNumber(websiteOrders.length)} note="ওয়েবসাইট অর্ডার" icon={<ClipboardList className="h-5 w-5" />} />
                <MetricCard title="ইউজার" value={toBanglaNumber(websiteUsers.length)} note="সাইন আপ ইউজার" icon={<Users className="h-5 w-5" />} />
                <MetricCard title="রিভিউ" value={toBanglaNumber(websiteReviews.length)} note={`${toBanglaNumber(publishedReviewCount)} প্রকাশিত`} icon={<MessageSquare className="h-5 w-5" />} />
                <MetricCard title="প্রোডাক্ট" value={toBanglaNumber(products.length)} note={`${toBanglaNumber(totalStock)} স্টক`} icon={<Boxes className="h-5 w-5" />} />
                <MetricCard title="লো স্টক" value={toBanglaNumber(lowStockCount)} note="স্টক দেখা দরকার" icon={<PackagePlus className="h-5 w-5" />} />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
                <Panel title="সাম্প্রতিক অর্ডার" action={`${toBanglaNumber(websiteOrders.length)}টি`}>
                  <OrderList orders={websiteOrders.slice(0, 5)} onStatusChange={updateWebsiteOrderStatus} onDelete={deleteWebsiteOrder} />
                </Panel>
                <Panel title="লো স্টক প্রোডাক্ট" action={`${toBanglaNumber(lowStockCount)}টি`}>
                  <ProductList products={products.filter(isLowStock).slice(0, 5)} onEdit={openEditProduct} compact />
                </Panel>
              </div>
            </section>
          )}

          {activeMenu === "orders" && (
            <section className="mt-6">
              <Panel title="ওয়েবসাইট অর্ডার" action={`${toBanglaNumber(websiteOrders.length)}টি`}>
                <OrderList orders={websiteOrders} onStatusChange={updateWebsiteOrderStatus} onDelete={deleteWebsiteOrder} />
              </Panel>
            </section>
          )}

          {activeMenu === "users" && (
            <section className="mt-6">
              <Panel title="সাইন আপ ইউজার" action={`${toBanglaNumber(websiteUsers.length)} জন`}>
                <UserList users={websiteUsers} />
              </Panel>
            </section>
          )}

          {activeMenu === "reviews" && (
            <section className="mt-6">
              <Panel title="রিভিউ ম্যানেজমেন্ট" action={`${toBanglaNumber(filteredReviews.length)}টি`}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-[#fed7aa] bg-[#fffaf6] px-4">
                    <Search className="h-4 w-4 text-primary" />
                    <input
                      value={reviewSearch}
                      onChange={(event) => setReviewSearch(event.target.value)}
                      placeholder="রিভিউ খুঁজুন"
                      className="h-full w-full bg-transparent text-sm text-[#7c2d12] outline-none placeholder:text-[#c2410c]/70"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={openAddReview}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    যোগ করুন
                  </button>
                </div>
                <ReviewList
                  reviews={filteredReviews}
                  onEdit={openEditReview}
                  onDelete={deleteWebsiteReview}
                  onStatusChange={updateWebsiteReviewStatus}
                />
                {reviewLoadError && (
                  <div className="mt-4 rounded-2xl border border-[#fed7aa] bg-[#fff1e8] px-4 py-3 text-sm font-semibold text-[#9a3412]">
                    {reviewLoadError}
                  </div>
                )}
              </Panel>
            </section>
          )}

          {activeMenu === "products" && (
            <section className="mt-6">
              <Panel title="প্রোডাক্ট তালিকা" action={`${toBanglaNumber(filteredProducts.length)}টি`}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-[#fed7aa] bg-[#fffaf6] px-4">
                    <Search className="h-4 w-4 text-primary" />
                    <input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="প্রোডাক্ট খুঁজুন"
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
                <ProductList products={filteredProducts} onEdit={openEditProduct} />
              </Panel>
            </section>
          )}

          {activeMenu === "analytics" && (
            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <Panel title="পেমেন্ট সামারি" action="রিয়েল ডাটা">
                {paymentSummary.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paymentSummary.map((item) => (
                      <div key={item.method} className="rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-4">
                        <p className="text-sm font-semibold text-[#9a3412]">{item.method}</p>
                        <h3 className="mt-2 text-2xl font-bold text-[#7c2d12]">
                          {toBanglaNumber(item.total)} টাকা
                        </h3>
                        <p className="mt-1 text-sm text-[#9a3412]">{toBanglaNumber(item.count)} অর্ডার</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<BarChart3 className="h-8 w-8" />} title="এখনো অ্যানালিটিক্স ডাটা নেই" />
                )}
              </Panel>
              <Panel title="প্রোডাক্ট পারফরম্যান্স" action={`${toBanglaNumber(totalSales)} বিক্রি`}>
                <SimpleBars products={products.slice(0, 8)} />
              </Panel>
            </section>
          )}

          {activeMenu === "settings" && (
            <section className="mt-6">
              <Panel title="স্টোর সেটিংস" action="রিড অনলি">
                <div className="grid gap-4 md:grid-cols-3">
                  <SettingCard title="স্টোর নাম" value="সাতক্ষীরার আম" />
                  <SettingCard title="সাপোর্ট নম্বর" value="+8801779024048" />
                  <SettingCard title="API Mode" value={process.env.NEXT_PUBLIC_API_URL ?? "Local"} />
                </div>
              </Panel>
            </section>
          )}
        </section>
      </div>

      {isProductFormOpen && (
        <ProductFormModal
          editingProduct={editingProduct}
          productForm={productForm}
          onClose={() => setIsProductFormOpen(false)}
          onSubmit={saveProduct}
          onChange={updateProductForm}
          onImageChange={handleProductImageChange}
        />
      )}

      {isReviewFormOpen && (
        <ReviewFormModal
          editingReview={editingReview}
          reviewForm={reviewForm}
          onClose={() => setIsReviewFormOpen(false)}
          onSubmit={saveReview}
          onChange={updateReviewForm}
          onMediaChange={handleReviewMediaChange}
          onMediaClear={clearReviewMedia}
        />
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
      <form onSubmit={onSubmit} className="w-full max-w-[440px] rounded-3xl border border-[#fed7aa] bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-primary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Admin Access</p>
            <h1 className="text-2xl font-bold text-[#7c2d12]">Dashboard Login</h1>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Email">
            <input required type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} className="field" placeholder="admin@satkhiraramm.com" />
          </Field>
          <Field label="Password">
            <input required type="password" value={form.password} onChange={(event) => onChange("password", event.target.value)} className="field" placeholder="Admin password" />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-[#fff1e8] px-4 py-3 text-sm font-semibold text-[#9a3412]">{error}</p>
        )}

        <button type="submit" disabled={isSubmitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:bg-[#fdba74]">
          <ShieldCheck className="h-5 w-5" />
          {isSubmitting ? "Signing in" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

function ProductFormModal({
  editingProduct,
  productForm,
  onClose,
  onSubmit,
  onChange,
  onImageChange,
}: {
  editingProduct: Product | null;
  productForm: ProductForm;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof ProductForm>(key: Key, value: ProductForm[Key]) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#2d1204]/50 px-4 py-6">
      <form onSubmit={onSubmit} className="max-h-[calc(100vh-3rem)] w-full max-w-[680px] overflow-y-auto rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-[0_30px_90px_rgba(45,18,4,0.25)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Product Management</p>
            <h2 className="mt-1 text-2xl font-bold text-[#7c2d12]">
              {editingProduct ? "প্রোডাক্ট এডিট করুন" : "নতুন প্রোডাক্ট যোগ করুন"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[#fed7aa] bg-[#fff7f1] p-2 text-[#7c2d12]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="প্রোডাক্ট নাম">
            <input required value={productForm.name} onChange={(event) => onChange("name", event.target.value)} className="field" />
          </Field>
          <Field label="ক্যাটাগরি">
            <select value={productForm.category} onChange={(event) => onChange("category", event.target.value)} className="field">
              <option>আম</option>
              <option>গুড়</option>
              <option>চারা</option>
              <option>আচার</option>
              <option>তেল</option>
              <option>মধু</option>
            </select>
          </Field>
          <Field label="ভ্যারাইটি / সাবটাইটেল">
            <input value={productForm.variety ?? ""} onChange={(event) => onChange("variety", event.target.value)} className="field" />
          </Field>
          <Field label="ইউনিট">
            <input required value={productForm.unit} onChange={(event) => onChange("unit", event.target.value)} className="field" />
          </Field>
          <Field label="দাম">
            <input required type="number" min={0} value={productForm.price} onChange={(event) => onChange("price", Number(event.target.value))} className="field" />
          </Field>
          <Field label="স্টক">
            <input required type="number" min={0} value={productForm.stock} onChange={(event) => onChange("stock", Number(event.target.value))} className="field" />
          </Field>
          <Field label="স্ট্যাটাস">
            <select value={productForm.status} onChange={(event) => onChange("status", event.target.value as ProductStatus)} className="field">
              <option>স্টক আছে</option>
              <option>স্টক কম</option>
              <option>শীঘ্রই আসছে</option>
              <option>বন্ধ</option>
            </select>
          </Field>
          <Field label="ডিসকাউন্ট লেবেল">
            <input value={productForm.discountLabel ?? ""} onChange={(event) => onChange("discountLabel", event.target.value)} className="field" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="শর্ট নোট">
              <textarea rows={3} value={productForm.shortNote ?? ""} onChange={(event) => onChange("shortNote", event.target.value)} className="field min-h-[96px] py-3" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="প্রোডাক্ট ছবি">
              <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
                <ProductImage image={productForm.image} name={productForm.name || "Product"} size="large" />
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-4 py-5 text-center text-[#7c2d12] transition hover:border-primary">
                  <ImagePlus className="h-7 w-7 text-primary" />
                  <span className="mt-2 text-sm font-bold">ছবি আপলোড করুন</span>
                  <span className="mt-1 text-xs text-[#9a3412]">JPG, PNG অথবা WebP</span>
                  <input type="file" accept="image/*" onChange={onImageChange} className="sr-only" />
                </label>
              </div>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <div className="grid gap-3 rounded-2xl border border-[#fed7aa] bg-[#fff7f1] p-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#7c2d12]">
                <input
                  type="checkbox"
                  checked={productForm.isActive ?? true}
                  onChange={(event) => onChange("isActive", event.target.checked)}
                  className="h-5 w-5 accent-[#f97316]"
                />
                ওয়েবসাইটে দেখান
              </label>
              <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#7c2d12]">
                <input
                  type="checkbox"
                  checked={productForm.isFeatured ?? true}
                  onChange={(event) => onChange("isFeatured", event.target.checked)}
                  className="h-5 w-5 accent-[#f97316]"
                />
                ফিচার্ড প্রোডাক্ট
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl border border-[#fed7aa] bg-white px-5 py-3 font-semibold text-[#7c2d12]">
            বাতিল
          </button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-white">
            <CheckCircle2 className="h-5 w-5" />
            সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </div>
  );
}

function ReviewFormModal({
  editingReview,
  reviewForm,
  onClose,
  onSubmit,
  onChange,
  onMediaChange,
  onMediaClear,
}: {
  editingReview: WebsiteReview | null;
  reviewForm: ReviewForm;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof ReviewForm>(key: Key, value: ReviewForm[Key]) => void;
  onMediaChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMediaClear: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#2d1204]/50 px-4 py-6">
      <form onSubmit={onSubmit} className="max-h-[calc(100vh-3rem)] w-full max-w-[720px] overflow-y-auto rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-[0_30px_90px_rgba(45,18,4,0.25)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Review Management</p>
            <h2 className="mt-1 text-2xl font-bold text-[#7c2d12]">
              {editingReview ? "রিভিউ এডিট করুন" : "নতুন রিভিউ যোগ করুন"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[#fed7aa] bg-[#fff7f1] p-2 text-[#7c2d12]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="নাম">
            <input required value={reviewForm.name} onChange={(event) => onChange("name", event.target.value)} className="field" />
          </Field>
          <Field label="মোবাইল">
            <input value={reviewForm.phone} onChange={(event) => onChange("phone", event.target.value)} className="field" />
          </Field>
          <Field label="লোকেশন">
            <input value={reviewForm.location} onChange={(event) => onChange("location", event.target.value)} className="field" />
          </Field>
          <Field label="রেটিং">
            <select value={reviewForm.rating} onChange={(event) => onChange("rating", Number(event.target.value))} className="field">
              <option value={5}>৫ স্টার</option>
              <option value={4}>৪ স্টার</option>
              <option value={3}>৩ স্টার</option>
              <option value={2}>২ স্টার</option>
              <option value={1}>১ স্টার</option>
            </select>
          </Field>
          <Field label="স্ট্যাটাস">
            <select value={reviewForm.status} onChange={(event) => onChange("status", event.target.value as ReviewStatus)} className="field">
              <option value="published">প্রকাশিত</option>
              <option value="pending">অপেক্ষমাণ</option>
              <option value="hidden">লুকানো</option>
            </select>
          </Field>
          <Field label="শিরোনাম">
            <input value={reviewForm.title} onChange={(event) => onChange("title", event.target.value)} className="field" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="রিভিউ">
              <textarea required rows={4} value={reviewForm.message} onChange={(event) => onChange("message", event.target.value)} className="field min-h-[128px] py-3" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="ছবি / ভিডিও">
              <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                <ReviewMediaPreview media={reviewForm.media} size="large" />
                <div className="grid gap-3">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-4 py-5 text-center text-[#7c2d12] transition hover:border-primary">
                    <Upload className="h-7 w-7 text-primary" />
                    <span className="mt-2 text-sm font-bold">মিডিয়া আপলোড করুন</span>
                    <span className="mt-1 text-xs text-[#9a3412]">ছবি অথবা ভিডিও, সর্বোচ্চ ৮ MB</span>
                    <input type="file" accept="image/*,video/*" onChange={onMediaChange} className="sr-only" />
                  </label>
                  {reviewForm.media && (
                    <button
                      type="button"
                      onClick={onMediaClear}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      মিডিয়া সরান
                    </button>
                  )}
                </div>
              </div>
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl border border-[#fed7aa] bg-white px-5 py-3 font-semibold text-[#7c2d12]">
            বাতিল
          </button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-white">
            <CheckCircle2 className="h-5 w-5" />
            সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </div>
  );
}

function MetricCard({ title, value, note, icon }: { title: string; value: string; note: string; icon: ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-primary">{icon}</div>
      <p className="mt-5 text-sm font-semibold text-[#9a3412]">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-[#7c2d12]">{value}</h3>
      <p className="mt-2 text-sm text-[#9a3412]">{note}</p>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#fed7aa] bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[#7c2d12]">{title}</h2>
        <span className="rounded-full bg-[#fff1e8] px-3 py-1 text-xs font-bold text-primary">{action}</span>
      </div>
      {children}
    </section>
  );
}

function OrderList({
  orders,
  onStatusChange,
  onDelete,
}: {
  orders: WebsiteOrder[];
  onStatusChange: (orderId: string, status: string) => void;
  onDelete: (orderId: string) => void;
}) {
  if (orders.length === 0) {
    return <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="এখনো কোনো অর্ডার নেই" />;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const deliveryAddress = getDeliveryAddress(order.customer);
        const paymentDetails = getPaymentDetails(order.payment);

        return (
          <div key={order.id} className="rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-[#7c2d12]">{order.id}</h3>
                  <StatusBadge label={order.status} />
                </div>
                <p className="mt-1 text-sm text-[#9a3412]">
                  {order.customer.name} · {order.customer.phone}
                </p>
                {deliveryAddress && (
                  <p className="mt-1 max-w-3xl whitespace-pre-wrap break-words text-sm text-[#9a3412]">
                    {deliveryAddress}
                  </p>
                )}
                <p className="mt-2 text-sm font-semibold text-primary">
                  {order.items.map((item) => `${item.name} x ${toBanglaNumber(item.quantity)}`).join(", ")}
                </p>
              </div>
              <div className="min-w-[220px] text-left lg:text-right">
                <p className="text-xl font-bold text-[#7c2d12]">{toBanglaNumber(order.total)} টাকা</p>
                <p className="mt-1 text-sm text-[#9a3412]">{order.payment.method}</p>
                {paymentDetails && (
                  <p className="mt-1 break-words text-xs font-semibold text-primary">
                    {paymentDetails}
                  </p>
                )}
                <div className="mt-3 flex gap-2 lg:justify-end">
                  {["প্রসেসিং", "ডেলিভারিতে", "সম্পন্ন"].map((status) => (
                    <button key={status} type="button" onClick={() => onStatusChange(order.id, status)} className="rounded-xl border border-[#fed7aa] bg-white px-3 py-2 text-xs font-bold text-[#7c2d12] hover:border-primary">
                      {status}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onDelete(order.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:border-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ডিলিট
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserList({ users }: { users: WebsiteUser[] }) {
  if (users.length === 0) {
    return <EmptyState icon={<Users className="h-8 w-8" />} title="কোনো ইউজার নেই" />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#fed7aa] bg-white">
      <div className="hidden grid-cols-[1.2fr_1fr_1.3fr_130px] gap-3 bg-[#fff7f1] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#9a3412] md:grid">
        <span>নাম</span>
        <span>মোবাইল</span>
        <span>ইমেইল</span>
        <span>স্ট্যাটাস</span>
      </div>
      <div className="divide-y divide-[#fed7aa]">
        {users.map((user) => {
          const displayEmail = getDisplayUserEmail(user.email);

          return (
            <div key={user.id || user.phone || user.email} className="grid gap-3 bg-[#fffaf6] px-4 py-4 md:grid-cols-[1.2fr_1fr_1.3fr_130px] md:items-center">
              <div className="min-w-0">
                <p className="font-bold text-[#7c2d12]">{user.name || "নাম নেই"}</p>
                <p className="mt-1 text-xs font-bold text-primary">Joined: {user.joinedAt || "N/A"}</p>
              </div>
              <p className="break-words text-sm font-semibold text-[#9a3412]">{user.phone || "N/A"}</p>
              <p className="break-all text-sm font-semibold text-[#7c2d12]">{displayEmail || "ইমেইল নেই"}</p>
              <StatusBadge label={user.status || "নতুন"} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewList({
  reviews,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  reviews: WebsiteReview[];
  onEdit: (review: WebsiteReview) => void;
  onDelete: (reviewId: string) => void;
  onStatusChange: (reviewId: string, status: ReviewStatus) => void;
}) {
  if (reviews.length === 0) {
    return <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="কোনো রিভিউ নেই" />;
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="grid gap-4 rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-4 xl:grid-cols-[96px_minmax(0,1fr)_auto] xl:items-start">
          <ReviewMediaPreview media={review.media} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-[#7c2d12]">{review.title || review.name}</h3>
              <StatusBadge label={getReviewStatusLabel(review.status)} />
              <ReviewRating rating={review.rating} />
            </div>
            <p className="mt-1 text-sm text-[#9a3412]">
              {review.name} {review.phone ? `· ${review.phone}` : ""} {review.location ? `· ${review.location}` : ""}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#7c2d12]">
              {review.message}
            </p>
            {review.media?.name && (
              <p className="mt-2 text-xs font-bold text-primary">
                {review.media.name} {formatFileSize(review.media.size) ? `· ${formatFileSize(review.media.size)}` : ""}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {review.status !== "published" && (
              <button type="button" onClick={() => onStatusChange(review.id, "published")} className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-xs font-bold text-[#166534]">
                প্রকাশ
              </button>
            )}
            {review.status !== "hidden" && (
              <button type="button" onClick={() => onStatusChange(review.id, "hidden")} className="rounded-xl border border-[#fed7aa] bg-white px-3 py-2 text-xs font-bold text-[#7c2d12]">
                লুকান
              </button>
            )}
            <button type="button" onClick={() => onEdit(review)} className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#fed7aa] bg-white px-3 py-2 text-xs font-bold text-[#7c2d12]">
              <Edit3 className="h-3.5 w-3.5" />
              এডিট
            </button>
            <button type="button" onClick={() => onDelete(review.id)} className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:border-red-400">
              <Trash2 className="h-3.5 w-3.5" />
              ডিলিট
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductList({ products, onEdit, compact = false }: { products: Product[]; onEdit: (product: Product) => void; compact?: boolean }) {
  if (products.length === 0) {
    return <EmptyState icon={<Boxes className="h-8 w-8" />} title="কোনো প্রোডাক্ট নেই" />;
  }

  return (
    <div className={compact ? "space-y-3" : "grid gap-3 xl:grid-cols-2"}>
      {products.map((product) => (
        <div key={product.id} className="grid gap-3 rounded-2xl border border-[#fed7aa] bg-white p-3 sm:grid-cols-[74px_1fr_auto] sm:items-center">
          <ProductImage image={product.image} name={product.name} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-[#7c2d12]">{product.name}</h3>
              <StatusBadge label={product.status} />
            </div>
            <p className="mt-1 text-sm text-[#9a3412]">
              {product.id} · {product.category} · {product.unit}
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {toBanglaNumber(product.price)} টাকা · স্টক {toBanglaNumber(product.stock)}
            </p>
          </div>
          <button type="button" onClick={() => onEdit(product)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#fed7aa] bg-[#fff7f1] px-4 py-2 text-sm font-semibold text-[#7c2d12]">
            <Edit3 className="h-4 w-4" />
            এডিট
          </button>
        </div>
      ))}
    </div>
  );
}

function ProductImage({ image, name, size = "normal" }: { image?: string; name: string; size?: "normal" | "large" }) {
  const [failed, setFailed] = useState(false);
  const src = getProductImageSrc(image);
  const className =
    size === "large"
      ? "h-[140px] w-full rounded-2xl object-cover sm:w-[160px]"
      : "h-[72px] w-[72px] rounded-2xl object-cover";

  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-orange-200 to-amber-500 text-xs font-bold text-white`}>
        ছবি নেই
      </div>
    );
  }

  return <img src={src} alt={name} className={className} onError={() => setFailed(true)} />;
}

function ReviewMediaPreview({ media, size = "normal" }: { media?: ReviewMedia | null; size?: "normal" | "large" }) {
  const className =
    size === "large"
      ? "h-[150px] w-full rounded-2xl object-cover sm:w-[180px]"
      : "h-[88px] w-full rounded-2xl object-cover xl:h-[88px] xl:w-[88px]";

  if (!media?.url) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-orange-200 to-amber-500 text-xs font-bold text-white`}>
        মিডিয়া নেই
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <video
        src={media.url}
        controls={size === "large"}
        muted
        playsInline
        className={`${className} bg-[#2d1204]`}
      />
    );
  }

  return <img src={media.url} alt={media.name || "Review media"} className={className} />;
}

function ReviewRating({ rating }: { rating: number }) {
  const value = Math.min(5, Math.max(1, Number(rating || 5)));

  return (
    <span className="inline-flex items-center gap-0.5 text-[#ffb703]" aria-label={`${value} star review`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < value ? "fill-current" : "text-[#fed7aa]"}`} />
      ))}
    </span>
  );
}

function SimpleBars({ products }: { products: Product[] }) {
  const max = Math.max(1, ...products.map((product) => Number(product.sales || 0)));

  if (products.length === 0) {
    return <EmptyState icon={<BarChart3 className="h-8 w-8" />} title="প্রোডাক্ট ডাটা নেই" />;
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div key={product.id}>
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-[#7c2d12]">
            <span>{product.name}</span>
            <span>{toBanglaNumber(product.sales)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#fff1e8]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (Number(product.sales || 0) / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#fed7aa] bg-[#fffaf6] px-5 py-10 text-center text-[#9a3412]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-primary">{icon}</div>
      <h3 className="mt-3 text-lg font-bold text-[#7c2d12]">{title}</h3>
    </div>
  );
}

function SettingCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-4">
      <p className="text-sm font-semibold text-[#9a3412]">{title}</p>
      <p className="mt-2 break-all font-bold text-[#7c2d12]">{value}</p>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const tone =
    label === "স্টক আছে" || label === "সম্পন্ন" || label === "প্রকাশিত"
      ? "bg-[#dcfce7] text-[#166534]"
      : label === "শীঘ্রই আসছে"
        ? "bg-[#fef3c7] text-[#92400e]"
      : label === "স্টক কম" || label === "প্রসেসিং" || label === "নতুন অর্ডার" || label === "নতুন" || label === "অপেক্ষমাণ"
        ? "bg-[#fff1e8] text-primary"
        : label === "বন্ধ" || label === "লুকানো"
          ? "bg-[#fee2e2] text-[#b91c1c]"
          : "bg-[#e0f2fe] text-[#0369a1]";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#7c2d12]">{label}</span>
      {children}
    </label>
  );
}
