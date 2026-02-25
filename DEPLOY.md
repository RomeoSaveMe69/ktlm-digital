# Vercel မှာ Supabase Error ဖြစ်ရင်

**Error:** `@supabase/ssr: Your project's URL and API key are required`

ဒီ project က **Supabase မသုံးပါ။** MongoDB + JWT ပဲ သုံးပါတယ်။ Error က Vercel ရဲ့ **env vars** နဲ့ **build cache** ကြောင့် ဖြစ်နိုင်ပါတယ်။

1. **Vercel Dashboard** → သင့် Project → **Settings** → **Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL` နဲ့ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (သို့မဟုတ် ဆိုင်ရာ Supabase env တွေ) ရှိရင် **ဖျက်ပါ**။
   - ထားရမယ့် env တွေ: `MONGODB_URI` နဲ့ `JWT_SECRET` ပဲ။

2. **Redeploy** လုပ်ပြီး **Clear cache** လုပ်ပါ။  
   - **Deployments** tab → နောက်ဆုံး deployment မှာ **⋯** → **Redeploy** → **Redeploy with existing Build Cache** ကို **မရွေးပါနဲ့** (cache ဖျက်ပြီး ပြန် build လုပ်မယ်)။

3. သေချာစေရန် local မှာ `npm run build` ပြန် run ကြည့်ပါ။ Supabase ကုဒ်/package မရှိပါက build အောင်ရပါမယ်။

---

# Weblive / Production မှာ 404 ဖြစ်ရင်

## ၁. Subpath မှာ deploy လုပ်ထားရင် (ဥပမာ yoursite.com/konethelaymyar)

`.env` သို့မဟုတ် Weblive env settings မှာ ထည့်ပါ:

```
NEXT_PUBLIC_BASE_PATH=/konethelaymyar
```

ပြီးရင် ပြန် build လုပ်ပြီး deploy ပါ။ Login link က `/konethelaymyar/login` ဖြစ်သွားမယ်။

---

## ၂. Host က Node.js / Server မပါဘဲ Static ပဲ ဆိုရင်

Next.js က default အားဖြင့် **Node server** လိုတယ် (`npm run build` + `npm run start`)။  
Weblive က **static file ပဲ** လက်ခံတယ်ဆိုရင်:

- **Option A:** Weblive မှာ **Node.js** support ရှိမရှိ စစ်ပါ။ ရှိရင် build လုပ်ပြီး:
  - Upload လုပ်တဲ့အခါ `.next` folder + `node_modules` + `package.json` ပါအောင် လုပ်ပါ သို့မဟုတ်
  - Git connect ဆိုရင် build command: `npm run build`, start/run command: `npm run start` ထားပါ။
- **Option B:** Static-only host ဆိုရင် login/profile လို **server + auth** လိုတဲ့ page တွေ အပြည့်အဝ မရနိုင်ပါ။ Vercel / Netlify / Railway လို **Next.js support ပါတဲ့** host သုံးပါ။

---

## ၃. Build ကို မှန်မှန် run ထားပါ

Deploy မလုပ်ခင် local မှာ:

```bash
cd konethelaymyar-digital
npm run build
```

Build အောင်ပြီး output မှာ ဒီ route တွေ ပါရမယ်:

- `/`
- `/login`
- `/profile`
- `/admin`
- `/api/auth/*`, `/api/orders`

ဒါတွေ မပါရင် branch / folder မှားနေတာ စစ်ပါ။

---

## ၄. Weblive မှာ ထည့်စစ်ရမှာ

- **Build command:** `npm run build`
- **Output / Publish directory:** `.next` သာ မဟုတ်ပါနဲ့။ Next.js အတွက် **Node server** လိုတယ်ဆိုရင် start command မှာ `npm run start` သို့မဟုတ် `node server.js` လို run command ထားပါ။
- **Root directory:** project က `konethelaymyar-digital` folder ထဲမှာဆိုရင် Weblive မှာ **Root** ကို `konethelaymyar-digital` လို့ ထားပါ။

---

## Summary (EN)

- **404 on /login in production:** Set `NEXT_PUBLIC_BASE_PATH` if the app is under a subpath (e.g. `/myapp`).
- Host must run **Node.js** (`next start`) for full Next.js; static-only hosts will not serve all routes correctly.
- Use a Next.js-friendly host (Vercel, Netlify, Railway) if Weblive does not support Node.
