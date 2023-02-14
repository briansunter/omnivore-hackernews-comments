import esbuild from "esbuild";
import { esBuildConfig } from "./esbuild.config.js";

const context = await esbuild.context({
  ...esBuildConfig,
  sourcemap: true,
});

await context.watch();
