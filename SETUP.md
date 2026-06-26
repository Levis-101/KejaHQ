# KejaHQ — Phase 1 Setup Guide

Everything you need to get the project running from scratch.

---

## Step 1 — Create the Next.js project

Open a terminal and run:

```bash
npx create-next-app@latest kejahq \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias

cd kejahq
```

When prompted, accept the defaults.

---

## Step 2 — Install dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

That's the only extra package Phase 1 needs. Everything else (Tailwind, Next.js) is already in the project.

---

## Step 3 — Add the source files

Copy ALL the files from this folder into your `kejahq/` project, replacing any generated defaults.

The structure should look like this:

```
kejahq/
├── .env.local.example        ← copy to .env.local and fill in
├── tailwind.config.ts        ← replace the generated one
├── supabase/
│   └── schema.sql
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   └── (dashboard)/
    │       ├── layout.tsx
    │       └── dashboard/page.tsx
    ├── components/
    │   └── dashboard/
    │       └── Sidebar.tsx
    └── lib/
        ├── supabase.ts
        └── supabase-server.ts
```

---

## Step 4 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a **New Project** (choose a region close to Kenya — Middle East/Africa)
3. Wait ~2 minutes for it to provision
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon / public` key

---

## Step 5 — Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yourprojectid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 6 — Run the database schema

1. In your Supabase project, go to **SQL Editor → New Query**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

This creates all your tables (profiles, properties, units, tenants, maintenance_requests) and sets up Row Level Security so each landlord only sees their own data.

---

## Step 7 — Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll be redirected to `/login`. Sign up, confirm your email (if Supabase requires it), and you'll land on the dashboard.

---

## What Phase 1 gives you

| Feature                        | Status |
|-------------------------------|--------|
| Landlord signup / login        | ✅ Done |
| Session management (Supabase)  | ✅ Done |
| Auth guard (dashboard locked)  | ✅ Done |
| Dashboard shell with sidebar   | ✅ Done |
| Unit grid preview              | ✅ Done |
| Database schema (all tables)   | ✅ Done |
| Row Level Security             | ✅ Done |

---

## What's next — Phase 2

- Add a property (building name, address, floors)
- Add units to that property
- Add tenants to units
- Mark payments

That's where the real value kicks in.

---

## Troubleshooting

**"Cannot read property of undefined" on profile fetch**
→ The trigger that creates profiles on signup may not have run. In Supabase SQL Editor, run:
```sql
select * from public.profiles;
```
If empty, check the trigger was created by the schema.sql run.

**TypeScript errors on supabase types**
→ The types in `src/lib/supabase.ts` must match your actual table columns. If you change the schema, update the types file too.

**Styles not loading**
→ Make sure `globals.css` is imported in `src/app/layout.tsx` and that Tailwind content paths cover your `src/` directory.
