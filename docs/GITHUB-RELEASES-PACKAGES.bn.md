# GitHub-এর "Releases" আর "Packages": কোনটা কী, কোনটা করব, কোনটা করব না

> StackJoist-এর মালিকের জন্য লেখা একটি গাইড (বাংলায়)। তারিখ: ২০২৬-১০-২৬।
> সংক্ষেপে: **Releases ব্যবহার করব, Packages ব্যবহার করব না।** প্যাকেজ যাবে npm-এ (npmjs.com)।

রিপোর মূল পেজের ডান পাশে "About" অংশের নিচে তিনটি জিনিস দেখা যায়: **Releases**, **Packages** আর কখনো **Deployments**। এখন দুটোতেই লেখা থাকবে "No releases published" / "No packages published"। এটা স্বাভাবিক, কারণ এখনো কিছু release হয়নি।

---

## ১. Releases কী?

**Release** হলো আপনার কোডের একটা নির্দিষ্ট ভার্সনের "অফিসিয়াল ঘোষণা"। তিনটি জিনিস মিলে একটা release:

| অংশ                 | মানে                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **Git tag**         | একটা নির্দিষ্ট commit-এর গায়ে ভার্সন নম্বরের লেবেল, যেমন `v0.1.0`। পরে যে কেউ ঠিক সেই কোডটা দেখতে পারে। |
| **Release notes**   | এই ভার্সনে কী নতুন, কী ঠিক হলো, কী ভাঙতে পারে: মানুষের পড়ার মতো করে লেখা।                               |
| **Assets** (ঐচ্ছিক) | ডাউনলোড করার মতো ফাইল (zip, binary)। GitHub নিজে থেকেই সোর্স কোডের zip/tar.gz যোগ করে দেয়।              |

### এর কাজ কী?

- ব্যবহারকারী আর contributor-রা এক জায়গায় দেখতে পায় কোন ভার্সনে কী বদলেছে।
- কেউ রিপো **Watch → Custom → Releases** করে রাখলে নতুন release-এ নোটিফিকেশন পায়।
- npm পেজে "Repository" লিঙ্ক থেকে এসে মানুষ ভার্সনের ইতিহাস দেখে। এতে প্রজেক্টটাকে সক্রিয় ও বিশ্বাসযোগ্য মনে হয়, যা SEO আর ব্র্যান্ডের জন্যও ভালো।
- কোনো ভার্সনে সমস্যা হলে কোন commit থেকে সেটা বানানো হয়েছিল, tag দেখে সাথে সাথে বোঝা যায়।

### আমরা কি এটা করব? **হ্যাঁ।**

প্রতিবার npm-এ নতুন ভার্সন publish হলে একই নম্বরে একটা GitHub Release হবে (যেমন npm `0.1.0` ↔ GitHub `v0.1.0`)।

### কেন?

- npm শুধু প্যাকেজটা দেয়, "কী বদলাল" তা সুন্দর করে দেখায় না। Release notes সেই কাজটা করে।
- `CHANGELOG.md`-এর সাথে মিলিয়ে রাখলে ইতিহাস এক জায়গায় পরিষ্কার থাকে।
- পরে npm trusted publishing + provenance চালু করলে npm পেজে দেখাবে প্যাকেজটা ঠিক কোন GitHub commit আর workflow থেকে বানানো। tag আর release থাকলে এটা মিলিয়ে দেখা সহজ হয়।

### কখন করব?

**এখন নয়।** প্রথম release হবে Phase 7 (release readiness) শেষ হওয়ার পর, যখন:

1. সব চেক PASS হয়েছে, আর tarball থেকে ইনস্টল যাচাই হয়েছে।
2. আপনি স্পষ্টভাবে অনুমতি দিয়েছেন (release সবার কাছে দৃশ্যমান, তাই AGENTS.md অনুযায়ী অনুমোদন লাগবে)।
3. আগে npm-এ publish হয়েছে আর `npm create stackjoist@latest` আসলেই কাজ করছে।

ক্রম: **আগে npm publish → যাচাই → তারপর GitHub Release।** উল্টো করলে GitHub-এ এমন ভার্সনের ঘোষণা থাকবে, যা npm-এ নেই।

### কীভাবে করব? (প্রথমবার হাতে, পরে স্বয়ংক্রিয়)

**হাতে (GitHub UI দিয়ে):**

1. রিপোর ডান পাশে **Releases → Create a new release**।
2. **Choose a tag** → `v0.1.0` লিখুন → "Create new tag: v0.1.0 on publish"। Target: `main`।
3. **Release title:** `v0.1.0`।
4. **Generate release notes** বাটনে চাপ দিলে GitHub নিজেই PR/commit-এর তালিকা বানাবে; তারপর ওপরে `CHANGELOG.md` থেকে মূল পরিবর্তনগুলো মানুষের ভাষায় লিখে দিন।
5. ভার্সন `0.x` বা `-beta` হলে **Set as a pre-release** টিক দিন। stable হলে **Set as the latest release**।
6. **Publish release**।

**কমান্ড দিয়ে (`gh` CLI):**

```bash
gh release create v0.1.0 --title "v0.1.0" --notes-file release-notes.md
# বা GitHub-কে নোট বানাতে দিন:
gh release create v0.1.0 --generate-notes
```

**স্বয়ংক্রিয় (Phase 7-এ বানাব):** একটা আলাদা GitHub Actions workflow, যেটা শুধু আপনি হাতে চালু করলে (manual "Run workflow") চলবে। সেটা টেস্ট চালাবে → npm-এ publish করবে (trusted publishing, কোনো স্থায়ী টোকেন ছাড়া) → তারপর tag আর GitHub Release বানাবে। ভুল করে push থেকে নিজে নিজে release হবে না।

### Releases-এ কী করব না

- ❌ **npm publish-এর আগে release বানাব না।**
- ❌ **একবার release হওয়া tag সরাব বা মুছব না।** মানুষ আর npm provenance সেটার ওপর নির্ভর করে। ভুল হলে নতুন ভার্সন দেব (যেমন `v0.1.1`)।
- ❌ **Assets-এ `node_modules`, build zip বা `.env` রাখব না।** আমাদের আসল বিতরণ npm-এ; GitHub-এর নিজে থেকে দেওয়া সোর্স zip-ই যথেষ্ট।
- ❌ **ভার্সন নম্বর npm থেকে আলাদা রাখব না।** দুই জায়গায় সবসময় একই নম্বর থাকবে।

---

## ২. Packages কী?

**GitHub Packages** হলো GitHub-এর নিজস্ব package registry, মানে npmjs.com-এর মতো একটা জায়গা, কিন্তু GitHub-এর ভেতরে। এখানে npm প্যাকেজ, Docker image (`ghcr.io`), Maven, NuGet ইত্যাদি রাখা যায়। রিপোর পাশের "Packages" অংশ শুধু দেখায় এই রিপো থেকে GitHub Packages-এ কিছু publish হয়েছে কিনা।

### এর কাজ কী?

- মূলত **কোম্পানির ভেতরের (private) প্যাকেজ** রাখার জন্য, যেগুলো শুধু টিমের মানুষ ইনস্টল করবে।
- Docker image রাখার জন্য (`ghcr.io/...`), যদি প্রজেক্টে Docker image থাকে।

### আমরা কি এটা করব? **না।**

### কেন করব না?

1. **ব্যবহারকারীদের login লাগবে।** GitHub Packages-এর npm registry থেকে প্যাকেজ ইনস্টল করতে GitHub-এ authentication (একটা token) লাগে, এমনকি পাবলিক প্যাকেজের জন্যও। এর মানে `npm create stackjoist@latest` সাধারণ মানুষের জন্য সোজাসুজি কাজ করবে না। আমাদের পুরো লক্ষ্যই হলো যে কেউ এক কমান্ডে ব্যবহার করতে পারবে।
2. **নাম বদলাতে হবে।** GitHub Packages-এ npm প্যাকেজের নাম scope-সহ হতে হয় (`@stackjoist/create-stackjoist`)। তখন `npm create stackjoist` আর এই প্যাকেজের দিকে যাবে না।
3. **দুই জায়গায় দুই কপি = বিভ্রান্তি।** মানুষ বুঝবে না কোনটা আসল, আর দুটোকে মিলিয়ে রাখার ঝামেলা বাড়বে।
4. **SEO আর আবিষ্কারের দিক থেকে লাভ নেই।** ডেভেলপাররা প্যাকেজ খোঁজে npmjs.com-এ; সার্চ ইঞ্জিনও npm পেজ দেখায়।
5. **আমাদের Docker image নেই।** StackJoist একটা CLI, image বানানোর দরকার নেই। (তৈরি-করা প্রজেক্টে Docker Compose থাকবে, কিন্তু সেটা ব্যবহারকারীর লোকাল ডাটাবেসের জন্য, publish করার জন্য নয়।)

### তাহলে "Packages" অংশটা খালি থাকলে সমস্যা?

না, কোনো সমস্যা নেই। চাইলে লুকিয়ে রাখতে পারেন:
রিপোর মূল পেজে **About-এর পাশে ⚙️ (gear) আইকন → "Include in the home page"** → **Packages** টিক তুলে দিন (চাইলে **Deployments**-ও)। **Releases** টিক রাখুন।

### Packages নিয়ে কী করব না

- ❌ GitHub Packages-এ npm প্যাকেজ publish করব না।
- ❌ Release workflow-এ `packages: write` অনুমতি দেব না। দরকার নেই, আর অপ্রয়োজনীয় অনুমতি নিরাপত্তার ঝুঁকি।
- ❌ `.npmrc`-এ `npm.pkg.github.com` registry সেট করব না। করলে npm-এ publish ভুল জায়গায় চলে যেতে পারে।

---

## ৩. এক নজরে

|           | Releases                                      | Packages (GitHub Packages)                 | npm (npmjs.com)                         |
| --------- | --------------------------------------------- | ------------------------------------------ | --------------------------------------- |
| কী        | ভার্সনের ঘোষণা + নোট + tag                    | GitHub-এর নিজস্ব registry                  | পাবলিক JavaScript registry              |
| আমরা করব? | ✅ হ্যাঁ, প্রতিটি npm ভার্সনের সাথে           | ❌ না                                      | ✅ হ্যাঁ, এটাই আসল বিতরণ                |
| কেন       | পরিবর্তনের ইতিহাস, বিশ্বাসযোগ্যতা, নোটিফিকেশন | ইনস্টলে login লাগে, scope লাগে, বিভ্রান্তি | `npm create stackjoist` এখান থেকেই চলে  |
| কখন       | npm publish যাচাইয়ের পর                      | কখনো না (অন্তত v0.1-এ)                     | Phase 7 শেষে, আপনার অনুমতিতে            |
| কে চালাবে | হাতে-চালু workflow / আপনি                     | —                                          | হাতে-চালু workflow (trusted publishing) |

---

## ৪. এখন আপনার কিছু করার আছে?

- **এখন Releases বা Packages-এ কিছু করতে হবে না।**
- ঐচ্ছিক: About ⚙️ থেকে **Packages** (আর **Deployments**) লুকিয়ে দিন, আর About-এ একটা ছোট description, website (ডোমেইন কিনলে) আর topics (`cli`, `scaffolding`, `typescript`, `create-app`, `claude-code`) যোগ করুন। Topics GitHub সার্চে খুঁজে পেতে সাহায্য করে।
- পরে Phase 7-এ npm account, 2FA, trusted publishing আর প্রথম release-এর পুরো ধাপ `PUBLISHING.md`-এ লিখে দেব।
