// `pnpm deploy --prod` reinstalls @prisma/client from the pnpm store as its
// raw, ungenerated package. The actual generated client code and query
// engine binary (written by `prisma generate`) live in a sibling
// `.prisma/client` package next to it, in the *source* install — both get
// discarded by the deploy reinstall. Copy them from the already-generated
// source location into wherever the deployed output resolves
// @prisma/client to (pnpm's virtual store hashing makes that path opaque,
// so it's resolved via Node rather than hardcoded).
const fs = require("fs");
const path = require("path");

const deployDir = process.argv[2];
if (!deployDir) {
  console.error("usage: node copy-prisma-client.js <deploy-dir>");
  process.exit(1);
}

function resolvePrismaRoot(startDir) {
  const resolvedFile = require.resolve("@prisma/client", { paths: [startDir] });
  return path.dirname(path.dirname(path.dirname(resolvedFile)));
}

const srcRoot = resolvePrismaRoot(path.join(__dirname, "../../../packages/database"));

const deployedDbDir = fs.realpathSync(path.join(deployDir, "node_modules/@journal/database"));
const destRoot = resolvePrismaRoot(path.dirname(deployedDbDir));

for (const name of ["@prisma", ".prisma"]) {
  fs.cpSync(path.join(srcRoot, name), path.join(destRoot, name), { recursive: true, force: true });
}

console.log(`copied generated prisma client from ${srcRoot} to ${destRoot}`);
