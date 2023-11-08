import esbuild from "esbuild";

const IS_WATCH_MODE = process.env.IS_WATCH_MODE;

const TARGET_ENTRIES = [
  {
    target: "node21",
    entryPoints: ["server/index.js"],
    platform: "node",
    outfile: "../dist/server/server.js",
  },
];

const buildBundle = async () => {
  try {
    const baseOptions = {
      logLevel: "info",
      bundle: true,
      charset: "utf8",
      minifyWhitespace: true,
      absWorkingDir: process.cwd(),
    };

    for (const targetOpts of TARGET_ENTRIES) {
      const mergedOpts = { ...baseOptions, ...targetOpts };

      if (IS_WATCH_MODE) {
        let ctx = await esbuild.context(mergedOpts);
        await ctx.watch();
      } else {
        const { errors } = await esbuild.build(mergedOpts);
        if (errors.length) {
          console.error(`[ESBuild] Bundle failed with ${errors.length} errors`);
          process.exit(1);
        }
      }
    }
  } catch (e) {
    console.log("[ESBuild] Build failed with error");
    console.error(e);
    process.exit(1);
  }
};

buildBundle().catch(() => process.exit(1));
