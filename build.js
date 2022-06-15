import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { replace } from "esbuild-plugin-replace";
import textReplace from "esbuild-plugin-text-replace";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  await build({
    bundle: true,
    format: "esm",
    target: "esnext",
    external: ["__STATIC_CONTENT_MANIFEST", "*.wasm"],
    conditions: ["worker", "browser"],
    entryPoints: [path.join(__dirname, "build", "postgres-deno.js")],
    outfile: path.join(__dirname, "build", "postgres-tmp.js"),
    treeShaking: true,
    plugins: [
      replace({
        "stdCrypto.subtle": "crypto.subtle",
        "webCrypto.subtle": "crypto.subtle",
        "stdCrypto": "unused_stdCrypto",
        "webCrypto": "unused_webCrypto",
      }),
    ],
  });
  await build({
    bundle: true,
    format: "esm",
    target: "esnext",
    external: ["__STATIC_CONTENT_MANIFEST", "*.wasm"],
    conditions: ["worker", "browser"],
    entryPoints: [path.join(__dirname, "build", "postgres-tmp.js")],
    outfile: path.join(__dirname, "build", "postgres.js"),
    treeShaking: true,
    plugins: [
      textReplace({
        include: /.+/,
        pattern: [
          ["var data = decode(", "const data = null && decode("],
          ["var unused_stdCrypto =", "var unused_stdCrypto = null &&"],
          ["var unused_webCrypto =", "var unused_webCrypto = null &&"],
          ["var imports =", "var imports = null &&"],
          ["var cachedTextEncoder =", "var cachedTextEncoder = null &&"],
          ["var DigestContextFinalization =", "var DigestContextFinalization = null &&"],
          ["var wasm =", "var wasm = null &&"],
          ["var wasmInstance =", "var wasmInstance = null &&"],
          [`var wasmModule =`, "var wasmModule = null &&"]
        ]
      }),
    ]
    // define: {
    //   "unused_stdCrypto": "null",
    //   "unused_webCrypto": "null",
    // }
  });
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
