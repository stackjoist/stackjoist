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

| Recipe                  | Upstream / key versions              | Status       |
| ----------------------- | ------------------------------------ | ------------ |
| Express + Mongoose      | express 5.x, mongoose 9.x, zod 4.x   | planned (P2) |
| Vite + React + Tailwind | create-vite 9.3.1, tailwindcss 4.3.x | planned (P4) |
| Next.js + Tailwind      | create-next-app 16.4.x               | planned (P5) |
| NestJS + Prisma         | @nestjs/cli 12.x, prisma 7.x stable  | planned (P6) |

## Known upstream facts

- `prisma`'s `latest` dist-tag pointed to `8.0.0-rc.27` on 2026-10-26; StackJoist pins the 7.x stable line (ADR-002).
