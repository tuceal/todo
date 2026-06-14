---
name: react-native-web pnpm dist fix
description: react-native-web@0.21 installed via pnpm has incomplete dist/exports/ directory; fix in metro.config.js
---

## Rule
When using react-native-web@0.21.x with pnpm in an Expo project, the `dist/exports/` directory only contains 4 entries (KeyboardAvoidingView, TouchableNativeFeedback, TouchableWithoutFeedback, unmountComponentAtNode). The `dist/index.js` is an ESM barrel that tries to import from ~60 missing export files.

**Why:** The pnpm content-addressable store appears to cache an incomplete version of the dist/ directory. `dist/cjs/index.js` (the main field) also doesn't exist.

**How to apply:** In `metro.config.js`, add a `resolver.resolveRequest` that redirects any `react-native-web/dist/` import to `react-native-web/src/`. Also add `react-native-web` to `transformer.transformIgnorePatterns` allowlist since src/ files use Flow types and ESM syntax.

```js
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("react-native-web/dist/")) {
    const srcName = moduleName.replace("react-native-web/dist/", "react-native-web/src/");
    try { return context.resolveRequest(context, srcName, platform); } catch(_) {}
  }
  // ...
};
config.transformer.transformIgnorePatterns = [
  `node_modules/(?!(react-native|@react-native|expo|@expo|react-native-web))`,
];
```
