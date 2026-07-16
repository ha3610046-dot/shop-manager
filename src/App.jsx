import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  LayoutDashboard, ShoppingCart, Package, Wallet, Users, Truck, Building2,
  BarChart3, Plus, Trash2, Search, X, Pencil, AlertTriangle, CheckCircle2,
  Phone, TrendingUp, Banknote, Loader2, RotateCcw, MapPin, StickyNote, Minus,
  ClipboardList, TrendingDown, FileText, PackagePlus, ReceiptText, UserPlus, Warehouse,
  Download, Upload
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

/* ---------------------------------- تصميم ---------------------------------- */
const C = {
  navy: "#12172B",
  navySoft: "#1D2440",
  teal: "#0EA99C",
  tealSoft: "#E6F7F5",
  amber: "#F5A524",
  amberSoft: "#FEF3DD",
  danger: "#E5484D",
  dangerSoft: "#FCE8E8",
  success: "#22A06B",
  successSoft: "#E4F6EE",
  page: "#F3F4F7",
  border: "#E6E8EE",
  text: "#171A2B",
  muted: "#7A7F93",
};
const MONO = "'JetBrains Mono', monospace";
const CATEGORIES = ["موبايلات", "أجهزة كهربائية", "إكسسوارات", "أخرى"];

/* ---------------------------------- أدوات ---------------------------------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const money = (n) => Math.round(n || 0).toLocaleString("en-US");
const fmtDate = (ts) => new Date(ts).toLocaleDateString("ar-IQ", { year: "numeric", month: "short", day: "numeric" });
const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
const DAY = 86400000;
const toInputDate = (ts) => { const d = new Date(ts); const off = d.getTimezoneOffset(); return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10); };
const fromInputDate = (str, keepTimeFromTs) => {
  const t = keepTimeFromTs ? new Date(keepTimeFromTs) : new Date();
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d, t.getHours(), t.getMinutes(), t.getSeconds()).getTime();
};

const AR_ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const AR_TEENS = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const AR_TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const AR_HUNDREDS = ["", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
const AR_SCALES = [
  ["", "", ""],
  ["ألف", "ألفان", "آلاف"],
  ["مليون", "مليونان", "ملايين"],
  ["مليار", "مليونان", "مليارات"],
];
function threeDigitsToArabic(n) {
  n = Math.floor(n);
  if (n === 0) return "";
  const parts = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h > 0) parts.push(AR_HUNDREDS[h]);
  if (rem > 0) {
    if (rem < 10) parts.push(AR_ONES[rem]);
    else if (rem < 20) parts.push(AR_TEENS[rem - 10]);
    else {
      const t = Math.floor(rem / 10), o = rem % 10;
      parts.push(o > 0 ? `${AR_ONES[o]} و${AR_TENS[t]}` : AR_TENS[t]);
    }
  }
  return parts.join(" و");
}
function numberToArabicWords(num) {
  num = Math.round(Math.abs(Number(num) || 0));
  if (num === 0) return "صفر";
  const groups = [];
  let n = num, i = 0;
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); i++; }
  const phrases = [];
  for (let g = groups.length - 1; g >= 0; g--) {
    const val = groups[g];
    if (val === 0) continue;
    if (g === 0) { phrases.push(threeDigitsToArabic(val)); continue; }
    const [sg, du, pl] = AR_SCALES[g];
    if (val === 1) phrases.push(sg);
    else if (val === 2) phrases.push(du);
    else if (val >= 3 && val <= 10) phrases.push(`${threeDigitsToArabic(val)} ${pl}`);
    else phrases.push(`${threeDigitsToArabic(val)} ${sg}`);
  }
  return phrases.join(" و");
}
function arabicMoneyWords(num) {
  const n = Math.round(Number(num) || 0);
  if (n <= 0) return "";
  return `${numberToArabicWords(n)} دينار عراقي`;
}

const toDbProduct = (p) => ({ id: p.id, name: p.name, category: p.category, brand: p.brand, cost_price: p.costPrice, sell_price: p.sellPrice, qty: p.qty, min_qty: p.minQty, barcode: p.barcode, created_at: p.createdAt });
const fromDbProduct = (r) => ({ id: r.id, name: r.name, category: r.category, brand: r.brand, costPrice: r.cost_price, sellPrice: r.sell_price, qty: r.qty, minQty: r.min_qty, barcode: r.barcode, createdAt: r.created_at });
const toDbCustomer = (c) => ({ id: c.id, name: c.name, phone: c.phone, address: c.address, notes: c.notes, created_at: c.createdAt });
const fromDbCustomer = (r) => ({ id: r.id, name: r.name, phone: r.phone, address: r.address, notes: r.notes, createdAt: r.created_at });
const toDbSupplier = (s) => ({ id: s.id, name: s.name, phone: s.phone, notes: s.notes, created_at: s.createdAt });
const fromDbSupplier = (r) => ({ id: r.id, name: r.name, phone: r.phone, notes: r.notes, createdAt: r.created_at });
const toDbSale = (s) => ({
  id: s.id, date: s.date, customer_id: s.customerId, customer_name: s.customerName, items: s.items,
  subtotal: s.subtotal, discount: s.discount, total: s.total, payment_type: s.paymentType,
  paid_amount: s.paidAmount, installment: s.installment, status: s.status,
});
const fromDbSale = (r) => ({
  id: r.id, date: r.date, customerId: r.customer_id, customerName: r.customer_name, items: r.items || [],
  subtotal: r.subtotal, discount: r.discount, total: r.total, paymentType: r.payment_type,
  paidAmount: r.paid_amount, installment: r.installment, status: r.status,
});
const toDbPurchase = (p) => ({
  id: p.id, date: p.date, supplier_id: p.supplierId, supplier_name: p.supplierName, items: p.items,
  total: p.total, payment_type: p.paymentType, paid: p.paid, remaining: p.remaining,
  payments: p.payments || [], status: p.status,
});
const fromDbPurchase = (r) => ({
  id: r.id, date: r.date, supplierId: r.supplier_id, supplierName: r.supplier_name, items: r.items || [],
  total: r.total, paymentType: r.payment_type, paid: r.paid, remaining: r.remaining,
  payments: r.payments || [], status: r.status,
});

/* ------------------------------- عناصر مشتركة ------------------------------- */
function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: { bg: C.successSoft, fg: C.success },
    error: { bg: C.dangerSoft, fg: C.danger },
    info: { bg: "#EEF0F6", fg: C.navy },
  }[toast.type || "success"];
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full shadow-lg text-sm font-medium"
      style={{ background: colors.bg, color: colors.fg, border: `1px solid ${colors.fg}22` }}
    >
      {toast.msg}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent, dark }) {
  return (
    <div
      className="rounded-2xl p-4 flex-1 min-w-[150px]"
      style={{
        background: dark ? C.navy : "#fff",
        border: dark ? "none" : `1px solid ${C.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: dark ? "#9CA3C4" : C.muted }}>{label}</span>
        <div className="p-1.5 rounded-lg" style={{ background: dark ? "#ffffff14" : accent + "17" }}>
          <Icon size={15} style={{ color: dark ? "#fff" : accent }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: dark ? "#fff" : C.navy, fontFamily: MONO }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: dark ? "#8B90AE" : C.muted }}>{sub}</div>}
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.navy }}>{title}</h2>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: C.muted }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({ children, onClick, icon: Icon, type = "button", full, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${full ? "w-full" : ""}`}
      style={{ background: C.teal, color: "#fff" }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, icon: Icon, danger }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border transition hover:bg-gray-50"
      style={{ borderColor: danger ? C.danger + "55" : C.border, color: danger ? C.danger : C.navy }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 transition";
const inputStyle = { borderColor: C.border };

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(18,23,43,0.55)" }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[88vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        style={{ border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: C.border }}>
          <h3 className="font-bold text-base" style={{ color: C.navy }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={17} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="p-3 rounded-2xl mb-3" style={{ background: C.page }}>
        <Icon size={22} style={{ color: C.muted }} />
      </div>
      <p className="text-sm" style={{ color: C.muted }}>{text}</p>
    </div>
  );
}

function MoneyHint({ amount }) {
  const words = arabicMoneyWords(amount);
  if (!words) return null;
  return <div className="text-xs mt-1 leading-relaxed" style={{ color: C.teal }}>= {words}</div>;
}

function EditableDate({ ts, onChange }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(toInputDate(ts));
  if (editing) {
    return (
      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="date"
          autoFocus
          className="text-xs rounded-lg border px-1.5 py-0.5 outline-none"
          style={{ borderColor: C.teal, fontFamily: MONO }}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button onClick={() => { onChange(fromInputDate(val, ts)); setEditing(false); }} className="p-1 rounded-lg" style={{ background: C.successSoft, color: C.success }}><CheckCircle2 size={12} /></button>
        <button onClick={() => setEditing(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={12} /></button>
      </span>
    );
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setVal(toInputDate(ts)); setEditing(true); }}
      className="inline-flex items-center gap-1 hover:underline"
      title="تعديل التاريخ"
      type="button"
    >
      {fmtDate(ts)} <Pencil size={11} style={{ color: C.muted }} />
    </button>
  );
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium" style={{ color: C.danger }}>تأكيد الحذف؟</span>
      <button onClick={onConfirm} className="p-1.5 rounded-lg" style={{ background: C.dangerSoft, color: C.danger }}><CheckCircle2 size={14} /></button>
      <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={14} /></button>
    </div>
  );
}

/* ---------------------------------- الرئيسية ---------------------------------- */
function DashboardView({ products, customers, sales, setTab, showToast, exportBackup, triggerImport }) {
  const today = startOfDay(Date.now());
  const todaySales = sales.filter((s) => startOfDay(s.date) === today);
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);

  const activeInst = sales.filter((s) => s.paymentType === "installment" && s.status === "active");
  const outstanding = activeInst.reduce((a, s) => a + s.installment.remaining, 0);

  const lowStock = products.filter((p) => p.qty <= (p.minQty ?? 3));

  const totalProfit = sales.reduce(
    (a, s) => a + s.items.reduce((x, it) => x + (it.price - it.cost) * it.qty, 0),
    0
  );

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = today - i * DAY;
      const total = sales.filter((s) => startOfDay(s.date) === d).reduce((a, s) => a + s.total, 0);
      days.push({ day: new Date(d).toLocaleDateString("ar-IQ", { weekday: "short" }), total });
    }
    return days;
  }, [sales, today]);

  return (
    <div>
      <div
        className="rounded-2xl p-6 mb-8 receipt-notch"
        style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navySoft})`, paddingBottom: 34 }}
      >
        <p className="text-sm" style={{ color: "#9CA3C4" }}>{new Date().toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <h1 className="text-2xl font-bold text-white mt-1 mb-5">مرحباً بيك بمحلك 👋</h1>
        <div className="flex flex-wrap gap-3">
          <StatCard dark icon={Banknote} label="مبيعات اليوم" value={money(todayTotal)} sub={`${todaySales.length} فاتورة`} />
          <StatCard dark icon={Wallet} label="أقساط متبقية" value={money(outstanding)} sub={`${activeInst.length} عقد نشط`} />
          <StatCard dark icon={TrendingUp} label="إجمالي الأرباح" value={money(totalProfit)} sub="منذ البداية" />
          <StatCard dark icon={AlertTriangle} label="نواقص المخزون" value={lowStock.length} sub="صنف تحت الحد الأدنى" />
        </div>
      </div>


      <TileMenu setTab={setTab} products={products} sales={sales} showToast={showToast} exportBackup={exportBackup} triggerImport={triggerImport} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <h3 className="font-bold mb-4" style={{ color: C.navy }}>مبيعات آخر ٧ أيام</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(v) => [money(v) + " د.ع", "المبيعات"]}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 12, direction: "rtl" }}
                />
                <Bar dataKey="total" fill={C.teal} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <h3 className="font-bold mb-4" style={{ color: C.navy }}>نواقص المخزون</h3>
          {lowStock.length === 0 ? (
            <p className="text-sm" style={{ color: C.muted }}>لا توجد نواقص حالياً 👍</p>
          ) : (
            <div className="space-y-2 max-h-[190px] overflow-y-auto">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: C.text }}>{p.name}</span>
                  <span className="font-bold px-2 py-0.5 rounded-lg" style={{ background: C.dangerSoft, color: C.danger, fontFamily: MONO }}>{p.qty}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setTab("inventory")} className="text-xs font-semibold mt-4" style={{ color: C.teal }}>إدارة المخزون ←</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- المخزون ---------------------------------- */
function InventoryView({ products, addProduct, updateProduct, deleteProduct }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("الكل");
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const filtered = products.filter(
    (p) =>
      (cat === "الكل" || p.category === cat) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || (p.barcode || "").includes(q))
  );

  function openAdd() { setModal({ mode: "add", data: { name: "", category: CATEGORIES[0], brand: "", costPrice: "", sellPrice: "", qty: "", minQty: 3, barcode: "" } }); }
  function openEdit(p) { setModal({ mode: "edit", data: { ...p } }); }

  function submit(e) {
    e.preventDefault();
    const d = modal.data;
    if (!d.name.trim()) return;
    const payload = {
      name: d.name.trim(),
      category: d.category,
      brand: d.brand,
      costPrice: Number(d.costPrice) || 0,
      sellPrice: Number(d.sellPrice) || 0,
      qty: Number(d.qty) || 0,
      minQty: Number(d.minQty) || 3,
      barcode: d.barcode,
    };
    if (modal.mode === "add") addProduct(payload);
    else updateProduct(d.id, payload);
    setModal(null);
  }

  return (
    <div>
      <PageHeader
        title="المخزون"
        subtitle={`${products.length} صنف`}
        action={<PrimaryButton icon={Plus} onClick={openAdd}>إضافة منتج</PrimaryButton>}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          <input className={inputCls} style={{ ...inputStyle, paddingRight: 32 }} placeholder="بحث بالاسم أو الباركود..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={inputCls} style={{ ...inputStyle, width: 160 }} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>الكل</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} text="ما لكيت أي منتج. ضيف منتج جديد للبدء." />
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: C.page }}>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: C.muted }}>المنتج</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: C.muted }}>الفئة</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: C.muted }}>الشراء</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: C.muted }}>البيع</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: C.muted }}>الكمية</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: C.text }}>{p.name}</div>
                    {p.brand && <div className="text-xs" style={{ color: C.muted }}>{p.brand}</div>}
                  </td>
                  <td className="px-4 py-3" style={{ color: C.muted }}>{p.category}</td>
                  <td className="px-4 py-3" style={{ fontFamily: MONO, color: C.muted }}>{money(p.costPrice)}</td>
                  <td className="px-4 py-3 font-semibold" style={{ fontFamily: MONO, color: C.navy }}>{money(p.sellPrice)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-lg font-bold"
                      style={{
                        fontFamily: MONO,
                        background: p.qty <= (p.minQty ?? 3) ? C.dangerSoft : C.successSoft,
                        color: p.qty <= (p.minQty ?? 3) ? C.danger : C.success,
                      }}
                    >
                      {p.qty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {confirmId === p.id ? (
                      <ConfirmDelete onConfirm={() => { deleteProduct(p.id); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil size={14} style={{ color: C.muted }} /></button>
                        <button onClick={() => setConfirmId(p.id)} className="p-1.5 rounded-lg hover:bg-gray-100"><Trash2 size={14} style={{ color: C.danger }} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "add" ? "إضافة منتج" : "تعديل منتج"} onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            <Field label="اسم المنتج">
              <input className={inputCls} style={inputStyle} required value={modal.data.name} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الفئة">
                <select className={inputCls} style={inputStyle} value={modal.data.category} onChange={(e) => setModal({ ...modal, data: { ...modal.data, category: e.target.value } })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="الماركة (اختياري)">
                <input className={inputCls} style={inputStyle} value={modal.data.brand} onChange={(e) => setModal({ ...modal, data: { ...modal.data, brand: e.target.value } })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="سعر الشراء">
                <input type="number" min="0" className={inputCls} style={inputStyle} value={modal.data.costPrice} onChange={(e) => setModal({ ...modal, data: { ...modal.data, costPrice: e.target.value } })} />
                <MoneyHint amount={modal.data.costPrice} />
              </Field>
              <Field label="سعر البيع">
                <input type="number" min="0" className={inputCls} style={inputStyle} required value={modal.data.sellPrice} onChange={(e) => setModal({ ...modal, data: { ...modal.data, sellPrice: e.target.value } })} />
                <MoneyHint amount={modal.data.sellPrice} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الكمية">
                <input type="number" min="0" className={inputCls} style={inputStyle} required value={modal.data.qty} onChange={(e) => setModal({ ...modal, data: { ...modal.data, qty: e.target.value } })} />
              </Field>
              <Field label="حد التنبيه الأدنى">
                <input type="number" min="0" className={inputCls} style={inputStyle} value={modal.data.minQty} onChange={(e) => setModal({ ...modal, data: { ...modal.data, minQty: e.target.value } })} />
              </Field>
            </div>
            <Field label="الباركود (اختياري)">
              <input className={inputCls} style={inputStyle} value={modal.data.barcode} onChange={(e) => setModal({ ...modal, data: { ...modal.data, barcode: e.target.value } })} />
            </Field>
            <PrimaryButton type="submit" full>{modal.mode === "add" ? "إضافة" : "حفظ التعديلات"}</PrimaryButton>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------ البيع ------------------------------------ */
function POSView({ products, customers, addSale, addCustomer, showToast }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState("cash");
  const [downPayment, setDownPayment] = useState(0);
  const [months, setMonths] = useState(3);
  const [quickCustomer, setQuickCustomer] = useState(null);
  const [saleDate, setSaleDate] = useState(toInputDate(Date.now()));

  const results = q.length > 0 ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.barcode || "").includes(q)).slice(0, 8) : [];

  function addToCart(p) {
    if (p.qty <= 0) return showToast("هذا المنتج نافذ من المخزون", "error");
    setCart((c) => {
      const existing = c.find((it) => it.productId === p.id);
      if (existing) {
        if (existing.qty >= p.qty) { showToast("الكمية المتوفرة غير كافية", "error"); return c; }
        return c.map((it) => it.productId === p.id ? { ...it, qty: it.qty + 1 } : it);
      }
      return [...c, { productId: p.id, name: p.name, price: p.sellPrice, cost: p.costPrice, qty: 1, stock: p.qty }];
    });
    setQ("");
  }

  function changeQty(id, delta) {
    setCart((c) => c.map((it) => {
      if (it.productId !== id) return it;
      const next = it.qty + delta;
      if (next < 1) return it;
      if (next > it.stock) { showToast("الكمية المتوفرة غير كافية", "error"); return it; }
      return { ...it, qty: next };
    }));
  }
  function removeItem(id) { setCart((c) => c.filter((it) => it.productId !== id)); }

  const subtotal = cart.reduce((a, it) => a + it.price * it.qty, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const dp = Math.min(Number(downPayment || 0), total);
  const monthlyAmount = paymentType === "installment" && months > 0 ? Math.ceil((total - dp) / months) : 0;

  const selectedCustomer = customers.find((c) => c.id === customerId);

  function submitSale() {
    if (cart.length === 0) return showToast("السلة فارغة", "error");
    if (paymentType === "installment" && !selectedCustomer) return showToast("لازم تختار زبون مسجل للبيع بالتقسيط", "error");
    if (paymentType === "installment" && months < 1) return showToast("عدد الأشهر لازم يكون ١ أو أكثر", "error");

    const saleTs = fromInputDate(saleDate);
    const sale = {
      id: uid(),
      date: saleTs,
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customerName: selectedCustomer ? selectedCustomer.name : (walkInName.trim() || "زبون نقدي"),
      items: cart.map((it) => ({ productId: it.productId, name: it.name, price: it.price, cost: it.cost, qty: it.qty })),
      subtotal,
      discount: Number(discount || 0),
      total,
      paymentType,
      paidAmount: paymentType === "cash" ? total : dp,
      installment: paymentType === "installment" ? {
        months: Number(months), monthlyAmount, downPayment: dp, startDate: saleTs, payments: [], remaining: total - dp,
      } : null,
      status: paymentType === "cash" ? "paid" : (total - dp <= 0 ? "completed" : "active"),
    };
    addSale(sale);
    setCart([]); setCustomerId(""); setWalkInName(""); setDiscount(0); setPaymentType("cash"); setDownPayment(0); setMonths(3); setSaleDate(toInputDate(Date.now()));
  }

  return (
    <div>
      <PageHeader title="فاتورة بيع جديدة" subtitle="ضيف المنتجات وحدد نوع الدفع" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <div className="relative mb-4">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
            <input autoFocus className={inputCls} style={{ ...inputStyle, paddingRight: 34 }} placeholder="دور على منتج بالاسم أو الباركود..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {results.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: C.border }}>
              {results.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 border-t first:border-t-0" style={{ borderColor: C.border }}>
                  <span style={{ color: C.text }}>{p.name}</span>
                  <span className="flex items-center gap-3">
                    <span style={{ fontFamily: MONO, color: C.navy }}>{money(p.sellPrice)} د.ع</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: p.qty > 0 ? C.successSoft : C.dangerSoft, color: p.qty > 0 ? C.success : C.danger }}>متوفر {p.qty}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <h4 className="text-xs font-bold mb-3" style={{ color: C.muted }}>السلة ({cart.length})</h4>
          {cart.length === 0 ? (
            <EmptyState icon={ShoppingCart} text="السلة فارغة، دور على منتج وضيفه." />
          ) : (
            <div className="space-y-2">
              {cart.map((it) => (
                <div key={it.productId} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: C.page }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: C.text }}>{it.name}</div>
                    <div className="text-xs" style={{ color: C.muted, fontFamily: MONO }}>{money(it.price)} د.ع × {it.qty}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(it.productId, -1)} className="p-1 rounded-lg bg-white border" style={{ borderColor: C.border }}><Minus size={13} /></button>
                    <span className="text-sm font-bold w-5 text-center" style={{ fontFamily: MONO }}>{it.qty}</span>
                    <button onClick={() => changeQty(it.productId, 1)} className="p-1 rounded-lg bg-white border" style={{ borderColor: C.border }}><Plus size={13} /></button>
                    <button onClick={() => removeItem(it.productId)} className="p-1.5 rounded-lg hover:bg-white"><Trash2 size={14} style={{ color: C.danger }} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 h-fit" style={{ border: `1px solid ${C.border}` }}>
          <Field label="تاريخ الفاتورة">
            <input type="date" className={inputCls} style={{ ...inputStyle, fontFamily: MONO }} value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
          </Field>
          <Field label="الزبون">
            <select className={inputCls} style={inputStyle} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">زبون نقدي (بدون تسجيل)</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {!customerId && (
            <Field label="اسم الزبون (اختياري)">
              <input className={inputCls} style={inputStyle} placeholder="زبون نقدي" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} />
            </Field>
          )}
          <button onClick={() => setQuickCustomer({ name: "", phone: "" })} className="text-xs font-semibold mb-4" style={{ color: C.teal }}>+ تسجيل زبون جديد</button>

          <Field label="خصم (د.ع)">
            <input type="number" min="0" className={inputCls} style={inputStyle} value={discount} onChange={(e) => setDiscount(e.target.value)} />
            <MoneyHint amount={discount} />
          </Field>

          <Field label="نوع الدفع">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentType("cash")} className="rounded-xl py-2 text-sm font-semibold border" style={{ background: paymentType === "cash" ? C.teal : "#fff", color: paymentType === "cash" ? "#fff" : C.navy, borderColor: paymentType === "cash" ? C.teal : C.border }}>نقدي</button>
              <button onClick={() => setPaymentType("installment")} className="rounded-xl py-2 text-sm font-semibold border" style={{ background: paymentType === "installment" ? C.amber : "#fff", color: paymentType === "installment" ? "#fff" : C.navy, borderColor: paymentType === "installment" ? C.amber : C.border }}>تقسيط</button>
            </div>
          </Field>

          {paymentType === "installment" && (
            <>
              <Field label="الدفعة الأولى (د.ع)">
                <input type="number" min="0" className={inputCls} style={inputStyle} value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
                <MoneyHint amount={downPayment} />
              </Field>
              <Field label="عدد الأشهر">
                <input type="number" min="1" className={inputCls} style={inputStyle} value={months} onChange={(e) => setMonths(e.target.value)} />
              </Field>
              <div className="rounded-xl px-3 py-2.5 mb-3 text-sm flex items-center justify-between" style={{ background: C.amberSoft }}>
                <span style={{ color: C.navy }}>القسط الشهري</span>
                <span className="font-bold" style={{ fontFamily: MONO, color: C.amberDark || "#B76E00" }}>{money(monthlyAmount)} د.ع</span>
              </div>
            </>
          )}

          <div className="pt-3 mb-4 receipt-notch-top" style={{ borderTop: `1px dashed ${C.border}` }}>
            <div className="flex justify-between text-sm mb-1" style={{ color: C.muted }}>
              <span>المجموع الفرعي</span><span style={{ fontFamily: MONO }}>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2" style={{ color: C.muted }}>
              <span>الخصم</span><span style={{ fontFamily: MONO }}>-{money(discount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold" style={{ color: C.navy }}>
              <span>الإجمالي</span><span style={{ fontFamily: MONO }}>{money(total)} د.ع</span>
            </div>
            <MoneyHint amount={total} />
          </div>

          <PrimaryButton full icon={CheckCircle2} onClick={submitSale}>إتمام البيع</PrimaryButton>
        </div>
      </div>

      {quickCustomer && (
        <Modal title="تسجيل زبون جديد" onClose={() => setQuickCustomer(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (!quickCustomer.name.trim()) return; const c = await addCustomer({ name: quickCustomer.name.trim(), phone: quickCustomer.phone, address: "", notes: "" }); setCustomerId(c.id); setQuickCustomer(null); }}>
            <Field label="اسم الزبون">
              <input className={inputCls} style={inputStyle} required value={quickCustomer.name} onChange={(e) => setQuickCustomer({ ...quickCustomer, name: e.target.value })} />
            </Field>
            <Field label="رقم الهاتف">
              <input className={inputCls} style={inputStyle} value={quickCustomer.phone} onChange={(e) => setQuickCustomer({ ...quickCustomer, phone: e.target.value })} />
            </Field>
            <PrimaryButton type="submit" full>إضافة</PrimaryButton>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- الأقساط --------------------------------- */
function InstallmentsView({ sales, recordPayment, updateSaleDate, updatePaymentDate }) {
  const [filter, setFilter] = useState("active");
  const [payingId, setPayingId] = useState(null);
  const [amount, setAmount] = useState(0);
  const [payDate, setPayDate] = useState(toInputDate(Date.now()));
  const [historyOpen, setHistoryOpen] = useState(null);

  const list = sales.filter((s) => s.paymentType === "installment" && (filter === "all" || s.status === filter));

  function isOverdue(s) {
    if (s.status !== "active") return false;
    const monthsElapsed = Math.floor((Date.now() - s.installment.startDate) / (30 * DAY));
    return monthsElapsed > s.installment.payments.length;
  }

  return (
    <div>
      <PageHeader title="الأقساط" subtitle="تابع الديون والدفعات الشهرية" />
      <div className="flex gap-2 mb-4">
        {[["active", "نشطة"], ["completed", "مكتملة"], ["all", "الكل"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className="px-3.5 py-1.5 rounded-xl text-sm font-semibold" style={{ background: filter === k ? C.navy : "#fff", color: filter === k ? "#fff" : C.navy, border: `1px solid ${filter === k ? C.navy : C.border}` }}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Wallet} text="ماكو عقود تقسيط بهذا التصنيف." />
      ) : (
        <div className="space-y-3">
          {list.map((s) => {
            const paidPct = Math.min(100, Math.round(((s.total - s.installment.remaining) / s.total) * 100));
            const overdue = isOverdue(s);
            return (
              <div key={s.id} className="bg-white rounded-2xl p-4" style={{ border: `1px solid ${overdue ? C.danger + "55" : C.border}` }}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <div className="font-bold" style={{ color: C.navy }}>{s.customerName}</div>
                    <div className="text-xs flex items-center gap-1 flex-wrap" style={{ color: C.muted }}>
                      <EditableDate ts={s.date} onChange={(nd) => updateSaleDate(s.id, nd)} /> · {s.installment.months} أشهر · قسط {money(s.installment.monthlyAmount)} د.ع
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: C.dangerSoft, color: C.danger }}>متأخر</span>}
                    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: s.status === "completed" ? C.successSoft : C.amberSoft, color: s.status === "completed" ? C.success : "#B76E00" }}>
                      {s.status === "completed" ? "مكتمل" : "نشط"}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full mb-2" style={{ background: C.page }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${paidPct}%`, background: C.teal }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: C.muted }}>مدفوع {money(s.total - s.installment.remaining)} من {money(s.total)}</span>
                  <span className="font-bold" style={{ color: C.danger, fontFamily: MONO }}>متبقي {money(s.installment.remaining)} د.ع</span>
                </div>

                {s.status === "active" && (
                  payingId === s.id ? (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="number" className={inputCls} style={{ ...inputStyle, width: 120 }} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="المبلغ" />
                        <input type="date" className={inputCls} style={{ ...inputStyle, width: 150, fontFamily: MONO }} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                        <PrimaryButton onClick={() => { const amt = Math.min(Number(amount) || 0, s.installment.remaining); if (amt > 0) recordPayment(s.id, amt, fromInputDate(payDate)); setPayingId(null); }}>تأكيد</PrimaryButton>
                        <GhostButton onClick={() => setPayingId(null)}>إلغاء</GhostButton>
                      </div>
                      <MoneyHint amount={amount} />
                    </div>
                  ) : (
                    <button onClick={() => { setPayingId(s.id); setAmount(Math.min(s.installment.monthlyAmount, s.installment.remaining)); setPayDate(toInputDate(Date.now())); }} className="mt-3 text-xs font-bold" style={{ color: C.teal }}>+ تسجيل دفعة</button>
                  )
                )}

                {s.installment.payments.length > 0 && (
                  <div className="mt-2">
                    <button onClick={() => setHistoryOpen(historyOpen === s.id ? null : s.id)} className="text-xs font-medium" style={{ color: C.muted }}>
                      {historyOpen === s.id ? "إخفاء سجل الدفعات ▲" : `عرض سجل الدفعات (${s.installment.payments.length}) ▼`}
                    </button>
                    {historyOpen === s.id && (
                      <div className="mt-2 space-y-1.5 rounded-xl p-2.5" style={{ background: C.page }}>
                        {s.installment.payments.map((pmt) => (
                          <div key={pmt.id} className="flex items-center justify-between text-xs">
                            <EditableDate ts={pmt.date} onChange={(nd) => updatePaymentDate(s.id, pmt.id, nd)} />
                            <span className="font-semibold" style={{ fontFamily: MONO, color: C.navy }}>{money(pmt.amount)} د.ع</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- العملاء --------------------------------- */
function CustomersView({ customers, sales, addCustomer, updateCustomer, deleteCustomer, updateSaleDate }) {
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  function openAdd() { setModal({ mode: "add", data: { name: "", phone: "", address: "", notes: "" } }); }
  function openEdit(c) { setModal({ mode: "edit", data: { ...c } }); }
  function submit(e) {
    e.preventDefault();
    if (!modal.data.name.trim()) return;
    if (modal.mode === "add") addCustomer(modal.data);
    else updateCustomer(modal.data.id, modal.data);
    setModal(null);
  }

  return (
    <div>
      <PageHeader title="العملاء" subtitle={`${customers.length} عميل`} action={<PrimaryButton icon={Plus} onClick={openAdd}>عميل جديد</PrimaryButton>} />
      {customers.length === 0 ? (
        <EmptyState icon={Users} text="ما عندك زبائن مسجلين لحد الآن." />
      ) : (
        <div className="space-y-3">
          {customers.map((c) => {
            const cSales = sales.filter((s) => s.customerId === c.id);
            const totalPurchases = cSales.reduce((a, s) => a + s.total, 0);
            const outstanding = cSales.filter((s) => s.paymentType === "installment" && s.status === "active").reduce((a, s) => a + s.installment.remaining, 0);
            return (
              <div key={c.id} className="bg-white rounded-2xl p-4" style={{ border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                    <div className="font-bold" style={{ color: C.navy }}>{c.name}</div>
                    <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: C.muted }}>{c.phone && <><Phone size={11} />{c.phone}</>}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs" style={{ color: C.muted }}>مشتريات</div>
                      <div className="font-bold text-sm" style={{ fontFamily: MONO, color: C.navy }}>{money(totalPurchases)}</div>
                    </div>
                    {outstanding > 0 && (
                      <div className="text-right">
                        <div className="text-xs" style={{ color: C.muted }}>عليه</div>
                        <div className="font-bold text-sm" style={{ fontFamily: MONO, color: C.danger }}>{money(outstanding)}</div>
                      </div>
                    )}
                    {confirmId === c.id ? (
                      <ConfirmDelete onConfirm={() => { deleteCustomer(c.id); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil size={14} style={{ color: C.muted }} /></button>
                        <button onClick={() => setConfirmId(c.id)} className="p-1.5 rounded-lg hover:bg-gray-100"><Trash2 size={14} style={{ color: C.danger }} /></button>
                      </div>
                    )}
                  </div>
                </div>
                {expanded === c.id && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: C.border }}>
                    {cSales.length === 0 ? (
                      <p className="text-xs" style={{ color: C.muted }}>ماكو مشتريات مسجلة.</p>
                    ) : cSales.map((s) => (
                      <div key={s.id} className="flex justify-between text-xs py-1" style={{ color: C.muted }}>
                        <span className="flex items-center gap-1"><EditableDate ts={s.date} onChange={(nd) => updateSaleDate(s.id, nd)} /> · {s.paymentType === "cash" ? "نقدي" : "تقسيط"}</span>
                        <span style={{ fontFamily: MONO }}>{money(s.total)} د.ع</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "add" ? "عميل جديد" : "تعديل بيانات العميل"} onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            <Field label="الاسم"><input className={inputCls} style={inputStyle} required value={modal.data.name} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} /></Field>
            <Field label="رقم الهاتف"><input className={inputCls} style={inputStyle} value={modal.data.phone} onChange={(e) => setModal({ ...modal, data: { ...modal.data, phone: e.target.value } })} /></Field>
            <Field label="العنوان"><input className={inputCls} style={inputStyle} value={modal.data.address} onChange={(e) => setModal({ ...modal, data: { ...modal.data, address: e.target.value } })} /></Field>
            <Field label="ملاحظات"><textarea className={inputCls} style={inputStyle} rows={2} value={modal.data.notes} onChange={(e) => setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })} /></Field>
            <PrimaryButton type="submit" full>{modal.mode === "add" ? "إضافة" : "حفظ"}</PrimaryButton>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------- الموردين -------------------------------- */
function SuppliersView({ suppliers, purchases, addSupplier, updateSupplier, deleteSupplier }) {
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  function openAdd() { setModal({ mode: "add", data: { name: "", phone: "", notes: "" } }); }
  function openEdit(s) { setModal({ mode: "edit", data: { ...s } }); }
  function submit(e) {
    e.preventDefault();
    if (!modal.data.name.trim()) return;
    if (modal.mode === "add") addSupplier(modal.data);
    else updateSupplier(modal.data.id, modal.data);
    setModal(null);
  }

  return (
    <div>
      <PageHeader title="الموردين" subtitle={`${suppliers.length} مورد`} action={<PrimaryButton icon={Plus} onClick={openAdd}>مورد جديد</PrimaryButton>} />
      {suppliers.length === 0 ? (
        <EmptyState icon={Truck} text="ما عندك موردين مسجلين لحد الآن." />
      ) : (
        <div className="space-y-3">
          {suppliers.map((s) => {
            const total = purchases.filter((p) => p.supplierId === s.id).reduce((a, p) => a + p.total, 0);
            const owed = purchases.filter((p) => p.supplierId === s.id && p.remaining > 0).reduce((a, p) => a + p.remaining, 0);
            return (
              <div key={s.id} className="bg-white rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2" style={{ border: `1px solid ${C.border}` }}>
                <div>
                  <div className="font-bold" style={{ color: C.navy }}>{s.name}</div>
                  <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: C.muted }}>{s.phone && <><Phone size={11} />{s.phone}</>}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs" style={{ color: C.muted }}>إجمالي المشتريات</div>
                    <div className="font-bold text-sm" style={{ fontFamily: MONO, color: C.navy }}>{money(total)}</div>
                  </div>
                  {owed > 0 && (
                    <div className="text-right">
                      <div className="text-xs" style={{ color: C.muted }}>عليك له</div>
                      <div className="font-bold text-sm" style={{ fontFamily: MONO, color: C.danger }}>{money(owed)}</div>
                    </div>
                  )}
                  {confirmId === s.id ? (
                    <ConfirmDelete onConfirm={() => { deleteSupplier(s.id); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil size={14} style={{ color: C.muted }} /></button>
                      <button onClick={() => setConfirmId(s.id)} className="p-1.5 rounded-lg hover:bg-gray-100"><Trash2 size={14} style={{ color: C.danger }} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {modal && (
        <Modal title={modal.mode === "add" ? "مورد جديد" : "تعديل المورد"} onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            <Field label="اسم المورد"><input className={inputCls} style={inputStyle} required value={modal.data.name} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} /></Field>
            <Field label="رقم الهاتف"><input className={inputCls} style={inputStyle} value={modal.data.phone} onChange={(e) => setModal({ ...modal, data: { ...modal.data, phone: e.target.value } })} /></Field>
            <Field label="ملاحظات"><textarea className={inputCls} style={inputStyle} rows={2} value={modal.data.notes} onChange={(e) => setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })} /></Field>
            <PrimaryButton type="submit" full>{modal.mode === "add" ? "إضافة" : "حفظ"}</PrimaryButton>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------- المشتريات -------------------------------- */
function PurchasesView({ purchases, products, suppliers, addPurchase, addSupplier, addProduct, updatePurchaseDate, recordSupplierPayment, showToast }) {
  const [supplierId, setSupplierId] = useState("");
  const [cart, setCart] = useState([]);
  const [q, setQ] = useState("");
  const [quickSupplier, setQuickSupplier] = useState(null);
  const [quickProduct, setQuickProduct] = useState(null);
  const [purchaseDate, setPurchaseDate] = useState(toInputDate(Date.now()));
  const [paymentType, setPaymentType] = useState("cash");
  const [paidNow, setPaidNow] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(toInputDate(Date.now()));

  const results = q.length > 0 ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];

  function addToCart(p) {
    setCart((c) => {
      if (c.find((it) => it.productId === p.id)) return c;
      return [...c, { productId: p.id, name: p.name, cost: p.costPrice, qty: 1 }];
    });
    setQ("");
  }
  function updateItem(id, patch) { setCart((c) => c.map((it) => it.productId === id ? { ...it, ...patch } : it)); }
  function removeItem(id) { setCart((c) => c.filter((it) => it.productId !== id)); }

  const total = cart.reduce((a, it) => a + Number(it.cost || 0) * Number(it.qty || 0), 0);
  const paid = paymentType === "cash" ? total : Math.min(Number(paidNow || 0), total);
  const remaining = total - paid;

  function submit() {
    if (!supplierId) return showToast("اختر المورد أولاً", "error");
    if (cart.length === 0) return showToast("ضيف منتجات للفاتورة", "error");
    const supplier = suppliers.find((s) => s.id === supplierId);
    addPurchase({
      id: uid(), date: fromInputDate(purchaseDate), supplierId, supplierName: supplier.name,
      items: cart.map((it) => ({ productId: it.productId, name: it.name, qty: Number(it.qty) || 0, cost: Number(it.cost) || 0 })),
      total, paymentType, paid, remaining, payments: [],
      status: remaining <= 0 ? "paid" : "open",
    });
    setCart([]); setSupplierId(""); setPurchaseDate(toInputDate(Date.now())); setPaymentType("cash"); setPaidNow(0);
  }

  return (
    <div>
      <PageHeader title="المشتريات" subtitle="سجل فواتير الشراء من الموردين وزود المخزون" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <input className={inputCls} style={{ ...inputStyle, paddingRight: 34 }} placeholder="دور على منتج موجود..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button onClick={() => setQuickProduct({ name: q, category: CATEGORIES[0], costPrice: "", sellPrice: "", qty: 1 })} className="flex items-center gap-1 px-3 rounded-xl text-sm font-semibold shrink-0" style={{ background: C.tealSoft, color: C.teal }}>
              <Plus size={15} /> منتج جديد
            </button>
          </div>
          {results.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: C.border }}>
              {results.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 border-t first:border-t-0" style={{ borderColor: C.border }}>
                  <span style={{ color: C.text }}>{p.name}</span>
                  <span style={{ fontFamily: MONO, color: C.muted }}>مخزون حالي: {p.qty}</span>
                </button>
              ))}
            </div>
          )}
          {q.length > 0 && results.length === 0 && (
            <p className="text-xs mb-4" style={{ color: C.muted }}>ماكو منتج بهذا الاسم بالمخزون — اضغط "منتج جديد" لإضافته.</p>
          )}
          {cart.length === 0 ? (
            <EmptyState icon={Truck} text="ضيف منتجات للفاتورة." />
          ) : (
            <div className="space-y-2">
              {cart.map((it) => (
                <div key={it.productId} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: C.page }}>
                  <span className="flex-1 text-sm font-medium" style={{ color: C.text }}>{it.name}</span>
                  <input type="number" min="1" className={inputCls} style={{ ...inputStyle, width: 80, background: "#fff" }} value={it.qty} onChange={(e) => updateItem(it.productId, { qty: e.target.value })} placeholder="كمية" />
                  <input type="number" min="0" className={inputCls} style={{ ...inputStyle, width: 110, background: "#fff" }} value={it.cost} onChange={(e) => updateItem(it.productId, { cost: e.target.value })} placeholder="سعر الشراء" />
                  <button onClick={() => removeItem(it.productId)} className="p-1.5 rounded-lg hover:bg-white"><Trash2 size={14} style={{ color: C.danger }} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 h-fit" style={{ border: `1px solid ${C.border}` }}>
          <Field label="تاريخ الفاتورة">
            <input type="date" className={inputCls} style={{ ...inputStyle, fontFamily: MONO }} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </Field>
          <Field label="المورد">
            <select className={inputCls} style={inputStyle} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">اختر المورد</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <button onClick={() => setQuickSupplier({ name: "", phone: "" })} className="text-xs font-semibold mb-4" style={{ color: C.teal }}>+ مورد جديد</button>

          <Field label="طريقة الدفع">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentType("cash")} className="rounded-xl py-2 text-sm font-semibold border" style={{ background: paymentType === "cash" ? C.teal : "#fff", color: paymentType === "cash" ? "#fff" : C.navy, borderColor: paymentType === "cash" ? C.teal : C.border }}>نقد</button>
              <button onClick={() => setPaymentType("credit")} className="rounded-xl py-2 text-sm font-semibold border" style={{ background: paymentType === "credit" ? C.amber : "#fff", color: paymentType === "credit" ? "#fff" : C.navy, borderColor: paymentType === "credit" ? C.amber : C.border }}>آجل (دين)</button>
            </div>
          </Field>
          {paymentType === "credit" && (
            <Field label="المبلغ المدفوع الآن (اختياري)">
              <input type="number" min="0" className={inputCls} style={inputStyle} value={paidNow} onChange={(e) => setPaidNow(e.target.value)} />
              <MoneyHint amount={paidNow} />
            </Field>
          )}

          <div className="pt-3 mb-4" style={{ borderTop: `1px dashed ${C.border}` }}>
            <div className="flex justify-between text-lg font-bold" style={{ color: C.navy }}>
              <span>الإجمالي</span><span style={{ fontFamily: MONO }}>{money(total)} د.ع</span>
            </div>
            <MoneyHint amount={total} />
            {paymentType === "credit" && (
              <div className="flex justify-between text-sm mt-1" style={{ color: C.danger }}>
                <span>متبقي بذمتك للمورد</span><span style={{ fontFamily: MONO }}>{money(remaining)} د.ع</span>
              </div>
            )}
          </div>
          <PrimaryButton full icon={CheckCircle2} onClick={submit}>حفظ فاتورة الشراء</PrimaryButton>
        </div>
      </div>

      <h3 className="font-bold mt-8 mb-3" style={{ color: C.navy }}>سجل المشتريات</h3>
      {purchases.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>ماكو فواتير شراء مسجلة.</p>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-3.5" style={{ border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between flex-wrap gap-2 cursor-pointer" onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                <div className="text-sm">
                  <span className="font-semibold" style={{ color: C.navy }}>{p.supplierName}</span>
                  <span className="mx-2" style={{ color: C.muted }}>·</span>
                  <span style={{ color: C.muted }}><EditableDate ts={p.date} onChange={(nd) => updatePurchaseDate(p.id, nd)} /></span>
                  <span className="mx-2" style={{ color: C.muted }}>·</span>
                  <span style={{ color: C.muted }}>{p.items.length} صنف</span>
                  {p.paymentType === "credit" && (
                    <span className="mx-2 text-xs px-2 py-0.5 rounded-lg" style={{ background: p.remaining > 0 ? C.dangerSoft : C.successSoft, color: p.remaining > 0 ? C.danger : C.success }}>
                      {p.remaining > 0 ? `آجل · متبقي ${money(p.remaining)}` : "آجل · مسدد بالكامل"}
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm" style={{ fontFamily: MONO, color: C.navy }}>{money(p.total)} د.ع</span>
              </div>

              {openId === p.id && (
                <div className="mt-3 pt-3 space-y-1" style={{ borderTop: `1px dashed ${C.border}` }}>
                  {p.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-xs" style={{ color: C.muted }}>
                      <span>{it.name} × {it.qty}</span>
                      <span style={{ fontFamily: MONO }}>{money(it.cost * it.qty)}</span>
                    </div>
                  ))}
                  {p.paymentType === "credit" && p.remaining > 0 && (
                    payingId === p.id ? (
                      <div className="flex items-center gap-2 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        <input type="number" className={inputCls} style={{ ...inputStyle, width: 120 }} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="المبلغ" />
                        <input type="date" className={inputCls} style={{ ...inputStyle, width: 150, fontFamily: MONO }} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                        <PrimaryButton onClick={() => { const amt = Math.min(Number(payAmount) || 0, p.remaining); if (amt > 0) recordSupplierPayment(p.id, amt, fromInputDate(payDate)); setPayingId(null); }}>تأكيد</PrimaryButton>
                        <GhostButton onClick={() => setPayingId(null)}>إلغاء</GhostButton>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setPayingId(p.id); setPayAmount(p.remaining); setPayDate(toInputDate(Date.now())); }} className="text-xs font-bold mt-3" style={{ color: C.teal }}>+ تسديد للمورد</button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {quickSupplier && (
        <Modal title="مورد جديد" onClose={() => setQuickSupplier(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (!quickSupplier.name.trim()) return; const s = await addSupplier({ name: quickSupplier.name.trim(), phone: quickSupplier.phone, notes: "" }); setSupplierId(s.id); setQuickSupplier(null); }}>
            <Field label="اسم المورد"><input className={inputCls} style={inputStyle} required value={quickSupplier.name} onChange={(e) => setQuickSupplier({ ...quickSupplier, name: e.target.value })} /></Field>
            <Field label="رقم الهاتف"><input className={inputCls} style={inputStyle} value={quickSupplier.phone} onChange={(e) => setQuickSupplier({ ...quickSupplier, phone: e.target.value })} /></Field>
            <PrimaryButton type="submit" full>إضافة</PrimaryButton>
          </form>
        </Modal>
      )}

      {quickProduct && (
        <Modal title="منتج جديد" onClose={() => setQuickProduct(null)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!quickProduct.name.trim()) return;
            const item = await addProduct({
              name: quickProduct.name.trim(), category: quickProduct.category, brand: "",
              costPrice: Number(quickProduct.costPrice) || 0, sellPrice: Number(quickProduct.sellPrice) || 0,
              qty: 0, minQty: 3, barcode: "",
            });
            setCart((c) => [...c, { productId: item.id, name: item.name, cost: item.costPrice, qty: Number(quickProduct.qty) || 1 }]);
            setQuickProduct(null); setQ("");
          }}>
            <Field label="اسم المنتج"><input className={inputCls} style={inputStyle} required value={quickProduct.name} onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })} /></Field>
            <Field label="الفئة">
              <select className={inputCls} style={inputStyle} value={quickProduct.category} onChange={(e) => setQuickProduct({ ...quickProduct, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="سعر الشراء"><input type="number" min="0" className={inputCls} style={inputStyle} required value={quickProduct.costPrice} onChange={(e) => setQuickProduct({ ...quickProduct, costPrice: e.target.value })} /></Field>
              <Field label="سعر البيع"><input type="number" min="0" className={inputCls} style={inputStyle} required value={quickProduct.sellPrice} onChange={(e) => setQuickProduct({ ...quickProduct, sellPrice: e.target.value })} /></Field>
            </div>
            <Field label="الكمية المشتراة"><input type="number" min="1" className={inputCls} style={inputStyle} value={quickProduct.qty} onChange={(e) => setQuickProduct({ ...quickProduct, qty: e.target.value })} /></Field>
            <PrimaryButton type="submit" full>إضافة للفاتورة</PrimaryButton>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- سند دفع --------------------------------- */
function PaymentVoucherView({ purchases, recordSupplierPayment }) {
  const [filter, setFilter] = useState("open");
  const [payingId, setPayingId] = useState(null);
  const [amount, setAmount] = useState(0);
  const [payDate, setPayDate] = useState(toInputDate(Date.now()));

  const credit = purchases.filter((p) => p.paymentType === "credit");
  const list = credit.filter((p) => filter === "all" || (filter === "open" ? p.remaining > 0 : p.remaining <= 0));
  const totalOwed = credit.filter((p) => p.remaining > 0).reduce((a, p) => a + p.remaining, 0);

  return (
    <div>
      <PageHeader title="سند دفع" subtitle="سدد فواتير الشراء الآجلة المستحقة على المحل للموردين" />

      <div className="rounded-2xl p-4 mb-5" style={{ background: C.navy }}>
        <div className="text-xs" style={{ color: "#9CA3C4" }}>إجمالي الدين المستحق على المحل لكل الموردين</div>
        <div className="text-2xl font-bold text-white mt-1" style={{ fontFamily: MONO }}>{money(totalOwed)} د.ع</div>
      </div>

      <div className="flex gap-2 mb-4">
        {[["open", "مستحقة"], ["paid", "مسددة"], ["all", "الكل"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className="px-3.5 py-1.5 rounded-xl text-sm font-semibold" style={{ background: filter === k ? C.navy : "#fff", color: filter === k ? "#fff" : C.navy, border: `1px solid ${filter === k ? C.navy : C.border}` }}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={ReceiptText} text="ماكو فواتير شراء آجلة بهذا التصنيف." />
      ) : (
        <div className="space-y-3">
          {list.map((p) => {
            const paidPct = Math.min(100, Math.round(((p.total - p.remaining) / p.total) * 100));
            return (
              <div key={p.id} className="bg-white rounded-2xl p-4" style={{ border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <div className="font-bold" style={{ color: C.navy }}>{p.supplierName}</div>
                    <div className="text-xs" style={{ color: C.muted }}>{fmtDate(p.date)} · {p.items.length} صنف · إجمالي {money(p.total)} د.ع</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: p.remaining > 0 ? C.dangerSoft : C.successSoft, color: p.remaining > 0 ? C.danger : C.success }}>
                    {p.remaining > 0 ? "مستحقة" : "مسددة بالكامل"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full mb-2" style={{ background: C.page }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${paidPct}%`, background: C.teal }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: C.muted }}>مدفوع {money(p.total - p.remaining)} من {money(p.total)}</span>
                  {p.remaining > 0 && <span className="font-bold" style={{ color: C.danger, fontFamily: MONO }}>متبقي {money(p.remaining)} د.ع</span>}
                </div>

                {p.remaining > 0 && (
                  payingId === p.id ? (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="number" className={inputCls} style={{ ...inputStyle, width: 130 }} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="المبلغ" />
                        <input type="date" className={inputCls} style={{ ...inputStyle, width: 150, fontFamily: MONO }} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                        <PrimaryButton onClick={() => { const amt = Math.min(Number(amount) || 0, p.remaining); if (amt > 0) recordSupplierPayment(p.id, amt, fromInputDate(payDate)); setPayingId(null); }}>تأكيد الدفع</PrimaryButton>
                        <GhostButton onClick={() => setPayingId(null)}>إلغاء</GhostButton>
                      </div>
                      <MoneyHint amount={amount} />
                    </div>
                  ) : (
                    <button onClick={() => { setPayingId(p.id); setAmount(p.remaining); setPayDate(toInputDate(Date.now())); }} className="mt-3 text-xs font-bold" style={{ color: C.teal }}>+ تسديد للمورد</button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- التقارير --------------------------------- */
function ReportsView({ sales, purchases }) {
  const [period, setPeriod] = useState("all");

  const filteredSales = useMemo(() => {
    if (period === "all") return sales;
    const now = Date.now();
    const cutoff = period === "today" ? startOfDay(now) : period === "week" ? now - 7 * DAY : now - 30 * DAY;
    return sales.filter((s) => s.date >= cutoff);
  }, [sales, period]);

  const revenue = filteredSales.reduce((a, s) => a + s.total, 0);
  const profit = filteredSales.reduce((a, s) => a + s.items.reduce((x, it) => x + (it.price - it.cost) * it.qty, 0), 0);
  const invoiceCount = filteredSales.length;
  const outstanding = sales.filter((s) => s.paymentType === "installment" && s.status === "active").reduce((a, s) => a + s.installment.remaining, 0);

  const topProducts = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => s.items.forEach((it) => { map[it.name] = (map[it.name] || 0) + it.qty; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filteredSales]);
  const maxQty = topProducts[0]?.[1] || 1;

  return (
    <div>
      <PageHeader title="التقارير" subtitle="ملخص الأداء المالي" />
      <div className="flex gap-2 mb-5">
        {[["today", "اليوم"], ["week", "٧ أيام"], ["month", "٣٠ يوم"], ["all", "الكل"]].map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)} className="px-3.5 py-1.5 rounded-xl text-sm font-semibold" style={{ background: period === k ? C.navy : "#fff", color: period === k ? "#fff" : C.navy, border: `1px solid ${period === k ? C.navy : C.border}` }}>{l}</button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard icon={Banknote} label="الإيرادات" value={money(revenue)} accent={C.teal} sub={`${invoiceCount} فاتورة`} />
        <StatCard icon={TrendingUp} label="الأرباح" value={money(profit)} accent={C.success} />
        <StatCard icon={Wallet} label="أقساط متبقية (كل الفترات)" value={money(outstanding)} accent={C.amber} />
      </div>

      <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
        <h3 className="font-bold mb-4" style={{ color: C.navy }}>الأكثر مبيعاً</h3>
        {topProducts.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>ماكو بيانات كافية بعد.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map(([name, qty]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: C.text }}>{name}</span>
                  <span style={{ fontFamily: MONO, color: C.muted }}>{qty}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: C.page }}>
                  <div className="h-2 rounded-full" style={{ width: `${(qty / maxQty) * 100}%`, background: C.teal }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- قائمة بيع --------------------------------- */
function SalesListView({ sales }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [openId, setOpenId] = useState(null);

  const filtered = sales.filter(
    (s) => (type === "all" || s.paymentType === type) && s.customerName.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="قائمة بيع" subtitle={`${sales.length} فاتورة بيع`} />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          <input className={inputCls} style={{ ...inputStyle, paddingRight: 32 }} placeholder="بحث باسم الزبون..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {[["all", "الكل"], ["cash", "نقدي"], ["installment", "تقسيط"]].map(([k, l]) => (
          <button key={k} onClick={() => setType(k)} className="px-3.5 py-1.5 rounded-xl text-sm font-semibold" style={{ background: type === k ? C.navy : "#fff", color: type === k ? "#fff" : C.navy, border: `1px solid ${type === k ? C.navy : C.border}` }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} text="ماكو فواتير مطابقة." />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-3.5" style={{ border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between flex-wrap gap-2 cursor-pointer" onClick={() => setOpenId(openId === s.id ? null : s.id)}>
                <div>
                  <span className="font-semibold text-sm" style={{ color: C.navy }}>{s.customerName}</span>
                  <span className="text-xs mx-2" style={{ color: C.muted }}>{fmtDate(s.date)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: s.paymentType === "cash" ? C.successSoft : C.amberSoft, color: s.paymentType === "cash" ? C.success : "#B76E00" }}>
                    {s.paymentType === "cash" ? "نقدي" : "تقسيط"}
                  </span>
                </div>
                <span className="font-bold" style={{ fontFamily: MONO, color: C.navy }}>{money(s.total)} د.ع</span>
              </div>
              {openId === s.id && (
                <div className="mt-3 pt-3 space-y-1" style={{ borderTop: `1px dashed ${C.border}` }}>
                  {s.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-xs" style={{ color: C.muted }}>
                      <span>{it.name} × {it.qty}</span>
                      <span style={{ fontFamily: MONO }}>{money(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- الوصول السريع (بلاطات) ------------------------------- */
function TileMenu({ setTab, products, sales, showToast, exportBackup, triggerImport }) {
  const [stagnantOpen, setStagnantOpen] = useState(false);

  const stagnant = useMemo(() => {
    const cutoff = Date.now() - 60 * DAY;
    const soldRecently = new Set();
    sales.filter((s) => s.date >= cutoff).forEach((s) => s.items.forEach((it) => soldRecently.add(it.productId)));
    return products.filter((p) => !soldRecently.has(p.id) && p.qty > 0);
  }, [products, sales]);

  const soon = () => showToast("هذه الميزة قريباً 🚧", "info");

  const tiles = [
    { label: "فواتير الانتظار", icon: ClipboardList, color: "#22B8CF", onClick: soon },
    { label: "المواد المستهلكة", icon: TrendingUp, color: "#E8467C", onClick: soon },
    { label: "المواد الراكدة", icon: TrendingDown, color: "#E8467C", onClick: () => setStagnantOpen(true) },
    { label: "قائمة ارجاع بيع", icon: RotateCcw, color: "#E8467C", onClick: soon },
    { label: "قائمة بيع", icon: ClipboardList, color: "#22B8CF", onClick: () => setTab("saleslist") },

    { label: "عرض سعر", icon: FileText, color: "#22B8CF", onClick: soon },
    { label: "أضافة ماده", icon: PackagePlus, color: "#F2994A", onClick: () => setTab("inventory") },
    { label: "عرض المواد", icon: Package, color: "#F2994A", onClick: () => setTab("inventory") },
    { label: "قائمة شراء", icon: Truck, color: "#9B8CF2", onClick: () => setTab("purchases") },
    { label: "نقطة بيع", icon: ShoppingCart, color: "#22B8CF", onClick: () => setTab("pos") },

    { label: "سند دفع", icon: ReceiptText, color: "#3FB27F", onClick: () => setTab("paymentvoucher") },
    { label: "سند قبض", icon: ReceiptText, color: "#3FB27F", onClick: () => setTab("installments") },
    { label: "أضافة حساب", icon: UserPlus, color: "#E0B400", onClick: () => setTab("customers") },
    { label: "كشف مبيعات", icon: BarChart3, color: "#E8467C", onClick: () => setTab("reports") },
    { label: "المخازن", icon: Warehouse, color: "#F2994A", onClick: soon },
    { label: "الموردين", icon: Truck, color: "#9B8CF2", onClick: () => setTab("suppliers") },
    { label: "نسخة احتياطية", icon: Download, color: "#22B8CF", onClick: exportBackup },
    { label: "استيراد نسخة", icon: Upload, color: "#22B8CF", onClick: triggerImport },
  ];

  return (
    <div className="mb-8">
      <h3 className="font-bold mb-4" style={{ color: C.navy }}>الوصول السريع</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <button
            key={t.label}
            onClick={t.onClick}
            className="flex flex-col items-center justify-center gap-2.5 rounded-2xl py-5 px-2 transition hover:opacity-90"
            style={{ background: C.navy }}
          >
            <div className="p-2.5 rounded-xl" style={{ background: t.color + "22" }}>
              <t.icon size={20} style={{ color: t.color }} />
            </div>
            <span className="text-xs font-medium text-white text-center leading-tight">{t.label}</span>
          </button>
        ))}
      </div>

      {stagnantOpen && (
        <Modal title="المواد الراكدة (بلا حركة بيع آخر ٦٠ يوم)" onClose={() => setStagnantOpen(false)}>
          {stagnant.length === 0 ? (
            <p className="text-sm" style={{ color: C.muted }}>ما عندك مواد راكدة حالياً 👍 كل المخزون يتحرك.</p>
          ) : (
            <div className="space-y-2">
              {stagnant.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm rounded-xl px-3 py-2" style={{ background: C.page }}>
                  <span style={{ color: C.text }}>{p.name}</span>
                  <span className="font-bold" style={{ fontFamily: MONO, color: C.amber }}>الكمية: {p.qty}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------ App ------------------------------------ */
const NAV = [
  { id: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { id: "pos", label: "بيع جديد", icon: ShoppingCart },
  { id: "inventory", label: "المخزون", icon: Package },
  { id: "installments", label: "الأقساط", icon: Wallet },
];

const TAB_LABELS = {
  dashboard: "الرئيسية", pos: "بيع جديد", inventory: "المخزون", installments: "الأقساط",
  saleslist: "قائمة بيع", customers: "العملاء", purchases: "المشتريات",
  suppliers: "الموردين", reports: "التقارير", paymentvoucher: "سند دفع",
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [toast, setToast] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [p, c, s, sa, pu] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: true }),
        supabase.from("customers").select("*").order("created_at", { ascending: true }),
        supabase.from("suppliers").select("*").order("created_at", { ascending: true }),
        supabase.from("sales").select("*").order("date", { ascending: false }),
        supabase.from("purchases").select("*").order("date", { ascending: false }),
      ]);
      setProducts((p.data || []).map(fromDbProduct));
      setCustomers((c.data || []).map(fromDbCustomer));
      setSuppliers((s.data || []).map(fromDbSupplier));
      setSales((sa.data || []).map(fromDbSale));
      setPurchases((pu.data || []).map(fromDbPurchase));
      if (p.error || c.error || s.error || sa.error || pu.error) {
        showToast("⚠️ تعذر الاتصال بقاعدة البيانات، تحقق من اتصالك بالنت", "error");
      }
      setReady(true);
    })();
  }, []);

  function showToast(msg, type = "success") { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); }

  async function addProduct(data) {
    const item = { ...data, id: uid(), createdAt: Date.now() };
    const { error } = await supabase.from("products").insert(toDbProduct(item));
    if (!error) setProducts((prev) => [...prev, item]);
    showToast(!error ? "تمت إضافة المنتج" : "⚠️ تعذر حفظ البيانات، تحقق من اتصالك وحاول مرة ثانية", !error ? "success" : "error");
    return item;
  }
  async function updateProduct(id, patch) {
    const { error } = await supabase.from("products").update(toDbProduct({ id, ...patch })).eq("id", id);
    if (!error) setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
    showToast(!error ? "تم حفظ التعديلات" : "⚠️ تعذر حفظ التعديلات", !error ? "success" : "error");
  }
  async function deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(!error ? "تم حذف المنتج" : "⚠️ تعذر حفظ الحذف", !error ? "info" : "error");
  }

  async function addCustomer(data) {
    const item = { ...data, id: uid(), createdAt: Date.now() };
    const { error } = await supabase.from("customers").insert(toDbCustomer(item));
    if (!error) setCustomers((prev) => [...prev, item]);
    showToast(!error ? "تمت إضافة العميل" : "⚠️ تعذر حفظ البيانات، تحقق من اتصالك وحاول مرة ثانية", !error ? "success" : "error");
    return item;
  }
  async function updateCustomer(id, patch) {
    const { error } = await supabase.from("customers").update(toDbCustomer({ id, ...patch })).eq("id", id);
    if (!error) setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
    showToast(!error ? "تم حفظ التعديلات" : "⚠️ تعذر حفظ التعديلات", !error ? "success" : "error");
  }
  async function deleteCustomer(id) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast(!error ? "تم حذف العميل" : "⚠️ تعذر حفظ الحذف", !error ? "info" : "error");
  }

  async function addSupplier(data) {
    const item = { ...data, id: uid(), createdAt: Date.now() };
    const { error } = await supabase.from("suppliers").insert(toDbSupplier(item));
    if (!error) setSuppliers((prev) => [...prev, item]);
    showToast(!error ? "تمت إضافة المورد" : "⚠️ تعذر حفظ البيانات، تحقق من اتصالك وحاول مرة ثانية", !error ? "success" : "error");
    return item;
  }
  async function updateSupplier(id, patch) {
    const { error } = await supabase.from("suppliers").update(toDbSupplier({ id, ...patch })).eq("id", id);
    if (!error) setSuppliers((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
    showToast(!error ? "تم حفظ التعديلات" : "⚠️ تعذر حفظ التعديلات", !error ? "success" : "error");
  }
  async function deleteSupplier(id) {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (!error) setSuppliers((prev) => prev.filter((s) => s.id !== id));
    showToast(!error ? "تم حذف المورد" : "⚠️ تعذر حفظ الحذف", !error ? "info" : "error");
  }

  async function addSale(sale) {
    const nextProducts = products.map((p) => {
      const item = sale.items.find((it) => it.productId === p.id);
      return item ? { ...p, qty: Math.max(0, p.qty - item.qty) } : p;
    });
    const changedProducts = nextProducts.filter((p, i) => p.qty !== products[i].qty);
    const [r1, r2] = await Promise.all([
      supabase.from("sales").insert(toDbSale(sale)),
      changedProducts.length ? supabase.from("products").upsert(changedProducts.map(toDbProduct)) : Promise.resolve({ error: null }),
    ]);
    const ok = !r1.error && !r2.error;
    if (ok) { setSales((prev) => [sale, ...prev]); setProducts(nextProducts); }
    showToast(ok ? "تم إنشاء الفاتورة بنجاح" : "⚠️ صار خطأ بحفظ الفاتورة، تحقق من اتصالك وحاول مرة ثانية", ok ? "success" : "error");
  }
  async function recordPayment(saleId, amount, date) {
    const sale = sales.find((s) => s.id === saleId);
    const payments = [...sale.installment.payments, { id: uid(), date: date || Date.now(), amount }];
    const remaining = Math.max(0, sale.installment.remaining - amount);
    const status = remaining <= 0 ? "completed" : "active";
    const installment = { ...sale.installment, payments, remaining };
    const { error } = await supabase.from("sales").update({ installment, status }).eq("id", saleId);
    if (!error) setSales((prev) => prev.map((s) => s.id === saleId ? { ...s, installment, status } : s));
    showToast(!error ? "تم تسجيل الدفعة" : "⚠️ تعذر حفظ الدفعة", !error ? "success" : "error");
  }
  async function updateSaleDate(saleId, newDate) {
    const { error } = await supabase.from("sales").update({ date: newDate }).eq("id", saleId);
    if (!error) setSales((prev) => prev.map((s) => s.id === saleId ? { ...s, date: newDate } : s));
    showToast(!error ? "تم تعديل التاريخ" : "⚠️ تعذر حفظ التعديل", !error ? "success" : "error");
  }
  async function updatePaymentDate(saleId, paymentId, newDate) {
    const sale = sales.find((s) => s.id === saleId);
    const payments = sale.installment.payments.map((p) => p.id === paymentId ? { ...p, date: newDate } : p);
    const installment = { ...sale.installment, payments };
    const { error } = await supabase.from("sales").update({ installment }).eq("id", saleId);
    if (!error) setSales((prev) => prev.map((s) => s.id === saleId ? { ...s, installment } : s));
    showToast(!error ? "تم تعديل التاريخ" : "⚠️ تعذر حفظ التعديل", !error ? "success" : "error");
  }

  async function addPurchase(purchase) {
    const nextProducts = products.map((p) => {
      const item = purchase.items.find((it) => it.productId === p.id);
      return item ? { ...p, qty: p.qty + item.qty, costPrice: item.cost || p.costPrice } : p;
    });
    const changedProducts = nextProducts.filter((p, i) => p.qty !== products[i].qty || p.costPrice !== products[i].costPrice);
    const [r1, r2] = await Promise.all([
      supabase.from("purchases").insert(toDbPurchase(purchase)),
      changedProducts.length ? supabase.from("products").upsert(changedProducts.map(toDbProduct)) : Promise.resolve({ error: null }),
    ]);
    const ok = !r1.error && !r2.error;
    if (ok) { setPurchases((prev) => [purchase, ...prev]); setProducts(nextProducts); }
    showToast(ok ? "تم حفظ فاتورة الشراء" : "⚠️ صار خطأ بحفظ الفاتورة، تحقق من اتصالك وحاول مرة ثانية", ok ? "success" : "error");
  }
  async function updatePurchaseDate(purchaseId, newDate) {
    const { error } = await supabase.from("purchases").update({ date: newDate }).eq("id", purchaseId);
    if (!error) setPurchases((prev) => prev.map((p) => p.id === purchaseId ? { ...p, date: newDate } : p));
    showToast(!error ? "تم تعديل التاريخ" : "⚠️ تعذر حفظ التعديل", !error ? "success" : "error");
  }
  async function recordSupplierPayment(purchaseId, amount, date) {
    const purchase = purchases.find((p) => p.id === purchaseId);
    const payments = [...(purchase.payments || []), { id: uid(), date: date || Date.now(), amount }];
    const remaining = Math.max(0, purchase.remaining - amount);
    const paid = purchase.paid + amount;
    const status = remaining <= 0 ? "paid" : "open";
    const { error } = await supabase.from("purchases").update({ payments, paid, remaining, status }).eq("id", purchaseId);
    if (!error) setPurchases((prev) => prev.map((p) => p.id === purchaseId ? { ...p, payments, paid, remaining, status } : p));
    showToast(!error ? "تم تسجيل التسديد" : "⚠️ تعذر حفظ التسديد", !error ? "success" : "error");
  }

  async function resetAll() {
    const ids = (arr) => arr.map((x) => x.id);
    const [r1, r2, r3, r4, r5] = await Promise.all([
      products.length ? supabase.from("products").delete().in("id", ids(products)) : Promise.resolve({ error: null }),
      customers.length ? supabase.from("customers").delete().in("id", ids(customers)) : Promise.resolve({ error: null }),
      suppliers.length ? supabase.from("suppliers").delete().in("id", ids(suppliers)) : Promise.resolve({ error: null }),
      sales.length ? supabase.from("sales").delete().in("id", ids(sales)) : Promise.resolve({ error: null }),
      purchases.length ? supabase.from("purchases").delete().in("id", ids(purchases)) : Promise.resolve({ error: null }),
    ]);
    const ok = ![r1, r2, r3, r4, r5].some((r) => r.error);
    if (ok) { setProducts([]); setCustomers([]); setSuppliers([]); setSales([]); setPurchases([]); }
    setResetConfirm(false);
    showToast(ok ? "تم مسح كل البيانات" : "⚠️ صار خطأ أثناء المسح", ok ? "info" : "error");
  }

  function exportBackup() {
    try {
      const data = { products, customers, suppliers, sales, purchases, exportedAt: Date.now() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `نسخة-احتياطية-${toInputDate(Date.now())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("تم تنزيل النسخة الاحتياطية");
    } catch (e) {
      showToast("⚠️ تعذر إنشاء النسخة الاحتياطية", "error");
    }
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const p = Array.isArray(data.products) ? data.products : products;
        const c = Array.isArray(data.customers) ? data.customers : customers;
        const s = Array.isArray(data.suppliers) ? data.suppliers : suppliers;
        const sa = Array.isArray(data.sales) ? data.sales : sales;
        const pu = Array.isArray(data.purchases) ? data.purchases : purchases;
        const results = await Promise.all([
          p.length ? supabase.from("products").upsert(p.map(toDbProduct)) : Promise.resolve({ error: null }),
          c.length ? supabase.from("customers").upsert(c.map(toDbCustomer)) : Promise.resolve({ error: null }),
          s.length ? supabase.from("suppliers").upsert(s.map(toDbSupplier)) : Promise.resolve({ error: null }),
          sa.length ? supabase.from("sales").upsert(sa.map(toDbSale)) : Promise.resolve({ error: null }),
          pu.length ? supabase.from("purchases").upsert(pu.map(toDbPurchase)) : Promise.resolve({ error: null }),
        ]);
        const ok = !results.some((r) => r.error);
        if (ok) { setProducts(p); setCustomers(c); setSuppliers(s); setSales(sa); setPurchases(pu); }
        showToast(ok ? "تم استيراد النسخة الاحتياطية بنجاح" : "⚠️ صار خطأ أثناء الاستيراد", ok ? "success" : "error");
      } catch (err) {
        showToast("⚠️ الملف غير صالح", "error");
      }
    };
    reader.readAsText(file);
  }

  function triggerImport() { fileInputRef.current?.click(); }

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: C.page }}>
        <Loader2 className="animate-spin" size={26} style={{ color: C.teal }} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex h-screen overflow-hidden" style={{ background: C.page, fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=JetBrains+Mono:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: ${C.teal} !important; box-shadow: 0 0 0 3px ${C.teal}22; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #D3D6E0; border-radius: 8px; }
        .receipt-notch { -webkit-mask-image: radial-gradient(circle at 12px 0, transparent 11px, black 11.5px); -webkit-mask-size: 24px 24px; -webkit-mask-repeat: repeat-x; -webkit-mask-position: bottom left; mask-image: radial-gradient(circle at 12px 0, transparent 11px, black 11.5px); mask-size: 24px 24px; mask-repeat: repeat-x; mask-position: bottom left; }
        h1,h2,h3,h4 { font-family: 'Tajawal', sans-serif; }
      `}</style>

      <aside className="w-[220px] shrink-0 hidden md:flex flex-col py-6 px-4" style={{ background: C.navy }}>
        <div className="mb-8 px-2">
          <div className="text-white font-extrabold text-lg" style={{ fontFamily: "'Tajawal', sans-serif" }}>محلّي</div>
          <div className="text-xs" style={{ color: "#8B90AE" }}>أجهزة كهربائية وموبايلات</div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => {
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ background: active ? C.teal : "transparent", color: active ? "#fff" : "#B4B8D1" }}
              >
                <n.icon size={17} />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="pt-4 border-t space-y-1" style={{ borderColor: "#ffffff14" }}>
          <button onClick={exportBackup} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ color: "#8B90AE" }}>
            <Download size={13} /> تصدير نسخة احتياطية
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ color: "#8B90AE" }}>
            <Upload size={13} /> استيراد نسخة احتياطية
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ""; }} />
          {resetConfirm ? (
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-xs" style={{ color: "#B4B8D1" }}>مسح كل شي؟</span>
              <button onClick={resetAll} className="p-1.5 rounded-lg" style={{ background: C.dangerSoft, color: C.danger }}><CheckCircle2 size={13} /></button>
              <button onClick={() => setResetConfirm(false)} className="p-1.5 rounded-lg" style={{ color: "#B4B8D1" }}><X size={13} /></button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ color: "#8B90AE" }}>
              <RotateCcw size={13} /> إعادة تعيين البيانات
            </button>
          )}
        </div>
      </aside>

      {tab !== "dashboard" && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b" style={{ borderColor: C.border }}>
          <span className="font-bold text-sm" style={{ color: C.navy }}>{TAB_LABELS[tab]}</span>
          <button onClick={() => setTab("dashboard")} className="p-1.5 rounded-full" style={{ background: C.page }} aria-label="خروج">
            <X size={16} style={{ color: C.navy }} />
          </button>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around py-2 bg-white border-t" style={{ borderColor: C.border }}>
        {NAV.slice(0, 5).map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-0.5 px-2 py-1">
            <n.icon size={18} style={{ color: tab === n.id ? C.teal : C.muted }} />
            <span className="text-[10px]" style={{ color: tab === n.id ? C.teal : C.muted }}>{n.label}</span>
          </button>
        ))}
      </div>

      <main className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 ${tab !== "dashboard" ? "pt-16 md:pt-8" : ""}`}>
        {tab === "dashboard" && <DashboardView products={products} customers={customers} sales={sales} setTab={setTab} showToast={showToast} exportBackup={exportBackup} triggerImport={triggerImport} />}
        {tab === "inventory" && <InventoryView products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />}
        {tab === "pos" && <POSView products={products} customers={customers} addSale={addSale} addCustomer={addCustomer} showToast={showToast} />}
        {tab === "saleslist" && <SalesListView sales={sales} />}
        {tab === "paymentvoucher" && <PaymentVoucherView purchases={purchases} recordSupplierPayment={recordSupplierPayment} />}
        {tab === "installments" && <InstallmentsView sales={sales} recordPayment={recordPayment} updateSaleDate={updateSaleDate} updatePaymentDate={updatePaymentDate} />}
        {tab === "customers" && <CustomersView customers={customers} sales={sales} addCustomer={addCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} updateSaleDate={updateSaleDate} />}
        {tab === "suppliers" && <SuppliersView suppliers={suppliers} purchases={purchases} addSupplier={addSupplier} updateSupplier={updateSupplier} deleteSupplier={deleteSupplier} />}
        {tab === "purchases" && <PurchasesView purchases={purchases} products={products} suppliers={suppliers} addPurchase={addPurchase} addSupplier={addSupplier} addProduct={addProduct} updatePurchaseDate={updatePurchaseDate} recordSupplierPayment={recordSupplierPayment} showToast={showToast} />}
        {tab === "reports" && <ReportsView sales={sales} purchases={purchases} />}
      </main>

      <Toast toast={toast} />
    </div>
  );
}
