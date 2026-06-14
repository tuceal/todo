---
name: Clerk Expo NativeClerkModule web stub
description: @clerk/expo NativeClerkModule calls TurboModuleRegistry.get() at module top-level, crashing on web
---

## Rule
`@clerk/expo/dist/specs/NativeClerkModule.js` calls `TurboModuleRegistry.get("ClerkExpo")` at the module's TOP LEVEL (not inside a guard). On web (react-native-web), `TurboModuleRegistry` is undefined, causing "Cannot read properties of undefined (reading 'get')".

**Why:** The native-module.js file does check Platform.OS before using the module, but it still `require()`s NativeClerkModule.js unconditionally at the top.

**How to apply:** Create a stub file `shims/NativeClerkModule.web.js` that exports `null`, then add to metro.config.js resolveRequest:

```js
if (platform === "web" && moduleName.endsWith("specs/NativeClerkModule")) {
  return { type: "sourceFile", filePath: NATIVE_CLERK_MODULE_STUB };
}
```

Also ensure `(auth)` route group has a `_layout.tsx` file, otherwise expo-router warns about missing nested route names.
