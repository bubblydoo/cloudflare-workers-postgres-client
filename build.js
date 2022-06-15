import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { replace } from "esbuild-plugin-replace";
import textReplace from "esbuild-plugin-text-replace";
import esbuildDefine from "cloudflare-workers-node-compat/esbuild-define";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("esbuild").BuildOptions} */
const common = {
  bundle: true,
  format: "esm",
  target: "esnext",
  external: ["*.wasm"],
  conditions: ["worker", "browser"],
  treeShaking: true,
  pure: ["decode"]
}
try {
  await build({
    ...common,
    entryPoints: [path.join(__dirname, "build", "postgres-deno.js")],
    outfile: path.join(__dirname, "build", "postgres-tmp.js"),
    plugins: [
      replace({
        "stdCrypto.subtle": "crypto.subtle",
        "webCrypto.subtle": "crypto.subtle",
        "stdCrypto": "unused_stdCrypto",
        "webCrypto": "unused_webCrypto",
      }),
    ],
    inject: [
      "./workers-override.ts",
      "./node_modules/cloudflare-workers-node-compat/build/deno-worker-compat.mjs"
    ],
    define: {
      ...esbuildDefine,
      "Deno.startTls": "workerDenoPostgres_startTls",
      "Deno.connect": "workerDenoPostgres_connect",
    }
  });
  await build({
    ...common,
    entryPoints: [path.join(__dirname, "build", "postgres-tmp.js")],
    outfile: path.join(__dirname, "build", "postgres.js"),
    plugins: [
      textReplace({
        include: /.+/,
        pattern: [
          // Filter out crypto-related
          ["var unused_stdCrypto =", "var unused_stdCrypto = null &&"],
          ["var unused_webCrypto =", "var unused_webCrypto = null &&"],
          // Filter out FinalizationRegistry-related
          ["var DigestContextFinalization =", "var DigestContextFinalization = null &&"],
          // Filter out Wasm-related
          ["var data = decode(\"AGFzb", "var data = null && decode(\"AGFzb"],
          ["var wasm =", "var wasm = null &&"],
          ["var wasmInstance =", "var wasmInstance = null &&"],
          [`var wasmModule =`, "var wasmModule = null &&"]
        ]
      }),
    ],
  });
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
