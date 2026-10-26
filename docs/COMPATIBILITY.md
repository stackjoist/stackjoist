# Compatibility

Versions checked with `npm view` on 2026-10-26. "Pinned" means the exact version StackJoist was tested with.

## StackJoist itself

| Item             | Supported                       | Notes                                                                         |
| ---------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| Node.js          | `>=22.12.0` (tested 22, 24, 26) | Node 20 is EOL; `commander@15` requires ≥ 22.12                               |
| Module system    | ESM only                        |                                                                               |
| OS               | Windows, Linux, macOS           | Windows and Linux verified in CI every PR; macOS in the unit/CLI matrix       |
| Package managers | npm, pnpm                       | Yarn and Bun reported as unsupported (ADR-006)                                |
| TypeScript (dev) | 6.0.x                           | `typescript-eslint@8.72` peer range is `<6.1.0`; TS 7 not supported by it yet |

## Recipes _(filled in as each recipe is verified)_

| Recipe                  | Upstream / key versions                                                                                                                                          | Status                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Express + Mongoose      | express ^5.3.0, mongoose ^9.11.4, zod ^4.6.7, typescript ~6.0.3. Generated project needs Node >= 22.13 (ESLint 10) and, with pnpm, pnpm >= 10.26 (`allowBuilds`) | Verified 2026-10-26 with npm 12.1.0 and pnpm 12.15.0 on Windows 11 / Node 24.18.1 (Linux/macOS: CI in P7) |
| Vite + React + Tailwind | create-vite 9.3.1, tailwindcss 4.3.x                                                                                                                             | planned (P4)                                                                                              |
| Next.js + Tailwind      | create-next-app 16.4.x                                                                                                                                           | planned (P5)                                                                                              |
| NestJS + Prisma         | @nestjs/cli 12.x, prisma 7.x stable                                                                                                                              | planned (P6)                                                                                              |

## Known upstream facts

- `prisma`'s `latest` dist-tag pointed to `8.0.0-rc.27` on 2026-10-26; StackJoist pins the 7.x stable line (ADR-002).
