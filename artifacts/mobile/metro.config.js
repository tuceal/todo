const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const NATIVE_CLERK_MODULE_STUB = path.resolve(
  __dirname,
  "shims/NativeClerkModule.web.js",
);

// ── Fix: react-native-web@0.21 dist/exports/ is incomplete in pnpm ──────────
// expo-router explicitly imports react-native-web/dist/index and
// react-native-web/dist/exports/X, but those files are missing in the pnpm
// content-addressable store. Redirect them all to the src/ equivalents,
// which are present and correct.
//
// Also stub out @clerk/expo's NativeClerkModule on web — it tries to call
// TurboModuleRegistry.get() which is unavailable in react-native-web.
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub native Clerk module on web
  if (
    platform === "web" &&
    (moduleName.endsWith("specs/NativeClerkModule") ||
      moduleName.endsWith("specs/NativeClerkModule.js"))
  ) {
    return { type: "sourceFile", filePath: NATIVE_CLERK_MODULE_STUB };
  }

  // Redirect broken react-native-web dist/ to src/
  if (moduleName.startsWith("react-native-web/dist/")) {
    const srcName = moduleName.replace(
      "react-native-web/dist/",
      "react-native-web/src/",
    );
    try {
      return context.resolveRequest(context, srcName, platform);
    } catch (_) {
      // fall through to default resolver
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// ── Allow react-native-web/src to be Babel-transformed ─────────────────────
// Metro skips node_modules by default. The src/ files contain Flow types and
// ESM syntax that must be stripped/transformed before they can run.
const ALWAYS_TRANSFORM = [
  "react-native",
  "@react-native",
  "@react-navigation",
  "expo",
  "@expo",
  "@unimodules",
  "react-native-web",
];

config.transformer.transformIgnorePatterns = [
  `node_modules/(?!(${ALWAYS_TRANSFORM.join("|")}))`,
];

module.exports = config;
