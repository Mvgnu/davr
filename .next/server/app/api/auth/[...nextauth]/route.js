"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "bcrypt":
/*!*************************!*\
  !*** external "bcrypt" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "pg":
/*!*********************!*\
  !*** external "pg" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("pg");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=%2FUsers%2Fmagnusohle%2Fcursorprojects%2Fdavr%2Fapp&pageExtensions=js&pageExtensions=jsx&pageExtensions=ts&pageExtensions=tsx&rootDir=%2FUsers%2Fmagnusohle%2Fcursorprojects%2Fdavr&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=%2FUsers%2Fmagnusohle%2Fcursorprojects%2Fdavr%2Fapp&pageExtensions=js&pageExtensions=jsx&pageExtensions=ts&pageExtensions=tsx&rootDir=%2FUsers%2Fmagnusohle%2Fcursorprojects%2Fdavr&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_magnusohle_cursorprojects_davr_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/auth/[...nextauth]/route.ts */ \"(rsc)/./app/api/auth/[...nextauth]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"/Users/magnusohle/cursorprojects/davr/app/api/auth/[...nextauth]/route.ts\",\n    nextConfigOutput,\n    userland: _Users_magnusohle_cursorprojects_davr_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRm1hZ251c29obGUlMkZjdXJzb3Jwcm9qZWN0cyUyRmRhdnIlMkZhcHAmcGFnZUV4dGVuc2lvbnM9anMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPXRzeCZyb290RGlyPSUyRlVzZXJzJTJGbWFnbnVzb2hsZSUyRmN1cnNvcnByb2plY3RzJTJGZGF2ciZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDeUI7QUFDdEc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hbHVtaW51bS1yZWN5Y2xpbmctZ2VybWFueS8/Zjc5NCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvbWFnbnVzb2hsZS9jdXJzb3Jwcm9qZWN0cy9kYXZyL2FwcC9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9hdXRoL1suLi5uZXh0YXV0aF1cIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9tYWdudXNvaGxlL2N1cnNvcnByb2plY3RzL2RhdnIvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=%2FUsers%2Fmagnusohle%2Fcursorprojects%2Fdavr%2Fapp&pageExtensions=js&pageExtensions=jsx&pageExtensions=ts&pageExtensions=tsx&rootDir=%2FUsers%2Fmagnusohle%2Fcursorprojects%2Fdavr&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/auth/[...nextauth]/route.ts":
/*!*********************************************!*\
  !*** ./app/api/auth/[...nextauth]/route.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler),\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var bcrypt__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! bcrypt */ \"bcrypt\");\n/* harmony import */ var bcrypt__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(bcrypt__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/db */ \"(rsc)/./lib/db.ts\");\n\n\n\n\nconst authOptions = {\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            name: \"Credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    return null;\n                }\n                try {\n                    const result = await (0,_lib_db__WEBPACK_IMPORTED_MODULE_3__.query)(\"SELECT id, name, email, password_hash, role, profile_image FROM users WHERE email = $1\", [\n                        credentials.email\n                    ]);\n                    const user = result.rows[0];\n                    if (!user) {\n                        return null;\n                    }\n                    const isPasswordValid = await (0,bcrypt__WEBPACK_IMPORTED_MODULE_2__.compare)(credentials.password, user.password_hash);\n                    if (!isPasswordValid) {\n                        return null;\n                    }\n                    return {\n                        id: user.id.toString(),\n                        email: user.email,\n                        name: user.name,\n                        role: user.role || \"user\",\n                        image: user.profile_image || null\n                    };\n                } catch (error) {\n                    console.error(\"Database error during authentication:\", error);\n                    return null;\n                }\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.id = user.id;\n                token.role = user.role;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (token) {\n                session.user.id = token.id;\n                session.user.role = token.role;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/auth/login\",\n        signOut: \"/\",\n        error: \"/auth/login\"\n    },\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60\n    },\n    secret: process.env.NEXTAUTH_SECRET || \"DAVR_APP_SECRET_KEY\"\n};\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(authOptions);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBbUU7QUFDRDtBQUNqQztBQUNBO0FBRTFCLE1BQU1JLGNBQTJCO0lBQ3RDQyxXQUFXO1FBQ1RKLDJFQUFtQkEsQ0FBQztZQUNsQkssTUFBTTtZQUNOQyxhQUFhO2dCQUNYQyxPQUFPO29CQUFFQyxPQUFPO29CQUFTQyxNQUFNO2dCQUFRO2dCQUN2Q0MsVUFBVTtvQkFBRUYsT0FBTztvQkFBWUMsTUFBTTtnQkFBVztZQUNsRDtZQUNBLE1BQU1FLFdBQVVMLFdBQVc7Z0JBQ3pCLElBQUksQ0FBQ0EsYUFBYUMsU0FBUyxDQUFDRCxhQUFhSSxVQUFVO29CQUNqRCxPQUFPO2dCQUNUO2dCQUVBLElBQUk7b0JBQ0YsTUFBTUUsU0FBUyxNQUFNViw4Q0FBS0EsQ0FDeEIsMEZBQ0E7d0JBQUNJLFlBQVlDLEtBQUs7cUJBQUM7b0JBR3JCLE1BQU1NLE9BQU9ELE9BQU9FLElBQUksQ0FBQyxFQUFFO29CQUUzQixJQUFJLENBQUNELE1BQU07d0JBQ1QsT0FBTztvQkFDVDtvQkFFQSxNQUFNRSxrQkFBa0IsTUFBTWQsK0NBQU9BLENBQUNLLFlBQVlJLFFBQVEsRUFBRUcsS0FBS0csYUFBYTtvQkFFOUUsSUFBSSxDQUFDRCxpQkFBaUI7d0JBQ3BCLE9BQU87b0JBQ1Q7b0JBRUEsT0FBTzt3QkFDTEUsSUFBSUosS0FBS0ksRUFBRSxDQUFDQyxRQUFRO3dCQUNwQlgsT0FBT00sS0FBS04sS0FBSzt3QkFDakJGLE1BQU1RLEtBQUtSLElBQUk7d0JBQ2ZjLE1BQU1OLEtBQUtNLElBQUksSUFBSTt3QkFDbkJDLE9BQU9QLEtBQUtRLGFBQWEsSUFBSTtvQkFDL0I7Z0JBQ0YsRUFBRSxPQUFPQyxPQUFPO29CQUNkQyxRQUFRRCxLQUFLLENBQUMseUNBQXlDQTtvQkFDdkQsT0FBTztnQkFDVDtZQUNGO1FBQ0Y7S0FDRDtJQUNERSxXQUFXO1FBQ1QsTUFBTUMsS0FBSSxFQUFFQyxLQUFLLEVBQUViLElBQUksRUFBRTtZQUN2QixJQUFJQSxNQUFNO2dCQUNSYSxNQUFNVCxFQUFFLEdBQUdKLEtBQUtJLEVBQUU7Z0JBQ2xCUyxNQUFNUCxJQUFJLEdBQUdOLEtBQUtNLElBQUk7WUFDeEI7WUFDQSxPQUFPTztRQUNUO1FBQ0EsTUFBTUMsU0FBUSxFQUFFQSxPQUFPLEVBQUVELEtBQUssRUFBRTtZQUM5QixJQUFJQSxPQUFPO2dCQUNUQyxRQUFRZCxJQUFJLENBQUNJLEVBQUUsR0FBR1MsTUFBTVQsRUFBRTtnQkFDMUJVLFFBQVFkLElBQUksQ0FBQ00sSUFBSSxHQUFHTyxNQUFNUCxJQUFJO1lBQ2hDO1lBQ0EsT0FBT1E7UUFDVDtJQUNGO0lBQ0FDLE9BQU87UUFDTEMsUUFBUTtRQUNSQyxTQUFTO1FBQ1RSLE9BQU87SUFDVDtJQUNBSyxTQUFTO1FBQ1BJLFVBQVU7UUFDVkMsUUFBUSxLQUFLLEtBQUssS0FBSztJQUN6QjtJQUNBQyxRQUFRQyxRQUFRQyxHQUFHLENBQUNDLGVBQWUsSUFBSTtBQUN6QyxFQUFFO0FBRUYsTUFBTUMsVUFBVXRDLGdEQUFRQSxDQUFDSTtBQUVrQiIsInNvdXJjZXMiOlsid2VicGFjazovL2FsdW1pbnVtLXJlY3ljbGluZy1nZXJtYW55Ly4vYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHM/YzhhNCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTmV4dEF1dGgsIHsgTmV4dEF1dGhPcHRpb25zLCBBdXRoT3B0aW9ucyB9IGZyb20gJ25leHQtYXV0aCc7XG5pbXBvcnQgQ3JlZGVudGlhbHNQcm92aWRlciBmcm9tICduZXh0LWF1dGgvcHJvdmlkZXJzL2NyZWRlbnRpYWxzJztcbmltcG9ydCB7IGNvbXBhcmUgfSBmcm9tICdiY3J5cHQnO1xuaW1wb3J0IHsgcXVlcnkgfSBmcm9tICdAL2xpYi9kYic7XG5cbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9uczogQXV0aE9wdGlvbnMgPSB7XG4gIHByb3ZpZGVyczogW1xuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xuICAgICAgbmFtZTogJ0NyZWRlbnRpYWxzJyxcbiAgICAgIGNyZWRlbnRpYWxzOiB7XG4gICAgICAgIGVtYWlsOiB7IGxhYmVsOiAnRW1haWwnLCB0eXBlOiAnZW1haWwnIH0sXG4gICAgICAgIHBhc3N3b3JkOiB7IGxhYmVsOiAnUGFzc3dvcmQnLCB0eXBlOiAncGFzc3dvcmQnIH1cbiAgICAgIH0sXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgaWYgKCFjcmVkZW50aWFscz8uZW1haWwgfHwgIWNyZWRlbnRpYWxzPy5wYXNzd29yZCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBxdWVyeShcbiAgICAgICAgICAgICdTRUxFQ1QgaWQsIG5hbWUsIGVtYWlsLCBwYXNzd29yZF9oYXNoLCByb2xlLCBwcm9maWxlX2ltYWdlIEZST00gdXNlcnMgV0hFUkUgZW1haWwgPSAkMScsXG4gICAgICAgICAgICBbY3JlZGVudGlhbHMuZW1haWxdXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IHVzZXIgPSByZXN1bHQucm93c1swXTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBpc1Bhc3N3b3JkVmFsaWQgPSBhd2FpdCBjb21wYXJlKGNyZWRlbnRpYWxzLnBhc3N3b3JkLCB1c2VyLnBhc3N3b3JkX2hhc2gpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICghaXNQYXNzd29yZFZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiB1c2VyLmlkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICAgIG5hbWU6IHVzZXIubmFtZSxcbiAgICAgICAgICAgIHJvbGU6IHVzZXIucm9sZSB8fCAndXNlcicsXG4gICAgICAgICAgICBpbWFnZTogdXNlci5wcm9maWxlX2ltYWdlIHx8IG51bGwsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdEYXRhYmFzZSBlcnJvciBkdXJpbmcgYXV0aGVudGljYXRpb246JywgZXJyb3IpO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgXSxcbiAgY2FsbGJhY2tzOiB7XG4gICAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIgfSkge1xuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgdG9rZW4uaWQgPSB1c2VyLmlkO1xuICAgICAgICB0b2tlbi5yb2xlID0gdXNlci5yb2xlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH0sXG4gICAgYXN5bmMgc2Vzc2lvbih7IHNlc3Npb24sIHRva2VuIH0pIHtcbiAgICAgIGlmICh0b2tlbikge1xuICAgICAgICBzZXNzaW9uLnVzZXIuaWQgPSB0b2tlbi5pZDtcbiAgICAgICAgc2Vzc2lvbi51c2VyLnJvbGUgPSB0b2tlbi5yb2xlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgfVxuICB9LFxuICBwYWdlczoge1xuICAgIHNpZ25JbjogJy9hdXRoL2xvZ2luJyxcbiAgICBzaWduT3V0OiAnLycsXG4gICAgZXJyb3I6ICcvYXV0aC9sb2dpbicsXG4gIH0sXG4gIHNlc3Npb246IHtcbiAgICBzdHJhdGVneTogJ2p3dCcsXG4gICAgbWF4QWdlOiAzMCAqIDI0ICogNjAgKiA2MCwgLy8gMzAgZGF5c1xuICB9LFxuICBzZWNyZXQ6IHByb2Nlc3MuZW52Lk5FWFRBVVRIX1NFQ1JFVCB8fCAnREFWUl9BUFBfU0VDUkVUX0tFWScsXG59O1xuXG5jb25zdCBoYW5kbGVyID0gTmV4dEF1dGgoYXV0aE9wdGlvbnMpO1xuXG5leHBvcnQgeyBoYW5kbGVyIGFzIEdFVCwgaGFuZGxlciBhcyBQT1NUIH07ICJdLCJuYW1lcyI6WyJOZXh0QXV0aCIsIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJjb21wYXJlIiwicXVlcnkiLCJhdXRoT3B0aW9ucyIsInByb3ZpZGVycyIsIm5hbWUiLCJjcmVkZW50aWFscyIsImVtYWlsIiwibGFiZWwiLCJ0eXBlIiwicGFzc3dvcmQiLCJhdXRob3JpemUiLCJyZXN1bHQiLCJ1c2VyIiwicm93cyIsImlzUGFzc3dvcmRWYWxpZCIsInBhc3N3b3JkX2hhc2giLCJpZCIsInRvU3RyaW5nIiwicm9sZSIsImltYWdlIiwicHJvZmlsZV9pbWFnZSIsImVycm9yIiwiY29uc29sZSIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwic2Vzc2lvbiIsInBhZ2VzIiwic2lnbkluIiwic2lnbk91dCIsInN0cmF0ZWd5IiwibWF4QWdlIiwic2VjcmV0IiwicHJvY2VzcyIsImVudiIsIk5FWFRBVVRIX1NFQ1JFVCIsImhhbmRsZXIiLCJHRVQiLCJQT1NUIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/auth/[...nextauth]/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/db.ts":
/*!*******************!*\
  !*** ./lib/db.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   closePool: () => (/* binding */ closePool),\n/* harmony export */   pool: () => (/* binding */ pool),\n/* harmony export */   query: () => (/* binding */ query),\n/* harmony export */   transaction: () => (/* binding */ transaction)\n/* harmony export */ });\n/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pg */ \"pg\");\n/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pg__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _neondatabase_serverless__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @neondatabase/serverless */ \"(rsc)/./node_modules/@neondatabase/serverless/index.mjs\");\n\n\n// Get database connection string from environment variables\nconst connectionString = process.env.DATABASE_URL || \"\";\n// Fallback error message if DATABASE_URL is not set\nif (!connectionString) {\n    console.error(\"DATABASE_URL environment variable is not set!\");\n}\n// Initialize the pool with a dummy implementation first\nlet pool = new pg__WEBPACK_IMPORTED_MODULE_0__.Pool(); // This will be overwritten below\n// Initialize connection pool differently based on environment\nif (false) {} else {\n    // For development/other environments\n    try {\n        // Regular Postgres database (default)\n        pool = new pg__WEBPACK_IMPORTED_MODULE_0__.Pool({\n            connectionString,\n            max: 10,\n            idleTimeoutMillis: 30000,\n            connectionTimeoutMillis: 5000\n        });\n    // Special handling for Neon is done in the query function\n    } catch (err) {\n        console.error(\"Failed to initialize database pool:\", err);\n        // Set up a dummy pool that will throw meaningful errors\n        // This allows the application to at least start and show proper error messages\n        // @ts-ignore - Intentionally creating a mock for error handling\n        pool = {\n            query: ()=>Promise.reject(new Error(\"Database connection not initialized\")),\n            connect: ()=>Promise.reject(new Error(\"Database connection not initialized\")),\n            end: ()=>Promise.resolve()\n        };\n    }\n}\n// Test the connection on startup\npool.query(\"SELECT NOW()\").then(()=>console.log(\"\\uD83D\\uDD0B Database connection established\")).catch((err)=>console.error(\"⚠️ Database connection failed:\", err));\n/**\n * Execute a database query with parameters\n */ async function query(text, params = []) {\n    const start = Date.now();\n    try {\n        // If using Neon database\n        if (connectionString.includes(\"neon.tech\") && typeof _neondatabase_serverless__WEBPACK_IMPORTED_MODULE_1__.neon === \"function\") {\n            const sql = (0,_neondatabase_serverless__WEBPACK_IMPORTED_MODULE_1__.neon)(connectionString);\n            const result = await sql(text, ...params);\n            // Format the result to match the pg's QueryResult interface\n            return {\n                rows: result,\n                rowCount: result.length,\n                // These fields aren't really used in our code, so we're adding dummy values\n                command: \"\",\n                oid: 0,\n                fields: []\n            };\n        }\n        // Regular Pool query\n        const res = await pool.query(text, params);\n        const duration = Date.now() - start;\n        // Log slow queries in development\n        if (duration > 100 && \"development\" !== \"production\") {\n            console.log(\"\\uD83D\\uDC0C Slow query:\", {\n                text,\n                duration,\n                rows: res.rowCount\n            });\n        }\n        return res;\n    } catch (error) {\n        console.error(\"Query error:\", error.message, {\n            text,\n            params\n        });\n        throw error;\n    }\n}\n/**\n * Execute multiple queries in a transaction\n */ async function transaction(callback) {\n    const client = await pool.connect();\n    try {\n        await client.query(\"BEGIN\");\n        const result = await callback(client);\n        await client.query(\"COMMIT\");\n        return result;\n    } catch (error) {\n        await client.query(\"ROLLBACK\");\n        throw error;\n    } finally{\n        client.release();\n    }\n}\n/**\n * Gracefully close the database connection pool\n */ async function closePool() {\n    await pool.end();\n}\n// Export the pool for direct use when needed\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TSxlQUFlQztJQUNwQixNQUFNcEMsS0FBS1UsR0FBRztBQUNoQjtBQUVBLDZDQUE2QztBQUM3QiIsInNvdXJjZXMiOlsid2VicGFjazovL2FsdW1pbnVtLXJlY3ljbGluZy1nZXJtYW55Ly4vbGliL2RiLnRzPzFkZjAiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUG9vbCwgUG9vbENsaWVudCwgUXVlcnlSZXN1bHQsIFF1ZXJ5UmVzdWx0Um93IH0gZnJvbSAncGcnO1xuaW1wb3J0IHsgbmVvbiB9IGZyb20gJ0BuZW9uZGF0YWJhc2Uvc2VydmVybGVzcyc7XG5cbi8vIEdldCBkYXRhYmFzZSBjb25uZWN0aW9uIHN0cmluZyBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlc1xuY29uc3QgY29ubmVjdGlvblN0cmluZyA9IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCB8fCAnJztcblxuLy8gRmFsbGJhY2sgZXJyb3IgbWVzc2FnZSBpZiBEQVRBQkFTRV9VUkwgaXMgbm90IHNldFxuaWYgKCFjb25uZWN0aW9uU3RyaW5nKSB7XG4gIGNvbnNvbGUuZXJyb3IoJ0RBVEFCQVNFX1VSTCBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyBub3Qgc2V0IScpO1xufVxuXG4vLyBJbml0aWFsaXplIHRoZSBwb29sIHdpdGggYSBkdW1teSBpbXBsZW1lbnRhdGlvbiBmaXJzdFxubGV0IHBvb2w6IFBvb2wgPSBuZXcgUG9vbCgpOyAvLyBUaGlzIHdpbGwgYmUgb3ZlcndyaXR0ZW4gYmVsb3dcblxuLy8gSW5pdGlhbGl6ZSBjb25uZWN0aW9uIHBvb2wgZGlmZmVyZW50bHkgYmFzZWQgb24gZW52aXJvbm1lbnRcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIC8vIEZvciBwcm9kdWN0aW9uLCB1c2UgYSBzdGFuZGFyZCBwb29sXG4gIHBvb2wgPSBuZXcgUG9vbCh7XG4gICAgY29ubmVjdGlvblN0cmluZyxcbiAgICBtYXg6IDEwLFxuICAgIGlkbGVUaW1lb3V0TWlsbGlzOiAzMDAwMCxcbiAgICBjb25uZWN0aW9uVGltZW91dE1pbGxpczogNTAwMCxcbiAgfSk7XG59IGVsc2Uge1xuICAvLyBGb3IgZGV2ZWxvcG1lbnQvb3RoZXIgZW52aXJvbm1lbnRzXG4gIHRyeSB7XG4gICAgLy8gUmVndWxhciBQb3N0Z3JlcyBkYXRhYmFzZSAoZGVmYXVsdClcbiAgICBwb29sID0gbmV3IFBvb2woe1xuICAgICAgY29ubmVjdGlvblN0cmluZyxcbiAgICAgIG1heDogMTAsXG4gICAgICBpZGxlVGltZW91dE1pbGxpczogMzAwMDAsXG4gICAgICBjb25uZWN0aW9uVGltZW91dE1pbGxpczogNTAwMCxcbiAgICB9KTtcbiAgICBcbiAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciBOZW9uIGlzIGRvbmUgaW4gdGhlIHF1ZXJ5IGZ1bmN0aW9uXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIGRhdGFiYXNlIHBvb2w6JywgZXJyKTtcbiAgICAvLyBTZXQgdXAgYSBkdW1teSBwb29sIHRoYXQgd2lsbCB0aHJvdyBtZWFuaW5nZnVsIGVycm9yc1xuICAgIC8vIFRoaXMgYWxsb3dzIHRoZSBhcHBsaWNhdGlvbiB0byBhdCBsZWFzdCBzdGFydCBhbmQgc2hvdyBwcm9wZXIgZXJyb3IgbWVzc2FnZXNcbiAgICAvLyBAdHMtaWdub3JlIC0gSW50ZW50aW9uYWxseSBjcmVhdGluZyBhIG1vY2sgZm9yIGVycm9yIGhhbmRsaW5nXG4gICAgcG9vbCA9IHtcbiAgICAgIHF1ZXJ5OiAoKSA9PiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0RhdGFiYXNlIGNvbm5lY3Rpb24gbm90IGluaXRpYWxpemVkJykpLFxuICAgICAgY29ubmVjdDogKCkgPT4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdEYXRhYmFzZSBjb25uZWN0aW9uIG5vdCBpbml0aWFsaXplZCcpKSxcbiAgICAgIGVuZDogKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgfTtcbiAgfVxufVxuXG4vLyBUZXN0IHRoZSBjb25uZWN0aW9uIG9uIHN0YXJ0dXBcbnBvb2wucXVlcnkoJ1NFTEVDVCBOT1coKScpXG4gIC50aGVuKCgpID0+IGNvbnNvbGUubG9nKCfwn5SLIERhdGFiYXNlIGNvbm5lY3Rpb24gZXN0YWJsaXNoZWQnKSlcbiAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKCfimqDvuI8gRGF0YWJhc2UgY29ubmVjdGlvbiBmYWlsZWQ6JywgZXJyKSk7XG5cbi8qKlxuICogRXhlY3V0ZSBhIGRhdGFiYXNlIHF1ZXJ5IHdpdGggcGFyYW1ldGVyc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnk8VCBleHRlbmRzIFF1ZXJ5UmVzdWx0Um93ID0gYW55PihcbiAgdGV4dDogc3RyaW5nLCBcbiAgcGFyYW1zOiBhbnlbXSA9IFtdXG4pOiBQcm9taXNlPFF1ZXJ5UmVzdWx0PFQ+PiB7XG4gIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gSWYgdXNpbmcgTmVvbiBkYXRhYmFzZVxuICAgIGlmIChjb25uZWN0aW9uU3RyaW5nLmluY2x1ZGVzKCduZW9uLnRlY2gnKSAmJiB0eXBlb2YgbmVvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc3Qgc3FsID0gbmVvbihjb25uZWN0aW9uU3RyaW5nKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNxbCh0ZXh0LCAuLi5wYXJhbXMpIGFzIHVua25vd24gYXMgVFtdO1xuICAgICAgXG4gICAgICAvLyBGb3JtYXQgdGhlIHJlc3VsdCB0byBtYXRjaCB0aGUgcGcncyBRdWVyeVJlc3VsdCBpbnRlcmZhY2VcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJvd3M6IHJlc3VsdCxcbiAgICAgICAgcm93Q291bnQ6IHJlc3VsdC5sZW5ndGgsXG4gICAgICAgIC8vIFRoZXNlIGZpZWxkcyBhcmVuJ3QgcmVhbGx5IHVzZWQgaW4gb3VyIGNvZGUsIHNvIHdlJ3JlIGFkZGluZyBkdW1teSB2YWx1ZXNcbiAgICAgICAgY29tbWFuZDogJycsXG4gICAgICAgIG9pZDogMCxcbiAgICAgICAgZmllbGRzOiBbXVxuICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLy8gUmVndWxhciBQb29sIHF1ZXJ5XG4gICAgY29uc3QgcmVzID0gYXdhaXQgcG9vbC5xdWVyeTxUPih0ZXh0LCBwYXJhbXMpO1xuICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0O1xuICAgIFxuICAgIC8vIExvZyBzbG93IHF1ZXJpZXMgaW4gZGV2ZWxvcG1lbnRcbiAgICBpZiAoZHVyYXRpb24gPiAxMDAgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgY29uc29sZS5sb2coJ/CfkIwgU2xvdyBxdWVyeTonLCB7IHRleHQsIGR1cmF0aW9uLCByb3dzOiByZXMucm93Q291bnQgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXM7XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdRdWVyeSBlcnJvcjonLCBlcnJvci5tZXNzYWdlLCB7IHRleHQsIHBhcmFtcyB9KTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGUgbXVsdGlwbGUgcXVlcmllcyBpbiBhIHRyYW5zYWN0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cmFuc2FjdGlvbjxUID0gYW55PihcbiAgY2FsbGJhY2s6IChjbGllbnQ6IFBvb2xDbGllbnQpID0+IFByb21pc2U8VD5cbik6IFByb21pc2U8VD4ge1xuICBjb25zdCBjbGllbnQgPSBhd2FpdCBwb29sLmNvbm5lY3QoKTtcbiAgXG4gIHRyeSB7XG4gICAgYXdhaXQgY2xpZW50LnF1ZXJ5KCdCRUdJTicpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNhbGxiYWNrKGNsaWVudCk7XG4gICAgYXdhaXQgY2xpZW50LnF1ZXJ5KCdDT01NSVQnKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGF3YWl0IGNsaWVudC5xdWVyeSgnUk9MTEJBQ0snKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBjbGllbnQucmVsZWFzZSgpO1xuICB9XG59XG5cbi8qKlxuICogR3JhY2VmdWxseSBjbG9zZSB0aGUgZGF0YWJhc2UgY29ubmVjdGlvbiBwb29sXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZVBvb2woKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IHBvb2wuZW5kKCk7XG59XG5cbi8vIEV4cG9ydCB0aGUgcG9vbCBmb3IgZGlyZWN0IHVzZSB3aGVuIG5lZWRlZFxuZXhwb3J0IHsgcG9vbCB9OyAiXSwibmFtZXMiOlsiUG9vbCIsIm5lb24iLCJjb25uZWN0aW9uU3RyaW5nIiwicHJvY2VzcyIsImVudiIsIkRBVEFCQVNFX1VSTCIsImNvbnNvbGUiLCJlcnJvciIsInBvb2wiLCJtYXgiLCJpZGxlVGltZW91dE1pbGxpcyIsImNvbm5lY3Rpb25UaW1lb3V0TWlsbGlzIiwiZXJyIiwicXVlcnkiLCJQcm9taXNlIiwicmVqZWN0IiwiRXJyb3IiLCJjb25uZWN0IiwiZW5kIiwicmVzb2x2ZSIsInRoZW4iLCJsb2ciLCJjYXRjaCIsInRleHQiLCJwYXJhbXMiLCJzdGFydCIsIkRhdGUiLCJub3ciLCJpbmNsdWRlcyIsInNxbCIsInJlc3VsdCIsInJvd3MiLCJyb3dDb3VudCIsImxlbmd0aCIsImNvbW1hbmQiLCJvaWQiLCJmaWVsZHMiLCJyZXMiLCJkdXJhdGlvbiIsIm1lc3NhZ2UiLCJ0cmFuc2FjdGlvbiIsImNhbGxiYWNrIiwiY2xpZW50IiwicmVsZWFzZSIsImNsb3NlUG9vbCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/db.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@neondatabase","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/oauth","vendor-chunks/@panva","vendor-chunks/preact-render-to-string","vendor-chunks/oidc-token-hash","vendor-chunks/preact"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=%2FUsers%2Fmagnusohle%2Fcursorprojects%2Fdavr%2Fapp&pageExtensions=js&pageExtensions=jsx&pageExtensions=ts&pageExtensions=tsx&rootDir=%2FUsers%2Fmagnusohle%2Fcursorprojects%2Fdavr&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();