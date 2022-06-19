import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { replace } from "esbuild-plugin-replace";
import generateBundlerConfig from "cloudflare-workers-compat/bundler-config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("esbuild").BuildOptions} */
const common = {
  bundle: true,
  format: "esm",
  target: "esnext",
  conditions: ["worker", "browser"],
  treeShaking: true,
  pure: ["decode"]
};

const compatConfig = await generateBundlerConfig({
  denoObject: {
    attributes: true,
    global: "empty-object"
  },
  onIncompatible: "ignore"
});

await build({
  ...common,
  entryPoints: [path.join(__dirname, "build", "postgres-deno.js")],
  outfile: path.join(__dirname, "build", "postgres-tmp.js"),
  plugins: [
    replace({
      delimiters: ['', ''],
      values: {
        "stdCrypto.subtle": "crypto.subtle",
        "webCrypto.subtle": "crypto.subtle",
        "stdCrypto": "unused_stdCrypto",
        "webCrypto": "unused_webCrypto"
      }
    })
  ],
  inject: [
    ...compatConfig.inject,
    "./workers-override.ts",
  ],
  define: {
    ...compatConfig.define,
    "Deno.startTls": "workerDenoPostgres_startTls",
    "Deno.connect": "workerDenoPostgres_connect",
  },
});

await build({
  ...common,
  entryPoints: [path.join(__dirname, "build", "postgres-tmp.js")],
  outfile: path.join(__dirname, "build", "postgres.js"),
  plugins: [
    replace({
      delimiters: ['', ''],
      values: {
        // Filter out crypto-related
        "var unused_stdCrypto =": "var unused_stdCrypto = null &&",
        "var unused_webCrypto =": "var unused_webCrypto = null &&",
        // Filter out FinalizationRegistry-related
        "var DigestContextFinalization =": "var DigestContextFinalization = null &&",
        // Filter out Wasm-related
        "var data = decode(\"": "var data = null && decode(\"",
        "var wasm =": "var wasm = null &&",
        "var wasmInstance =": "var wasmInstance = null &&",
        "var wasmModule =": "var wasmModule = null &&"
      }
    })
  ],
});
