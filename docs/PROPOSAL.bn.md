# StackForge — বেসলাইন প্রস্তাবনা (Phase 0) — বাংলা সংস্করণ

> **অবস্থা: প্রস্তাবিত — মালিকের অনুমোদনের অপেক্ষায়। এই ডকুমেন্টের কোনো কিছুই এখনো implement করা হয়নি।**
>
> এটি [PROPOSAL.md](PROPOSAL.md)-এর বাংলা অনুবাদ, শুধু পড়া ও রিভিউয়ের সুবিধার জন্য। দুটির মধ্যে কোনো অমিল থাকলে ইংরেজি সংস্করণটিই প্রামাণিক। অনুমোদনের পর দুটি ফাইলই ভেঙে আলাদা source-of-truth ডকুমেন্টে নেওয়া হবে, তারপর মুছে ফেলা হবে।
>
> কাজের নাম "StackForge"। npm প্যাকেজের নাম **এখনো চূড়ান্ত নয়** (§৯ দেখুন)।
> তথ্যের তারিখ: ২০২৬-১০-২৬। সব ভার্সন সেদিন `npm view` দিয়ে যাচাই করা।

---

## ১. রিপোজিটরি অডিট

| বিষয় | যা পাওয়া গেছে |
|---|---|
| Git | ব্রাঞ্চ `main`, **কোনো commit নেই**। `AGENTS.md` ও `CLAUDE.md` আপনি stage করে রেখেছেন, অপরিবর্তিত রাখা হয়েছে। |
| `CLAUDE.md` | এক লাইন: `@AGENTS.md`। |
| `AGENTS.md` | ৫০৮ লাইন; প্রামাণিক ইঞ্জিনিয়ারিং নীতিমালা। কোনো পরিবর্তন করা হয়নি। |
| কোড / manifest / lockfile / CI | কিছুই নেই। এটি একটি **নতুন প্রজেক্ট**। |
| লোকাল runtime | Node `v24.18.1`, npm `12.1.0`, pnpm `12.15.0`, Yarn `1.22.22` (অডিটের সময় Corepack ডাউনলোড করেছে), Git `2.55.0`। |
| লোকালি নেই | **Docker** ও **Bun** ইনস্টল নেই। এগুলো লাগে এমন চেক লোকালি `BLOCKED` থাকবে, শুধু CI-তে চলবে। |
| OS | Windows 11। Windows-এর path ও process handling (`.cmd` shim, সংরক্ষিত ফাইলনাম, `\` separator) শুরু থেকেই গুরুত্বপূর্ণ বিষয়। |

### যে তথ্যগুলো brief-কে বদলে দেয়

১. **`create-stackforge` নামটি npm-এ অন্য কেউ নিয়ে নিয়েছেন** (v0.4.2, ২০২৬-০২-১৩ তৈরি, মাসে ~২৮ ডাউনলোড)। এর বিবরণ ("universal full-stack boilerplate generator … AI agent integrations") এই প্রোডাক্টের সাথে সরাসরি মেলে, আর এটি আগেই `create-stackforge` **এবং** `stackforge` দুটি কমান্ড ব্যবহার করে। **`stackforge`** ও `stackforge-cli` নামও নেওয়া। npm এমন নতুন নাম গ্রহণ করে না যা আগের কোনো নাম থেকে শুধু যতিচিহ্নে আলাদা, তাই `create-stack-forge` আসলে কোনো বিকল্প নয়, যদিও সেটা 404 দেখায়। → খোলা প্রশ্ন Q1।

২. **Prisma-র `latest` ট্যাগ এখন একটি release candidate নির্দেশ করছে** (`8.0.0-rc.27`)। সর্বশেষ stable হলো `7.10.1`। CLI কেন অন্ধভাবে `@latest` ইনস্টল করবে না, এটা তার বাস্তব প্রমাণ।

৩. **সাম্প্রতিক major ভার্সন:** TypeScript 7.0 (native compiler), Vite 8, create-vite 9, Next.js 16.4, NestJS 12, Express 5, Mongoose 9, Zod 4, ESLint 10, Vitest 5, Tailwind 4.3। প্রতিটি recipe adapter এই ভার্সনগুলোর আসল আউটপুটের বিপরীতে যাচাই হবে, পুরোনো ডকুমেন্টেশনের ভিত্তিতে নয়।

৪. **Node.js:** v26 বর্তমান ভার্সন, আর Node 20-এর সাপোর্ট এপ্রিল ২০২৬-এ শেষ হয়ে গেছে। প্রস্তাবিত লাইব্রেরিগুলোর Node ≥ 22 লাগে (`commander@15` লাগে ≥ 22.12, `execa@10` লাগে ≥ 22)।

---

## ২. প্রোডাক্ট সংজ্ঞা

**সমস্যা।** একটি নির্ভরযোগ্য TypeScript প্রজেক্ট শুরু করতে (validation, error handling, test, env config, লোকাল ডাটাবেস, CI) কয়েক দিন লেগে যায়। আর বেশিরভাগ generator যা তৈরি করে, সেটা শুধু দেখতেই সম্পূর্ণ মনে হয়। AI coding agent ব্যবহারকারী টিমের দ্বিতীয় সমস্যা হলো: অনেকগুলো রিপোজিটরিতে ইঞ্জিনিয়ারিং নিয়ম (instructions, skills, subagents, hooks) ইনস্টল ও আপডেট করার কোনো নির্ভরযোগ্য, ভার্সনসহ উপায় নেই।

**StackForge** যাচাই-করা starter প্রজেক্ট তৈরি করে, আর একটি ভার্সনসহ AI Development Operating System ইনস্টল করে। scaffolder আর AI workflow একে অপরের ওপর নির্ভরশীল নয়: যেকোনো একটি আলাদাভাবে ব্যবহার করা যায়।

### প্রস্তাবিত MVP (v0.1)

| থাকবে | বাদ (পরে আসবে, বাতিল নয়) |
|---|---|
| `create` (interactive + non-interactive, `--dry-run`) | Next.js ও NestJS+Prisma recipe (v0.2, Q2/Q3 দেখুন) |
| `list`, `doctor`, `add` কমান্ড | Express+Prisma/Drizzle, monorepo, auth, Redis, background job |
| Recipe: **Express + MongoDB + Mongoose** | Yarn Berry ও Bun সাপোর্ট (শনাক্ত করে স্পষ্টভাবে জানাবে, সাপোর্টের দাবি করবে না) |
| Recipe: **Vite + React + TS + Tailwind** | ব্যবহারকারী-নির্ধারিত preset, কমিউনিটি recipe |
| Add-on engine + ২–৩টি add-on: `ai-workflows`, `ci-github`, (সম্ভবত) `env-validation` | Add-on **অপসারণ** (implement ও test না হওয়া পর্যন্ত দাবি করা হবে না) |
| শুধু **Claude Code**-এর জন্য AI workflow v1 | অন্যান্য agent-এর adapter |
| npm + pnpm যাচাইকৃত | Publish করা (আপনার স্পষ্ট অনুমোদন লাগবে) |
| Pack-করা tarball থেকে ইনস্টল যাচাই, CI, publishing গাইড | |

**প্রথমে দুটি recipe কেন:** এরা প্রোডাক্টের দুই অংশ কভার করে (ডাটাবেসসহ একটি API, আর Tailwind-সহ একটি front end), আর দুই ধরনের recipe কৌশলই পরীক্ষা করে: নিজস্ব template, এবং upstream generator-এর ওপর overlay। এরপর Next.js আর Nest যোগ করা মানে শুধু নতুন adapter লেখা, engine বদলাতে হবে না। তাছাড়া Prisma 8 এখন RC অবস্থায় আছে, তাই Nest+Prisma recipe সেটা স্থির হওয়ার পর করা, অথবা ইচ্ছাকৃতভাবে 7.x-এ pin করা ভালো।

---

## ৩. আর্কিটেকচার

### ৩.১ একটি প্যাকেজ, monorepo নয় (আপাতত)

একটিই publish-যোগ্য npm প্যাকেজ। `src/`-এর ভেতরে মডিউলের সীমানা বজায় রাখা হবে ESLint-এর `no-restricted-imports` নিয়ম দিয়ে (কোন মডিউল কোনটাকে import করতে পারবে), সাথে টেস্ট। কারণ:

- Publish হবে মাত্র একটি জিনিস। Monorepo-তে workspace আর build-order-এর ঝামেলা বাড়ে, অথচ ব্যবহারকারীর এখনো কোনো লাভ নেই।
- AI workflow-এর **ভার্সন আলাদা**, নিজস্ব manifest-এ রাখা (`assets/ai/workflow.json` → `version`), যদিও এটি একই tarball-এ যায়। টার্গেট প্রজেক্টে কোন workflow ভার্সন ইনস্টল হলো, installer তা লিখে রাখে।
- **কখন আবার ভাবা হবে:** AI workflow-এর release চক্র CLI থেকে আলাদা হওয়া দরকার হলে, বা অন্যরা scaffolder ছাড়া শুধু AI workflow চাইলে, তখন এটিকে আলাদা প্যাকেজে সরানো হবে।

### ৩.২ ফোল্ডার কাঠামো

```text
src/
  cli/            # commander সংযোগ, help টেক্সট, exit code। পাতলা স্তর।
  commands/       # create, list, doctor, add। শুধু সমন্বয়ের কাজ।
  core/
    errors.ts     # typed error (UserError, PreconditionError, ExternalToolError) + exit code
    logger.ts     # structured event -> সুন্দর TTY আউটপুট বা --json
    plan.ts       # Plan = ক্রমানুসারে FileOp[] + CommandOp[]; --dry-run-এ দেখানো হয়
    fs-safe.ts    # path যাচাই, symlink চেক, staging ফোল্ডার, atomic সমাপ্তি
    exec.ts       # execa wrapper: শুধু argument array, shell:false, timeout, abort signal
    pm.ts         # package-manager শনাক্তকরণ/adapter (npm, pnpm; বাকিগুলো জানানো হয়)
    project.ts    # বিদ্যমান প্রজেক্ট পরিদর্শন: manifest, lockfile, framework চেনা
    state.ts      # .stackforge/state.json (ইনস্টল-করা add-on, ভার্সন, ফাইল hash)
  recipes/
    registry.ts   # স্থির তালিকা; ইচ্ছামতো বাইরের কোড ডাইনামিকভাবে লোড হয় না
    express-mongoose/  recipe.ts + adapter
    vite-react-tailwind/
  addons/
    registry.ts
    ai-workflows/  ci-github/ ...
  verify/         # recipe-এর verify কমান্ড চালায়, PASS/FAIL/NOT RUN/BLOCKED সংগ্রহ করে
assets/
  templates/<recipe>/...     # নিজস্ব template ফাইল (tarball-এ যায়)
  ai/                        # AI workflow asset + workflow.json manifest
```

Import-এর দিক: `cli → commands → (recipes | addons | verify) → core`। `core` তার ওপরের কাউকে import করে না। Recipe-রা একে অপরকে import করে না।

### ৩.৩ Recipe সিস্টেম

```ts
interface Recipe {
  id: 'express-mongoose' | 'vite-react-tailwind' /* ... */;
  title: string;
  strategy: 'template' | 'upstream+overlay';
  compat: { node: string; packageManagers: PackageManagerId[] };
  upstream?: { pkg: 'create-vite'; version: '9.3.1'; args: (ctx) => string[] }; // নির্দিষ্ট ভার্সনে pin
  options: RecipeOption[];           // যেমন tests: vitest|none, docker: bool
  plan(ctx: RecipeContext): Plan;    // pure: শুধু operation তৈরি করে, কিছু স্পর্শ করে না
  verify: VerifyStep[];              // typecheck, lint, test, build, smoke
}
```

- **আগে plan, তারপর execute।** `plan()` pure, তাই unit test করা যায়, আর `--dry-run` এটা দেখায়। এরপর executor সেটা প্রয়োগ করে।
- **Staging ফোল্ডার।** প্রজেক্ট তৈরি হয় একই ড্রাইভে পাশাপাশি একটি নতুন ফোল্ডারে: `.<name>.stackforge-<random>`। সফল হলে সেটিকে টার্গেট নামে rename করা হয়। ব্যর্থ হলে বা Ctrl-C চাপলে **শুধু সেই staging ফোল্ডারটিই** মোছা হয়। ব্যবহারকারীর বিদ্যমান কোনো ফোল্ডার কখনো স্পর্শ করা হয় না।
- **Upstream generator** চালানো হয় **নির্দিষ্ট pin-করা ভার্সনে**: non-interactive flag, `--skip-install` আর git ছাড়া। Dependency ইনস্টল পরে StackForge নিজে একবারে করে।
- **Config সম্পাদনা** হয় syntax বুঝে: JS/TS config-এর জন্য `magicast`, আর `package.json`/`tsconfig`-এর জন্য JSON parse/serialize। প্রতিটির আগে একটি **পূর্বশর্ত যাচাই** থাকে: adapter নিশ্চিত করে ফাইলের কাঠামো প্রত্যাশামতো (যেমন "`vite.config.ts` `defineConfig({ plugins: [...] })` default-export করে")। কাঠামো ভিন্ন হলে স্পষ্ট বার্তা দিয়ে ব্যর্থ হয়। সোর্স ফাইলে regex দিয়ে লেখা বদলানো হয় না।
- **ভার্সন কৌশল:** প্রতিটি recipe-এর একটি পরীক্ষিত dependency ভার্সনের সেট থাকে: upstream generator-এর নির্দিষ্ট ভার্সন, আর overlay dependency-র caret range। CI-এর একটি "canary" job (নির্ধারিত সময়ে চলে, প্রতি PR-এ নয়) সর্বশেষ upstream দিয়ে আবার generate করে দেখে, আর অমিল পেলে issue খোলে। ভার্সন বাড়ানো হয় ভেবেচিন্তে, আলাদা PR-এ।

### ৩.৪ Add-on সিস্টেম

প্রতিটি add-on তার metadata ঘোষণা করে (data হিসেবে রাখা, টেস্টে একটি schema দিয়ে যাচাই করা):

```ts
interface AddonManifest {
  id: string; version: string;
  appliesTo: { frameworks?: FrameworkId[]; requires?: string[]; conflicts?: string[] };
  dependencies?: Record<string,string>; devDependencies?: Record<string,string>;
  files: Array<{ path: string; mode: 'create' | 'merge-json' | 'managed' }>;
  env?: Array<{ name: string; example: string; description: string }>;
  verify: VerifyStep[];
  reversible: false;            // MVP: অপসারণের দাবি করা হয় না
  limitations: string[];
}
```

`add <id>`-এর ধাপ: প্রজেক্ট পরিদর্শন → সামঞ্জস্য ও সংঘাত নির্ণয় → plan তৈরি → preview ও সংঘাত দেখানো (`--yes` দিলে **কোনো** সংঘাত না থাকলেই শুধু এগোয়) → যে ফাইল বদলাবে তার ব্যাকআপ `.stackforge/backups/<timestamp>/`-এ → প্রয়োগ → যাচাই → বদলানো প্রতিটি ফাইলের রিপোর্ট। আবার চালালে কিছু বদলায় না (idempotent)। অবস্থা রাখা হয় `.stackforge/state.json`-এ।

### ৩.৫ AI workflow আর্কিটেকচার (বিস্তারিত §৫-এ)

- **Source of truth:** `assets/ai/` আর `workflow.json` (ভার্সন, skill/agent/hook-এর তালিকা, target-adapter ম্যাপ)।
- **Adapter:** v1-এ শুধু `claude-code`। এটি নিরপেক্ষ সংজ্ঞাগুলোকে `.claude/skills`, `.claude/agents` আর `.claude/settings.json`-এর hooks-এ রূপান্তর করে। ভবিষ্যতে প্রতিটি agent-এর নিজস্ব adapter হবে, আর সেই agent-এর ডকুমেন্টেশনের সাথে যাচাইয়ের পরেই কেবল সামঞ্জস্যের দাবি করা হবে।
- **Managed ফাইলের আপডেট:** installer যে ফাইল লেখে, তার প্রতিটির sha256 লিখে রাখে। আপডেটের সময়: ইনস্টলের পর ফাইলটি না বদলালে সেটি প্রতিস্থাপিত হয়। ব্যবহারকারী বদলে থাকলে নতুন ভার্সনটি পাশে `<file>.stackforge-new` নামে লেখা হয় আর জানানো হয়। ব্যবহারকারীর পরিবর্তন কখনো নীরবে মুছে ফেলা হয় না।

---

## ৪. প্রযুক্তিগত পছন্দ

| বিষয় | পছন্দ | ভার্সন | বিবেচিত বিকল্প / মন্তব্য |
|---|---|---|---|
| ভাষা | TypeScript, strict, শুধু ESM | 6.0.x **অথবা** 7.0.x | TS 7 হলো native compiler। **T1.2-এ যাচাই করতে হবে** `typescript-eslint` এটা সাপোর্ট করে কিনা; না করলে 6.0.x-এ pin। |
| Runtime | `engines.node: ">=22.12"` | 22 / 24 / 26 | Node 20-এর সাপোর্ট শেষ। commander/execa এটা চায়। |
| Argument parsing | `commander` | 15.x | `cac`, `citty`: ছোট, কিন্তু help/subcommand handling কম পরিণত। |
| Prompt | `@clack/prompts` | 1.x | ভালো cancellation (`isCancel`) ও spinner UX। |
| Process | `execa` | 10.x | Windows `.cmd` shim, abort, timeout সামলায়। `tinyexec` হালকা; সাইজ সমস্যা হলে আবার ভাবা হবে। |
| নাম যাচাই | `validate-npm-package-name` + নিজস্ব নিয়ম | — | নিজস্ব নিয়ম যোগ করে: path traversal, Windows-এর সংরক্ষিত নাম, শেষে ডট। |
| Config সম্পাদনা | `magicast` (JS/TS), সাধারণ JSON | 0.5.x | 1.0-এর আগের ভার্সন। Adapter-এর পেছনে আলাদা রাখা, তাই দরকারে বদলানো যাবে। |
| Build | সাধারণ `tsc` → `dist/` | — | CLI-এর জন্য bundling দরকার নেই। কম জটিলতা, পড়ার মতো stack trace। শুরুর সময় মেপে দেখে প্রয়োজন হলেই কেবল tsup/tsdown। |
| Test | `vitest` | 5.x | |
| Lint/format | ESLint 10 + typescript-eslint, Prettier | — | |
| তৈরি-করা UI-এর E2E | Playwright + `@axe-core/playwright` | — | তৈরি-করা Vite প্রজেক্টের টেস্টে আর CI-এর recipe job-এ। |

সব প্রার্থী লাইব্রেরির লাইসেন্স MIT/Apache-2.0 (`npm view … license` দিয়ে যাচাই করা)। এই টেবিলের বাইরে নতুন কোনো dependency যোগ করতে AGENTS.md §6 অনুযায়ী আপনার অনুমোদন লাগবে।

**Recipe stack (প্রতিটি recipe phase-এ generator-এর আসল আউটপুট দেখে নিশ্চিত করা হবে):**

- **Vite:** `create-vite@9.3.1 --template react-ts`, তারপর `tailwindcss` + `@tailwindcss/vite` 4.3.x (`vite.config.ts`-এ plugin, CSS-এ `@import "tailwindcss";`), Vitest + Testing Library, axe-সহ Playwright smoke test, light/dark/system theme-এর উদাহরণ।
- **Express:** নিজস্ব template। Express 5, Mongoose 9, request ও env যাচাইয়ের জন্য Zod 4, `helmet`, `cors` (env থেকে allowlist), `pino` logging, আলাদা `app.ts`/`server.ts`, health endpoint, কেন্দ্রীয় 404/error middleware, graceful shutdown (SIGINT/SIGTERM, server বন্ধ, Mongoose disconnect, exit timeout), MongoDB-এর জন্য Docker Compose, Vitest + Supertest, `mongodb-memory-server`-এ integration test। এতে Docker লাগে না, তবে প্রথমবার একটি `mongod` binary ডাউনলোড করে, তাই তখন ইন্টারনেট লাগবে।
- **Next.js (v0.2):** `create-next-app@16.4.x` স্পষ্ট flag দিয়ে (`--ts --tailwind --eslint --app --src-dir? --skip-install --disable-git --use-<pm>`)। Pin-করা ভার্সনের `--help` দেখে flag-গুলো আবার যাচাই করতে হবে।
- **NestJS + Prisma (v0.2):** `@nestjs/cli@12` দিয়ে `nest new … --skip-install --skip-git --strict`। ততদিনে 8.0 GA না হলে Prisma **7.x stable লাইনে** pin থাকবে। Prisma 7-এর workflow (`prisma.config.ts`, স্পষ্ট output-সহ `prisma-client` generator, driver adapter `@prisma/adapter-pg`, `.env` স্বয়ংক্রিয়ভাবে লোড না হওয়া) **implement করার সময় ইনস্টল-করা ভার্সনের ডকুমেন্টেশনের সাথে যাচাই করতে হবে।** এখানে এগুলো স্মৃতি থেকে লেখা, এখনো যাচাই করা হয়নি।

এই প্রস্তাবনায় ব্যবহৃত ডকুমেন্টেশন: Claude Code-এর [skills](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents), [hooks](https://code.claude.com/docs/en/hooks), [plugins](https://code.claude.com/docs/en/plugins) (২০২৬-১০-২৬ তারিখে পড়া)। Framework-এর ডকুমেন্টেশন প্রতিটি recipe phase-এ পড়া হবে।

---

## ৫. AI workflow নকশা (Claude Code adapter, v1)

### ৫.১ প্ল্যাটফর্মের যাচাইকৃত তথ্য (আজ পড়া ডকুমেন্টেশন থেকে)

- **Skill:** `.claude/skills/<name>/SKILL.md`। Frontmatter প্রথম লাইন থেকেই শুরু হতে হবে। `description` (সাথে `when_to_use`) **১,৫৩৬ অক্ষরে** কেটে ফেলা হয়। পার্শ্বপ্রতিক্রিয়া আছে এমন workflow-এর জন্য `disable-model-invocation: true`। সহায়ক ফাইলগুলো দরকার হলে তবেই লোড হয় (progressive disclosure), আর `SKILL.md` ৫০০ লাইনের নিচে রাখার কথা বলা আছে। **অচেনা frontmatter field নীরবে উপেক্ষা করা হয়**, তাই validator-কে বানান ভুল ধরতে হবে।
- **Subagent:** `.claude/agents/*.md`। `name` (`:` চলবে না, শুরুতে `-` চলবে না) আর `description` বাধ্যতামূলক। `tools` হলো allowlist, যা **প্ল্যাটফর্ম সত্যিই প্রয়োগ করে**। কোনো subagent তখনই অন্য subagent চালাতে পারে, যখন তার tools-এ `Agent` থাকে।
- **Hook:** `.claude/settings.json` → `hooks.<Event>[].{matcher, hooks[]}`। `PreToolUse` exit 2 বা `permissionDecision: "deny" | "ask"` দিয়ে বাধা দেয়। **ডকুমেন্টেশনেই বলা আছে hook "best-effort", আর নিশ্চিতভাবে অনুমতি দেওয়া/আটকানোর কাজ permission সিস্টেমের।** `onFailure: "block"` না থাকলে, ব্যর্থ বা timeout হওয়া hook কোনো কিছু আটকায় **না**।
- **Plugin** বিতরণের আরেকটি উপায় (`.claude-plugin/plugin.json`, marketplace, `/plugin:skill` রূপে নাম)। Q5 দেখুন।

### ৫.২ কী ইনস্টল হবে (`add ai-workflows`, অথবা `create`-এর সময় বেছে নিলে)

```text
AGENTS.md                    # নীতিমালা: কীভাবে বিতরণ হবে, Q4 দেখুন
CLAUDE.md                    # "@AGENTS.md" (CLAUDE.md আগে থেকে থাকলে: preview দেখিয়ে শুধু import লাইনটি যোগ, যদি না থাকে)
.claude/skills/<name>/SKILL.md (+ references/*.md)
.claude/agents/<name>.md
.claude/hooks/*.mjs          # Node script (সব OS-এ চলে), exec form-এ চালানো: node + args
.claude/settings.json        # merge করা: hook + "ask" permission নিয়ম যোগ হয়; ব্যবহারকারীর key অক্ষত থাকে
.stackforge/ai-manifest.json # workflow ভার্সন + প্রতিটি managed ফাইলের sha256
```

**কোনো অনুমতি কখনো বাড়ানো হয় না।** Installer শুধু `permissions.ask` নিয়ম যোগ করে (যেমন `Bash(npm publish:*)`, `Bash(git push:*)`, `Bash(git reset --hard:*)`)। `allow` নিয়ম বা `bypassPermissions` কখনো যোগ করে না।

### ৫.৩ প্রাথমিক skill (১০টি; প্রতিটিতে থাকবে পরিধি / কখন চালু হবে / পূর্বশর্ত / ধাপ / নিরাপত্তা / যাচাই / কাজ শেষের সংজ্ঞা)

| Skill | উদ্দেশ্য | কে চালু করতে পারে |
|---|---|---|
| `repo-discovery` | কিছু বদলানোর আগে অবস্থা, নির্দেশনা, git, script পরিদর্শন | model + ব্যবহারকারী |
| `plan-task` | প্রয়োজনীয়তা স্পষ্ট করা, plan লেখা, আর গ্রহণযোগ্যতার মানদণ্ডসহ `TASKS.md` এন্ট্রি | model + ব্যবহারকারী |
| `tdd` | Red → green → refactor; bug-এর ক্ষেত্রে আগে regression test | model + ব্যবহারকারী |
| `debug-root-cause` | সমস্যা পুনরুৎপাদন, আলাদা করা, ঠিক করা; CI ব্যর্থতার বিশ্লেষণসহ; ৩ চেষ্টার পর থামার নিয়ম | model + ব্যবহারকারী |
| `api-endpoint` | Validation, authz, error shape আর test-সহ endpoint; `references/express.md`, `references/nestjs.md` | model + ব্যবহারকারী |
| `db-change` | Schema/migration/index রিভিউ; `references/prisma.md`, `references/mongoose.md` | model + ব্যবহারকারী |
| `ui-verify` | Breakpoint, state, theme (light/dark/system), keyboard, axe; Playwright থাকলে সেটা দিয়ে, না থাকলে NOT RUN জানায় | model + ব্যবহারকারী |
| `security-review` | Trust boundary, input, authz, secret, `npm audit` | model + ব্যবহারকারী |
| `verify-and-handoff` | পাওয়া চেকগুলো চালানো, PASS/FAIL/NOT RUN/BLOCKED রিপোর্ট, `PROGRESS.md`/`TASKS.md` আপডেট | model + ব্যবহারকারী |
| `release-prep` | Pack, tarball পরিদর্শন, changelog; কখনো publish করে না | **শুধু ব্যবহারকারী** (`disable-model-invocation: true`) |

Stack-নির্দিষ্ট নির্দেশনা `references/`-এ থাকে, ফলে একটি কাজ শুধু তার স্পর্শ-করা stack-এর নির্দেশনাই লোড করে।

### ৫.৪ Subagent ও orchestration

| Agent | Tools (প্রয়োগকৃত allowlist) | লিখতে পারে? |
|---|---|---|
| `planner` (architect-এর ভূমিকাও এর মধ্যে) | Read, Grep, Glob, WebFetch | না |
| `implementer` | Read, Edit, Write, Grep, Glob, Bash | **সোর্স ফাইলের একমাত্র লেখক** |
| `test-engineer` | Read, Edit, Write, Grep, Glob, Bash | শুধু test ফাইল (নির্দেশনা-স্তরে; নিচের নোট দেখুন) |
| `ui-reviewer` | Read, Grep, Glob, Bash | না |
| `security-reviewer` | Read, Grep, Glob, Bash | না |
| `code-reviewer` | Read, Grep, Glob, Bash | না |

- আমার প্রস্তাব, **"architect"-এর কাজ `planner`-এর মধ্যেই** রাখা। বড় নকশাগত সিদ্ধান্ত সে মানুষের কাছে পাঠাবে। এতে একই রকম দায়িত্বের দুটি agent থাকে না। আলাদা চাইলে জানাবেন।
- **কাজ ভাগ করা** (একটি `orchestrate` skill-এ, শুধু ব্যবহারকারী চালু করতে পারবে):
  - **S** কাজ (≤১টি মডিউল, contract-এ পরিবর্তন নেই) → implementer + যাচাই।
  - **M** → planner → implementer → test-engineer → code-reviewer।
  - **L বা সংবেদনশীল** (auth, data, টাকা, public API) → সাথে security-reviewer, আর UI পরিবর্তন হলে ui-reviewer।
- **নিয়ম:**
  - এক সময়ে একজনই লিখবে; শুধু read-only reviewer-রা একসাথে চলতে পারে।
  - Reviewer-রা implementer-এর সারাংশ বিশ্বাস না করে নিজেরাই `git diff` পড়ে আর চেক চালায়।
  - প্রতিটি agent একটি নির্দিষ্ট রিপোর্ট ব্লক দিয়ে শেষ করে (Scope / Evidence / Findings / Verdict / NOT RUN)।
  - সর্বোচ্চ ৩ বার ঠিক করার চেষ্টা, তারপর মানুষের কাছে পাঠানো।
  - কোন কাজে মানুষের অনুমোদন লাগবে, তা AGENTS.md §5 থেকে আসে।
- **সৎ সীমাবদ্ধতা:** "test-engineer শুধু test লিখবে" একটি নির্দেশনা মাত্র, প্ল্যাটফর্ম এটা প্রয়োগ করে না। Reviewer-দের read-only থাকা অবশ্য `tools` দিয়ে প্রয়োগ **করা হয়**।

### ৫.৫ Hook (ন্যূনতম সেট)

১. `PreToolUse` / `Bash`: ধ্বংসাত্মক বা বাইরে দৃশ্যমান কমান্ড ধরে (`git push`, `--force`, `reset --hard`, `npm publish`, `prisma migrate reset`, প্রজেক্টের বাইরে `rm -rf`, `DROP`) → কারণসহ `permissionDecision: "ask"`। এটি `permissions.ask` নিয়মের পরিপূরক, বিকল্প নয়।

২. `PreToolUse` / `Edit|Write`: `.env.example` ছাড়া অন্য `.env*` ফাইলে লেখা আটকায়, আর উচ্চ-নিশ্চয়তার secret প্যাটার্ন (private key, `AKIA…`, `ghp_…`, `sk-…`) পেলে জিজ্ঞেস করে।

৩. `SessionStart`: `docs/PROGRESS.md` থাকলে তার "Next" অংশ দেখায় (সস্তায় প্রসঙ্গ দেওয়া)।

ডিফল্টভাবে প্রতি সম্পাদনার পর lint বা test চালানোর hook থাকবে না (খুব ব্যয়বহুল)। পরে ঐচ্ছিক হিসেবে দেওয়া যায়।

### ৫.৬ Workflow কীভাবে যাচাই হবে (নির্ধারিত বনাম গুণগত)

| চেক | ধরন | স্বয়ংক্রিয়? |
|---|---|---|
| ওপরের ডকুমেন্টেশন অনুযায়ী frontmatter schema (বাধ্যতামূলক field, নামের নিয়ম, ১,৫৩৬ অক্ষরের সীমা, অচেনা field ধরা) | static | হ্যাঁ |
| Reference-এর অখণ্ডতা (প্রতিটি `references/*.md` আর `@import` আসলেই আছে কিনা) | static | হ্যাঁ |
| নীতিমালার অখণ্ডতা (ইনস্টল-করা AGENTS.md-এর hash মূল ফাইলের সাথে মেলে; অনুমোদনের নিয়ম আর PASS/FAIL/NOT RUN/BLOCKED নিয়মের মতো প্রয়োজনীয় অংশ আছে) | static | হ্যাঁ |
| নমুনা রিপোজিটরিতে installer (খালি, CLAUDE.md আগে থেকে আছে, `.claude/settings.json` আগে থেকে আছে, ব্যবহারকারীর সম্পাদিত skill, নামের সংঘাত) | integration | হ্যাঁ |
| Hook script: নমুনা JSON stdin → নির্দিষ্ট exit code / সিদ্ধান্ত | unit | হ্যাঁ |
| Settings merge কখনো `allow` / `bypassPermissions` যোগ করে না | unit | হ্যাঁ |
| Skill-গুলো Claude Code-এ আসলেই চালু হয় আর ভালো কাজ করে | গুণগত | **না।** হাতে-কলমে চেকলিস্ট; `claude plugin eval` পরে দেখা হবে। এর দাবি করা হবে না। |

---

## ৬. নিরাপত্তা ও নির্ভরযোগ্যতা পরিকল্পনা

| ঝুঁকি | প্রতিকার | টেস্ট |
|---|---|---|
| Path traversal / ক্ষতিকর নাম | নাম যাচাই (npm-এর নিয়ম + `/ \ ..` নয়, absolute path নয়, Windows-এর সংরক্ষিত `CON/NUL/COM1…` নয়, শেষে ডট/স্পেস নয়)। `--dir` স্পষ্টভাবে না দিলে টার্গেট cwd-এর ভেতরেই থাকতে হবে | Table-driven unit test |
| ফোল্ডার আগে থেকে আছে | টার্গেট থাকলে আর খালি না হলে প্রত্যাখ্যান; ব্যবহারকারীর কিছু কখনো `--force` দিয়ে মোছা হয় না | Integration |
| Symlink | টার্গেট আর প্রতিটি লেখার path `lstat` করা; symlink-এর মধ্য দিয়ে লেখা প্রত্যাখ্যান; staging ফোল্ডার `mkdtemp` দিয়ে তৈরি | Integration (POSIX CI; সম্ভব হলে Windows) |
| Command injection | `execa`-তে argument array, `shell: false`, ব্যবহারকারীর ইনপুট কমান্ড স্ট্রিংয়ে বসানো হয় না | Unit + `shell: true` খোঁজার lint নিয়ম |
| আংশিক ব্যর্থতা / Ctrl-C | Staging ফোল্ডার + atomic rename। মোছার আগে marker ফাইল দেখে নিশ্চিত হয়, তারপর শুধু নিজের তৈরি ফোল্ডারই মোছে | ইচ্ছাকৃত ত্রুটি ঢুকিয়ে টেস্ট |
| ব্যবহারকারীর config মুছে যাওয়া (`add`) | Plan + preview, সংঘাত থাকলে `--yes` আটকায়, ব্যাকআপ, hash দিয়ে managed ফাইল ট্র্যাক | নমুনা প্রজেক্টে টেস্ট |
| Secret | Template-এ শুধু `.env.example`; প্যাকেজের `files` allowlist; release চেকে tarball স্ক্যান | Release টেস্ট |
| ইনস্টলের সময় চলা script | pnpm ডিফল্টভাবে dependency-র build script আটকে দেয়। Recipe-গুলো নির্দিষ্টভাবে বলে দেয় কোন প্যাকেজের এটা লাগবে (যেমন Prisma, esbuild); **pnpm 12-এর config syntax-এর সাথে যাচাই করে** | Recipe টেস্ট |
| তৈরি-করা টেস্ট production DB-তে চলে যাওয়া | টেস্ট config in-memory বা `localhost` টেস্ট DB ব্যবহার করে; `NODE_ENV=production` হলে বা URI লোকাল না হলে চলতে অস্বীকার করে | Template টেস্ট |
| Upstream পরিবর্তন | Generator-এর নির্দিষ্ট pin, কাঠামোর পূর্বশর্ত, নির্ধারিত canary | CI |
| ক্ষতিকর template বিষয়বস্তু | v1-এ template শুধু tarball-এর ভেতরের নিজস্ব ফাইল; দূরবর্তী (remote) template নেই | — |
| Hook এড়ানো সম্ভব | "Best-effort" বলে ডকুমেন্ট করা; আসল প্রয়োগ হয় `permissions.ask`, CI আর branch protection দিয়ে | ডকুমেন্টেশন |

---

## ৭. টেস্টিং কৌশল

| স্তর | কী | কোথায় চলে |
|---|---|---|
| Unit | নাম/path যাচাই, PM শনাক্তকরণ, plan তৈরি, settings merge, manifest schema, hook script | প্রতি PR-এ, সব OS-এ |
| CLI integration | Build-করা CLI (`node dist/...`) টেম্প ফোল্ডারে চালানো: flag, `--dry-run`, `--yes`, ভুল ইনপুট, আগে থেকে থাকা ফোল্ডার, cancel করার অনুকরণ, process ব্যর্থতা, exit code, `--json` আউটপুট | প্রতি PR-এ, ubuntu + windows |
| Recipe তৈরি (দ্রুত) | `--no-install` দিয়ে generate; ফাইল, manifest, config-এর কাঠামো যাচাই | প্রতি PR-এ |
| Recipe যাচাই (পূর্ণ) | generate → install (npm, pnpm) → typecheck → lint → test → build → smoke (HTTP `/health`; Vite-এর জন্য ৩টি viewport-এ Playwright + axe) | রাতে + release-এ + label দিলে |
| DB-নির্ভর | mongodb-memory-server-এ Express integration test; Compose ফাইল `docker compose config` দিয়ে যাচাই | CI (**লোকালি Docker BLOCKED**) |
| Add-on | সামঞ্জস্য নির্ণয়, সংঘাত, আবার চালালে কিছু না বদলানো, আপডেট, ব্যাকআপ থেকে পুনরুদ্ধার | প্রতি PR-এ |
| AI workflow | §৫.৬ | প্রতি PR-এ |
| প্যাকেজ বিতরণ | `npm pack` → ফাইল তালিকা পরিদর্শন → পরিষ্কার ফোল্ডারে tarball ইনস্টল → সেখান থেকে `create`/`list`/`doctor` চালানো → asset খুঁজে পাচ্ছে কিনা আর shebang/bin কাজ করছে কিনা নিশ্চিত করা | প্রতি PR-এ (ubuntu), release-এ (সব OS) |
| নিরাপত্তা | CLI dependency আর তৈরি-করা প্রজেক্টে `npm audit --omit=dev`; tarball-এ secret স্ক্যান | প্রতি PR / release |

CI matrix: unit + CLI টেস্টের জন্য Node 22/24/26 × ubuntu/windows/macOS। খরচ নিয়ন্ত্রণে রাখতে পূর্ণ recipe matrix চলবে Node 24 × ubuntu + windows-এ। রিপোর্টে সবসময় NOT RUN/BLOCKED আলাদাভাবে দেখানো হবে।

---

## ৮. রোডম্যাপ

প্রতিটি phase শেষ হবে AGENTS.md §১৩/§১৪ অনুযায়ী handoff দিয়ে। প্রতিটি কাজের বিস্তারিত গ্রহণযোগ্যতার মানদণ্ড অনুমোদনের পর `docs/TASKS.md`-এ যাবে।

| Phase | কাজ (ID) | নির্ভরতা | গ্রহণযোগ্যতা (সারাংশ) | MVP? |
|---|---|---|---|---|
| **P0** অডিট ও বেসলাইন | T0.1 অডিট ✅ · T0.2 এই প্রস্তাবনা ✅ · T0.3 অনুমোদনের পর source-of-truth ডকুমেন্টে ভাগ করা | — | আপনার অনুমোদন DECISIONS.md-এ লেখা | ✔ |
| **P1** CLI মূল অংশ | T1.1 প্যাকেজ কাঠামো (tsconfig, eslint, prettier, vitest, script) · T1.2 TS 6 বনাম 7 সামঞ্জস্য যাচাই · T1.3 errors/logger/exit code · T1.4 fs-safe + staging · T1.5 exec + pm adapter · T1.6 prompt, flag, `--dry-run`, cancel-সহ `create`-এর কাঠামো · T1.7 `list` · T1.8 `doctor` (Node/PM/git ভার্সন, প্রজেক্টের অবস্থা) · T1.9 pack করে ইনস্টলের smoke test | P0 | ওপরের সব CLI integration টেস্ট Windows + Linux-এ পাস; pack-করা tarball থেকে `list` চলে | ✔ |
| **P2** Express + Mongoose | T2.1 template · T2.2 recipe plan + option · T2.3 তৈরি-করা প্রজেক্টের টেস্ট · T2.4 পূর্ণ যাচাই (npm + pnpm) | P1 | তৈরি-করা প্রজেক্টে typecheck, lint, unit + integration test, build, `/health` smoke সব PASS | ✔ |
| **P3** Add-on engine + AI workflow | T3.1 প্রজেক্ট পরিদর্শক + state · T3.2 add-on engine (plan/preview/backup/apply/verify) · T3.3 AI asset: ১০টি skill, ৬টি agent, ৩টি hook, `orchestrate` · T3.4 Claude Code adapter + settings merge · T3.5 managed ফাইল আপডেট · T3.6 validator + নমুনা প্রজেক্টে টেস্ট · T3.7 হাতে-কলমে চেকলিস্টসহ `docs/AI-WORKFLOWS.md` | P1 | §৫.৬-এর স্বয়ংক্রিয় চেক PASS; দুবার ইনস্টল করলে কিছু বদলায় না; ব্যবহারকারীর সম্পাদিত ফাইল অক্ষত থাকে | ✔ |
| **P4** Vite + React + Tailwind | T4.1 upstream+overlay adapter · T4.2 theme/a11y উদাহরণ পেজ · T4.3 ৩টি viewport-এ Playwright + axe · T4.4 পূর্ণ যাচাই | P1 (ঐচ্ছিক AI-এর জন্য P3) | build/typecheck/lint/test PASS; build-করা CSS-এ Tailwind class আছে; উদাহরণ পেজে axe-এ কোনো গুরুতর লঙ্ঘন নেই | ✔ |
| **P5** CI + v0.1 release প্রস্তুতি | T5.1 CI workflow (স্তরভিত্তিক) · T5.2 canary job · T5.3 README/CONTRIBUTING/CHANGELOG/PUBLISHING/RELEASE · T5.4 release-প্রস্তুতি রিপোর্ট | P2–P4 | Brief-এর §১০ "Release verification"-এর সব কিছু প্রমাণসহ; **publish নয়** | ✔ |
| **P6** Next.js recipe | T6.x | P5 | P4-এর মতো + loading/error/not-found route | v0.2 |
| **P7** NestJS + Postgres + Prisma | T7.x (শুরুর সময় Prisma লাইন ঠিক হবে) | P5 | build/test PASS; CI-এর Postgres service-এ Prisma generate/migrate | v0.2 |
| **P8** আরও add-on, recipe, অন্য agent-এর adapter | — | চাহিদা অনুযায়ী | — | পরে |

ক্রমটি brief থেকে আলাদা: add-on engine আর AI workflow (P3) Vite-এর **আগে** আসছে। কারণ `add ai-workflows`-ই প্রথম সত্যিকারের add-on, আর এটাই প্রোডাক্টের মূল বিশেষত্ব। এতে engine-টা কাল্পনিক প্রয়োজনের বদলে একটি বাস্তব ব্যবহারকারী সামনে রেখে তৈরি হয়।

---

## ৯. প্যাকেজের নাম ও release কৌশল

- **আপনার সিদ্ধান্ত লাগবে (Q1)।** `create-stackforge` আর `stackforge` একটি একই রকম প্রোডাক্ট নিয়ে নিয়েছে। বিকল্প:
  - **A. নতুন ব্র্যান্ড (প্রস্তাবিত)।** Scope ছাড়া `create-<brand>`, যাতে ব্যবহারকারী চালায় `npm create <brand>@latest`। ২০২৬-১০-২৬ তারিখে npm-এ খালি ছিল: `create-stacksmith`, `create-keelstack`, `create-stackwright`, `create-anvilstack`, `create-stackgate`। GitHub org, ডোমেইন আর ট্রেডমার্ক **যাচাই করা হয়নি**।
  - **B. "StackForge" নাম রাখা, scope সহ।** `@<your-scope>/create-stackforge`, যাতে ব্যবহারকারী চালায় `npm create @<your-scope>/stackforge`। কারিগরিভাবে চলবে, কিন্তু প্রায় একই কাজ করা আলাদা একটি `create-stackforge`-এর পাশে থাকবে। এতে ব্যবহারকারী আর সার্চ দুটোতেই বিভ্রান্তি হবে।
- **কমান্ড (bin):** একটি প্যাকেজে দুটি bin: `create-<brand>` (scaffold) আর `<brand>` (`list`/`doctor`/`add`)। Subcommand-গুলো `npx create-<brand> doctor` হিসেবেও চলে, তাই global ইনস্টল লাগে না।
- **Release:** শুধু ESM, Node ≥ 22.12, `files` allowlist (`dist`, `assets`, README, LICENSE), SemVer `0.1.0` থেকে শুরু। npm trusted publishing (OIDC) হবে একটি আলাদা, হাতে চালু করতে হয় এমন GitHub Actions workflow থেকে, provenance আর ন্যূনতম `permissions`-সহ।
- **যেগুলোতে অনুমোদন লাগবে:** চূড়ান্ত নাম, লাইসেন্স (Q6), লেখক/রিপো metadata, যেকোনো `npm publish`, GitHub রিপো বা release তৈরি, publish করতে পারে এমন workflow push করা।

---

## ১০. খোলা প্রশ্ন (যে সিদ্ধান্তগুলো কাজের ধরন বদলে দেয়)

- **Q1 — নাম:** নতুন ব্র্যান্ড (কোনটি?), নাকি scope-সহ `@scope/create-stackforge`?
- **Q2 — MVP-এর আকার:** v0.1 = Express + Vite (প্রস্তাবিত), নাকি প্রথম release-এর আগেই চারটি recipe?
- **Q3 — Nest recipe-এর Prisma লাইন:** stable 7.x-এ pin করা, নাকি 8.0 GA-এর অপেক্ষা?
- **Q4 — নীতিমালা বিতরণ:** আপনার AGENTS.md-ই নীতিমালা। তৈরি-করা প্রজেক্টে StackForge কি (ক) আপনার AGENTS.md হুবহু একটি managed, hash-ট্র্যাক-করা ফাইল হিসেবে বসাবে (প্রস্তাবিত: একটিই নীতিমালা, `add ai-workflows --update` দিয়ে আপডেট হয়), নাকি (খ) একটি ছোট AGENTS.md বসাবে, যা `.stackforge/policy/`-এর একটি ভার্সনসহ কপির দিকে নির্দেশ করে? কিছু অংশ প্রোডাক্ট-নির্দিষ্ট (যেমন Shopify, SEO); হুবহু রাখলে সেগুলোও থাকবে, কারণ সেগুলোতে আগে থেকেই "যখন ব্যবহৃত হয়" লেখা আছে।
- **Q5 — AI workflow কীভাবে পৌঁছাবে:** `.claude/`-এ managed ফাইল হিসেবে (v1-এর জন্য প্রস্তাবিত: চোখে দেখা যায়, commit হয়, বাড়তি ধাপ ছাড়াই পুরো টিমের জন্য কাজ করে), নাকি পরে Claude Code plugin/marketplace হিসেবেও?
- **Q6 — লাইসেন্স ও পরিচয়:** MIT? `package.json`-এর জন্য লেখকের নাম/ইমেইল আর GitHub রিপো URL (না পাওয়া পর্যন্ত placeholder থাকবে)।
- **Q7 — Package manager:** v0.1-এ শুধু npm + pnpm যাচাই করা (yarn/bun-এর ক্ষেত্রে স্পষ্ট বার্তা দিয়ে জানানো হবে যে সাপোর্ট নেই)? Bun এখানে ইনস্টল নেই, তাই লোকালি সেটা যাচাই করাও সম্ভব নয়।

অন্য কিছু না বললে কম-প্রভাবের বিষয়ে এই ডিফল্টগুলো ব্যবহার করব: Prettier formatting, Conventional Commits, Express logging-এর জন্য `pino`, validation-এর জন্য Zod, Vite উদাহরণে light/dark/system theme, CI-এর জন্য `--json` আউটপুট মোড।

---

## ১১. প্রস্তাবিত বেসলাইন

অনুমোদনের জন্য প্রস্তাব: **v0.1 = CLI মূল অংশ + Express/Mongoose + Vite/React/Tailwind + `ai-workflows` (Claude Code)-সহ add-on engine + release প্রস্তুতি (publish নয়)**। একটি প্যাকেজ, ESM, Node ≥ 22.12, npm + pnpm, নতুন একটি ব্র্যান্ড নামে।

এটাই সবচেয়ে ছোট release, যা প্রোডাক্টের প্রতিটি কঠিন অংশ প্রমাণ করে: নিজস্ব template, upstream generator-এর ওপর overlay, বিদ্যমান প্রজেক্টে নিরাপদ সম্পাদনা, অখণ্ডতা যাচাইসহ AI workflow ইনস্টল ও আপডেট, আর pack-করা tarball থেকে ইনস্টল। এর সবকিছু এই মেশিনেই যাচাই করা যায়, শুধু Docker-নির্ভর চেকগুলো CI-তে চলবে। এরপর v0.2-এ Next.js আর NestJS+Prisma যোগ হবে নতুন adapter হিসেবে, engine নতুন করে নকশা করতে হবে না।
