import { createClient } from "@supabase/supabase-js";

// مفتاح "publishable" آمن يظهر بالمتصفح لأنه مصمم لهذا الغرض بالضبط،
// والحماية الحقيقية تجي من صلاحيات RLS المفعّلة على كل جدول بقاعدة البيانات.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pevtilyouxdpajsxfmbf.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_opyWTAtCcd5f-1GZzocrkQ_j7uBhHPV";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
