import { build, emptyDir } from "https://deno.land/x/dnt@0.32.0/mod.ts";

await emptyDir("./build/types-package");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./build/types-package",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "cloudflare-workers-postgres",
    version: '0.0.0',
  },
  typeCheck: false,
  test: false,
  declaration: true,
  compilerOptions: {
    lib: ["dom"]
  }
});
