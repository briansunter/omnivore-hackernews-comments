import esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";
const esBuildConfig = {
  entryPoints: ["src/background.ts"],
  bundle: true,
  minify: true,
  logLevel: "info",
  outfile: "dist/background.js",
  plugins: [
    copy({
      resolveFrom: "cwd",
      assets: {
        from: "./assets/**/*",
        to: "./dist/",
      },
    }),
  ],
};

esbuild.build(esBuildConfig).catch(console.error);

export { esBuildConfig };
