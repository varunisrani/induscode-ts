// @ts-nocheck
// Recovered from dist/guardrails.js (esbuild bundle — types erased)
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/guard/value.js
var require_value = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/guard/value.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HasPropertyKey = HasPropertyKey;
    exports.IsAsyncIterator = IsAsyncIterator;
    exports.IsArray = IsArray;
    exports.IsBigInt = IsBigInt;
    exports.IsBoolean = IsBoolean;
    exports.IsDate = IsDate;
    exports.IsFunction = IsFunction;
    exports.IsIterator = IsIterator;
    exports.IsNull = IsNull;
    exports.IsNumber = IsNumber;
    exports.IsObject = IsObject;
    exports.IsRegExp = IsRegExp;
    exports.IsString = IsString;
    exports.IsSymbol = IsSymbol;
    exports.IsUint8Array = IsUint8Array;
    exports.IsUndefined = IsUndefined;
    function HasPropertyKey(value, key) {
      return key in value;
    }
    function IsAsyncIterator(value) {
      return IsObject(value) && !IsArray(value) && !IsUint8Array(value) && Symbol.asyncIterator in value;
    }
    function IsArray(value) {
      return Array.isArray(value);
    }
    function IsBigInt(value) {
      return typeof value === "bigint";
    }
    function IsBoolean(value) {
      return typeof value === "boolean";
    }
    function IsDate(value) {
      return value instanceof globalThis.Date;
    }
    function IsFunction(value) {
      return typeof value === "function";
    }
    function IsIterator(value) {
      return IsObject(value) && !IsArray(value) && !IsUint8Array(value) && Symbol.iterator in value;
    }
    function IsNull(value) {
      return value === null;
    }
    function IsNumber(value) {
      return typeof value === "number";
    }
    function IsObject(value) {
      return typeof value === "object" && value !== null;
    }
    function IsRegExp(value) {
      return value instanceof globalThis.RegExp;
    }
    function IsString(value) {
      return typeof value === "string";
    }
    function IsSymbol(value) {
      return typeof value === "symbol";
    }
    function IsUint8Array(value) {
      return value instanceof globalThis.Uint8Array;
    }
    function IsUndefined(value) {
      return value === void 0;
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/clone/value.js
var require_value2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/clone/value.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Clone = Clone;
    var ValueGuard = __importStar(require_value());
    function ArrayType(value) {
      return value.map((value2) => Visit(value2));
    }
    function DateType(value) {
      return new Date(value.getTime());
    }
    function Uint8ArrayType(value) {
      return new Uint8Array(value);
    }
    function RegExpType(value) {
      return new RegExp(value.source, value.flags);
    }
    function ObjectType(value) {
      const result = {};
      for (const key of Object.getOwnPropertyNames(value)) {
        result[key] = Visit(value[key]);
      }
      for (const key of Object.getOwnPropertySymbols(value)) {
        result[key] = Visit(value[key]);
      }
      return result;
    }
    function Visit(value) {
      return ValueGuard.IsArray(value) ? ArrayType(value) : ValueGuard.IsDate(value) ? DateType(value) : ValueGuard.IsUint8Array(value) ? Uint8ArrayType(value) : ValueGuard.IsRegExp(value) ? RegExpType(value) : ValueGuard.IsObject(value) ? ObjectType(value) : value;
    }
    function Clone(value) {
      return Visit(value);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/clone/type.js
var require_type = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/clone/type.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CloneRest = CloneRest;
    exports.CloneType = CloneType;
    var value_1 = require_value2();
    function CloneRest(schemas) {
      return schemas.map((schema) => CloneType(schema));
    }
    function CloneType(schema, options) {
      return options === void 0 ? (0, value_1.Clone)(schema) : (0, value_1.Clone)({ ...options, ...schema });
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/clone/index.js
var require_clone = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/clone/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_type(), exports);
    __exportStar(require_value2(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/value/guard/guard.js
var require_guard = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/value/guard/guard.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IsAsyncIterator = IsAsyncIterator;
    exports.IsIterator = IsIterator;
    exports.IsStandardObject = IsStandardObject;
    exports.IsInstanceObject = IsInstanceObject;
    exports.IsPromise = IsPromise;
    exports.IsDate = IsDate;
    exports.IsMap = IsMap;
    exports.IsSet = IsSet;
    exports.IsRegExp = IsRegExp;
    exports.IsTypedArray = IsTypedArray;
    exports.IsInt8Array = IsInt8Array;
    exports.IsUint8Array = IsUint8Array;
    exports.IsUint8ClampedArray = IsUint8ClampedArray;
    exports.IsInt16Array = IsInt16Array;
    exports.IsUint16Array = IsUint16Array;
    exports.IsInt32Array = IsInt32Array;
    exports.IsUint32Array = IsUint32Array;
    exports.IsFloat32Array = IsFloat32Array;
    exports.IsFloat64Array = IsFloat64Array;
    exports.IsBigInt64Array = IsBigInt64Array;
    exports.IsBigUint64Array = IsBigUint64Array;
    exports.HasPropertyKey = HasPropertyKey;
    exports.IsObject = IsObject;
    exports.IsArray = IsArray;
    exports.IsUndefined = IsUndefined;
    exports.IsNull = IsNull;
    exports.IsBoolean = IsBoolean;
    exports.IsNumber = IsNumber;
    exports.IsInteger = IsInteger;
    exports.IsBigInt = IsBigInt;
    exports.IsString = IsString;
    exports.IsFunction = IsFunction;
    exports.IsSymbol = IsSymbol;
    exports.IsValueType = IsValueType;
    function IsAsyncIterator(value) {
      return IsObject(value) && globalThis.Symbol.asyncIterator in value;
    }
    function IsIterator(value) {
      return IsObject(value) && globalThis.Symbol.iterator in value;
    }
    function IsStandardObject(value) {
      return IsObject(value) && (globalThis.Object.getPrototypeOf(value) === Object.prototype || globalThis.Object.getPrototypeOf(value) === null);
    }
    function IsInstanceObject(value) {
      return IsObject(value) && !IsArray(value) && IsFunction(value.constructor) && value.constructor.name !== "Object";
    }
    function IsPromise(value) {
      return value instanceof globalThis.Promise;
    }
    function IsDate(value) {
      return value instanceof Date && globalThis.Number.isFinite(value.getTime());
    }
    function IsMap(value) {
      return value instanceof globalThis.Map;
    }
    function IsSet(value) {
      return value instanceof globalThis.Set;
    }
    function IsRegExp(value) {
      return value instanceof globalThis.RegExp;
    }
    function IsTypedArray(value) {
      return globalThis.ArrayBuffer.isView(value);
    }
    function IsInt8Array(value) {
      return value instanceof globalThis.Int8Array;
    }
    function IsUint8Array(value) {
      return value instanceof globalThis.Uint8Array;
    }
    function IsUint8ClampedArray(value) {
      return value instanceof globalThis.Uint8ClampedArray;
    }
    function IsInt16Array(value) {
      return value instanceof globalThis.Int16Array;
    }
    function IsUint16Array(value) {
      return value instanceof globalThis.Uint16Array;
    }
    function IsInt32Array(value) {
      return value instanceof globalThis.Int32Array;
    }
    function IsUint32Array(value) {
      return value instanceof globalThis.Uint32Array;
    }
    function IsFloat32Array(value) {
      return value instanceof globalThis.Float32Array;
    }
    function IsFloat64Array(value) {
      return value instanceof globalThis.Float64Array;
    }
    function IsBigInt64Array(value) {
      return value instanceof globalThis.BigInt64Array;
    }
    function IsBigUint64Array(value) {
      return value instanceof globalThis.BigUint64Array;
    }
    function HasPropertyKey(value, key) {
      return key in value;
    }
    function IsObject(value) {
      return value !== null && typeof value === "object";
    }
    function IsArray(value) {
      return globalThis.Array.isArray(value) && !globalThis.ArrayBuffer.isView(value);
    }
    function IsUndefined(value) {
      return value === void 0;
    }
    function IsNull(value) {
      return value === null;
    }
    function IsBoolean(value) {
      return typeof value === "boolean";
    }
    function IsNumber(value) {
      return typeof value === "number";
    }
    function IsInteger(value) {
      return globalThis.Number.isInteger(value);
    }
    function IsBigInt(value) {
      return typeof value === "bigint";
    }
    function IsString(value) {
      return typeof value === "string";
    }
    function IsFunction(value) {
      return typeof value === "function";
    }
    function IsSymbol(value) {
      return typeof value === "symbol";
    }
    function IsValueType(value) {
      return IsBigInt(value) || IsBoolean(value) || IsNull(value) || IsNumber(value) || IsString(value) || IsSymbol(value) || IsUndefined(value);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/value/guard/index.js
var require_guard2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/value/guard/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_guard(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/system/policy.js
var require_policy = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/system/policy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeSystemPolicy = void 0;
    var index_1 = require_guard2();
    var TypeSystemPolicy;
    (function(TypeSystemPolicy2) {
      TypeSystemPolicy2.InstanceMode = "default";
      TypeSystemPolicy2.ExactOptionalPropertyTypes = false;
      TypeSystemPolicy2.AllowArrayObject = false;
      TypeSystemPolicy2.AllowNaN = false;
      TypeSystemPolicy2.AllowNullVoid = false;
      function IsExactOptionalProperty(value, key) {
        return TypeSystemPolicy2.ExactOptionalPropertyTypes ? key in value : value[key] !== void 0;
      }
      TypeSystemPolicy2.IsExactOptionalProperty = IsExactOptionalProperty;
      function IsObjectLike(value) {
        const isObject = (0, index_1.IsObject)(value);
        return TypeSystemPolicy2.AllowArrayObject ? isObject : isObject && !(0, index_1.IsArray)(value);
      }
      TypeSystemPolicy2.IsObjectLike = IsObjectLike;
      function IsRecordLike(value) {
        return IsObjectLike(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
      }
      TypeSystemPolicy2.IsRecordLike = IsRecordLike;
      function IsNumberLike(value) {
        return TypeSystemPolicy2.AllowNaN ? (0, index_1.IsNumber)(value) : Number.isFinite(value);
      }
      TypeSystemPolicy2.IsNumberLike = IsNumberLike;
      function IsVoidLike(value) {
        const isUndefined = (0, index_1.IsUndefined)(value);
        return TypeSystemPolicy2.AllowNullVoid ? isUndefined || value === null : isUndefined;
      }
      TypeSystemPolicy2.IsVoidLike = IsVoidLike;
    })(TypeSystemPolicy || (exports.TypeSystemPolicy = TypeSystemPolicy = {}));
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/create/immutable.js
var require_immutable = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/create/immutable.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Immutable = Immutable;
    var ValueGuard = __importStar(require_value());
    function ImmutableArray(value) {
      return globalThis.Object.freeze(value).map((value2) => Immutable(value2));
    }
    function ImmutableDate(value) {
      return value;
    }
    function ImmutableUint8Array(value) {
      return value;
    }
    function ImmutableRegExp(value) {
      return value;
    }
    function ImmutableObject(value) {
      const result = {};
      for (const key of Object.getOwnPropertyNames(value)) {
        result[key] = Immutable(value[key]);
      }
      for (const key of Object.getOwnPropertySymbols(value)) {
        result[key] = Immutable(value[key]);
      }
      return globalThis.Object.freeze(result);
    }
    function Immutable(value) {
      return ValueGuard.IsArray(value) ? ImmutableArray(value) : ValueGuard.IsDate(value) ? ImmutableDate(value) : ValueGuard.IsUint8Array(value) ? ImmutableUint8Array(value) : ValueGuard.IsRegExp(value) ? ImmutableRegExp(value) : ValueGuard.IsObject(value) ? ImmutableObject(value) : value;
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/create/type.js
var require_type2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/create/type.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CreateType = CreateType;
    var policy_1 = require_policy();
    var immutable_1 = require_immutable();
    var value_1 = require_value2();
    function CreateType(schema, options) {
      const result = options !== void 0 ? { ...options, ...schema } : schema;
      switch (policy_1.TypeSystemPolicy.InstanceMode) {
        case "freeze":
          return (0, immutable_1.Immutable)(result);
        case "clone":
          return (0, value_1.Clone)(result);
        default:
          return result;
      }
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/create/index.js
var require_create = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/create/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_type2(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/error/error.js
var require_error = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/error/error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeBoxError = void 0;
    var TypeBoxError = class extends Error {
      constructor(message) {
        super(message);
      }
    };
    exports.TypeBoxError = TypeBoxError;
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/error/index.js
var require_error2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/error/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_error(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/symbols/symbols.js
var require_symbols = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/symbols/symbols.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Kind = exports.Hint = exports.OptionalKind = exports.ReadonlyKind = exports.TransformKind = void 0;
    exports.TransformKind = /* @__PURE__ */ Symbol.for("TypeBox.Transform");
    exports.ReadonlyKind = /* @__PURE__ */ Symbol.for("TypeBox.Readonly");
    exports.OptionalKind = /* @__PURE__ */ Symbol.for("TypeBox.Optional");
    exports.Hint = /* @__PURE__ */ Symbol.for("TypeBox.Hint");
    exports.Kind = /* @__PURE__ */ Symbol.for("TypeBox.Kind");
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/symbols/index.js
var require_symbols2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/symbols/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_symbols(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/guard/kind.js
var require_kind = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/guard/kind.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IsReadonly = IsReadonly;
    exports.IsOptional = IsOptional;
    exports.IsAny = IsAny;
    exports.IsArgument = IsArgument;
    exports.IsArray = IsArray;
    exports.IsAsyncIterator = IsAsyncIterator;
    exports.IsBigInt = IsBigInt;
    exports.IsBoolean = IsBoolean;
    exports.IsComputed = IsComputed;
    exports.IsConstructor = IsConstructor;
    exports.IsDate = IsDate;
    exports.IsFunction = IsFunction;
    exports.IsImport = IsImport;
    exports.IsInteger = IsInteger;
    exports.IsProperties = IsProperties;
    exports.IsIntersect = IsIntersect;
    exports.IsIterator = IsIterator;
    exports.IsKindOf = IsKindOf;
    exports.IsLiteralString = IsLiteralString;
    exports.IsLiteralNumber = IsLiteralNumber;
    exports.IsLiteralBoolean = IsLiteralBoolean;
    exports.IsLiteralValue = IsLiteralValue;
    exports.IsLiteral = IsLiteral;
    exports.IsMappedKey = IsMappedKey;
    exports.IsMappedResult = IsMappedResult;
    exports.IsNever = IsNever;
    exports.IsNot = IsNot;
    exports.IsNull = IsNull;
    exports.IsNumber = IsNumber;
    exports.IsObject = IsObject;
    exports.IsPromise = IsPromise;
    exports.IsRecord = IsRecord;
    exports.IsRecursive = IsRecursive;
    exports.IsRef = IsRef;
    exports.IsRegExp = IsRegExp;
    exports.IsString = IsString;
    exports.IsSymbol = IsSymbol;
    exports.IsTemplateLiteral = IsTemplateLiteral;
    exports.IsThis = IsThis;
    exports.IsTransform = IsTransform;
    exports.IsTuple = IsTuple;
    exports.IsUndefined = IsUndefined;
    exports.IsUnion = IsUnion;
    exports.IsUint8Array = IsUint8Array;
    exports.IsUnknown = IsUnknown;
    exports.IsUnsafe = IsUnsafe;
    exports.IsVoid = IsVoid;
    exports.IsKind = IsKind;
    exports.IsSchema = IsSchema;
    var ValueGuard = __importStar(require_value());
    var index_1 = require_symbols2();
    function IsReadonly(value) {
      return ValueGuard.IsObject(value) && value[index_1.ReadonlyKind] === "Readonly";
    }
    function IsOptional(value) {
      return ValueGuard.IsObject(value) && value[index_1.OptionalKind] === "Optional";
    }
    function IsAny(value) {
      return IsKindOf(value, "Any");
    }
    function IsArgument(value) {
      return IsKindOf(value, "Argument");
    }
    function IsArray(value) {
      return IsKindOf(value, "Array");
    }
    function IsAsyncIterator(value) {
      return IsKindOf(value, "AsyncIterator");
    }
    function IsBigInt(value) {
      return IsKindOf(value, "BigInt");
    }
    function IsBoolean(value) {
      return IsKindOf(value, "Boolean");
    }
    function IsComputed(value) {
      return IsKindOf(value, "Computed");
    }
    function IsConstructor(value) {
      return IsKindOf(value, "Constructor");
    }
    function IsDate(value) {
      return IsKindOf(value, "Date");
    }
    function IsFunction(value) {
      return IsKindOf(value, "Function");
    }
    function IsImport(value) {
      return IsKindOf(value, "Import");
    }
    function IsInteger(value) {
      return IsKindOf(value, "Integer");
    }
    function IsProperties(value) {
      return ValueGuard.IsObject(value);
    }
    function IsIntersect(value) {
      return IsKindOf(value, "Intersect");
    }
    function IsIterator(value) {
      return IsKindOf(value, "Iterator");
    }
    function IsKindOf(value, kind) {
      return ValueGuard.IsObject(value) && index_1.Kind in value && value[index_1.Kind] === kind;
    }
    function IsLiteralString(value) {
      return IsLiteral(value) && ValueGuard.IsString(value.const);
    }
    function IsLiteralNumber(value) {
      return IsLiteral(value) && ValueGuard.IsNumber(value.const);
    }
    function IsLiteralBoolean(value) {
      return IsLiteral(value) && ValueGuard.IsBoolean(value.const);
    }
    function IsLiteralValue(value) {
      return ValueGuard.IsBoolean(value) || ValueGuard.IsNumber(value) || ValueGuard.IsString(value);
    }
    function IsLiteral(value) {
      return IsKindOf(value, "Literal");
    }
    function IsMappedKey(value) {
      return IsKindOf(value, "MappedKey");
    }
    function IsMappedResult(value) {
      return IsKindOf(value, "MappedResult");
    }
    function IsNever(value) {
      return IsKindOf(value, "Never");
    }
    function IsNot(value) {
      return IsKindOf(value, "Not");
    }
    function IsNull(value) {
      return IsKindOf(value, "Null");
    }
    function IsNumber(value) {
      return IsKindOf(value, "Number");
    }
    function IsObject(value) {
      return IsKindOf(value, "Object");
    }
    function IsPromise(value) {
      return IsKindOf(value, "Promise");
    }
    function IsRecord(value) {
      return IsKindOf(value, "Record");
    }
    function IsRecursive(value) {
      return ValueGuard.IsObject(value) && index_1.Hint in value && value[index_1.Hint] === "Recursive";
    }
    function IsRef(value) {
      return IsKindOf(value, "Ref");
    }
    function IsRegExp(value) {
      return IsKindOf(value, "RegExp");
    }
    function IsString(value) {
      return IsKindOf(value, "String");
    }
    function IsSymbol(value) {
      return IsKindOf(value, "Symbol");
    }
    function IsTemplateLiteral(value) {
      return IsKindOf(value, "TemplateLiteral");
    }
    function IsThis(value) {
      return IsKindOf(value, "This");
    }
    function IsTransform(value) {
      return ValueGuard.IsObject(value) && index_1.TransformKind in value;
    }
    function IsTuple(value) {
      return IsKindOf(value, "Tuple");
    }
    function IsUndefined(value) {
      return IsKindOf(value, "Undefined");
    }
    function IsUnion(value) {
      return IsKindOf(value, "Union");
    }
    function IsUint8Array(value) {
      return IsKindOf(value, "Uint8Array");
    }
    function IsUnknown(value) {
      return IsKindOf(value, "Unknown");
    }
    function IsUnsafe(value) {
      return IsKindOf(value, "Unsafe");
    }
    function IsVoid(value) {
      return IsKindOf(value, "Void");
    }
    function IsKind(value) {
      return ValueGuard.IsObject(value) && index_1.Kind in value && ValueGuard.IsString(value[index_1.Kind]);
    }
    function IsSchema(value) {
      return IsAny(value) || IsArgument(value) || IsArray(value) || IsBoolean(value) || IsBigInt(value) || IsAsyncIterator(value) || IsComputed(value) || IsConstructor(value) || IsDate(value) || IsFunction(value) || IsInteger(value) || IsIntersect(value) || IsIterator(value) || IsLiteral(value) || IsMappedKey(value) || IsMappedResult(value) || IsNever(value) || IsNot(value) || IsNull(value) || IsNumber(value) || IsObject(value) || IsPromise(value) || IsRecord(value) || IsRef(value) || IsRegExp(value) || IsString(value) || IsSymbol(value) || IsTemplateLiteral(value) || IsThis(value) || IsTuple(value) || IsUndefined(value) || IsUnion(value) || IsUint8Array(value) || IsUnknown(value) || IsUnsafe(value) || IsVoid(value) || IsKind(value);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/guard/type.js
var require_type3 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/guard/type.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeGuardUnknownTypeError = void 0;
    exports.IsReadonly = IsReadonly;
    exports.IsOptional = IsOptional;
    exports.IsAny = IsAny;
    exports.IsArgument = IsArgument;
    exports.IsArray = IsArray;
    exports.IsAsyncIterator = IsAsyncIterator;
    exports.IsBigInt = IsBigInt;
    exports.IsBoolean = IsBoolean;
    exports.IsComputed = IsComputed;
    exports.IsConstructor = IsConstructor;
    exports.IsDate = IsDate;
    exports.IsFunction = IsFunction;
    exports.IsImport = IsImport;
    exports.IsInteger = IsInteger;
    exports.IsProperties = IsProperties;
    exports.IsIntersect = IsIntersect;
    exports.IsIterator = IsIterator;
    exports.IsKindOf = IsKindOf;
    exports.IsLiteralString = IsLiteralString;
    exports.IsLiteralNumber = IsLiteralNumber;
    exports.IsLiteralBoolean = IsLiteralBoolean;
    exports.IsLiteral = IsLiteral;
    exports.IsLiteralValue = IsLiteralValue;
    exports.IsMappedKey = IsMappedKey;
    exports.IsMappedResult = IsMappedResult;
    exports.IsNever = IsNever;
    exports.IsNot = IsNot;
    exports.IsNull = IsNull;
    exports.IsNumber = IsNumber;
    exports.IsObject = IsObject;
    exports.IsPromise = IsPromise;
    exports.IsRecord = IsRecord;
    exports.IsRecursive = IsRecursive;
    exports.IsRef = IsRef;
    exports.IsRegExp = IsRegExp;
    exports.IsString = IsString;
    exports.IsSymbol = IsSymbol;
    exports.IsTemplateLiteral = IsTemplateLiteral;
    exports.IsThis = IsThis;
    exports.IsTransform = IsTransform;
    exports.IsTuple = IsTuple;
    exports.IsUndefined = IsUndefined;
    exports.IsUnionLiteral = IsUnionLiteral;
    exports.IsUnion = IsUnion;
    exports.IsUint8Array = IsUint8Array;
    exports.IsUnknown = IsUnknown;
    exports.IsUnsafe = IsUnsafe;
    exports.IsVoid = IsVoid;
    exports.IsKind = IsKind;
    exports.IsSchema = IsSchema;
    var ValueGuard = __importStar(require_value());
    var index_1 = require_symbols2();
    var index_2 = require_error2();
    var TypeGuardUnknownTypeError = class extends index_2.TypeBoxError {
    };
    exports.TypeGuardUnknownTypeError = TypeGuardUnknownTypeError;
    var KnownTypes = [
      "Argument",
      "Any",
      "Array",
      "AsyncIterator",
      "BigInt",
      "Boolean",
      "Computed",
      "Constructor",
      "Date",
      "Enum",
      "Function",
      "Integer",
      "Intersect",
      "Iterator",
      "Literal",
      "MappedKey",
      "MappedResult",
      "Not",
      "Null",
      "Number",
      "Object",
      "Promise",
      "Record",
      "Ref",
      "RegExp",
      "String",
      "Symbol",
      "TemplateLiteral",
      "This",
      "Tuple",
      "Undefined",
      "Union",
      "Uint8Array",
      "Unknown",
      "Void"
    ];
    function IsPattern(value) {
      try {
        new RegExp(value);
        return true;
      } catch {
        return false;
      }
    }
    function IsControlCharacterFree(value) {
      if (!ValueGuard.IsString(value))
        return false;
      for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i);
        if (code >= 7 && code <= 13 || code === 27 || code === 127) {
          return false;
        }
      }
      return true;
    }
    function IsAdditionalProperties(value) {
      return IsOptionalBoolean(value) || IsSchema(value);
    }
    function IsOptionalBigInt(value) {
      return ValueGuard.IsUndefined(value) || ValueGuard.IsBigInt(value);
    }
    function IsOptionalNumber(value) {
      return ValueGuard.IsUndefined(value) || ValueGuard.IsNumber(value);
    }
    function IsOptionalBoolean(value) {
      return ValueGuard.IsUndefined(value) || ValueGuard.IsBoolean(value);
    }
    function IsOptionalString(value) {
      return ValueGuard.IsUndefined(value) || ValueGuard.IsString(value);
    }
    function IsOptionalPattern(value) {
      return ValueGuard.IsUndefined(value) || ValueGuard.IsString(value) && IsControlCharacterFree(value) && IsPattern(value);
    }
    function IsOptionalFormat(value) {
      return ValueGuard.IsUndefined(value) || ValueGuard.IsString(value) && IsControlCharacterFree(value);
    }
    function IsOptionalSchema(value) {
      return ValueGuard.IsUndefined(value) || IsSchema(value);
    }
    function IsReadonly(value) {
      return ValueGuard.IsObject(value) && value[index_1.ReadonlyKind] === "Readonly";
    }
    function IsOptional(value) {
      return ValueGuard.IsObject(value) && value[index_1.OptionalKind] === "Optional";
    }
    function IsAny(value) {
      return IsKindOf(value, "Any") && IsOptionalString(value.$id);
    }
    function IsArgument(value) {
      return IsKindOf(value, "Argument") && ValueGuard.IsNumber(value.index);
    }
    function IsArray(value) {
      return IsKindOf(value, "Array") && value.type === "array" && IsOptionalString(value.$id) && IsSchema(value.items) && IsOptionalNumber(value.minItems) && IsOptionalNumber(value.maxItems) && IsOptionalBoolean(value.uniqueItems) && IsOptionalSchema(value.contains) && IsOptionalNumber(value.minContains) && IsOptionalNumber(value.maxContains);
    }
    function IsAsyncIterator(value) {
      return IsKindOf(value, "AsyncIterator") && value.type === "AsyncIterator" && IsOptionalString(value.$id) && IsSchema(value.items);
    }
    function IsBigInt(value) {
      return IsKindOf(value, "BigInt") && value.type === "bigint" && IsOptionalString(value.$id) && IsOptionalBigInt(value.exclusiveMaximum) && IsOptionalBigInt(value.exclusiveMinimum) && IsOptionalBigInt(value.maximum) && IsOptionalBigInt(value.minimum) && IsOptionalBigInt(value.multipleOf);
    }
    function IsBoolean(value) {
      return IsKindOf(value, "Boolean") && value.type === "boolean" && IsOptionalString(value.$id);
    }
    function IsComputed(value) {
      return IsKindOf(value, "Computed") && ValueGuard.IsString(value.target) && ValueGuard.IsArray(value.parameters) && value.parameters.every((schema) => IsSchema(schema));
    }
    function IsConstructor(value) {
      return IsKindOf(value, "Constructor") && value.type === "Constructor" && IsOptionalString(value.$id) && ValueGuard.IsArray(value.parameters) && value.parameters.every((schema) => IsSchema(schema)) && IsSchema(value.returns);
    }
    function IsDate(value) {
      return IsKindOf(value, "Date") && value.type === "Date" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximumTimestamp) && IsOptionalNumber(value.exclusiveMinimumTimestamp) && IsOptionalNumber(value.maximumTimestamp) && IsOptionalNumber(value.minimumTimestamp) && IsOptionalNumber(value.multipleOfTimestamp);
    }
    function IsFunction(value) {
      return IsKindOf(value, "Function") && value.type === "Function" && IsOptionalString(value.$id) && ValueGuard.IsArray(value.parameters) && value.parameters.every((schema) => IsSchema(schema)) && IsSchema(value.returns);
    }
    function IsImport(value) {
      return IsKindOf(value, "Import") && ValueGuard.HasPropertyKey(value, "$defs") && ValueGuard.IsObject(value.$defs) && IsProperties(value.$defs) && ValueGuard.HasPropertyKey(value, "$ref") && ValueGuard.IsString(value.$ref) && value.$ref in value.$defs;
    }
    function IsInteger(value) {
      return IsKindOf(value, "Integer") && value.type === "integer" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
    }
    function IsProperties(value) {
      return ValueGuard.IsObject(value) && Object.entries(value).every(([key, schema]) => IsControlCharacterFree(key) && IsSchema(schema));
    }
    function IsIntersect(value) {
      return IsKindOf(value, "Intersect") && (ValueGuard.IsString(value.type) && value.type !== "object" ? false : true) && ValueGuard.IsArray(value.allOf) && value.allOf.every((schema) => IsSchema(schema) && !IsTransform(schema)) && IsOptionalString(value.type) && (IsOptionalBoolean(value.unevaluatedProperties) || IsOptionalSchema(value.unevaluatedProperties)) && IsOptionalString(value.$id);
    }
    function IsIterator(value) {
      return IsKindOf(value, "Iterator") && value.type === "Iterator" && IsOptionalString(value.$id) && IsSchema(value.items);
    }
    function IsKindOf(value, kind) {
      return ValueGuard.IsObject(value) && index_1.Kind in value && value[index_1.Kind] === kind;
    }
    function IsLiteralString(value) {
      return IsLiteral(value) && ValueGuard.IsString(value.const);
    }
    function IsLiteralNumber(value) {
      return IsLiteral(value) && ValueGuard.IsNumber(value.const);
    }
    function IsLiteralBoolean(value) {
      return IsLiteral(value) && ValueGuard.IsBoolean(value.const);
    }
    function IsLiteral(value) {
      return IsKindOf(value, "Literal") && IsOptionalString(value.$id) && IsLiteralValue(value.const);
    }
    function IsLiteralValue(value) {
      return ValueGuard.IsBoolean(value) || ValueGuard.IsNumber(value) || ValueGuard.IsString(value);
    }
    function IsMappedKey(value) {
      return IsKindOf(value, "MappedKey") && ValueGuard.IsArray(value.keys) && value.keys.every((key) => ValueGuard.IsNumber(key) || ValueGuard.IsString(key));
    }
    function IsMappedResult(value) {
      return IsKindOf(value, "MappedResult") && IsProperties(value.properties);
    }
    function IsNever(value) {
      return IsKindOf(value, "Never") && ValueGuard.IsObject(value.not) && Object.getOwnPropertyNames(value.not).length === 0;
    }
    function IsNot(value) {
      return IsKindOf(value, "Not") && IsSchema(value.not);
    }
    function IsNull(value) {
      return IsKindOf(value, "Null") && value.type === "null" && IsOptionalString(value.$id);
    }
    function IsNumber(value) {
      return IsKindOf(value, "Number") && value.type === "number" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
    }
    function IsObject(value) {
      return IsKindOf(value, "Object") && value.type === "object" && IsOptionalString(value.$id) && IsProperties(value.properties) && IsAdditionalProperties(value.additionalProperties) && IsOptionalNumber(value.minProperties) && IsOptionalNumber(value.maxProperties);
    }
    function IsPromise(value) {
      return IsKindOf(value, "Promise") && value.type === "Promise" && IsOptionalString(value.$id) && IsSchema(value.item);
    }
    function IsRecord(value) {
      return IsKindOf(value, "Record") && value.type === "object" && IsOptionalString(value.$id) && IsAdditionalProperties(value.additionalProperties) && ValueGuard.IsObject(value.patternProperties) && ((schema) => {
        const keys = Object.getOwnPropertyNames(schema.patternProperties);
        return keys.length === 1 && IsPattern(keys[0]) && ValueGuard.IsObject(schema.patternProperties) && IsSchema(schema.patternProperties[keys[0]]);
      })(value);
    }
    function IsRecursive(value) {
      return ValueGuard.IsObject(value) && index_1.Hint in value && value[index_1.Hint] === "Recursive";
    }
    function IsRef(value) {
      return IsKindOf(value, "Ref") && IsOptionalString(value.$id) && ValueGuard.IsString(value.$ref);
    }
    function IsRegExp(value) {
      return IsKindOf(value, "RegExp") && IsOptionalString(value.$id) && ValueGuard.IsString(value.source) && ValueGuard.IsString(value.flags) && IsOptionalNumber(value.maxLength) && IsOptionalNumber(value.minLength);
    }
    function IsString(value) {
      return IsKindOf(value, "String") && value.type === "string" && IsOptionalString(value.$id) && IsOptionalNumber(value.minLength) && IsOptionalNumber(value.maxLength) && IsOptionalPattern(value.pattern) && IsOptionalFormat(value.format);
    }
    function IsSymbol(value) {
      return IsKindOf(value, "Symbol") && value.type === "symbol" && IsOptionalString(value.$id);
    }
    function IsTemplateLiteral(value) {
      return IsKindOf(value, "TemplateLiteral") && value.type === "string" && ValueGuard.IsString(value.pattern) && value.pattern[0] === "^" && value.pattern[value.pattern.length - 1] === "$";
    }
    function IsThis(value) {
      return IsKindOf(value, "This") && IsOptionalString(value.$id) && ValueGuard.IsString(value.$ref);
    }
    function IsTransform(value) {
      return ValueGuard.IsObject(value) && index_1.TransformKind in value;
    }
    function IsTuple(value) {
      return IsKindOf(value, "Tuple") && value.type === "array" && IsOptionalString(value.$id) && ValueGuard.IsNumber(value.minItems) && ValueGuard.IsNumber(value.maxItems) && value.minItems === value.maxItems && // empty
      (ValueGuard.IsUndefined(value.items) && ValueGuard.IsUndefined(value.additionalItems) && value.minItems === 0 || ValueGuard.IsArray(value.items) && value.items.every((schema) => IsSchema(schema)));
    }
    function IsUndefined(value) {
      return IsKindOf(value, "Undefined") && value.type === "undefined" && IsOptionalString(value.$id);
    }
    function IsUnionLiteral(value) {
      return IsUnion(value) && value.anyOf.every((schema) => IsLiteralString(schema) || IsLiteralNumber(schema));
    }
    function IsUnion(value) {
      return IsKindOf(value, "Union") && IsOptionalString(value.$id) && ValueGuard.IsObject(value) && ValueGuard.IsArray(value.anyOf) && value.anyOf.every((schema) => IsSchema(schema));
    }
    function IsUint8Array(value) {
      return IsKindOf(value, "Uint8Array") && value.type === "Uint8Array" && IsOptionalString(value.$id) && IsOptionalNumber(value.minByteLength) && IsOptionalNumber(value.maxByteLength);
    }
    function IsUnknown(value) {
      return IsKindOf(value, "Unknown") && IsOptionalString(value.$id);
    }
    function IsUnsafe(value) {
      return IsKindOf(value, "Unsafe");
    }
    function IsVoid(value) {
      return IsKindOf(value, "Void") && value.type === "void" && IsOptionalString(value.$id);
    }
    function IsKind(value) {
      return ValueGuard.IsObject(value) && index_1.Kind in value && ValueGuard.IsString(value[index_1.Kind]) && !KnownTypes.includes(value[index_1.Kind]);
    }
    function IsSchema(value) {
      return ValueGuard.IsObject(value) && (IsAny(value) || IsArgument(value) || IsArray(value) || IsBoolean(value) || IsBigInt(value) || IsAsyncIterator(value) || IsComputed(value) || IsConstructor(value) || IsDate(value) || IsFunction(value) || IsInteger(value) || IsIntersect(value) || IsIterator(value) || IsLiteral(value) || IsMappedKey(value) || IsMappedResult(value) || IsNever(value) || IsNot(value) || IsNull(value) || IsNumber(value) || IsObject(value) || IsPromise(value) || IsRecord(value) || IsRef(value) || IsRegExp(value) || IsString(value) || IsSymbol(value) || IsTemplateLiteral(value) || IsThis(value) || IsTuple(value) || IsUndefined(value) || IsUnion(value) || IsUint8Array(value) || IsUnknown(value) || IsUnsafe(value) || IsVoid(value) || IsKind(value));
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/guard/index.js
var require_guard3 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/guard/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueGuard = exports.TypeGuard = exports.KindGuard = void 0;
    exports.KindGuard = __importStar(require_kind());
    exports.TypeGuard = __importStar(require_type3());
    exports.ValueGuard = __importStar(require_value());
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/helpers/helpers.js
var require_helpers = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/helpers/helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Increment = Increment;
    function Increment(T) {
      return (parseInt(T) + 1).toString();
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/helpers/index.js
var require_helpers2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/helpers/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_helpers(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/patterns/patterns.js
var require_patterns = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/patterns/patterns.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PatternNeverExact = exports.PatternStringExact = exports.PatternNumberExact = exports.PatternBooleanExact = exports.PatternNever = exports.PatternString = exports.PatternNumber = exports.PatternBoolean = void 0;
    exports.PatternBoolean = "(true|false)";
    exports.PatternNumber = "(0|[1-9][0-9]*)";
    exports.PatternString = "(.*)";
    exports.PatternNever = "(?!.*)";
    exports.PatternBooleanExact = `^${exports.PatternBoolean}$`;
    exports.PatternNumberExact = `^${exports.PatternNumber}$`;
    exports.PatternStringExact = `^${exports.PatternString}$`;
    exports.PatternNeverExact = `^${exports.PatternNever}$`;
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/patterns/index.js
var require_patterns2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/patterns/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_patterns(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/registry/format.js
var require_format = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/registry/format.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Entries = Entries;
    exports.Clear = Clear;
    exports.Delete = Delete;
    exports.Has = Has;
    exports.Set = Set2;
    exports.Get = Get;
    var map = /* @__PURE__ */ new Map();
    function Entries() {
      return new Map(map);
    }
    function Clear() {
      return map.clear();
    }
    function Delete(format) {
      return map.delete(format);
    }
    function Has(format) {
      return map.has(format);
    }
    function Set2(format, func) {
      map.set(format, func);
    }
    function Get(format) {
      return map.get(format);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/registry/type.js
var require_type4 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/registry/type.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Entries = Entries;
    exports.Clear = Clear;
    exports.Delete = Delete;
    exports.Has = Has;
    exports.Set = Set2;
    exports.Get = Get;
    var map = /* @__PURE__ */ new Map();
    function Entries() {
      return new Map(map);
    }
    function Clear() {
      return map.clear();
    }
    function Delete(kind) {
      return map.delete(kind);
    }
    function Has(kind) {
      return map.has(kind);
    }
    function Set2(kind, func) {
      map.set(kind, func);
    }
    function Get(kind) {
      return map.get(kind);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/registry/index.js
var require_registry = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/registry/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeRegistry = exports.FormatRegistry = void 0;
    exports.FormatRegistry = __importStar(require_format());
    exports.TypeRegistry = __importStar(require_type4());
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/sets/set.js
var require_set = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/sets/set.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SetIncludes = SetIncludes;
    exports.SetIsSubset = SetIsSubset;
    exports.SetDistinct = SetDistinct;
    exports.SetIntersect = SetIntersect;
    exports.SetUnion = SetUnion;
    exports.SetComplement = SetComplement;
    exports.SetIntersectMany = SetIntersectMany;
    exports.SetUnionMany = SetUnionMany;
    function SetIncludes(T, S) {
      return T.includes(S);
    }
    function SetIsSubset(T, S) {
      return T.every((L) => SetIncludes(S, L));
    }
    function SetDistinct(T) {
      return [...new Set(T)];
    }
    function SetIntersect(T, S) {
      return T.filter((L) => S.includes(L));
    }
    function SetUnion(T, S) {
      return [...T, ...S];
    }
    function SetComplement(T, S) {
      return T.filter((L) => !S.includes(L));
    }
    function SetIntersectManyResolve(T, Init) {
      return T.reduce((Acc, L) => {
        return SetIntersect(Acc, L);
      }, Init);
    }
    function SetIntersectMany(T) {
      return T.length === 1 ? T[0] : T.length > 1 ? SetIntersectManyResolve(T.slice(1), T[0]) : [];
    }
    function SetUnionMany(T) {
      const Acc = [];
      for (const L of T)
        Acc.push(...L);
      return Acc;
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/sets/index.js
var require_sets = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/sets/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_set(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/any/any.js
var require_any = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/any/any.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Any = Any;
    var index_1 = require_create();
    var index_2 = require_symbols2();
    function Any(options) {
      return (0, index_1.CreateType)({ [index_2.Kind]: "Any" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/any/index.js
var require_any2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/any/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_any(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/array/array.js
var require_array = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/array/array.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Array = Array2;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Array2(items, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Array", type: "array", items }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/array/index.js
var require_array2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/array/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_array(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/argument/argument.js
var require_argument = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/argument/argument.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Argument = Argument;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Argument(index) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Argument", index });
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/argument/index.js
var require_argument2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/argument/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_argument(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/async-iterator/async-iterator.js
var require_async_iterator = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/async-iterator/async-iterator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AsyncIterator = AsyncIterator;
    var index_1 = require_symbols2();
    var type_1 = require_type2();
    function AsyncIterator(items, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "AsyncIterator", type: "AsyncIterator", items }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/async-iterator/index.js
var require_async_iterator2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/async-iterator/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_async_iterator(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/computed/computed.js
var require_computed = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/computed/computed.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Computed = Computed;
    var index_1 = require_create();
    var symbols_1 = require_symbols();
    function Computed(target, parameters, options) {
      return (0, index_1.CreateType)({ [symbols_1.Kind]: "Computed", target, parameters }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/computed/index.js
var require_computed2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/computed/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_computed(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/discard/discard.js
var require_discard = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/discard/discard.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Discard = Discard;
    function DiscardKey(value, key) {
      const { [key]: _, ...rest } = value;
      return rest;
    }
    function Discard(value, keys) {
      return keys.reduce((acc, key) => DiscardKey(acc, key), value);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/discard/index.js
var require_discard2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/discard/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_discard(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/never/never.js
var require_never = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/never/never.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Never = Never;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Never(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Never", not: {} }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/never/index.js
var require_never2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/never/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_never(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/mapped/mapped-key.js
var require_mapped_key = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/mapped/mapped-key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MappedKey = MappedKey;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function MappedKey(T) {
      return (0, type_1.CreateType)({
        [index_1.Kind]: "MappedKey",
        keys: T
      });
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/mapped/mapped-result.js
var require_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/mapped/mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MappedResult = MappedResult;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function MappedResult(properties) {
      return (0, type_1.CreateType)({
        [index_1.Kind]: "MappedResult",
        properties
      });
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/constructor/constructor.js
var require_constructor = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/constructor/constructor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Constructor = Constructor;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Constructor(parameters, returns, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Constructor", type: "Constructor", parameters, returns }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/constructor/index.js
var require_constructor2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/constructor/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_constructor(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/function/function.js
var require_function = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/function/function.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Function = Function;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Function(parameters, returns, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Function", type: "Function", parameters, returns }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/function/index.js
var require_function2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/function/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_function(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/union-create.js
var require_union_create = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/union-create.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnionCreate = UnionCreate;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function UnionCreate(T, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Union", anyOf: T }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/union-evaluated.js
var require_union_evaluated = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/union-evaluated.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnionEvaluated = UnionEvaluated;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    var index_2 = require_discard2();
    var index_3 = require_never2();
    var index_4 = require_optional2();
    var union_create_1 = require_union_create();
    var kind_1 = require_kind();
    function IsUnionOptional(types) {
      return types.some((type) => (0, kind_1.IsOptional)(type));
    }
    function RemoveOptionalFromRest(types) {
      return types.map((left) => (0, kind_1.IsOptional)(left) ? RemoveOptionalFromType(left) : left);
    }
    function RemoveOptionalFromType(T) {
      return (0, index_2.Discard)(T, [index_1.OptionalKind]);
    }
    function ResolveUnion(types, options) {
      const isOptional = IsUnionOptional(types);
      return isOptional ? (0, index_4.Optional)((0, union_create_1.UnionCreate)(RemoveOptionalFromRest(types), options)) : (0, union_create_1.UnionCreate)(RemoveOptionalFromRest(types), options);
    }
    function UnionEvaluated(T, options) {
      return T.length === 1 ? (0, type_1.CreateType)(T[0], options) : T.length === 0 ? (0, index_3.Never)(options) : ResolveUnion(T, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/union-type.js
var require_union_type = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/union-type.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var index_1 = require_symbols2();
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/union.js
var require_union = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/union.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Union = Union;
    var index_1 = require_never2();
    var type_1 = require_type2();
    var union_create_1 = require_union_create();
    function Union(types, options) {
      return types.length === 0 ? (0, index_1.Never)(options) : types.length === 1 ? (0, type_1.CreateType)(types[0], options) : (0, union_create_1.UnionCreate)(types, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/index.js
var require_union2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/union/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_union_evaluated(), exports);
    __exportStar(require_union_type(), exports);
    __exportStar(require_union(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/parse.js
var require_parse = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/parse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateLiteralParserError = void 0;
    exports.TemplateLiteralParse = TemplateLiteralParse;
    exports.TemplateLiteralParseExact = TemplateLiteralParseExact;
    var index_1 = require_error2();
    var TemplateLiteralParserError = class extends index_1.TypeBoxError {
    };
    exports.TemplateLiteralParserError = TemplateLiteralParserError;
    function Unescape(pattern) {
      return pattern.replace(/\\\$/g, "$").replace(/\\\*/g, "*").replace(/\\\^/g, "^").replace(/\\\|/g, "|").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
    }
    function IsNonEscaped(pattern, index, char) {
      return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92;
    }
    function IsOpenParen(pattern, index) {
      return IsNonEscaped(pattern, index, "(");
    }
    function IsCloseParen(pattern, index) {
      return IsNonEscaped(pattern, index, ")");
    }
    function IsSeparator(pattern, index) {
      return IsNonEscaped(pattern, index, "|");
    }
    function IsGroup(pattern) {
      if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1)))
        return false;
      let count = 0;
      for (let index = 0; index < pattern.length; index++) {
        if (IsOpenParen(pattern, index))
          count += 1;
        if (IsCloseParen(pattern, index))
          count -= 1;
        if (count === 0 && index !== pattern.length - 1)
          return false;
      }
      return true;
    }
    function InGroup(pattern) {
      return pattern.slice(1, pattern.length - 1);
    }
    function IsPrecedenceOr(pattern) {
      let count = 0;
      for (let index = 0; index < pattern.length; index++) {
        if (IsOpenParen(pattern, index))
          count += 1;
        if (IsCloseParen(pattern, index))
          count -= 1;
        if (IsSeparator(pattern, index) && count === 0)
          return true;
      }
      return false;
    }
    function IsPrecedenceAnd(pattern) {
      for (let index = 0; index < pattern.length; index++) {
        if (IsOpenParen(pattern, index))
          return true;
      }
      return false;
    }
    function Or(pattern) {
      let [count, start] = [0, 0];
      const expressions = [];
      for (let index = 0; index < pattern.length; index++) {
        if (IsOpenParen(pattern, index))
          count += 1;
        if (IsCloseParen(pattern, index))
          count -= 1;
        if (IsSeparator(pattern, index) && count === 0) {
          const range2 = pattern.slice(start, index);
          if (range2.length > 0)
            expressions.push(TemplateLiteralParse(range2));
          start = index + 1;
        }
      }
      const range = pattern.slice(start);
      if (range.length > 0)
        expressions.push(TemplateLiteralParse(range));
      if (expressions.length === 0)
        return { type: "const", const: "" };
      if (expressions.length === 1)
        return expressions[0];
      return { type: "or", expr: expressions };
    }
    function And(pattern) {
      function Group(value, index) {
        if (!IsOpenParen(value, index))
          throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
        let count = 0;
        for (let scan = index; scan < value.length; scan++) {
          if (IsOpenParen(value, scan))
            count += 1;
          if (IsCloseParen(value, scan))
            count -= 1;
          if (count === 0)
            return [index, scan];
        }
        throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
      }
      function Range(pattern2, index) {
        for (let scan = index; scan < pattern2.length; scan++) {
          if (IsOpenParen(pattern2, scan))
            return [index, scan];
        }
        return [index, pattern2.length];
      }
      const expressions = [];
      for (let index = 0; index < pattern.length; index++) {
        if (IsOpenParen(pattern, index)) {
          const [start, end] = Group(pattern, index);
          const range = pattern.slice(start, end + 1);
          expressions.push(TemplateLiteralParse(range));
          index = end;
        } else {
          const [start, end] = Range(pattern, index);
          const range = pattern.slice(start, end);
          if (range.length > 0)
            expressions.push(TemplateLiteralParse(range));
          index = end - 1;
        }
      }
      return expressions.length === 0 ? { type: "const", const: "" } : expressions.length === 1 ? expressions[0] : { type: "and", expr: expressions };
    }
    function TemplateLiteralParse(pattern) {
      return IsGroup(pattern) ? TemplateLiteralParse(InGroup(pattern)) : IsPrecedenceOr(pattern) ? Or(pattern) : IsPrecedenceAnd(pattern) ? And(pattern) : { type: "const", const: Unescape(pattern) };
    }
    function TemplateLiteralParseExact(pattern) {
      return TemplateLiteralParse(pattern.slice(1, pattern.length - 1));
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/finite.js
var require_finite = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/finite.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateLiteralFiniteError = void 0;
    exports.IsTemplateLiteralExpressionFinite = IsTemplateLiteralExpressionFinite;
    exports.IsTemplateLiteralFinite = IsTemplateLiteralFinite;
    var parse_1 = require_parse();
    var index_1 = require_error2();
    var TemplateLiteralFiniteError = class extends index_1.TypeBoxError {
    };
    exports.TemplateLiteralFiniteError = TemplateLiteralFiniteError;
    function IsNumberExpression(expression) {
      return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "0" && expression.expr[1].type === "const" && expression.expr[1].const === "[1-9][0-9]*";
    }
    function IsBooleanExpression(expression) {
      return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "true" && expression.expr[1].type === "const" && expression.expr[1].const === "false";
    }
    function IsStringExpression(expression) {
      return expression.type === "const" && expression.const === ".*";
    }
    function IsTemplateLiteralExpressionFinite(expression) {
      return IsNumberExpression(expression) || IsStringExpression(expression) ? false : IsBooleanExpression(expression) ? true : expression.type === "and" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "or" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "const" ? true : (() => {
        throw new TemplateLiteralFiniteError(`Unknown expression type`);
      })();
    }
    function IsTemplateLiteralFinite(schema) {
      const expression = (0, parse_1.TemplateLiteralParseExact)(schema.pattern);
      return IsTemplateLiteralExpressionFinite(expression);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/generate.js
var require_generate = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/generate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateLiteralGenerateError = void 0;
    exports.TemplateLiteralExpressionGenerate = TemplateLiteralExpressionGenerate;
    exports.TemplateLiteralGenerate = TemplateLiteralGenerate;
    var finite_1 = require_finite();
    var parse_1 = require_parse();
    var index_1 = require_error2();
    var TemplateLiteralGenerateError = class extends index_1.TypeBoxError {
    };
    exports.TemplateLiteralGenerateError = TemplateLiteralGenerateError;
    function* GenerateReduce(buffer) {
      if (buffer.length === 1)
        return yield* buffer[0];
      for (const left of buffer[0]) {
        for (const right of GenerateReduce(buffer.slice(1))) {
          yield `${left}${right}`;
        }
      }
    }
    function* GenerateAnd(expression) {
      return yield* GenerateReduce(expression.expr.map((expr) => [...TemplateLiteralExpressionGenerate(expr)]));
    }
    function* GenerateOr(expression) {
      for (const expr of expression.expr)
        yield* TemplateLiteralExpressionGenerate(expr);
    }
    function* GenerateConst(expression) {
      return yield expression.const;
    }
    function* TemplateLiteralExpressionGenerate(expression) {
      return expression.type === "and" ? yield* GenerateAnd(expression) : expression.type === "or" ? yield* GenerateOr(expression) : expression.type === "const" ? yield* GenerateConst(expression) : (() => {
        throw new TemplateLiteralGenerateError("Unknown expression");
      })();
    }
    function TemplateLiteralGenerate(schema) {
      const expression = (0, parse_1.TemplateLiteralParseExact)(schema.pattern);
      return (0, finite_1.IsTemplateLiteralExpressionFinite)(expression) ? [...TemplateLiteralExpressionGenerate(expression)] : [];
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/literal/literal.js
var require_literal = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/literal/literal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Literal = Literal;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Literal(value, options) {
      return (0, type_1.CreateType)({
        [index_1.Kind]: "Literal",
        const: value,
        type: typeof value
      }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/literal/index.js
var require_literal2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/literal/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_literal(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/boolean/boolean.js
var require_boolean = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/boolean/boolean.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Boolean = Boolean2;
    var index_1 = require_symbols2();
    var index_2 = require_create();
    function Boolean2(options) {
      return (0, index_2.CreateType)({ [index_1.Kind]: "Boolean", type: "boolean" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/boolean/index.js
var require_boolean2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/boolean/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_boolean(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/bigint/bigint.js
var require_bigint = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/bigint/bigint.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BigInt = BigInt;
    var index_1 = require_symbols2();
    var index_2 = require_create();
    function BigInt(options) {
      return (0, index_2.CreateType)({ [index_1.Kind]: "BigInt", type: "bigint" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/bigint/index.js
var require_bigint2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/bigint/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_bigint(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/number/number.js
var require_number = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/number/number.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Number = Number2;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Number2(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Number", type: "number" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/number/index.js
var require_number2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/number/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_number(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/string/string.js
var require_string = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/string/string.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.String = String2;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function String2(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "String", type: "string" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/string/index.js
var require_string2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/string/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_string(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/syntax.js
var require_syntax = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/syntax.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateLiteralSyntax = TemplateLiteralSyntax;
    var index_1 = require_literal2();
    var index_2 = require_boolean2();
    var index_3 = require_bigint2();
    var index_4 = require_number2();
    var index_5 = require_string2();
    var index_6 = require_union2();
    var index_7 = require_never2();
    function* FromUnion(syntax) {
      const trim = syntax.trim().replace(/"|'/g, "");
      return trim === "boolean" ? yield (0, index_2.Boolean)() : trim === "number" ? yield (0, index_4.Number)() : trim === "bigint" ? yield (0, index_3.BigInt)() : trim === "string" ? yield (0, index_5.String)() : yield (() => {
        const literals = trim.split("|").map((literal) => (0, index_1.Literal)(literal.trim()));
        return literals.length === 0 ? (0, index_7.Never)() : literals.length === 1 ? literals[0] : (0, index_6.UnionEvaluated)(literals);
      })();
    }
    function* FromTerminal(syntax) {
      if (syntax[1] !== "{") {
        const L = (0, index_1.Literal)("$");
        const R = FromSyntax(syntax.slice(1));
        return yield* [L, ...R];
      }
      for (let i = 2; i < syntax.length; i++) {
        if (syntax[i] === "}") {
          const L = FromUnion(syntax.slice(2, i));
          const R = FromSyntax(syntax.slice(i + 1));
          return yield* [...L, ...R];
        }
      }
      yield (0, index_1.Literal)(syntax);
    }
    function* FromSyntax(syntax) {
      for (let i = 0; i < syntax.length; i++) {
        if (syntax[i] === "$") {
          const L = (0, index_1.Literal)(syntax.slice(0, i));
          const R = FromTerminal(syntax.slice(i));
          return yield* [L, ...R];
        }
      }
      yield (0, index_1.Literal)(syntax);
    }
    function TemplateLiteralSyntax(syntax) {
      return [...FromSyntax(syntax)];
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/pattern.js
var require_pattern = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateLiteralPatternError = void 0;
    exports.TemplateLiteralPattern = TemplateLiteralPattern;
    var index_1 = require_patterns2();
    var index_2 = require_symbols2();
    var index_3 = require_error2();
    var kind_1 = require_kind();
    var TemplateLiteralPatternError = class extends index_3.TypeBoxError {
    };
    exports.TemplateLiteralPatternError = TemplateLiteralPatternError;
    function Escape(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function Visit(schema, acc) {
      return (0, kind_1.IsTemplateLiteral)(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) : (0, kind_1.IsUnion)(schema) ? `(${schema.anyOf.map((schema2) => Visit(schema2, acc)).join("|")})` : (0, kind_1.IsNumber)(schema) ? `${acc}${index_1.PatternNumber}` : (0, kind_1.IsInteger)(schema) ? `${acc}${index_1.PatternNumber}` : (0, kind_1.IsBigInt)(schema) ? `${acc}${index_1.PatternNumber}` : (0, kind_1.IsString)(schema) ? `${acc}${index_1.PatternString}` : (0, kind_1.IsLiteral)(schema) ? `${acc}${Escape(schema.const.toString())}` : (0, kind_1.IsBoolean)(schema) ? `${acc}${index_1.PatternBoolean}` : (() => {
        throw new TemplateLiteralPatternError(`Unexpected Kind '${schema[index_2.Kind]}'`);
      })();
    }
    function TemplateLiteralPattern(kinds) {
      return `^${kinds.map((schema) => Visit(schema, "")).join("")}$`;
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/union.js
var require_union3 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/union.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateLiteralToUnion = TemplateLiteralToUnion;
    var index_1 = require_union2();
    var index_2 = require_literal2();
    var generate_1 = require_generate();
    function TemplateLiteralToUnion(schema) {
      const R = (0, generate_1.TemplateLiteralGenerate)(schema);
      const L = R.map((S) => (0, index_2.Literal)(S));
      return (0, index_1.UnionEvaluated)(L);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/template-literal.js
var require_template_literal = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/template-literal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateLiteral = TemplateLiteral;
    var type_1 = require_type2();
    var syntax_1 = require_syntax();
    var pattern_1 = require_pattern();
    var value_1 = require_value();
    var index_1 = require_symbols2();
    function TemplateLiteral(unresolved, options) {
      const pattern = (0, value_1.IsString)(unresolved) ? (0, pattern_1.TemplateLiteralPattern)((0, syntax_1.TemplateLiteralSyntax)(unresolved)) : (0, pattern_1.TemplateLiteralPattern)(unresolved);
      return (0, type_1.CreateType)({ [index_1.Kind]: "TemplateLiteral", type: "string", pattern }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/index.js
var require_template_literal2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/template-literal/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_finite(), exports);
    __exportStar(require_generate(), exports);
    __exportStar(require_syntax(), exports);
    __exportStar(require_parse(), exports);
    __exportStar(require_pattern(), exports);
    __exportStar(require_union3(), exports);
    __exportStar(require_template_literal(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/indexed-property-keys.js
var require_indexed_property_keys = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/indexed-property-keys.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexPropertyKeys = IndexPropertyKeys;
    var index_1 = require_template_literal2();
    var kind_1 = require_kind();
    function FromTemplateLiteral(templateLiteral) {
      const keys = (0, index_1.TemplateLiteralGenerate)(templateLiteral);
      return keys.map((key) => key.toString());
    }
    function FromUnion(types) {
      const result = [];
      for (const type of types)
        result.push(...IndexPropertyKeys(type));
      return result;
    }
    function FromLiteral(literalValue) {
      return [literalValue.toString()];
    }
    function IndexPropertyKeys(type) {
      return [...new Set((0, kind_1.IsTemplateLiteral)(type) ? FromTemplateLiteral(type) : (0, kind_1.IsUnion)(type) ? FromUnion(type.anyOf) : (0, kind_1.IsLiteral)(type) ? FromLiteral(type.const) : (0, kind_1.IsNumber)(type) ? ["[number]"] : (0, kind_1.IsInteger)(type) ? ["[number]"] : [])];
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/indexed-from-mapped-result.js
var require_indexed_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/indexed-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexFromMappedResult = IndexFromMappedResult;
    var index_1 = require_mapped2();
    var indexed_property_keys_1 = require_indexed_property_keys();
    var index_2 = require_indexed2();
    function FromProperties(type, properties, options) {
      const result = {};
      for (const K2 of Object.getOwnPropertyNames(properties)) {
        result[K2] = (0, index_2.Index)(type, (0, indexed_property_keys_1.IndexPropertyKeys)(properties[K2]), options);
      }
      return result;
    }
    function FromMappedResult(type, mappedResult, options) {
      return FromProperties(type, mappedResult.properties, options);
    }
    function IndexFromMappedResult(type, mappedResult, options) {
      const properties = FromMappedResult(type, mappedResult, options);
      return (0, index_1.MappedResult)(properties);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/indexed.js
var require_indexed = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/indexed.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexFromPropertyKey = IndexFromPropertyKey;
    exports.IndexFromPropertyKeys = IndexFromPropertyKeys;
    exports.IndexFromComputed = IndexFromComputed;
    exports.Index = Index;
    var type_1 = require_type2();
    var index_1 = require_error2();
    var index_2 = require_computed2();
    var index_3 = require_never2();
    var index_4 = require_intersect2();
    var index_5 = require_union2();
    var indexed_property_keys_1 = require_indexed_property_keys();
    var indexed_from_mapped_key_1 = require_indexed_from_mapped_key();
    var indexed_from_mapped_result_1 = require_indexed_from_mapped_result();
    var kind_1 = require_kind();
    function FromRest(types, key) {
      return types.map((type) => IndexFromPropertyKey(type, key));
    }
    function FromIntersectRest(types) {
      return types.filter((type) => !(0, kind_1.IsNever)(type));
    }
    function FromIntersect(types, key) {
      return (0, index_4.IntersectEvaluated)(FromIntersectRest(FromRest(types, key)));
    }
    function FromUnionRest(types) {
      return types.some((L) => (0, kind_1.IsNever)(L)) ? [] : types;
    }
    function FromUnion(types, key) {
      return (0, index_5.UnionEvaluated)(FromUnionRest(FromRest(types, key)));
    }
    function FromTuple(types, key) {
      return key in types ? types[key] : key === "[number]" ? (0, index_5.UnionEvaluated)(types) : (0, index_3.Never)();
    }
    function FromArray(type, key) {
      return key === "[number]" ? type : (0, index_3.Never)();
    }
    function FromProperty(properties, propertyKey) {
      return propertyKey in properties ? properties[propertyKey] : (0, index_3.Never)();
    }
    function IndexFromPropertyKey(type, propertyKey) {
      return (0, kind_1.IsIntersect)(type) ? FromIntersect(type.allOf, propertyKey) : (0, kind_1.IsUnion)(type) ? FromUnion(type.anyOf, propertyKey) : (0, kind_1.IsTuple)(type) ? FromTuple(type.items ?? [], propertyKey) : (0, kind_1.IsArray)(type) ? FromArray(type.items, propertyKey) : (0, kind_1.IsObject)(type) ? FromProperty(type.properties, propertyKey) : (0, index_3.Never)();
    }
    function IndexFromPropertyKeys(type, propertyKeys) {
      return propertyKeys.map((propertyKey) => IndexFromPropertyKey(type, propertyKey));
    }
    function FromSchema(type, propertyKeys) {
      return (0, index_5.UnionEvaluated)(IndexFromPropertyKeys(type, propertyKeys));
    }
    function IndexFromComputed(type, key) {
      return (0, index_2.Computed)("Index", [type, key]);
    }
    function Index(type, key, options) {
      if ((0, kind_1.IsRef)(type) || (0, kind_1.IsRef)(key)) {
        const error = `Index types using Ref parameters require both Type and Key to be of TSchema`;
        if (!(0, kind_1.IsSchema)(type) || !(0, kind_1.IsSchema)(key))
          throw new index_1.TypeBoxError(error);
        return (0, index_2.Computed)("Index", [type, key]);
      }
      if ((0, kind_1.IsMappedResult)(key))
        return (0, indexed_from_mapped_result_1.IndexFromMappedResult)(type, key, options);
      if ((0, kind_1.IsMappedKey)(key))
        return (0, indexed_from_mapped_key_1.IndexFromMappedKey)(type, key, options);
      return (0, type_1.CreateType)((0, kind_1.IsSchema)(key) ? FromSchema(type, (0, indexed_property_keys_1.IndexPropertyKeys)(key)) : FromSchema(type, key), options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/indexed-from-mapped-key.js
var require_indexed_from_mapped_key = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/indexed-from-mapped-key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexFromMappedKey = IndexFromMappedKey;
    var indexed_1 = require_indexed();
    var index_1 = require_mapped2();
    var value_1 = require_value2();
    function MappedIndexPropertyKey(type, key, options) {
      return { [key]: (0, indexed_1.Index)(type, [key], (0, value_1.Clone)(options)) };
    }
    function MappedIndexPropertyKeys(type, propertyKeys, options) {
      return propertyKeys.reduce((result, left) => {
        return { ...result, ...MappedIndexPropertyKey(type, left, options) };
      }, {});
    }
    function MappedIndexProperties(type, mappedKey, options) {
      return MappedIndexPropertyKeys(type, mappedKey.keys, options);
    }
    function IndexFromMappedKey(type, mappedKey, options) {
      const properties = MappedIndexProperties(type, mappedKey, options);
      return (0, index_1.MappedResult)(properties);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/index.js
var require_indexed2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/indexed/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_indexed_from_mapped_key(), exports);
    __exportStar(require_indexed_from_mapped_result(), exports);
    __exportStar(require_indexed_property_keys(), exports);
    __exportStar(require_indexed(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/iterator/iterator.js
var require_iterator = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/iterator/iterator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Iterator = Iterator;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Iterator(items, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Iterator", type: "Iterator", items }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/iterator/index.js
var require_iterator2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/iterator/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_iterator(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/object/object.js
var require_object = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/object/object.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Object = void 0;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    var kind_1 = require_kind();
    function RequiredArray(properties) {
      return globalThis.Object.keys(properties).filter((key) => !(0, kind_1.IsOptional)(properties[key]));
    }
    function _Object(properties, options) {
      const required = RequiredArray(properties);
      const schema = required.length > 0 ? { [index_1.Kind]: "Object", type: "object", required, properties } : { [index_1.Kind]: "Object", type: "object", properties };
      return (0, type_1.CreateType)(schema, options);
    }
    exports.Object = _Object;
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/object/index.js
var require_object2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/object/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_object(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/promise/promise.js
var require_promise = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/promise/promise.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Promise = Promise2;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Promise2(item, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Promise", type: "Promise", item }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/promise/index.js
var require_promise2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/promise/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_promise(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly/readonly.js
var require_readonly = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly/readonly.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Readonly = Readonly;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    var index_2 = require_discard2();
    var readonly_from_mapped_result_1 = require_readonly_from_mapped_result();
    var kind_1 = require_kind();
    function RemoveReadonly(schema) {
      return (0, type_1.CreateType)((0, index_2.Discard)(schema, [index_1.ReadonlyKind]));
    }
    function AddReadonly(schema) {
      return (0, type_1.CreateType)({ ...schema, [index_1.ReadonlyKind]: "Readonly" });
    }
    function ReadonlyWithFlag(schema, F) {
      return F === false ? RemoveReadonly(schema) : AddReadonly(schema);
    }
    function Readonly(schema, enable) {
      const F = enable ?? true;
      return (0, kind_1.IsMappedResult)(schema) ? (0, readonly_from_mapped_result_1.ReadonlyFromMappedResult)(schema, F) : ReadonlyWithFlag(schema, F);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly/readonly-from-mapped-result.js
var require_readonly_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly/readonly-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReadonlyFromMappedResult = ReadonlyFromMappedResult;
    var index_1 = require_mapped2();
    var readonly_1 = require_readonly();
    function FromProperties(K, F) {
      const Acc = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(K))
        Acc[K2] = (0, readonly_1.Readonly)(K[K2], F);
      return Acc;
    }
    function FromMappedResult(R, F) {
      return FromProperties(R.properties, F);
    }
    function ReadonlyFromMappedResult(R, F) {
      const P = FromMappedResult(R, F);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly/index.js
var require_readonly2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_readonly_from_mapped_result(), exports);
    __exportStar(require_readonly(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/tuple/tuple.js
var require_tuple = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/tuple/tuple.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Tuple = Tuple;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Tuple(types, options) {
      return (0, type_1.CreateType)(types.length > 0 ? { [index_1.Kind]: "Tuple", type: "array", items: types, additionalItems: false, minItems: types.length, maxItems: types.length } : { [index_1.Kind]: "Tuple", type: "array", minItems: types.length, maxItems: types.length }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/tuple/index.js
var require_tuple2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/tuple/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_tuple(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/mapped/mapped.js
var require_mapped = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/mapped/mapped.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MappedFunctionReturnType = MappedFunctionReturnType;
    exports.Mapped = Mapped;
    var index_1 = require_symbols2();
    var index_2 = require_discard2();
    var index_3 = require_array2();
    var index_4 = require_async_iterator2();
    var index_5 = require_constructor2();
    var index_6 = require_function2();
    var index_7 = require_indexed2();
    var index_8 = require_intersect2();
    var index_9 = require_iterator2();
    var index_10 = require_literal2();
    var index_11 = require_object2();
    var index_12 = require_optional2();
    var index_13 = require_promise2();
    var index_14 = require_readonly2();
    var index_15 = require_tuple2();
    var index_16 = require_union2();
    var index_17 = require_sets();
    var mapped_result_1 = require_mapped_result();
    var kind_1 = require_kind();
    function FromMappedResult(K, P) {
      return K in P ? FromSchemaType(K, P[K]) : (0, mapped_result_1.MappedResult)(P);
    }
    function MappedKeyToKnownMappedResultProperties(K) {
      return { [K]: (0, index_10.Literal)(K) };
    }
    function MappedKeyToUnknownMappedResultProperties(P) {
      const Acc = {};
      for (const L of P)
        Acc[L] = (0, index_10.Literal)(L);
      return Acc;
    }
    function MappedKeyToMappedResultProperties(K, P) {
      return (0, index_17.SetIncludes)(P, K) ? MappedKeyToKnownMappedResultProperties(K) : MappedKeyToUnknownMappedResultProperties(P);
    }
    function FromMappedKey(K, P) {
      const R = MappedKeyToMappedResultProperties(K, P);
      return FromMappedResult(K, R);
    }
    function FromRest(K, T) {
      return T.map((L) => FromSchemaType(K, L));
    }
    function FromProperties(K, T) {
      const Acc = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(T))
        Acc[K2] = FromSchemaType(K, T[K2]);
      return Acc;
    }
    function FromSchemaType(K, T) {
      const options = { ...T };
      return (
        // unevaluated modifier types
        (0, kind_1.IsOptional)(T) ? (0, index_12.Optional)(FromSchemaType(K, (0, index_2.Discard)(T, [index_1.OptionalKind]))) : (0, kind_1.IsReadonly)(T) ? (0, index_14.Readonly)(FromSchemaType(K, (0, index_2.Discard)(T, [index_1.ReadonlyKind]))) : (
          // unevaluated mapped types
          (0, kind_1.IsMappedResult)(T) ? FromMappedResult(K, T.properties) : (0, kind_1.IsMappedKey)(T) ? FromMappedKey(K, T.keys) : (
            // unevaluated types
            (0, kind_1.IsConstructor)(T) ? (0, index_5.Constructor)(FromRest(K, T.parameters), FromSchemaType(K, T.returns), options) : (0, kind_1.IsFunction)(T) ? (0, index_6.Function)(FromRest(K, T.parameters), FromSchemaType(K, T.returns), options) : (0, kind_1.IsAsyncIterator)(T) ? (0, index_4.AsyncIterator)(FromSchemaType(K, T.items), options) : (0, kind_1.IsIterator)(T) ? (0, index_9.Iterator)(FromSchemaType(K, T.items), options) : (0, kind_1.IsIntersect)(T) ? (0, index_8.Intersect)(FromRest(K, T.allOf), options) : (0, kind_1.IsUnion)(T) ? (0, index_16.Union)(FromRest(K, T.anyOf), options) : (0, kind_1.IsTuple)(T) ? (0, index_15.Tuple)(FromRest(K, T.items ?? []), options) : (0, kind_1.IsObject)(T) ? (0, index_11.Object)(FromProperties(K, T.properties), options) : (0, kind_1.IsArray)(T) ? (0, index_3.Array)(FromSchemaType(K, T.items), options) : (0, kind_1.IsPromise)(T) ? (0, index_13.Promise)(FromSchemaType(K, T.item), options) : T
          )
        )
      );
    }
    function MappedFunctionReturnType(K, T) {
      const Acc = {};
      for (const L of K)
        Acc[L] = FromSchemaType(L, T);
      return Acc;
    }
    function Mapped(key, map, options) {
      const K = (0, kind_1.IsSchema)(key) ? (0, index_7.IndexPropertyKeys)(key) : key;
      const RT = map({ [index_1.Kind]: "MappedKey", keys: K });
      const R = MappedFunctionReturnType(K, RT);
      return (0, index_11.Object)(R, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/mapped/index.js
var require_mapped2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/mapped/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_mapped_key(), exports);
    __exportStar(require_mapped_result(), exports);
    __exportStar(require_mapped(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/optional/optional.js
var require_optional = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/optional/optional.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Optional = Optional;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    var index_2 = require_discard2();
    var optional_from_mapped_result_1 = require_optional_from_mapped_result();
    var kind_1 = require_kind();
    function RemoveOptional(schema) {
      return (0, type_1.CreateType)((0, index_2.Discard)(schema, [index_1.OptionalKind]));
    }
    function AddOptional(schema) {
      return (0, type_1.CreateType)({ ...schema, [index_1.OptionalKind]: "Optional" });
    }
    function OptionalWithFlag(schema, F) {
      return F === false ? RemoveOptional(schema) : AddOptional(schema);
    }
    function Optional(schema, enable) {
      const F = enable ?? true;
      return (0, kind_1.IsMappedResult)(schema) ? (0, optional_from_mapped_result_1.OptionalFromMappedResult)(schema, F) : OptionalWithFlag(schema, F);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/optional/optional-from-mapped-result.js
var require_optional_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/optional/optional-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OptionalFromMappedResult = OptionalFromMappedResult;
    var index_1 = require_mapped2();
    var optional_1 = require_optional();
    function FromProperties(P, F) {
      const Acc = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(P))
        Acc[K2] = (0, optional_1.Optional)(P[K2], F);
      return Acc;
    }
    function FromMappedResult(R, F) {
      return FromProperties(R.properties, F);
    }
    function OptionalFromMappedResult(R, F) {
      const P = FromMappedResult(R, F);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/optional/index.js
var require_optional2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/optional/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_optional_from_mapped_result(), exports);
    __exportStar(require_optional(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/intersect-create.js
var require_intersect_create = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/intersect-create.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntersectCreate = IntersectCreate;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    var kind_1 = require_kind();
    function IntersectCreate(T, options = {}) {
      const allObjects = T.every((schema) => (0, kind_1.IsObject)(schema));
      const clonedUnevaluatedProperties = (0, kind_1.IsSchema)(options.unevaluatedProperties) ? { unevaluatedProperties: options.unevaluatedProperties } : {};
      return (0, type_1.CreateType)(options.unevaluatedProperties === false || (0, kind_1.IsSchema)(options.unevaluatedProperties) || allObjects ? { ...clonedUnevaluatedProperties, [index_1.Kind]: "Intersect", type: "object", allOf: T } : { ...clonedUnevaluatedProperties, [index_1.Kind]: "Intersect", allOf: T }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/intersect-evaluated.js
var require_intersect_evaluated = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/intersect-evaluated.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntersectEvaluated = IntersectEvaluated;
    var index_1 = require_symbols2();
    var type_1 = require_type2();
    var index_2 = require_discard2();
    var index_3 = require_never2();
    var index_4 = require_optional2();
    var intersect_create_1 = require_intersect_create();
    var kind_1 = require_kind();
    function IsIntersectOptional(types) {
      return types.every((left) => (0, kind_1.IsOptional)(left));
    }
    function RemoveOptionalFromType(type) {
      return (0, index_2.Discard)(type, [index_1.OptionalKind]);
    }
    function RemoveOptionalFromRest(types) {
      return types.map((left) => (0, kind_1.IsOptional)(left) ? RemoveOptionalFromType(left) : left);
    }
    function ResolveIntersect(types, options) {
      return IsIntersectOptional(types) ? (0, index_4.Optional)((0, intersect_create_1.IntersectCreate)(RemoveOptionalFromRest(types), options)) : (0, intersect_create_1.IntersectCreate)(RemoveOptionalFromRest(types), options);
    }
    function IntersectEvaluated(types, options = {}) {
      if (types.length === 1)
        return (0, type_1.CreateType)(types[0], options);
      if (types.length === 0)
        return (0, index_3.Never)(options);
      if (types.some((schema) => (0, kind_1.IsTransform)(schema)))
        throw new Error("Cannot intersect transform types");
      return ResolveIntersect(types, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/intersect-type.js
var require_intersect_type = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/intersect-type.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var index_1 = require_symbols2();
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/intersect.js
var require_intersect = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/intersect.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Intersect = Intersect;
    var type_1 = require_type2();
    var index_1 = require_never2();
    var intersect_create_1 = require_intersect_create();
    var kind_1 = require_kind();
    function Intersect(types, options) {
      if (types.length === 1)
        return (0, type_1.CreateType)(types[0], options);
      if (types.length === 0)
        return (0, index_1.Never)(options);
      if (types.some((schema) => (0, kind_1.IsTransform)(schema)))
        throw new Error("Cannot intersect transform types");
      return (0, intersect_create_1.IntersectCreate)(types, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/index.js
var require_intersect2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intersect/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_intersect_evaluated(), exports);
    __exportStar(require_intersect_type(), exports);
    __exportStar(require_intersect(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/ref/ref.js
var require_ref = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/ref/ref.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Ref = Ref;
    var index_1 = require_error2();
    var type_1 = require_type2();
    var index_2 = require_symbols2();
    function Ref(...args) {
      const [$ref, options] = typeof args[0] === "string" ? [args[0], args[1]] : [args[0].$id, args[1]];
      if (typeof $ref !== "string")
        throw new index_1.TypeBoxError("Ref: $ref must be a string");
      return (0, type_1.CreateType)({ [index_2.Kind]: "Ref", $ref }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/ref/index.js
var require_ref2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/ref/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_ref(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/awaited/awaited.js
var require_awaited = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/awaited/awaited.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Awaited = Awaited;
    var type_1 = require_type2();
    var index_1 = require_computed2();
    var index_2 = require_intersect2();
    var index_3 = require_union2();
    var index_4 = require_ref2();
    var kind_1 = require_kind();
    function FromComputed(target, parameters) {
      return (0, index_1.Computed)("Awaited", [(0, index_1.Computed)(target, parameters)]);
    }
    function FromRef($ref) {
      return (0, index_1.Computed)("Awaited", [(0, index_4.Ref)($ref)]);
    }
    function FromIntersect(types) {
      return (0, index_2.Intersect)(FromRest(types));
    }
    function FromUnion(types) {
      return (0, index_3.Union)(FromRest(types));
    }
    function FromPromise(type) {
      return Awaited(type);
    }
    function FromRest(types) {
      return types.map((type) => Awaited(type));
    }
    function Awaited(type, options) {
      return (0, type_1.CreateType)((0, kind_1.IsComputed)(type) ? FromComputed(type.target, type.parameters) : (0, kind_1.IsIntersect)(type) ? FromIntersect(type.allOf) : (0, kind_1.IsUnion)(type) ? FromUnion(type.anyOf) : (0, kind_1.IsPromise)(type) ? FromPromise(type.item) : (0, kind_1.IsRef)(type) ? FromRef(type.$ref) : type, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/awaited/index.js
var require_awaited2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/awaited/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_awaited(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/keyof-property-keys.js
var require_keyof_property_keys = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/keyof-property-keys.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyOfPropertyKeys = KeyOfPropertyKeys;
    exports.KeyOfPattern = KeyOfPattern;
    var index_1 = require_sets();
    var kind_1 = require_kind();
    function FromRest(types) {
      const result = [];
      for (const L of types)
        result.push(KeyOfPropertyKeys(L));
      return result;
    }
    function FromIntersect(types) {
      const propertyKeysArray = FromRest(types);
      const propertyKeys = (0, index_1.SetUnionMany)(propertyKeysArray);
      return propertyKeys;
    }
    function FromUnion(types) {
      const propertyKeysArray = FromRest(types);
      const propertyKeys = (0, index_1.SetIntersectMany)(propertyKeysArray);
      return propertyKeys;
    }
    function FromTuple(types) {
      return types.map((_, indexer) => indexer.toString());
    }
    function FromArray(_) {
      return ["[number]"];
    }
    function FromProperties(T) {
      return globalThis.Object.getOwnPropertyNames(T);
    }
    function FromPatternProperties(patternProperties) {
      if (!includePatternProperties)
        return [];
      const patternPropertyKeys = globalThis.Object.getOwnPropertyNames(patternProperties);
      return patternPropertyKeys.map((key) => {
        return key[0] === "^" && key[key.length - 1] === "$" ? key.slice(1, key.length - 1) : key;
      });
    }
    function KeyOfPropertyKeys(type) {
      return (0, kind_1.IsIntersect)(type) ? FromIntersect(type.allOf) : (0, kind_1.IsUnion)(type) ? FromUnion(type.anyOf) : (0, kind_1.IsTuple)(type) ? FromTuple(type.items ?? []) : (0, kind_1.IsArray)(type) ? FromArray(type.items) : (0, kind_1.IsObject)(type) ? FromProperties(type.properties) : (0, kind_1.IsRecord)(type) ? FromPatternProperties(type.patternProperties) : [];
    }
    var includePatternProperties = false;
    function KeyOfPattern(schema) {
      includePatternProperties = true;
      const keys = KeyOfPropertyKeys(schema);
      includePatternProperties = false;
      const pattern = keys.map((key) => `(${key})`);
      return `^(${pattern.join("|")})$`;
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/keyof.js
var require_keyof = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/keyof.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyOfPropertyKeysToRest = KeyOfPropertyKeysToRest;
    exports.KeyOf = KeyOf;
    var type_1 = require_type2();
    var index_1 = require_literal2();
    var index_2 = require_number2();
    var index_3 = require_computed2();
    var index_4 = require_ref2();
    var keyof_property_keys_1 = require_keyof_property_keys();
    var index_5 = require_union2();
    var keyof_from_mapped_result_1 = require_keyof_from_mapped_result();
    var kind_1 = require_kind();
    function FromComputed(target, parameters) {
      return (0, index_3.Computed)("KeyOf", [(0, index_3.Computed)(target, parameters)]);
    }
    function FromRef($ref) {
      return (0, index_3.Computed)("KeyOf", [(0, index_4.Ref)($ref)]);
    }
    function KeyOfFromType(type, options) {
      const propertyKeys = (0, keyof_property_keys_1.KeyOfPropertyKeys)(type);
      const propertyKeyTypes = KeyOfPropertyKeysToRest(propertyKeys);
      const result = (0, index_5.UnionEvaluated)(propertyKeyTypes);
      return (0, type_1.CreateType)(result, options);
    }
    function KeyOfPropertyKeysToRest(propertyKeys) {
      return propertyKeys.map((L) => L === "[number]" ? (0, index_2.Number)() : (0, index_1.Literal)(L));
    }
    function KeyOf(type, options) {
      return (0, kind_1.IsComputed)(type) ? FromComputed(type.target, type.parameters) : (0, kind_1.IsRef)(type) ? FromRef(type.$ref) : (0, kind_1.IsMappedResult)(type) ? (0, keyof_from_mapped_result_1.KeyOfFromMappedResult)(type, options) : KeyOfFromType(type, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/keyof-from-mapped-result.js
var require_keyof_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/keyof-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyOfFromMappedResult = KeyOfFromMappedResult;
    var index_1 = require_mapped2();
    var keyof_1 = require_keyof();
    var value_1 = require_value2();
    function FromProperties(properties, options) {
      const result = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
        result[K2] = (0, keyof_1.KeyOf)(properties[K2], (0, value_1.Clone)(options));
      return result;
    }
    function FromMappedResult(mappedResult, options) {
      return FromProperties(mappedResult.properties, options);
    }
    function KeyOfFromMappedResult(mappedResult, options) {
      const properties = FromMappedResult(mappedResult, options);
      return (0, index_1.MappedResult)(properties);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/keyof-property-entries.js
var require_keyof_property_entries = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/keyof-property-entries.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyOfPropertyEntries = KeyOfPropertyEntries;
    var indexed_1 = require_indexed();
    var keyof_property_keys_1 = require_keyof_property_keys();
    function KeyOfPropertyEntries(schema) {
      const keys = (0, keyof_property_keys_1.KeyOfPropertyKeys)(schema);
      const schemas = (0, indexed_1.IndexFromPropertyKeys)(schema, keys);
      return keys.map((_, index) => [keys[index], schemas[index]]);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/index.js
var require_keyof2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/keyof/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_keyof_from_mapped_result(), exports);
    __exportStar(require_keyof_property_entries(), exports);
    __exportStar(require_keyof_property_keys(), exports);
    __exportStar(require_keyof(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/composite/composite.js
var require_composite = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/composite/composite.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Composite = Composite;
    var index_1 = require_intersect2();
    var index_2 = require_indexed2();
    var index_3 = require_keyof2();
    var index_4 = require_object2();
    var index_5 = require_sets();
    var kind_1 = require_kind();
    function CompositeKeys(T) {
      const Acc = [];
      for (const L of T)
        Acc.push(...(0, index_3.KeyOfPropertyKeys)(L));
      return (0, index_5.SetDistinct)(Acc);
    }
    function FilterNever(T) {
      return T.filter((L) => !(0, kind_1.IsNever)(L));
    }
    function CompositeProperty(T, K) {
      const Acc = [];
      for (const L of T)
        Acc.push(...(0, index_2.IndexFromPropertyKeys)(L, [K]));
      return FilterNever(Acc);
    }
    function CompositeProperties(T, K) {
      const Acc = {};
      for (const L of K) {
        Acc[L] = (0, index_1.IntersectEvaluated)(CompositeProperty(T, L));
      }
      return Acc;
    }
    function Composite(T, options) {
      const K = CompositeKeys(T);
      const P = CompositeProperties(T, K);
      const R = (0, index_4.Object)(P, options);
      return R;
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/composite/index.js
var require_composite2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/composite/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_composite(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/date/date.js
var require_date = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/date/date.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Date = Date2;
    var index_1 = require_symbols2();
    var type_1 = require_type2();
    function Date2(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Date", type: "Date" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/date/index.js
var require_date2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/date/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_date(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/null/null.js
var require_null = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/null/null.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Null = Null;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Null(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Null", type: "null" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/null/index.js
var require_null2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/null/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_null(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/symbol/symbol.js
var require_symbol = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/symbol/symbol.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Symbol = Symbol2;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Symbol2(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Symbol", type: "symbol" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/symbol/index.js
var require_symbol2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/symbol/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_symbol(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/undefined/undefined.js
var require_undefined = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/undefined/undefined.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Undefined = Undefined;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Undefined(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Undefined", type: "undefined" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/undefined/index.js
var require_undefined2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/undefined/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_undefined(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/uint8array/uint8array.js
var require_uint8array = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/uint8array/uint8array.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Uint8Array = Uint8Array2;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Uint8Array2(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Uint8Array", type: "Uint8Array" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/uint8array/index.js
var require_uint8array2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/uint8array/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_uint8array(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/unknown/unknown.js
var require_unknown = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/unknown/unknown.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Unknown = Unknown;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Unknown(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Unknown" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/unknown/index.js
var require_unknown2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/unknown/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_unknown(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/const/const.js
var require_const = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/const/const.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Const = Const;
    var index_1 = require_any2();
    var index_2 = require_bigint2();
    var index_3 = require_date2();
    var index_4 = require_function2();
    var index_5 = require_literal2();
    var index_6 = require_null2();
    var index_7 = require_object2();
    var index_8 = require_symbol2();
    var index_9 = require_tuple2();
    var index_10 = require_readonly2();
    var index_11 = require_undefined2();
    var index_12 = require_uint8array2();
    var index_13 = require_unknown2();
    var index_14 = require_create();
    var value_1 = require_value();
    function FromArray(T) {
      return T.map((L) => FromValue(L, false));
    }
    function FromProperties(value) {
      const Acc = {};
      for (const K of globalThis.Object.getOwnPropertyNames(value))
        Acc[K] = (0, index_10.Readonly)(FromValue(value[K], false));
      return Acc;
    }
    function ConditionalReadonly(T, root) {
      return root === true ? T : (0, index_10.Readonly)(T);
    }
    function FromValue(value, root) {
      return (0, value_1.IsAsyncIterator)(value) ? ConditionalReadonly((0, index_1.Any)(), root) : (0, value_1.IsIterator)(value) ? ConditionalReadonly((0, index_1.Any)(), root) : (0, value_1.IsArray)(value) ? (0, index_10.Readonly)((0, index_9.Tuple)(FromArray(value))) : (0, value_1.IsUint8Array)(value) ? (0, index_12.Uint8Array)() : (0, value_1.IsDate)(value) ? (0, index_3.Date)() : (0, value_1.IsObject)(value) ? ConditionalReadonly((0, index_7.Object)(FromProperties(value)), root) : (0, value_1.IsFunction)(value) ? ConditionalReadonly((0, index_4.Function)([], (0, index_13.Unknown)()), root) : (0, value_1.IsUndefined)(value) ? (0, index_11.Undefined)() : (0, value_1.IsNull)(value) ? (0, index_6.Null)() : (0, value_1.IsSymbol)(value) ? (0, index_8.Symbol)() : (0, value_1.IsBigInt)(value) ? (0, index_2.BigInt)() : (0, value_1.IsNumber)(value) ? (0, index_5.Literal)(value) : (0, value_1.IsBoolean)(value) ? (0, index_5.Literal)(value) : (0, value_1.IsString)(value) ? (0, index_5.Literal)(value) : (0, index_7.Object)({});
    }
    function Const(T, options) {
      return (0, index_14.CreateType)(FromValue(T, true), options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/const/index.js
var require_const2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/const/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_const(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/constructor-parameters/constructor-parameters.js
var require_constructor_parameters = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/constructor-parameters/constructor-parameters.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConstructorParameters = ConstructorParameters;
    var index_1 = require_tuple2();
    var index_2 = require_never2();
    var KindGuard = __importStar(require_kind());
    function ConstructorParameters(schema, options) {
      return KindGuard.IsConstructor(schema) ? (0, index_1.Tuple)(schema.parameters, options) : (0, index_2.Never)(options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/constructor-parameters/index.js
var require_constructor_parameters2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/constructor-parameters/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_constructor_parameters(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/enum/enum.js
var require_enum = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/enum/enum.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Enum = Enum;
    var index_1 = require_literal2();
    var index_2 = require_symbols2();
    var index_3 = require_union2();
    var value_1 = require_value();
    function Enum(item, options) {
      if ((0, value_1.IsUndefined)(item))
        throw new Error("Enum undefined or empty");
      const values1 = globalThis.Object.getOwnPropertyNames(item).filter((key) => isNaN(key)).map((key) => item[key]);
      const values2 = [...new Set(values1)];
      const anyOf = values2.map((value) => (0, index_1.Literal)(value));
      return (0, index_3.Union)(anyOf, { ...options, [index_2.Hint]: "Enum" });
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/enum/index.js
var require_enum2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/enum/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_enum(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends-check.js
var require_extends_check = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends-check.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtendsResult = exports.ExtendsResolverError = void 0;
    exports.ExtendsCheck = ExtendsCheck;
    var index_1 = require_any2();
    var index_2 = require_function2();
    var index_3 = require_number2();
    var index_4 = require_string2();
    var index_5 = require_unknown2();
    var index_6 = require_template_literal2();
    var index_7 = require_patterns2();
    var index_8 = require_symbols2();
    var index_9 = require_error2();
    var index_10 = require_guard3();
    var ExtendsResolverError = class extends index_9.TypeBoxError {
    };
    exports.ExtendsResolverError = ExtendsResolverError;
    var ExtendsResult;
    (function(ExtendsResult2) {
      ExtendsResult2[ExtendsResult2["Union"] = 0] = "Union";
      ExtendsResult2[ExtendsResult2["True"] = 1] = "True";
      ExtendsResult2[ExtendsResult2["False"] = 2] = "False";
    })(ExtendsResult || (exports.ExtendsResult = ExtendsResult = {}));
    function IntoBooleanResult(result) {
      return result === ExtendsResult.False ? result : ExtendsResult.True;
    }
    function Throw(message) {
      throw new ExtendsResolverError(message);
    }
    function IsStructuralRight(right) {
      return index_10.TypeGuard.IsNever(right) || index_10.TypeGuard.IsIntersect(right) || index_10.TypeGuard.IsUnion(right) || index_10.TypeGuard.IsUnknown(right) || index_10.TypeGuard.IsAny(right);
    }
    function StructuralRight(left, right) {
      return index_10.TypeGuard.IsNever(right) ? FromNeverRight(left, right) : index_10.TypeGuard.IsIntersect(right) ? FromIntersectRight(left, right) : index_10.TypeGuard.IsUnion(right) ? FromUnionRight(left, right) : index_10.TypeGuard.IsUnknown(right) ? FromUnknownRight(left, right) : index_10.TypeGuard.IsAny(right) ? FromAnyRight(left, right) : Throw("StructuralRight");
    }
    function FromAnyRight(left, right) {
      return ExtendsResult.True;
    }
    function FromAny(left, right) {
      return index_10.TypeGuard.IsIntersect(right) ? FromIntersectRight(left, right) : index_10.TypeGuard.IsUnion(right) && right.anyOf.some((schema) => index_10.TypeGuard.IsAny(schema) || index_10.TypeGuard.IsUnknown(schema)) ? ExtendsResult.True : index_10.TypeGuard.IsUnion(right) ? ExtendsResult.Union : index_10.TypeGuard.IsUnknown(right) ? ExtendsResult.True : index_10.TypeGuard.IsAny(right) ? ExtendsResult.True : ExtendsResult.Union;
    }
    function FromArrayRight(left, right) {
      return index_10.TypeGuard.IsUnknown(left) ? ExtendsResult.False : index_10.TypeGuard.IsAny(left) ? ExtendsResult.Union : index_10.TypeGuard.IsNever(left) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromArray(left, right) {
      return index_10.TypeGuard.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : !index_10.TypeGuard.IsArray(right) ? ExtendsResult.False : IntoBooleanResult(Visit(left.items, right.items));
    }
    function FromAsyncIterator(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : !index_10.TypeGuard.IsAsyncIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit(left.items, right.items));
    }
    function FromBigInt(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsBigInt(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromBooleanRight(left, right) {
      return index_10.TypeGuard.IsLiteralBoolean(left) ? ExtendsResult.True : index_10.TypeGuard.IsBoolean(left) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromBoolean(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsBoolean(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromConstructor(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : !index_10.TypeGuard.IsConstructor(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit(left.returns, right.returns));
    }
    function FromDate(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsDate(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromFunction(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : !index_10.TypeGuard.IsFunction(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit(left.returns, right.returns));
    }
    function FromIntegerRight(left, right) {
      return index_10.TypeGuard.IsLiteral(left) && index_10.ValueGuard.IsNumber(left.const) ? ExtendsResult.True : index_10.TypeGuard.IsNumber(left) || index_10.TypeGuard.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromInteger(left, right) {
      return index_10.TypeGuard.IsInteger(right) || index_10.TypeGuard.IsNumber(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : ExtendsResult.False;
    }
    function FromIntersectRight(left, right) {
      return right.allOf.every((schema) => Visit(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromIntersect(left, right) {
      return left.allOf.some((schema) => Visit(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromIterator(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : !index_10.TypeGuard.IsIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit(left.items, right.items));
    }
    function FromLiteral(left, right) {
      return index_10.TypeGuard.IsLiteral(right) && right.const === left.const ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsString(right) ? FromStringRight(left, right) : index_10.TypeGuard.IsNumber(right) ? FromNumberRight(left, right) : index_10.TypeGuard.IsInteger(right) ? FromIntegerRight(left, right) : index_10.TypeGuard.IsBoolean(right) ? FromBooleanRight(left, right) : ExtendsResult.False;
    }
    function FromNeverRight(left, right) {
      return ExtendsResult.False;
    }
    function FromNever(left, right) {
      return ExtendsResult.True;
    }
    function UnwrapTNot(schema) {
      let [current, depth] = [schema, 0];
      while (true) {
        if (!index_10.TypeGuard.IsNot(current))
          break;
        current = current.not;
        depth += 1;
      }
      return depth % 2 === 0 ? current : (0, index_5.Unknown)();
    }
    function FromNot(left, right) {
      return index_10.TypeGuard.IsNot(left) ? Visit(UnwrapTNot(left), right) : index_10.TypeGuard.IsNot(right) ? Visit(left, UnwrapTNot(right)) : Throw("Invalid fallthrough for Not");
    }
    function FromNull(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsNull(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromNumberRight(left, right) {
      return index_10.TypeGuard.IsLiteralNumber(left) ? ExtendsResult.True : index_10.TypeGuard.IsNumber(left) || index_10.TypeGuard.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromNumber(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsInteger(right) || index_10.TypeGuard.IsNumber(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function IsObjectPropertyCount(schema, count) {
      return Object.getOwnPropertyNames(schema.properties).length === count;
    }
    function IsObjectStringLike(schema) {
      return IsObjectArrayLike(schema);
    }
    function IsObjectSymbolLike(schema) {
      return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && index_10.TypeGuard.IsUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (index_10.TypeGuard.IsString(schema.properties.description.anyOf[0]) && index_10.TypeGuard.IsUndefined(schema.properties.description.anyOf[1]) || index_10.TypeGuard.IsString(schema.properties.description.anyOf[1]) && index_10.TypeGuard.IsUndefined(schema.properties.description.anyOf[0]));
    }
    function IsObjectNumberLike(schema) {
      return IsObjectPropertyCount(schema, 0);
    }
    function IsObjectBooleanLike(schema) {
      return IsObjectPropertyCount(schema, 0);
    }
    function IsObjectBigIntLike(schema) {
      return IsObjectPropertyCount(schema, 0);
    }
    function IsObjectDateLike(schema) {
      return IsObjectPropertyCount(schema, 0);
    }
    function IsObjectUint8ArrayLike(schema) {
      return IsObjectArrayLike(schema);
    }
    function IsObjectFunctionLike(schema) {
      const length = (0, index_3.Number)();
      return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit(schema.properties["length"], length)) === ExtendsResult.True;
    }
    function IsObjectConstructorLike(schema) {
      return IsObjectPropertyCount(schema, 0);
    }
    function IsObjectArrayLike(schema) {
      const length = (0, index_3.Number)();
      return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit(schema.properties["length"], length)) === ExtendsResult.True;
    }
    function IsObjectPromiseLike(schema) {
      const then = (0, index_2.Function)([(0, index_1.Any)()], (0, index_1.Any)());
      return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "then" in schema.properties && IntoBooleanResult(Visit(schema.properties["then"], then)) === ExtendsResult.True;
    }
    function Property(left, right) {
      return Visit(left, right) === ExtendsResult.False ? ExtendsResult.False : index_10.TypeGuard.IsOptional(left) && !index_10.TypeGuard.IsOptional(right) ? ExtendsResult.False : ExtendsResult.True;
    }
    function FromObjectRight(left, right) {
      return index_10.TypeGuard.IsUnknown(left) ? ExtendsResult.False : index_10.TypeGuard.IsAny(left) ? ExtendsResult.Union : index_10.TypeGuard.IsNever(left) || index_10.TypeGuard.IsLiteralString(left) && IsObjectStringLike(right) || index_10.TypeGuard.IsLiteralNumber(left) && IsObjectNumberLike(right) || index_10.TypeGuard.IsLiteralBoolean(left) && IsObjectBooleanLike(right) || index_10.TypeGuard.IsSymbol(left) && IsObjectSymbolLike(right) || index_10.TypeGuard.IsBigInt(left) && IsObjectBigIntLike(right) || index_10.TypeGuard.IsString(left) && IsObjectStringLike(right) || index_10.TypeGuard.IsSymbol(left) && IsObjectSymbolLike(right) || index_10.TypeGuard.IsNumber(left) && IsObjectNumberLike(right) || index_10.TypeGuard.IsInteger(left) && IsObjectNumberLike(right) || index_10.TypeGuard.IsBoolean(left) && IsObjectBooleanLike(right) || index_10.TypeGuard.IsUint8Array(left) && IsObjectUint8ArrayLike(right) || index_10.TypeGuard.IsDate(left) && IsObjectDateLike(right) || index_10.TypeGuard.IsConstructor(left) && IsObjectConstructorLike(right) || index_10.TypeGuard.IsFunction(left) && IsObjectFunctionLike(right) ? ExtendsResult.True : index_10.TypeGuard.IsRecord(left) && index_10.TypeGuard.IsString(RecordKey(left)) ? (() => {
        return right[index_8.Hint] === "Record" ? ExtendsResult.True : ExtendsResult.False;
      })() : index_10.TypeGuard.IsRecord(left) && index_10.TypeGuard.IsNumber(RecordKey(left)) ? (() => {
        return IsObjectPropertyCount(right, 0) ? ExtendsResult.True : ExtendsResult.False;
      })() : ExtendsResult.False;
    }
    function FromObject(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : !index_10.TypeGuard.IsObject(right) ? ExtendsResult.False : (() => {
        for (const key of Object.getOwnPropertyNames(right.properties)) {
          if (!(key in left.properties) && !index_10.TypeGuard.IsOptional(right.properties[key])) {
            return ExtendsResult.False;
          }
          if (index_10.TypeGuard.IsOptional(right.properties[key])) {
            return ExtendsResult.True;
          }
          if (Property(left.properties[key], right.properties[key]) === ExtendsResult.False) {
            return ExtendsResult.False;
          }
        }
        return ExtendsResult.True;
      })();
    }
    function FromPromise(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) && IsObjectPromiseLike(right) ? ExtendsResult.True : !index_10.TypeGuard.IsPromise(right) ? ExtendsResult.False : IntoBooleanResult(Visit(left.item, right.item));
    }
    function RecordKey(schema) {
      return index_7.PatternNumberExact in schema.patternProperties ? (0, index_3.Number)() : index_7.PatternStringExact in schema.patternProperties ? (0, index_4.String)() : Throw("Unknown record key pattern");
    }
    function RecordValue(schema) {
      return index_7.PatternNumberExact in schema.patternProperties ? schema.patternProperties[index_7.PatternNumberExact] : index_7.PatternStringExact in schema.patternProperties ? schema.patternProperties[index_7.PatternStringExact] : Throw("Unable to get record value schema");
    }
    function FromRecordRight(left, right) {
      const [Key, Value] = [RecordKey(right), RecordValue(right)];
      return index_10.TypeGuard.IsLiteralString(left) && index_10.TypeGuard.IsNumber(Key) && IntoBooleanResult(Visit(left, Value)) === ExtendsResult.True ? ExtendsResult.True : index_10.TypeGuard.IsUint8Array(left) && index_10.TypeGuard.IsNumber(Key) ? Visit(left, Value) : index_10.TypeGuard.IsString(left) && index_10.TypeGuard.IsNumber(Key) ? Visit(left, Value) : index_10.TypeGuard.IsArray(left) && index_10.TypeGuard.IsNumber(Key) ? Visit(left, Value) : index_10.TypeGuard.IsObject(left) ? (() => {
        for (const key of Object.getOwnPropertyNames(left.properties)) {
          if (Property(Value, left.properties[key]) === ExtendsResult.False) {
            return ExtendsResult.False;
          }
        }
        return ExtendsResult.True;
      })() : ExtendsResult.False;
    }
    function FromRecord(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : !index_10.TypeGuard.IsRecord(right) ? ExtendsResult.False : Visit(RecordValue(left), RecordValue(right));
    }
    function FromRegExp(left, right) {
      const L = index_10.TypeGuard.IsRegExp(left) ? (0, index_4.String)() : left;
      const R = index_10.TypeGuard.IsRegExp(right) ? (0, index_4.String)() : right;
      return Visit(L, R);
    }
    function FromStringRight(left, right) {
      return index_10.TypeGuard.IsLiteral(left) && index_10.ValueGuard.IsString(left.const) ? ExtendsResult.True : index_10.TypeGuard.IsString(left) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromString(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsString(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromSymbol(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsSymbol(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromTemplateLiteral(left, right) {
      return index_10.TypeGuard.IsTemplateLiteral(left) ? Visit((0, index_6.TemplateLiteralToUnion)(left), right) : index_10.TypeGuard.IsTemplateLiteral(right) ? Visit(left, (0, index_6.TemplateLiteralToUnion)(right)) : Throw("Invalid fallthrough for TemplateLiteral");
    }
    function IsArrayOfTuple(left, right) {
      return index_10.TypeGuard.IsArray(right) && left.items !== void 0 && left.items.every((schema) => Visit(schema, right.items) === ExtendsResult.True);
    }
    function FromTupleRight(left, right) {
      return index_10.TypeGuard.IsNever(left) ? ExtendsResult.True : index_10.TypeGuard.IsUnknown(left) ? ExtendsResult.False : index_10.TypeGuard.IsAny(left) ? ExtendsResult.Union : ExtendsResult.False;
    }
    function FromTuple(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : index_10.TypeGuard.IsArray(right) && IsArrayOfTuple(left, right) ? ExtendsResult.True : !index_10.TypeGuard.IsTuple(right) ? ExtendsResult.False : index_10.ValueGuard.IsUndefined(left.items) && !index_10.ValueGuard.IsUndefined(right.items) || !index_10.ValueGuard.IsUndefined(left.items) && index_10.ValueGuard.IsUndefined(right.items) ? ExtendsResult.False : index_10.ValueGuard.IsUndefined(left.items) && !index_10.ValueGuard.IsUndefined(right.items) ? ExtendsResult.True : left.items.every((schema, index) => Visit(schema, right.items[index]) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromUint8Array(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsUint8Array(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromUndefined(left, right) {
      return IsStructuralRight(right) ? StructuralRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsRecord(right) ? FromRecordRight(left, right) : index_10.TypeGuard.IsVoid(right) ? FromVoidRight(left, right) : index_10.TypeGuard.IsUndefined(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromUnionRight(left, right) {
      return right.anyOf.some((schema) => Visit(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromUnion(left, right) {
      return left.anyOf.every((schema) => Visit(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromUnknownRight(left, right) {
      return ExtendsResult.True;
    }
    function FromUnknown(left, right) {
      return index_10.TypeGuard.IsNever(right) ? FromNeverRight(left, right) : index_10.TypeGuard.IsIntersect(right) ? FromIntersectRight(left, right) : index_10.TypeGuard.IsUnion(right) ? FromUnionRight(left, right) : index_10.TypeGuard.IsAny(right) ? FromAnyRight(left, right) : index_10.TypeGuard.IsString(right) ? FromStringRight(left, right) : index_10.TypeGuard.IsNumber(right) ? FromNumberRight(left, right) : index_10.TypeGuard.IsInteger(right) ? FromIntegerRight(left, right) : index_10.TypeGuard.IsBoolean(right) ? FromBooleanRight(left, right) : index_10.TypeGuard.IsArray(right) ? FromArrayRight(left, right) : index_10.TypeGuard.IsTuple(right) ? FromTupleRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsUnknown(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromVoidRight(left, right) {
      return index_10.TypeGuard.IsUndefined(left) ? ExtendsResult.True : index_10.TypeGuard.IsUndefined(left) ? ExtendsResult.True : ExtendsResult.False;
    }
    function FromVoid(left, right) {
      return index_10.TypeGuard.IsIntersect(right) ? FromIntersectRight(left, right) : index_10.TypeGuard.IsUnion(right) ? FromUnionRight(left, right) : index_10.TypeGuard.IsUnknown(right) ? FromUnknownRight(left, right) : index_10.TypeGuard.IsAny(right) ? FromAnyRight(left, right) : index_10.TypeGuard.IsObject(right) ? FromObjectRight(left, right) : index_10.TypeGuard.IsVoid(right) ? ExtendsResult.True : ExtendsResult.False;
    }
    function Visit(left, right) {
      return (
        // resolvable
        index_10.TypeGuard.IsTemplateLiteral(left) || index_10.TypeGuard.IsTemplateLiteral(right) ? FromTemplateLiteral(left, right) : index_10.TypeGuard.IsRegExp(left) || index_10.TypeGuard.IsRegExp(right) ? FromRegExp(left, right) : index_10.TypeGuard.IsNot(left) || index_10.TypeGuard.IsNot(right) ? FromNot(left, right) : (
          // standard
          index_10.TypeGuard.IsAny(left) ? FromAny(left, right) : index_10.TypeGuard.IsArray(left) ? FromArray(left, right) : index_10.TypeGuard.IsBigInt(left) ? FromBigInt(left, right) : index_10.TypeGuard.IsBoolean(left) ? FromBoolean(left, right) : index_10.TypeGuard.IsAsyncIterator(left) ? FromAsyncIterator(left, right) : index_10.TypeGuard.IsConstructor(left) ? FromConstructor(left, right) : index_10.TypeGuard.IsDate(left) ? FromDate(left, right) : index_10.TypeGuard.IsFunction(left) ? FromFunction(left, right) : index_10.TypeGuard.IsInteger(left) ? FromInteger(left, right) : index_10.TypeGuard.IsIntersect(left) ? FromIntersect(left, right) : index_10.TypeGuard.IsIterator(left) ? FromIterator(left, right) : index_10.TypeGuard.IsLiteral(left) ? FromLiteral(left, right) : index_10.TypeGuard.IsNever(left) ? FromNever(left, right) : index_10.TypeGuard.IsNull(left) ? FromNull(left, right) : index_10.TypeGuard.IsNumber(left) ? FromNumber(left, right) : index_10.TypeGuard.IsObject(left) ? FromObject(left, right) : index_10.TypeGuard.IsRecord(left) ? FromRecord(left, right) : index_10.TypeGuard.IsString(left) ? FromString(left, right) : index_10.TypeGuard.IsSymbol(left) ? FromSymbol(left, right) : index_10.TypeGuard.IsTuple(left) ? FromTuple(left, right) : index_10.TypeGuard.IsPromise(left) ? FromPromise(left, right) : index_10.TypeGuard.IsUint8Array(left) ? FromUint8Array(left, right) : index_10.TypeGuard.IsUndefined(left) ? FromUndefined(left, right) : index_10.TypeGuard.IsUnion(left) ? FromUnion(left, right) : index_10.TypeGuard.IsUnknown(left) ? FromUnknown(left, right) : index_10.TypeGuard.IsVoid(left) ? FromVoid(left, right) : Throw(`Unknown left type operand '${left[index_8.Kind]}'`)
        )
      );
    }
    function ExtendsCheck(left, right) {
      return Visit(left, right);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends-from-mapped-result.js
var require_extends_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtendsFromMappedResult = ExtendsFromMappedResult;
    var index_1 = require_mapped2();
    var extends_1 = require_extends();
    var value_1 = require_value2();
    function FromProperties(P, Right, True, False, options) {
      const Acc = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(P))
        Acc[K2] = (0, extends_1.Extends)(P[K2], Right, True, False, (0, value_1.Clone)(options));
      return Acc;
    }
    function FromMappedResult(Left, Right, True, False, options) {
      return FromProperties(Left.properties, Right, True, False, options);
    }
    function ExtendsFromMappedResult(Left, Right, True, False, options) {
      const P = FromMappedResult(Left, Right, True, False, options);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends.js
var require_extends = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extends = Extends;
    var type_1 = require_type2();
    var index_1 = require_union2();
    var extends_check_1 = require_extends_check();
    var extends_from_mapped_key_1 = require_extends_from_mapped_key();
    var extends_from_mapped_result_1 = require_extends_from_mapped_result();
    var kind_1 = require_kind();
    function ExtendsResolve(left, right, trueType, falseType) {
      const R = (0, extends_check_1.ExtendsCheck)(left, right);
      return R === extends_check_1.ExtendsResult.Union ? (0, index_1.Union)([trueType, falseType]) : R === extends_check_1.ExtendsResult.True ? trueType : falseType;
    }
    function Extends(L, R, T, F, options) {
      return (0, kind_1.IsMappedResult)(L) ? (0, extends_from_mapped_result_1.ExtendsFromMappedResult)(L, R, T, F, options) : (0, kind_1.IsMappedKey)(L) ? (0, type_1.CreateType)((0, extends_from_mapped_key_1.ExtendsFromMappedKey)(L, R, T, F, options)) : (0, type_1.CreateType)(ExtendsResolve(L, R, T, F), options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends-from-mapped-key.js
var require_extends_from_mapped_key = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends-from-mapped-key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtendsFromMappedKey = ExtendsFromMappedKey;
    var index_1 = require_mapped2();
    var index_2 = require_literal2();
    var extends_1 = require_extends();
    var value_1 = require_value2();
    function FromPropertyKey(K, U, L, R, options) {
      return {
        [K]: (0, extends_1.Extends)((0, index_2.Literal)(K), U, L, R, (0, value_1.Clone)(options))
      };
    }
    function FromPropertyKeys(K, U, L, R, options) {
      return K.reduce((Acc, LK) => {
        return { ...Acc, ...FromPropertyKey(LK, U, L, R, options) };
      }, {});
    }
    function FromMappedKey(K, U, L, R, options) {
      return FromPropertyKeys(K.keys, U, L, R, options);
    }
    function ExtendsFromMappedKey(T, U, L, R, options) {
      const P = FromMappedKey(T, U, L, R, options);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends-undefined.js
var require_extends_undefined = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/extends-undefined.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtendsUndefinedCheck = ExtendsUndefinedCheck;
    var index_1 = require_symbols2();
    function Intersect(schema) {
      return schema.allOf.every((schema2) => ExtendsUndefinedCheck(schema2));
    }
    function Union(schema) {
      return schema.anyOf.some((schema2) => ExtendsUndefinedCheck(schema2));
    }
    function Not(schema) {
      return !ExtendsUndefinedCheck(schema.not);
    }
    function ExtendsUndefinedCheck(schema) {
      return schema[index_1.Kind] === "Intersect" ? Intersect(schema) : schema[index_1.Kind] === "Union" ? Union(schema) : schema[index_1.Kind] === "Not" ? Not(schema) : schema[index_1.Kind] === "Undefined" ? true : false;
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/index.js
var require_extends2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extends/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_extends_check(), exports);
    __exportStar(require_extends_from_mapped_key(), exports);
    __exportStar(require_extends_from_mapped_result(), exports);
    __exportStar(require_extends_undefined(), exports);
    __exportStar(require_extends(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/exclude/exclude-from-template-literal.js
var require_exclude_from_template_literal = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/exclude/exclude-from-template-literal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExcludeFromTemplateLiteral = ExcludeFromTemplateLiteral;
    var exclude_1 = require_exclude();
    var index_1 = require_template_literal2();
    function ExcludeFromTemplateLiteral(L, R) {
      return (0, exclude_1.Exclude)((0, index_1.TemplateLiteralToUnion)(L), R);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/exclude/exclude.js
var require_exclude = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/exclude/exclude.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Exclude = Exclude;
    var type_1 = require_type2();
    var index_1 = require_union2();
    var index_2 = require_never2();
    var index_3 = require_extends2();
    var exclude_from_mapped_result_1 = require_exclude_from_mapped_result();
    var exclude_from_template_literal_1 = require_exclude_from_template_literal();
    var kind_1 = require_kind();
    function ExcludeRest(L, R) {
      const excluded = L.filter((inner) => (0, index_3.ExtendsCheck)(inner, R) === index_3.ExtendsResult.False);
      return excluded.length === 1 ? excluded[0] : (0, index_1.Union)(excluded);
    }
    function Exclude(L, R, options = {}) {
      if ((0, kind_1.IsTemplateLiteral)(L))
        return (0, type_1.CreateType)((0, exclude_from_template_literal_1.ExcludeFromTemplateLiteral)(L, R), options);
      if ((0, kind_1.IsMappedResult)(L))
        return (0, type_1.CreateType)((0, exclude_from_mapped_result_1.ExcludeFromMappedResult)(L, R), options);
      return (0, type_1.CreateType)((0, kind_1.IsUnion)(L) ? ExcludeRest(L.anyOf, R) : (0, index_3.ExtendsCheck)(L, R) !== index_3.ExtendsResult.False ? (0, index_2.Never)() : L, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/exclude/exclude-from-mapped-result.js
var require_exclude_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/exclude/exclude-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExcludeFromMappedResult = ExcludeFromMappedResult;
    var index_1 = require_mapped2();
    var exclude_1 = require_exclude();
    function FromProperties(P, U) {
      const Acc = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(P))
        Acc[K2] = (0, exclude_1.Exclude)(P[K2], U);
      return Acc;
    }
    function FromMappedResult(R, T) {
      return FromProperties(R.properties, T);
    }
    function ExcludeFromMappedResult(R, T) {
      const P = FromMappedResult(R, T);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/exclude/index.js
var require_exclude2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/exclude/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_exclude_from_mapped_result(), exports);
    __exportStar(require_exclude_from_template_literal(), exports);
    __exportStar(require_exclude(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extract/extract-from-template-literal.js
var require_extract_from_template_literal = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extract/extract-from-template-literal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtractFromTemplateLiteral = ExtractFromTemplateLiteral;
    var extract_1 = require_extract();
    var index_1 = require_template_literal2();
    function ExtractFromTemplateLiteral(L, R) {
      return (0, extract_1.Extract)((0, index_1.TemplateLiteralToUnion)(L), R);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extract/extract.js
var require_extract = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extract/extract.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extract = Extract;
    var type_1 = require_type2();
    var index_1 = require_union2();
    var index_2 = require_never2();
    var index_3 = require_extends2();
    var extract_from_mapped_result_1 = require_extract_from_mapped_result();
    var extract_from_template_literal_1 = require_extract_from_template_literal();
    var kind_1 = require_kind();
    function ExtractRest(L, R) {
      const extracted = L.filter((inner) => (0, index_3.ExtendsCheck)(inner, R) !== index_3.ExtendsResult.False);
      return extracted.length === 1 ? extracted[0] : (0, index_1.Union)(extracted);
    }
    function Extract(L, R, options) {
      if ((0, kind_1.IsTemplateLiteral)(L))
        return (0, type_1.CreateType)((0, extract_from_template_literal_1.ExtractFromTemplateLiteral)(L, R), options);
      if ((0, kind_1.IsMappedResult)(L))
        return (0, type_1.CreateType)((0, extract_from_mapped_result_1.ExtractFromMappedResult)(L, R), options);
      return (0, type_1.CreateType)((0, kind_1.IsUnion)(L) ? ExtractRest(L.anyOf, R) : (0, index_3.ExtendsCheck)(L, R) !== index_3.ExtendsResult.False ? L : (0, index_2.Never)(), options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extract/extract-from-mapped-result.js
var require_extract_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extract/extract-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtractFromMappedResult = ExtractFromMappedResult;
    var index_1 = require_mapped2();
    var extract_1 = require_extract();
    function FromProperties(P, T) {
      const Acc = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(P))
        Acc[K2] = (0, extract_1.Extract)(P[K2], T);
      return Acc;
    }
    function FromMappedResult(R, T) {
      return FromProperties(R.properties, T);
    }
    function ExtractFromMappedResult(R, T) {
      const P = FromMappedResult(R, T);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extract/index.js
var require_extract2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/extract/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_extract_from_mapped_result(), exports);
    __exportStar(require_extract_from_template_literal(), exports);
    __exportStar(require_extract(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/instance-type/instance-type.js
var require_instance_type = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/instance-type/instance-type.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InstanceType = InstanceType;
    var type_1 = require_type2();
    var index_1 = require_never2();
    var KindGuard = __importStar(require_kind());
    function InstanceType(schema, options) {
      return KindGuard.IsConstructor(schema) ? (0, type_1.CreateType)(schema.returns, options) : (0, index_1.Never)(options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/instance-type/index.js
var require_instance_type2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/instance-type/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_instance_type(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly-optional/readonly-optional.js
var require_readonly_optional = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly-optional/readonly-optional.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReadonlyOptional = ReadonlyOptional;
    var index_1 = require_readonly2();
    var index_2 = require_optional2();
    function ReadonlyOptional(schema) {
      return (0, index_1.Readonly)((0, index_2.Optional)(schema));
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly-optional/index.js
var require_readonly_optional2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/readonly-optional/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_readonly_optional(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/record/record.js
var require_record = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/record/record.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Record = Record;
    exports.RecordPattern = RecordPattern;
    exports.RecordKey = RecordKey;
    exports.RecordValue = RecordValue;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    var index_2 = require_never2();
    var index_3 = require_number2();
    var index_4 = require_object2();
    var index_5 = require_string2();
    var index_6 = require_union2();
    var index_7 = require_template_literal2();
    var index_8 = require_patterns2();
    var index_9 = require_indexed2();
    var value_1 = require_value();
    var kind_1 = require_kind();
    function RecordCreateFromPattern(pattern, T, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Record", type: "object", patternProperties: { [pattern]: T } }, options);
    }
    function RecordCreateFromKeys(K, T, options) {
      const result = {};
      for (const K2 of K)
        result[K2] = T;
      return (0, index_4.Object)(result, { ...options, [index_1.Hint]: "Record" });
    }
    function FromTemplateLiteralKey(K, T, options) {
      return (0, index_7.IsTemplateLiteralFinite)(K) ? RecordCreateFromKeys((0, index_9.IndexPropertyKeys)(K), T, options) : RecordCreateFromPattern(K.pattern, T, options);
    }
    function FromUnionKey(key, type, options) {
      return RecordCreateFromKeys((0, index_9.IndexPropertyKeys)((0, index_6.Union)(key)), type, options);
    }
    function FromLiteralKey(key, type, options) {
      return RecordCreateFromKeys([key.toString()], type, options);
    }
    function FromRegExpKey(key, type, options) {
      return RecordCreateFromPattern(key.source, type, options);
    }
    function FromStringKey(key, type, options) {
      const pattern = (0, value_1.IsUndefined)(key.pattern) ? index_8.PatternStringExact : key.pattern;
      return RecordCreateFromPattern(pattern, type, options);
    }
    function FromAnyKey(_, type, options) {
      return RecordCreateFromPattern(index_8.PatternStringExact, type, options);
    }
    function FromNeverKey(_key, type, options) {
      return RecordCreateFromPattern(index_8.PatternNeverExact, type, options);
    }
    function FromBooleanKey(_key, type, options) {
      return (0, index_4.Object)({ true: type, false: type }, options);
    }
    function FromIntegerKey(_key, type, options) {
      return RecordCreateFromPattern(index_8.PatternNumberExact, type, options);
    }
    function FromNumberKey(_, type, options) {
      return RecordCreateFromPattern(index_8.PatternNumberExact, type, options);
    }
    function Record(key, type, options = {}) {
      return (0, kind_1.IsUnion)(key) ? FromUnionKey(key.anyOf, type, options) : (0, kind_1.IsTemplateLiteral)(key) ? FromTemplateLiteralKey(key, type, options) : (0, kind_1.IsLiteral)(key) ? FromLiteralKey(key.const, type, options) : (0, kind_1.IsBoolean)(key) ? FromBooleanKey(key, type, options) : (0, kind_1.IsInteger)(key) ? FromIntegerKey(key, type, options) : (0, kind_1.IsNumber)(key) ? FromNumberKey(key, type, options) : (0, kind_1.IsRegExp)(key) ? FromRegExpKey(key, type, options) : (0, kind_1.IsString)(key) ? FromStringKey(key, type, options) : (0, kind_1.IsAny)(key) ? FromAnyKey(key, type, options) : (0, kind_1.IsNever)(key) ? FromNeverKey(key, type, options) : (0, index_2.Never)(options);
    }
    function RecordPattern(record) {
      return globalThis.Object.getOwnPropertyNames(record.patternProperties)[0];
    }
    function RecordKey(type) {
      const pattern = RecordPattern(type);
      return pattern === index_8.PatternStringExact ? (0, index_5.String)() : pattern === index_8.PatternNumberExact ? (0, index_3.Number)() : (0, index_5.String)({ pattern });
    }
    function RecordValue(type) {
      return type.patternProperties[RecordPattern(type)];
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/record/index.js
var require_record2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/record/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_record(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/instantiate/instantiate.js
var require_instantiate = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/instantiate/instantiate.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FromTypes = FromTypes;
    exports.Instantiate = Instantiate;
    var type_1 = require_type();
    var index_1 = require_unknown2();
    var index_2 = require_readonly_optional2();
    var index_3 = require_readonly2();
    var index_4 = require_optional2();
    var index_5 = require_object2();
    var index_6 = require_record2();
    var ValueGuard = __importStar(require_value());
    var KindGuard = __importStar(require_kind());
    function FromConstructor(args, type) {
      type.parameters = FromTypes(args, type.parameters);
      type.returns = FromType(args, type.returns);
      return type;
    }
    function FromFunction(args, type) {
      type.parameters = FromTypes(args, type.parameters);
      type.returns = FromType(args, type.returns);
      return type;
    }
    function FromIntersect(args, type) {
      type.allOf = FromTypes(args, type.allOf);
      return type;
    }
    function FromUnion(args, type) {
      type.anyOf = FromTypes(args, type.anyOf);
      return type;
    }
    function FromTuple(args, type) {
      if (ValueGuard.IsUndefined(type.items))
        return type;
      type.items = FromTypes(args, type.items);
      return type;
    }
    function FromArray(args, type) {
      type.items = FromType(args, type.items);
      return type;
    }
    function FromAsyncIterator(args, type) {
      type.items = FromType(args, type.items);
      return type;
    }
    function FromIterator(args, type) {
      type.items = FromType(args, type.items);
      return type;
    }
    function FromPromise(args, type) {
      type.item = FromType(args, type.item);
      return type;
    }
    function FromObject(args, type) {
      const mappedProperties = FromProperties(args, type.properties);
      return { ...type, ...(0, index_5.Object)(mappedProperties) };
    }
    function FromRecord(args, type) {
      const mappedKey = FromType(args, (0, index_6.RecordKey)(type));
      const mappedValue = FromType(args, (0, index_6.RecordValue)(type));
      const result = (0, index_6.Record)(mappedKey, mappedValue);
      return { ...type, ...result };
    }
    function FromArgument(args, argument) {
      return argument.index in args ? args[argument.index] : (0, index_1.Unknown)();
    }
    function FromProperty(args, type) {
      const isReadonly = KindGuard.IsReadonly(type);
      const isOptional = KindGuard.IsOptional(type);
      const mapped = FromType(args, type);
      return isReadonly && isOptional ? (0, index_2.ReadonlyOptional)(mapped) : isReadonly && !isOptional ? (0, index_3.Readonly)(mapped) : !isReadonly && isOptional ? (0, index_4.Optional)(mapped) : mapped;
    }
    function FromProperties(args, properties) {
      return globalThis.Object.getOwnPropertyNames(properties).reduce((result, key) => {
        return { ...result, [key]: FromProperty(args, properties[key]) };
      }, {});
    }
    function FromTypes(args, types) {
      return types.map((type) => FromType(args, type));
    }
    function FromType(args, type) {
      return KindGuard.IsConstructor(type) ? FromConstructor(args, type) : KindGuard.IsFunction(type) ? FromFunction(args, type) : KindGuard.IsIntersect(type) ? FromIntersect(args, type) : KindGuard.IsUnion(type) ? FromUnion(args, type) : KindGuard.IsTuple(type) ? FromTuple(args, type) : KindGuard.IsArray(type) ? FromArray(args, type) : KindGuard.IsAsyncIterator(type) ? FromAsyncIterator(args, type) : KindGuard.IsIterator(type) ? FromIterator(args, type) : KindGuard.IsPromise(type) ? FromPromise(args, type) : KindGuard.IsObject(type) ? FromObject(args, type) : KindGuard.IsRecord(type) ? FromRecord(args, type) : KindGuard.IsArgument(type) ? FromArgument(args, type) : type;
    }
    function Instantiate(type, args) {
      return FromType(args, (0, type_1.CloneType)(type));
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/instantiate/index.js
var require_instantiate2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/instantiate/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_instantiate(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/integer/integer.js
var require_integer = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/integer/integer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Integer = Integer;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Integer(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Integer", type: "integer" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/integer/index.js
var require_integer2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/integer/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_integer(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/intrinsic-from-mapped-key.js
var require_intrinsic_from_mapped_key = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/intrinsic-from-mapped-key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntrinsicFromMappedKey = IntrinsicFromMappedKey;
    var index_1 = require_mapped2();
    var intrinsic_1 = require_intrinsic();
    var index_2 = require_literal2();
    var value_1 = require_value2();
    function MappedIntrinsicPropertyKey(K, M, options) {
      return {
        [K]: (0, intrinsic_1.Intrinsic)((0, index_2.Literal)(K), M, (0, value_1.Clone)(options))
      };
    }
    function MappedIntrinsicPropertyKeys(K, M, options) {
      const result = K.reduce((Acc, L) => {
        return { ...Acc, ...MappedIntrinsicPropertyKey(L, M, options) };
      }, {});
      return result;
    }
    function MappedIntrinsicProperties(T, M, options) {
      return MappedIntrinsicPropertyKeys(T["keys"], M, options);
    }
    function IntrinsicFromMappedKey(T, M, options) {
      const P = MappedIntrinsicProperties(T, M, options);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/intrinsic.js
var require_intrinsic = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/intrinsic.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Intrinsic = Intrinsic;
    var type_1 = require_type2();
    var index_1 = require_template_literal2();
    var intrinsic_from_mapped_key_1 = require_intrinsic_from_mapped_key();
    var index_2 = require_literal2();
    var index_3 = require_union2();
    var kind_1 = require_kind();
    function ApplyUncapitalize(value) {
      const [first, rest] = [value.slice(0, 1), value.slice(1)];
      return [first.toLowerCase(), rest].join("");
    }
    function ApplyCapitalize(value) {
      const [first, rest] = [value.slice(0, 1), value.slice(1)];
      return [first.toUpperCase(), rest].join("");
    }
    function ApplyUppercase(value) {
      return value.toUpperCase();
    }
    function ApplyLowercase(value) {
      return value.toLowerCase();
    }
    function FromTemplateLiteral(schema, mode, options) {
      const expression = (0, index_1.TemplateLiteralParseExact)(schema.pattern);
      const finite = (0, index_1.IsTemplateLiteralExpressionFinite)(expression);
      if (!finite)
        return { ...schema, pattern: FromLiteralValue(schema.pattern, mode) };
      const strings = [...(0, index_1.TemplateLiteralExpressionGenerate)(expression)];
      const literals = strings.map((value) => (0, index_2.Literal)(value));
      const mapped = FromRest(literals, mode);
      const union = (0, index_3.Union)(mapped);
      return (0, index_1.TemplateLiteral)([union], options);
    }
    function FromLiteralValue(value, mode) {
      return typeof value === "string" ? mode === "Uncapitalize" ? ApplyUncapitalize(value) : mode === "Capitalize" ? ApplyCapitalize(value) : mode === "Uppercase" ? ApplyUppercase(value) : mode === "Lowercase" ? ApplyLowercase(value) : value : value.toString();
    }
    function FromRest(T, M) {
      return T.map((L) => Intrinsic(L, M));
    }
    function Intrinsic(schema, mode, options = {}) {
      return (
        // Intrinsic-Mapped-Inference
        (0, kind_1.IsMappedKey)(schema) ? (0, intrinsic_from_mapped_key_1.IntrinsicFromMappedKey)(schema, mode, options) : (
          // Standard-Inference
          (0, kind_1.IsTemplateLiteral)(schema) ? FromTemplateLiteral(schema, mode, options) : (0, kind_1.IsUnion)(schema) ? (0, index_3.Union)(FromRest(schema.anyOf, mode), options) : (0, kind_1.IsLiteral)(schema) ? (0, index_2.Literal)(FromLiteralValue(schema.const, mode), options) : (
            // Default Type
            (0, type_1.CreateType)(schema, options)
          )
        )
      );
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/capitalize.js
var require_capitalize = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/capitalize.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Capitalize = Capitalize;
    var intrinsic_1 = require_intrinsic();
    function Capitalize(T, options = {}) {
      return (0, intrinsic_1.Intrinsic)(T, "Capitalize", options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/lowercase.js
var require_lowercase = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/lowercase.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Lowercase = Lowercase;
    var intrinsic_1 = require_intrinsic();
    function Lowercase(T, options = {}) {
      return (0, intrinsic_1.Intrinsic)(T, "Lowercase", options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/uncapitalize.js
var require_uncapitalize = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/uncapitalize.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Uncapitalize = Uncapitalize;
    var intrinsic_1 = require_intrinsic();
    function Uncapitalize(T, options = {}) {
      return (0, intrinsic_1.Intrinsic)(T, "Uncapitalize", options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/uppercase.js
var require_uppercase = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/uppercase.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Uppercase = Uppercase;
    var intrinsic_1 = require_intrinsic();
    function Uppercase(T, options = {}) {
      return (0, intrinsic_1.Intrinsic)(T, "Uppercase", options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/index.js
var require_intrinsic2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/intrinsic/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_capitalize(), exports);
    __exportStar(require_intrinsic_from_mapped_key(), exports);
    __exportStar(require_intrinsic(), exports);
    __exportStar(require_lowercase(), exports);
    __exportStar(require_uncapitalize(), exports);
    __exportStar(require_uppercase(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/omit/omit-from-mapped-result.js
var require_omit_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/omit/omit-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OmitFromMappedResult = OmitFromMappedResult;
    var index_1 = require_mapped2();
    var omit_1 = require_omit();
    var value_1 = require_value2();
    function FromProperties(properties, propertyKeys, options) {
      const result = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
        result[K2] = (0, omit_1.Omit)(properties[K2], propertyKeys, (0, value_1.Clone)(options));
      return result;
    }
    function FromMappedResult(mappedResult, propertyKeys, options) {
      return FromProperties(mappedResult.properties, propertyKeys, options);
    }
    function OmitFromMappedResult(mappedResult, propertyKeys, options) {
      const properties = FromMappedResult(mappedResult, propertyKeys, options);
      return (0, index_1.MappedResult)(properties);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/omit/omit.js
var require_omit = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/omit/omit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Omit = Omit;
    var type_1 = require_type2();
    var discard_1 = require_discard();
    var symbols_1 = require_symbols();
    var index_1 = require_computed2();
    var index_2 = require_literal2();
    var index_3 = require_indexed2();
    var index_4 = require_intersect2();
    var index_5 = require_union2();
    var index_6 = require_object2();
    var omit_from_mapped_key_1 = require_omit_from_mapped_key();
    var omit_from_mapped_result_1 = require_omit_from_mapped_result();
    var kind_1 = require_kind();
    var value_1 = require_value();
    function FromIntersect(types, propertyKeys) {
      return types.map((type) => OmitResolve(type, propertyKeys));
    }
    function FromUnion(types, propertyKeys) {
      return types.map((type) => OmitResolve(type, propertyKeys));
    }
    function FromProperty(properties, key) {
      const { [key]: _, ...R } = properties;
      return R;
    }
    function FromProperties(properties, propertyKeys) {
      return propertyKeys.reduce((T, K2) => FromProperty(T, K2), properties);
    }
    function FromObject(type, propertyKeys, properties) {
      const options = (0, discard_1.Discard)(type, [symbols_1.TransformKind, "$id", "required", "properties"]);
      const mappedProperties = FromProperties(properties, propertyKeys);
      return (0, index_6.Object)(mappedProperties, options);
    }
    function UnionFromPropertyKeys(propertyKeys) {
      const result = propertyKeys.reduce((result2, key) => (0, kind_1.IsLiteralValue)(key) ? [...result2, (0, index_2.Literal)(key)] : result2, []);
      return (0, index_5.Union)(result);
    }
    function OmitResolve(type, propertyKeys) {
      return (0, kind_1.IsIntersect)(type) ? (0, index_4.Intersect)(FromIntersect(type.allOf, propertyKeys)) : (0, kind_1.IsUnion)(type) ? (0, index_5.Union)(FromUnion(type.anyOf, propertyKeys)) : (0, kind_1.IsObject)(type) ? FromObject(type, propertyKeys, type.properties) : (0, index_6.Object)({});
    }
    function Omit(type, key, options) {
      const typeKey = (0, value_1.IsArray)(key) ? UnionFromPropertyKeys(key) : key;
      const propertyKeys = (0, kind_1.IsSchema)(key) ? (0, index_3.IndexPropertyKeys)(key) : key;
      const isTypeRef = (0, kind_1.IsRef)(type);
      const isKeyRef = (0, kind_1.IsRef)(key);
      return (0, kind_1.IsMappedResult)(type) ? (0, omit_from_mapped_result_1.OmitFromMappedResult)(type, propertyKeys, options) : (0, kind_1.IsMappedKey)(key) ? (0, omit_from_mapped_key_1.OmitFromMappedKey)(type, key, options) : isTypeRef && isKeyRef ? (0, index_1.Computed)("Omit", [type, typeKey], options) : !isTypeRef && isKeyRef ? (0, index_1.Computed)("Omit", [type, typeKey], options) : isTypeRef && !isKeyRef ? (0, index_1.Computed)("Omit", [type, typeKey], options) : (0, type_1.CreateType)({ ...OmitResolve(type, propertyKeys), ...options });
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/omit/omit-from-mapped-key.js
var require_omit_from_mapped_key = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/omit/omit-from-mapped-key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OmitFromMappedKey = OmitFromMappedKey;
    var index_1 = require_mapped2();
    var omit_1 = require_omit();
    var value_1 = require_value2();
    function FromPropertyKey(type, key, options) {
      return { [key]: (0, omit_1.Omit)(type, [key], (0, value_1.Clone)(options)) };
    }
    function FromPropertyKeys(type, propertyKeys, options) {
      return propertyKeys.reduce((Acc, LK) => {
        return { ...Acc, ...FromPropertyKey(type, LK, options) };
      }, {});
    }
    function FromMappedKey(type, mappedKey, options) {
      return FromPropertyKeys(type, mappedKey.keys, options);
    }
    function OmitFromMappedKey(type, mappedKey, options) {
      const properties = FromMappedKey(type, mappedKey, options);
      return (0, index_1.MappedResult)(properties);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/omit/index.js
var require_omit2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/omit/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_omit_from_mapped_key(), exports);
    __exportStar(require_omit_from_mapped_result(), exports);
    __exportStar(require_omit(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/pick/pick-from-mapped-result.js
var require_pick_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/pick/pick-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PickFromMappedResult = PickFromMappedResult;
    var index_1 = require_mapped2();
    var pick_1 = require_pick();
    var value_1 = require_value2();
    function FromProperties(properties, propertyKeys, options) {
      const result = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
        result[K2] = (0, pick_1.Pick)(properties[K2], propertyKeys, (0, value_1.Clone)(options));
      return result;
    }
    function FromMappedResult(mappedResult, propertyKeys, options) {
      return FromProperties(mappedResult.properties, propertyKeys, options);
    }
    function PickFromMappedResult(mappedResult, propertyKeys, options) {
      const properties = FromMappedResult(mappedResult, propertyKeys, options);
      return (0, index_1.MappedResult)(properties);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/pick/pick.js
var require_pick = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/pick/pick.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Pick = Pick;
    var type_1 = require_type2();
    var discard_1 = require_discard();
    var index_1 = require_computed2();
    var index_2 = require_intersect2();
    var index_3 = require_literal2();
    var index_4 = require_object2();
    var index_5 = require_union2();
    var index_6 = require_indexed2();
    var symbols_1 = require_symbols();
    var kind_1 = require_kind();
    var value_1 = require_value();
    var pick_from_mapped_key_1 = require_pick_from_mapped_key();
    var pick_from_mapped_result_1 = require_pick_from_mapped_result();
    function FromIntersect(types, propertyKeys) {
      return types.map((type) => PickResolve(type, propertyKeys));
    }
    function FromUnion(types, propertyKeys) {
      return types.map((type) => PickResolve(type, propertyKeys));
    }
    function FromProperties(properties, propertyKeys) {
      const result = {};
      for (const K2 of propertyKeys)
        if (K2 in properties)
          result[K2] = properties[K2];
      return result;
    }
    function FromObject(Type8, keys, properties) {
      const options = (0, discard_1.Discard)(Type8, [symbols_1.TransformKind, "$id", "required", "properties"]);
      const mappedProperties = FromProperties(properties, keys);
      return (0, index_4.Object)(mappedProperties, options);
    }
    function UnionFromPropertyKeys(propertyKeys) {
      const result = propertyKeys.reduce((result2, key) => (0, kind_1.IsLiteralValue)(key) ? [...result2, (0, index_3.Literal)(key)] : result2, []);
      return (0, index_5.Union)(result);
    }
    function PickResolve(type, propertyKeys) {
      return (0, kind_1.IsIntersect)(type) ? (0, index_2.Intersect)(FromIntersect(type.allOf, propertyKeys)) : (0, kind_1.IsUnion)(type) ? (0, index_5.Union)(FromUnion(type.anyOf, propertyKeys)) : (0, kind_1.IsObject)(type) ? FromObject(type, propertyKeys, type.properties) : (0, index_4.Object)({});
    }
    function Pick(type, key, options) {
      const typeKey = (0, value_1.IsArray)(key) ? UnionFromPropertyKeys(key) : key;
      const propertyKeys = (0, kind_1.IsSchema)(key) ? (0, index_6.IndexPropertyKeys)(key) : key;
      const isTypeRef = (0, kind_1.IsRef)(type);
      const isKeyRef = (0, kind_1.IsRef)(key);
      return (0, kind_1.IsMappedResult)(type) ? (0, pick_from_mapped_result_1.PickFromMappedResult)(type, propertyKeys, options) : (0, kind_1.IsMappedKey)(key) ? (0, pick_from_mapped_key_1.PickFromMappedKey)(type, key, options) : isTypeRef && isKeyRef ? (0, index_1.Computed)("Pick", [type, typeKey], options) : !isTypeRef && isKeyRef ? (0, index_1.Computed)("Pick", [type, typeKey], options) : isTypeRef && !isKeyRef ? (0, index_1.Computed)("Pick", [type, typeKey], options) : (0, type_1.CreateType)({ ...PickResolve(type, propertyKeys), ...options });
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/pick/pick-from-mapped-key.js
var require_pick_from_mapped_key = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/pick/pick-from-mapped-key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PickFromMappedKey = PickFromMappedKey;
    var index_1 = require_mapped2();
    var pick_1 = require_pick();
    var value_1 = require_value2();
    function FromPropertyKey(type, key, options) {
      return {
        [key]: (0, pick_1.Pick)(type, [key], (0, value_1.Clone)(options))
      };
    }
    function FromPropertyKeys(type, propertyKeys, options) {
      return propertyKeys.reduce((result, leftKey) => {
        return { ...result, ...FromPropertyKey(type, leftKey, options) };
      }, {});
    }
    function FromMappedKey(type, mappedKey, options) {
      return FromPropertyKeys(type, mappedKey.keys, options);
    }
    function PickFromMappedKey(type, mappedKey, options) {
      const properties = FromMappedKey(type, mappedKey, options);
      return (0, index_1.MappedResult)(properties);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/pick/index.js
var require_pick2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/pick/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_pick_from_mapped_key(), exports);
    __exportStar(require_pick_from_mapped_result(), exports);
    __exportStar(require_pick(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/partial/partial.js
var require_partial = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/partial/partial.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Partial = Partial;
    var type_1 = require_type2();
    var index_1 = require_computed2();
    var index_2 = require_optional2();
    var index_3 = require_object2();
    var index_4 = require_intersect2();
    var index_5 = require_union2();
    var index_6 = require_ref2();
    var index_7 = require_discard2();
    var index_8 = require_symbols2();
    var partial_from_mapped_result_1 = require_partial_from_mapped_result();
    var KindGuard = __importStar(require_kind());
    function FromComputed(target, parameters) {
      return (0, index_1.Computed)("Partial", [(0, index_1.Computed)(target, parameters)]);
    }
    function FromRef($ref) {
      return (0, index_1.Computed)("Partial", [(0, index_6.Ref)($ref)]);
    }
    function FromProperties(properties) {
      const partialProperties = {};
      for (const K of globalThis.Object.getOwnPropertyNames(properties))
        partialProperties[K] = (0, index_2.Optional)(properties[K]);
      return partialProperties;
    }
    function FromObject(type, properties) {
      const options = (0, index_7.Discard)(type, [index_8.TransformKind, "$id", "required", "properties"]);
      const mappedProperties = FromProperties(properties);
      return (0, index_3.Object)(mappedProperties, options);
    }
    function FromRest(types) {
      return types.map((type) => PartialResolve(type));
    }
    function PartialResolve(type) {
      return (
        // Mappable
        KindGuard.IsComputed(type) ? FromComputed(type.target, type.parameters) : KindGuard.IsRef(type) ? FromRef(type.$ref) : KindGuard.IsIntersect(type) ? (0, index_4.Intersect)(FromRest(type.allOf)) : KindGuard.IsUnion(type) ? (0, index_5.Union)(FromRest(type.anyOf)) : KindGuard.IsObject(type) ? FromObject(type, type.properties) : (
          // Intrinsic
          KindGuard.IsBigInt(type) ? type : KindGuard.IsBoolean(type) ? type : KindGuard.IsInteger(type) ? type : KindGuard.IsLiteral(type) ? type : KindGuard.IsNull(type) ? type : KindGuard.IsNumber(type) ? type : KindGuard.IsString(type) ? type : KindGuard.IsSymbol(type) ? type : KindGuard.IsUndefined(type) ? type : (
            // Passthrough
            (0, index_3.Object)({})
          )
        )
      );
    }
    function Partial(type, options) {
      if (KindGuard.IsMappedResult(type)) {
        return (0, partial_from_mapped_result_1.PartialFromMappedResult)(type, options);
      } else {
        return (0, type_1.CreateType)({ ...PartialResolve(type), ...options });
      }
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/partial/partial-from-mapped-result.js
var require_partial_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/partial/partial-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartialFromMappedResult = PartialFromMappedResult;
    var index_1 = require_mapped2();
    var partial_1 = require_partial();
    var value_1 = require_value2();
    function FromProperties(K, options) {
      const Acc = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(K))
        Acc[K2] = (0, partial_1.Partial)(K[K2], (0, value_1.Clone)(options));
      return Acc;
    }
    function FromMappedResult(R, options) {
      return FromProperties(R.properties, options);
    }
    function PartialFromMappedResult(R, options) {
      const P = FromMappedResult(R, options);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/partial/index.js
var require_partial2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/partial/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_partial_from_mapped_result(), exports);
    __exportStar(require_partial(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/required/required.js
var require_required = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/required/required.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Required = Required;
    var type_1 = require_type2();
    var index_1 = require_computed2();
    var index_2 = require_object2();
    var index_3 = require_intersect2();
    var index_4 = require_union2();
    var index_5 = require_ref2();
    var index_6 = require_symbols2();
    var index_7 = require_discard2();
    var required_from_mapped_result_1 = require_required_from_mapped_result();
    var KindGuard = __importStar(require_kind());
    function FromComputed(target, parameters) {
      return (0, index_1.Computed)("Required", [(0, index_1.Computed)(target, parameters)]);
    }
    function FromRef($ref) {
      return (0, index_1.Computed)("Required", [(0, index_5.Ref)($ref)]);
    }
    function FromProperties(properties) {
      const requiredProperties = {};
      for (const K of globalThis.Object.getOwnPropertyNames(properties))
        requiredProperties[K] = (0, index_7.Discard)(properties[K], [index_6.OptionalKind]);
      return requiredProperties;
    }
    function FromObject(type, properties) {
      const options = (0, index_7.Discard)(type, [index_6.TransformKind, "$id", "required", "properties"]);
      const mappedProperties = FromProperties(properties);
      return (0, index_2.Object)(mappedProperties, options);
    }
    function FromRest(types) {
      return types.map((type) => RequiredResolve(type));
    }
    function RequiredResolve(type) {
      return (
        // Mappable
        KindGuard.IsComputed(type) ? FromComputed(type.target, type.parameters) : KindGuard.IsRef(type) ? FromRef(type.$ref) : KindGuard.IsIntersect(type) ? (0, index_3.Intersect)(FromRest(type.allOf)) : KindGuard.IsUnion(type) ? (0, index_4.Union)(FromRest(type.anyOf)) : KindGuard.IsObject(type) ? FromObject(type, type.properties) : (
          // Intrinsic
          KindGuard.IsBigInt(type) ? type : KindGuard.IsBoolean(type) ? type : KindGuard.IsInteger(type) ? type : KindGuard.IsLiteral(type) ? type : KindGuard.IsNull(type) ? type : KindGuard.IsNumber(type) ? type : KindGuard.IsString(type) ? type : KindGuard.IsSymbol(type) ? type : KindGuard.IsUndefined(type) ? type : (
            // Passthrough
            (0, index_2.Object)({})
          )
        )
      );
    }
    function Required(type, options) {
      if (KindGuard.IsMappedResult(type)) {
        return (0, required_from_mapped_result_1.RequiredFromMappedResult)(type, options);
      } else {
        return (0, type_1.CreateType)({ ...RequiredResolve(type), ...options });
      }
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/required/required-from-mapped-result.js
var require_required_from_mapped_result = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/required/required-from-mapped-result.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequiredFromMappedResult = RequiredFromMappedResult;
    var index_1 = require_mapped2();
    var required_1 = require_required();
    function FromProperties(P, options) {
      const Acc = {};
      for (const K2 of globalThis.Object.getOwnPropertyNames(P))
        Acc[K2] = (0, required_1.Required)(P[K2], options);
      return Acc;
    }
    function FromMappedResult(R, options) {
      return FromProperties(R.properties, options);
    }
    function RequiredFromMappedResult(R, options) {
      const P = FromMappedResult(R, options);
      return (0, index_1.MappedResult)(P);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/required/index.js
var require_required2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/required/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_required_from_mapped_result(), exports);
    __exportStar(require_required(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/module/compute.js
var require_compute = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/module/compute.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FromType = FromType;
    exports.ComputeType = ComputeType;
    exports.ComputeModuleProperties = ComputeModuleProperties;
    var index_1 = require_create();
    var index_2 = require_clone();
    var index_3 = require_discard2();
    var index_4 = require_array2();
    var index_5 = require_awaited2();
    var index_6 = require_async_iterator2();
    var index_7 = require_constructor2();
    var index_8 = require_indexed2();
    var index_9 = require_function2();
    var index_10 = require_intersect2();
    var index_11 = require_iterator2();
    var index_12 = require_keyof2();
    var index_13 = require_object2();
    var index_14 = require_omit2();
    var index_15 = require_pick2();
    var index_16 = require_never2();
    var index_17 = require_partial2();
    var index_18 = require_record2();
    var index_19 = require_required2();
    var index_20 = require_tuple2();
    var index_21 = require_union2();
    var index_22 = require_symbols2();
    var KindGuard = __importStar(require_kind());
    function DereferenceParameters(moduleProperties, types) {
      return types.map((type) => {
        return KindGuard.IsRef(type) ? Dereference(moduleProperties, type.$ref) : FromType(moduleProperties, type);
      });
    }
    function Dereference(moduleProperties, ref) {
      return ref in moduleProperties ? KindGuard.IsRef(moduleProperties[ref]) ? Dereference(moduleProperties, moduleProperties[ref].$ref) : FromType(moduleProperties, moduleProperties[ref]) : (0, index_16.Never)();
    }
    function FromAwaited(parameters) {
      return (0, index_5.Awaited)(parameters[0]);
    }
    function FromIndex(parameters) {
      return (0, index_8.Index)(parameters[0], parameters[1]);
    }
    function FromKeyOf(parameters) {
      return (0, index_12.KeyOf)(parameters[0]);
    }
    function FromPartial(parameters) {
      return (0, index_17.Partial)(parameters[0]);
    }
    function FromOmit(parameters) {
      return (0, index_14.Omit)(parameters[0], parameters[1]);
    }
    function FromPick(parameters) {
      return (0, index_15.Pick)(parameters[0], parameters[1]);
    }
    function FromRequired(parameters) {
      return (0, index_19.Required)(parameters[0]);
    }
    function FromComputed(moduleProperties, target, parameters) {
      const dereferenced = DereferenceParameters(moduleProperties, parameters);
      return target === "Awaited" ? FromAwaited(dereferenced) : target === "Index" ? FromIndex(dereferenced) : target === "KeyOf" ? FromKeyOf(dereferenced) : target === "Partial" ? FromPartial(dereferenced) : target === "Omit" ? FromOmit(dereferenced) : target === "Pick" ? FromPick(dereferenced) : target === "Required" ? FromRequired(dereferenced) : (0, index_16.Never)();
    }
    function FromArray(moduleProperties, type) {
      return (0, index_4.Array)(FromType(moduleProperties, type));
    }
    function FromAsyncIterator(moduleProperties, type) {
      return (0, index_6.AsyncIterator)(FromType(moduleProperties, type));
    }
    function FromConstructor(moduleProperties, parameters, instanceType) {
      return (0, index_7.Constructor)(FromTypes(moduleProperties, parameters), FromType(moduleProperties, instanceType));
    }
    function FromFunction(moduleProperties, parameters, returnType) {
      return (0, index_9.Function)(FromTypes(moduleProperties, parameters), FromType(moduleProperties, returnType));
    }
    function FromIntersect(moduleProperties, types) {
      return (0, index_10.Intersect)(FromTypes(moduleProperties, types));
    }
    function FromIterator(moduleProperties, type) {
      return (0, index_11.Iterator)(FromType(moduleProperties, type));
    }
    function FromObject(moduleProperties, properties) {
      return (0, index_13.Object)(globalThis.Object.keys(properties).reduce((result, key) => {
        return { ...result, [key]: FromType(moduleProperties, properties[key]) };
      }, {}));
    }
    function FromRecord(moduleProperties, type) {
      const [value, pattern] = [FromType(moduleProperties, (0, index_18.RecordValue)(type)), (0, index_18.RecordPattern)(type)];
      const result = (0, index_2.CloneType)(type);
      result.patternProperties[pattern] = value;
      return result;
    }
    function FromTransform(moduleProperties, transform) {
      return KindGuard.IsRef(transform) ? { ...Dereference(moduleProperties, transform.$ref), [index_22.TransformKind]: transform[index_22.TransformKind] } : transform;
    }
    function FromTuple(moduleProperties, types) {
      return (0, index_20.Tuple)(FromTypes(moduleProperties, types));
    }
    function FromUnion(moduleProperties, types) {
      return (0, index_21.Union)(FromTypes(moduleProperties, types));
    }
    function FromTypes(moduleProperties, types) {
      return types.map((type) => FromType(moduleProperties, type));
    }
    function FromType(moduleProperties, type) {
      return (
        // Modifiers
        KindGuard.IsOptional(type) ? (0, index_1.CreateType)(FromType(moduleProperties, (0, index_3.Discard)(type, [index_22.OptionalKind])), type) : KindGuard.IsReadonly(type) ? (0, index_1.CreateType)(FromType(moduleProperties, (0, index_3.Discard)(type, [index_22.ReadonlyKind])), type) : (
          // Transform
          KindGuard.IsTransform(type) ? (0, index_1.CreateType)(FromTransform(moduleProperties, type), type) : (
            // Types
            KindGuard.IsArray(type) ? (0, index_1.CreateType)(FromArray(moduleProperties, type.items), type) : KindGuard.IsAsyncIterator(type) ? (0, index_1.CreateType)(FromAsyncIterator(moduleProperties, type.items), type) : KindGuard.IsComputed(type) ? (0, index_1.CreateType)(FromComputed(moduleProperties, type.target, type.parameters)) : KindGuard.IsConstructor(type) ? (0, index_1.CreateType)(FromConstructor(moduleProperties, type.parameters, type.returns), type) : KindGuard.IsFunction(type) ? (0, index_1.CreateType)(FromFunction(moduleProperties, type.parameters, type.returns), type) : KindGuard.IsIntersect(type) ? (0, index_1.CreateType)(FromIntersect(moduleProperties, type.allOf), type) : KindGuard.IsIterator(type) ? (0, index_1.CreateType)(FromIterator(moduleProperties, type.items), type) : KindGuard.IsObject(type) ? (0, index_1.CreateType)(FromObject(moduleProperties, type.properties), type) : KindGuard.IsRecord(type) ? (0, index_1.CreateType)(FromRecord(moduleProperties, type)) : KindGuard.IsTuple(type) ? (0, index_1.CreateType)(FromTuple(moduleProperties, type.items || []), type) : KindGuard.IsUnion(type) ? (0, index_1.CreateType)(FromUnion(moduleProperties, type.anyOf), type) : type
          )
        )
      );
    }
    function ComputeType(moduleProperties, key) {
      return key in moduleProperties ? FromType(moduleProperties, moduleProperties[key]) : (0, index_16.Never)();
    }
    function ComputeModuleProperties(moduleProperties) {
      return globalThis.Object.getOwnPropertyNames(moduleProperties).reduce((result, key) => {
        return { ...result, [key]: ComputeType(moduleProperties, key) };
      }, {});
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/module/module.js
var require_module = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/module/module.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TModule = void 0;
    exports.Module = Module;
    var index_1 = require_create();
    var index_2 = require_symbols2();
    var compute_1 = require_compute();
    var TModule = class {
      constructor($defs) {
        const computed = (0, compute_1.ComputeModuleProperties)($defs);
        const identified = this.WithIdentifiers(computed);
        this.$defs = identified;
      }
      /** `[Json]` Imports a Type by Key. */
      Import(key, options) {
        const $defs = { ...this.$defs, [key]: (0, index_1.CreateType)(this.$defs[key], options) };
        return (0, index_1.CreateType)({ [index_2.Kind]: "Import", $defs, $ref: key });
      }
      // prettier-ignore
      WithIdentifiers($defs) {
        return globalThis.Object.getOwnPropertyNames($defs).reduce((result, key) => {
          return { ...result, [key]: { ...$defs[key], $id: key } };
        }, {});
      }
    };
    exports.TModule = TModule;
    function Module(properties) {
      return new TModule(properties);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/module/index.js
var require_module2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/module/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_module(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/not/not.js
var require_not = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/not/not.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Not = Not;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Not(type, options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Not", not: type }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/not/index.js
var require_not2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/not/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_not(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/parameters/parameters.js
var require_parameters = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/parameters/parameters.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parameters = Parameters;
    var index_1 = require_tuple2();
    var index_2 = require_never2();
    var KindGuard = __importStar(require_kind());
    function Parameters(schema, options) {
      return KindGuard.IsFunction(schema) ? (0, index_1.Tuple)(schema.parameters, options) : (0, index_2.Never)();
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/parameters/index.js
var require_parameters2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/parameters/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_parameters(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/recursive/recursive.js
var require_recursive = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/recursive/recursive.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Recursive = Recursive;
    var type_1 = require_type();
    var type_2 = require_type2();
    var value_1 = require_value();
    var index_1 = require_symbols2();
    var Ordinal = 0;
    function Recursive(callback, options = {}) {
      if ((0, value_1.IsUndefined)(options.$id))
        options.$id = `T${Ordinal++}`;
      const thisType = (0, type_1.CloneType)(callback({ [index_1.Kind]: "This", $ref: `${options.$id}` }));
      thisType.$id = options.$id;
      return (0, type_2.CreateType)({ [index_1.Hint]: "Recursive", ...thisType }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/recursive/index.js
var require_recursive2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/recursive/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_recursive(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/regexp/regexp.js
var require_regexp = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/regexp/regexp.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RegExp = RegExp2;
    var type_1 = require_type2();
    var value_1 = require_value();
    var index_1 = require_symbols2();
    function RegExp2(unresolved, options) {
      const expr = (0, value_1.IsString)(unresolved) ? new globalThis.RegExp(unresolved) : unresolved;
      return (0, type_1.CreateType)({ [index_1.Kind]: "RegExp", type: "RegExp", source: expr.source, flags: expr.flags }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/regexp/index.js
var require_regexp2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/regexp/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_regexp(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/rest/rest.js
var require_rest = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/rest/rest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Rest = Rest;
    var kind_1 = require_kind();
    function RestResolve(T) {
      return (0, kind_1.IsIntersect)(T) ? T.allOf : (0, kind_1.IsUnion)(T) ? T.anyOf : (0, kind_1.IsTuple)(T) ? T.items ?? [] : [];
    }
    function Rest(T) {
      return RestResolve(T);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/rest/index.js
var require_rest2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/rest/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_rest(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/return-type/return-type.js
var require_return_type = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/return-type/return-type.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReturnType = ReturnType;
    var type_1 = require_type2();
    var index_1 = require_never2();
    var KindGuard = __importStar(require_kind());
    function ReturnType(schema, options) {
      return KindGuard.IsFunction(schema) ? (0, type_1.CreateType)(schema.returns, options) : (0, index_1.Never)(options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/return-type/index.js
var require_return_type2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/return-type/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_return_type(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/schema/anyschema.js
var require_anyschema = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/schema/anyschema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/schema/schema.js
var require_schema = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/schema/schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var index_1 = require_symbols2();
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/schema/index.js
var require_schema2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/schema/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_anyschema(), exports);
    __exportStar(require_schema(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/static/static.js
var require_static = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/static/static.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/static/index.js
var require_static2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/static/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_static(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/transform/transform.js
var require_transform = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/transform/transform.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TransformEncodeBuilder = exports.TransformDecodeBuilder = void 0;
    exports.Transform = Transform;
    var index_1 = require_symbols2();
    var kind_1 = require_kind();
    var TransformDecodeBuilder = class {
      constructor(schema) {
        this.schema = schema;
      }
      Decode(decode) {
        return new TransformEncodeBuilder(this.schema, decode);
      }
    };
    exports.TransformDecodeBuilder = TransformDecodeBuilder;
    var TransformEncodeBuilder = class {
      constructor(schema, decode) {
        this.schema = schema;
        this.decode = decode;
      }
      EncodeTransform(encode, schema) {
        const Encode = (value) => schema[index_1.TransformKind].Encode(encode(value));
        const Decode = (value) => this.decode(schema[index_1.TransformKind].Decode(value));
        const Codec = { Encode, Decode };
        return { ...schema, [index_1.TransformKind]: Codec };
      }
      EncodeSchema(encode, schema) {
        const Codec = { Decode: this.decode, Encode: encode };
        return { ...schema, [index_1.TransformKind]: Codec };
      }
      Encode(encode) {
        return (0, kind_1.IsTransform)(this.schema) ? this.EncodeTransform(encode, this.schema) : this.EncodeSchema(encode, this.schema);
      }
    };
    exports.TransformEncodeBuilder = TransformEncodeBuilder;
    function Transform(schema) {
      return new TransformDecodeBuilder(schema);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/transform/index.js
var require_transform2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/transform/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_transform(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/unsafe/unsafe.js
var require_unsafe = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/unsafe/unsafe.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Unsafe = Unsafe;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Unsafe(options = {}) {
      return (0, type_1.CreateType)({ [index_1.Kind]: options[index_1.Kind] ?? "Unsafe" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/unsafe/index.js
var require_unsafe2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/unsafe/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_unsafe(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/void/void.js
var require_void = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/void/void.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Void = Void;
    var type_1 = require_type2();
    var index_1 = require_symbols2();
    function Void(options) {
      return (0, type_1.CreateType)({ [index_1.Kind]: "Void", type: "void" }, options);
    }
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/void/index.js
var require_void2 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/void/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_void(), exports);
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/type/json.js
var require_json = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/type/json.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JsonTypeBuilder = void 0;
    var index_1 = require_any2();
    var index_2 = require_array2();
    var index_3 = require_boolean2();
    var index_4 = require_composite2();
    var index_5 = require_const2();
    var index_6 = require_enum2();
    var index_7 = require_exclude2();
    var index_8 = require_extends2();
    var index_9 = require_extract2();
    var index_10 = require_indexed2();
    var index_11 = require_integer2();
    var index_12 = require_intersect2();
    var index_13 = require_intrinsic2();
    var index_14 = require_keyof2();
    var index_15 = require_literal2();
    var index_16 = require_mapped2();
    var index_17 = require_never2();
    var index_18 = require_not2();
    var index_19 = require_null2();
    var index_20 = require_module2();
    var index_21 = require_number2();
    var index_22 = require_object2();
    var index_23 = require_omit2();
    var index_24 = require_optional2();
    var index_25 = require_partial2();
    var index_26 = require_pick2();
    var index_27 = require_readonly2();
    var index_28 = require_readonly_optional2();
    var index_29 = require_record2();
    var index_30 = require_recursive2();
    var index_31 = require_ref2();
    var index_32 = require_required2();
    var index_33 = require_rest2();
    var index_34 = require_string2();
    var index_35 = require_template_literal2();
    var index_36 = require_transform2();
    var index_37 = require_tuple2();
    var index_38 = require_union2();
    var index_39 = require_unknown2();
    var index_40 = require_unsafe2();
    var JsonTypeBuilder = class {
      // ------------------------------------------------------------------------
      // Modifiers
      // ------------------------------------------------------------------------
      /** `[Json]` Creates a Readonly and Optional property */
      ReadonlyOptional(type) {
        return (0, index_28.ReadonlyOptional)(type);
      }
      /** `[Json]` Creates a Readonly property */
      Readonly(type, enable) {
        return (0, index_27.Readonly)(type, enable ?? true);
      }
      /** `[Json]` Creates a Optional property */
      Optional(type, enable) {
        return (0, index_24.Optional)(type, enable ?? true);
      }
      // ------------------------------------------------------------------------
      // Types
      // ------------------------------------------------------------------------
      /** `[Json]` Creates an Any type */
      Any(options) {
        return (0, index_1.Any)(options);
      }
      /** `[Json]` Creates an Array type */
      Array(items, options) {
        return (0, index_2.Array)(items, options);
      }
      /** `[Json]` Creates a Boolean type */
      Boolean(options) {
        return (0, index_3.Boolean)(options);
      }
      /** `[Json]` Intrinsic function to Capitalize LiteralString types */
      Capitalize(schema, options) {
        return (0, index_13.Capitalize)(schema, options);
      }
      /** `[Json]` Creates a Composite object type */
      Composite(schemas, options) {
        return (0, index_4.Composite)(schemas, options);
      }
      /** `[JavaScript]` Creates a readonly const type from the given value. */
      Const(value, options) {
        return (0, index_5.Const)(value, options);
      }
      /** `[Json]` Creates a Enum type */
      Enum(item, options) {
        return (0, index_6.Enum)(item, options);
      }
      /** `[Json]` Constructs a type by excluding from unionType all union members that are assignable to excludedMembers */
      Exclude(unionType, excludedMembers, options) {
        return (0, index_7.Exclude)(unionType, excludedMembers, options);
      }
      /** `[Json]` Creates a Conditional type */
      Extends(L, R, T, F, options) {
        return (0, index_8.Extends)(L, R, T, F, options);
      }
      /** `[Json]` Constructs a type by extracting from type all union members that are assignable to union */
      Extract(type, union, options) {
        return (0, index_9.Extract)(type, union, options);
      }
      /** `[Json]` Returns an Indexed property type for the given keys */
      Index(type, key, options) {
        return (0, index_10.Index)(type, key, options);
      }
      /** `[Json]` Creates an Integer type */
      Integer(options) {
        return (0, index_11.Integer)(options);
      }
      /** `[Json]` Creates an Intersect type */
      Intersect(types, options) {
        return (0, index_12.Intersect)(types, options);
      }
      /** `[Json]` Creates a KeyOf type */
      KeyOf(type, options) {
        return (0, index_14.KeyOf)(type, options);
      }
      /** `[Json]` Creates a Literal type */
      Literal(literalValue, options) {
        return (0, index_15.Literal)(literalValue, options);
      }
      /** `[Json]` Intrinsic function to Lowercase LiteralString types */
      Lowercase(type, options) {
        return (0, index_13.Lowercase)(type, options);
      }
      /** `[Json]` Creates a Mapped object type */
      Mapped(key, map, options) {
        return (0, index_16.Mapped)(key, map, options);
      }
      /** `[Json]` Creates a Type Definition Module. */
      Module(properties) {
        return (0, index_20.Module)(properties);
      }
      /** `[Json]` Creates a Never type */
      Never(options) {
        return (0, index_17.Never)(options);
      }
      /** `[Json]` Creates a Not type */
      Not(type, options) {
        return (0, index_18.Not)(type, options);
      }
      /** `[Json]` Creates a Null type */
      Null(options) {
        return (0, index_19.Null)(options);
      }
      /** `[Json]` Creates a Number type */
      Number(options) {
        return (0, index_21.Number)(options);
      }
      /** `[Json]` Creates an Object type */
      Object(properties, options) {
        return (0, index_22.Object)(properties, options);
      }
      /** `[Json]` Constructs a type whose keys are omitted from the given type */
      Omit(schema, selector, options) {
        return (0, index_23.Omit)(schema, selector, options);
      }
      /** `[Json]` Constructs a type where all properties are optional */
      Partial(type, options) {
        return (0, index_25.Partial)(type, options);
      }
      /** `[Json]` Constructs a type whose keys are picked from the given type */
      Pick(type, key, options) {
        return (0, index_26.Pick)(type, key, options);
      }
      /** `[Json]` Creates a Record type */
      Record(key, value, options) {
        return (0, index_29.Record)(key, value, options);
      }
      /** `[Json]` Creates a Recursive type */
      Recursive(callback, options) {
        return (0, index_30.Recursive)(callback, options);
      }
      /** `[Json]` Creates a Ref type. The referenced type must contain a $id */
      Ref(...args) {
        return (0, index_31.Ref)(args[0], args[1]);
      }
      /** `[Json]` Constructs a type where all properties are required */
      Required(type, options) {
        return (0, index_32.Required)(type, options);
      }
      /** `[Json]` Extracts interior Rest elements from Tuple, Intersect and Union types */
      Rest(type) {
        return (0, index_33.Rest)(type);
      }
      /** `[Json]` Creates a String type */
      String(options) {
        return (0, index_34.String)(options);
      }
      /** `[Json]` Creates a TemplateLiteral type */
      TemplateLiteral(unresolved, options) {
        return (0, index_35.TemplateLiteral)(unresolved, options);
      }
      /** `[Json]` Creates a Transform type */
      Transform(type) {
        return (0, index_36.Transform)(type);
      }
      /** `[Json]` Creates a Tuple type */
      Tuple(types, options) {
        return (0, index_37.Tuple)(types, options);
      }
      /** `[Json]` Intrinsic function to Uncapitalize LiteralString types */
      Uncapitalize(type, options) {
        return (0, index_13.Uncapitalize)(type, options);
      }
      /** `[Json]` Creates a Union type */
      Union(types, options) {
        return (0, index_38.Union)(types, options);
      }
      /** `[Json]` Creates an Unknown type */
      Unknown(options) {
        return (0, index_39.Unknown)(options);
      }
      /** `[Json]` Creates a Unsafe type that will infers as the generic argument T */
      Unsafe(options) {
        return (0, index_40.Unsafe)(options);
      }
      /** `[Json]` Intrinsic function to Uppercase LiteralString types */
      Uppercase(schema, options) {
        return (0, index_13.Uppercase)(schema, options);
      }
    };
    exports.JsonTypeBuilder = JsonTypeBuilder;
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/type/type.js
var require_type5 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/type/type.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Rest = exports.Required = exports.RegExp = exports.Ref = exports.Recursive = exports.Record = exports.ReadonlyOptional = exports.Readonly = exports.Promise = exports.Pick = exports.Partial = exports.Parameters = exports.Optional = exports.Omit = exports.Object = exports.Number = exports.Null = exports.Not = exports.Never = exports.Module = exports.Mapped = exports.Literal = exports.KeyOf = exports.Iterator = exports.Uppercase = exports.Lowercase = exports.Uncapitalize = exports.Capitalize = exports.Intersect = exports.Integer = exports.Instantiate = exports.InstanceType = exports.Index = exports.Function = exports.Extract = exports.Extends = exports.Exclude = exports.Enum = exports.Date = exports.ConstructorParameters = exports.Constructor = exports.Const = exports.Composite = exports.Boolean = exports.BigInt = exports.Awaited = exports.AsyncIterator = exports.Array = exports.Argument = exports.Any = void 0;
    exports.Void = exports.Unsafe = exports.Unknown = exports.Union = exports.Undefined = exports.Uint8Array = exports.Tuple = exports.Transform = exports.TemplateLiteral = exports.Symbol = exports.String = exports.ReturnType = void 0;
    var index_1 = require_any2();
    Object.defineProperty(exports, "Any", { enumerable: true, get: function() {
      return index_1.Any;
    } });
    var index_2 = require_argument2();
    Object.defineProperty(exports, "Argument", { enumerable: true, get: function() {
      return index_2.Argument;
    } });
    var index_3 = require_array2();
    Object.defineProperty(exports, "Array", { enumerable: true, get: function() {
      return index_3.Array;
    } });
    var index_4 = require_async_iterator2();
    Object.defineProperty(exports, "AsyncIterator", { enumerable: true, get: function() {
      return index_4.AsyncIterator;
    } });
    var index_5 = require_awaited2();
    Object.defineProperty(exports, "Awaited", { enumerable: true, get: function() {
      return index_5.Awaited;
    } });
    var index_6 = require_bigint2();
    Object.defineProperty(exports, "BigInt", { enumerable: true, get: function() {
      return index_6.BigInt;
    } });
    var index_7 = require_boolean2();
    Object.defineProperty(exports, "Boolean", { enumerable: true, get: function() {
      return index_7.Boolean;
    } });
    var index_8 = require_composite2();
    Object.defineProperty(exports, "Composite", { enumerable: true, get: function() {
      return index_8.Composite;
    } });
    var index_9 = require_const2();
    Object.defineProperty(exports, "Const", { enumerable: true, get: function() {
      return index_9.Const;
    } });
    var index_10 = require_constructor2();
    Object.defineProperty(exports, "Constructor", { enumerable: true, get: function() {
      return index_10.Constructor;
    } });
    var index_11 = require_constructor_parameters2();
    Object.defineProperty(exports, "ConstructorParameters", { enumerable: true, get: function() {
      return index_11.ConstructorParameters;
    } });
    var index_12 = require_date2();
    Object.defineProperty(exports, "Date", { enumerable: true, get: function() {
      return index_12.Date;
    } });
    var index_13 = require_enum2();
    Object.defineProperty(exports, "Enum", { enumerable: true, get: function() {
      return index_13.Enum;
    } });
    var index_14 = require_exclude2();
    Object.defineProperty(exports, "Exclude", { enumerable: true, get: function() {
      return index_14.Exclude;
    } });
    var index_15 = require_extends2();
    Object.defineProperty(exports, "Extends", { enumerable: true, get: function() {
      return index_15.Extends;
    } });
    var index_16 = require_extract2();
    Object.defineProperty(exports, "Extract", { enumerable: true, get: function() {
      return index_16.Extract;
    } });
    var index_17 = require_function2();
    Object.defineProperty(exports, "Function", { enumerable: true, get: function() {
      return index_17.Function;
    } });
    var index_18 = require_indexed2();
    Object.defineProperty(exports, "Index", { enumerable: true, get: function() {
      return index_18.Index;
    } });
    var index_19 = require_instance_type2();
    Object.defineProperty(exports, "InstanceType", { enumerable: true, get: function() {
      return index_19.InstanceType;
    } });
    var index_20 = require_instantiate2();
    Object.defineProperty(exports, "Instantiate", { enumerable: true, get: function() {
      return index_20.Instantiate;
    } });
    var index_21 = require_integer2();
    Object.defineProperty(exports, "Integer", { enumerable: true, get: function() {
      return index_21.Integer;
    } });
    var index_22 = require_intersect2();
    Object.defineProperty(exports, "Intersect", { enumerable: true, get: function() {
      return index_22.Intersect;
    } });
    var index_23 = require_intrinsic2();
    Object.defineProperty(exports, "Capitalize", { enumerable: true, get: function() {
      return index_23.Capitalize;
    } });
    Object.defineProperty(exports, "Uncapitalize", { enumerable: true, get: function() {
      return index_23.Uncapitalize;
    } });
    Object.defineProperty(exports, "Lowercase", { enumerable: true, get: function() {
      return index_23.Lowercase;
    } });
    Object.defineProperty(exports, "Uppercase", { enumerable: true, get: function() {
      return index_23.Uppercase;
    } });
    var index_24 = require_iterator2();
    Object.defineProperty(exports, "Iterator", { enumerable: true, get: function() {
      return index_24.Iterator;
    } });
    var index_25 = require_keyof2();
    Object.defineProperty(exports, "KeyOf", { enumerable: true, get: function() {
      return index_25.KeyOf;
    } });
    var index_26 = require_literal2();
    Object.defineProperty(exports, "Literal", { enumerable: true, get: function() {
      return index_26.Literal;
    } });
    var index_27 = require_mapped2();
    Object.defineProperty(exports, "Mapped", { enumerable: true, get: function() {
      return index_27.Mapped;
    } });
    var index_28 = require_module2();
    Object.defineProperty(exports, "Module", { enumerable: true, get: function() {
      return index_28.Module;
    } });
    var index_29 = require_never2();
    Object.defineProperty(exports, "Never", { enumerable: true, get: function() {
      return index_29.Never;
    } });
    var index_30 = require_not2();
    Object.defineProperty(exports, "Not", { enumerable: true, get: function() {
      return index_30.Not;
    } });
    var index_31 = require_null2();
    Object.defineProperty(exports, "Null", { enumerable: true, get: function() {
      return index_31.Null;
    } });
    var index_32 = require_number2();
    Object.defineProperty(exports, "Number", { enumerable: true, get: function() {
      return index_32.Number;
    } });
    var index_33 = require_object2();
    Object.defineProperty(exports, "Object", { enumerable: true, get: function() {
      return index_33.Object;
    } });
    var index_34 = require_omit2();
    Object.defineProperty(exports, "Omit", { enumerable: true, get: function() {
      return index_34.Omit;
    } });
    var index_35 = require_optional2();
    Object.defineProperty(exports, "Optional", { enumerable: true, get: function() {
      return index_35.Optional;
    } });
    var index_36 = require_parameters2();
    Object.defineProperty(exports, "Parameters", { enumerable: true, get: function() {
      return index_36.Parameters;
    } });
    var index_37 = require_partial2();
    Object.defineProperty(exports, "Partial", { enumerable: true, get: function() {
      return index_37.Partial;
    } });
    var index_38 = require_pick2();
    Object.defineProperty(exports, "Pick", { enumerable: true, get: function() {
      return index_38.Pick;
    } });
    var index_39 = require_promise2();
    Object.defineProperty(exports, "Promise", { enumerable: true, get: function() {
      return index_39.Promise;
    } });
    var index_40 = require_readonly2();
    Object.defineProperty(exports, "Readonly", { enumerable: true, get: function() {
      return index_40.Readonly;
    } });
    var index_41 = require_readonly_optional2();
    Object.defineProperty(exports, "ReadonlyOptional", { enumerable: true, get: function() {
      return index_41.ReadonlyOptional;
    } });
    var index_42 = require_record2();
    Object.defineProperty(exports, "Record", { enumerable: true, get: function() {
      return index_42.Record;
    } });
    var index_43 = require_recursive2();
    Object.defineProperty(exports, "Recursive", { enumerable: true, get: function() {
      return index_43.Recursive;
    } });
    var index_44 = require_ref2();
    Object.defineProperty(exports, "Ref", { enumerable: true, get: function() {
      return index_44.Ref;
    } });
    var index_45 = require_regexp2();
    Object.defineProperty(exports, "RegExp", { enumerable: true, get: function() {
      return index_45.RegExp;
    } });
    var index_46 = require_required2();
    Object.defineProperty(exports, "Required", { enumerable: true, get: function() {
      return index_46.Required;
    } });
    var index_47 = require_rest2();
    Object.defineProperty(exports, "Rest", { enumerable: true, get: function() {
      return index_47.Rest;
    } });
    var index_48 = require_return_type2();
    Object.defineProperty(exports, "ReturnType", { enumerable: true, get: function() {
      return index_48.ReturnType;
    } });
    var index_49 = require_string2();
    Object.defineProperty(exports, "String", { enumerable: true, get: function() {
      return index_49.String;
    } });
    var index_50 = require_symbol2();
    Object.defineProperty(exports, "Symbol", { enumerable: true, get: function() {
      return index_50.Symbol;
    } });
    var index_51 = require_template_literal2();
    Object.defineProperty(exports, "TemplateLiteral", { enumerable: true, get: function() {
      return index_51.TemplateLiteral;
    } });
    var index_52 = require_transform2();
    Object.defineProperty(exports, "Transform", { enumerable: true, get: function() {
      return index_52.Transform;
    } });
    var index_53 = require_tuple2();
    Object.defineProperty(exports, "Tuple", { enumerable: true, get: function() {
      return index_53.Tuple;
    } });
    var index_54 = require_uint8array2();
    Object.defineProperty(exports, "Uint8Array", { enumerable: true, get: function() {
      return index_54.Uint8Array;
    } });
    var index_55 = require_undefined2();
    Object.defineProperty(exports, "Undefined", { enumerable: true, get: function() {
      return index_55.Undefined;
    } });
    var index_56 = require_union2();
    Object.defineProperty(exports, "Union", { enumerable: true, get: function() {
      return index_56.Union;
    } });
    var index_57 = require_unknown2();
    Object.defineProperty(exports, "Unknown", { enumerable: true, get: function() {
      return index_57.Unknown;
    } });
    var index_58 = require_unsafe2();
    Object.defineProperty(exports, "Unsafe", { enumerable: true, get: function() {
      return index_58.Unsafe;
    } });
    var index_59 = require_void2();
    Object.defineProperty(exports, "Void", { enumerable: true, get: function() {
      return index_59.Void;
    } });
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/type/javascript.js
var require_javascript = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/type/javascript.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaScriptTypeBuilder = void 0;
    var json_1 = require_json();
    var index_1 = require_argument2();
    var index_2 = require_async_iterator2();
    var index_3 = require_awaited2();
    var index_4 = require_bigint2();
    var index_5 = require_constructor2();
    var index_6 = require_constructor_parameters2();
    var index_7 = require_date2();
    var index_8 = require_function2();
    var index_9 = require_instance_type2();
    var index_10 = require_instantiate2();
    var index_11 = require_iterator2();
    var index_12 = require_parameters2();
    var index_13 = require_promise2();
    var index_14 = require_regexp2();
    var index_15 = require_return_type2();
    var index_16 = require_symbol2();
    var index_17 = require_uint8array2();
    var index_18 = require_undefined2();
    var index_19 = require_void2();
    var JavaScriptTypeBuilder = class extends json_1.JsonTypeBuilder {
      /** `[JavaScript]` Creates a Generic Argument Type */
      Argument(index) {
        return (0, index_1.Argument)(index);
      }
      /** `[JavaScript]` Creates a AsyncIterator type */
      AsyncIterator(items, options) {
        return (0, index_2.AsyncIterator)(items, options);
      }
      /** `[JavaScript]` Constructs a type by recursively unwrapping Promise types */
      Awaited(schema, options) {
        return (0, index_3.Awaited)(schema, options);
      }
      /** `[JavaScript]` Creates a BigInt type */
      BigInt(options) {
        return (0, index_4.BigInt)(options);
      }
      /** `[JavaScript]` Extracts the ConstructorParameters from the given Constructor type */
      ConstructorParameters(schema, options) {
        return (0, index_6.ConstructorParameters)(schema, options);
      }
      /** `[JavaScript]` Creates a Constructor type */
      Constructor(parameters, instanceType, options) {
        return (0, index_5.Constructor)(parameters, instanceType, options);
      }
      /** `[JavaScript]` Creates a Date type */
      Date(options = {}) {
        return (0, index_7.Date)(options);
      }
      /** `[JavaScript]` Creates a Function type */
      Function(parameters, returnType, options) {
        return (0, index_8.Function)(parameters, returnType, options);
      }
      /** `[JavaScript]` Extracts the InstanceType from the given Constructor type */
      InstanceType(schema, options) {
        return (0, index_9.InstanceType)(schema, options);
      }
      /** `[JavaScript]` Instantiates a type with the given parameters */
      Instantiate(schema, parameters) {
        return (0, index_10.Instantiate)(schema, parameters);
      }
      /** `[JavaScript]` Creates an Iterator type */
      Iterator(items, options) {
        return (0, index_11.Iterator)(items, options);
      }
      /** `[JavaScript]` Extracts the Parameters from the given Function type */
      Parameters(schema, options) {
        return (0, index_12.Parameters)(schema, options);
      }
      /** `[JavaScript]` Creates a Promise type */
      Promise(item, options) {
        return (0, index_13.Promise)(item, options);
      }
      /** `[JavaScript]` Creates a RegExp type */
      RegExp(unresolved, options) {
        return (0, index_14.RegExp)(unresolved, options);
      }
      /** `[JavaScript]` Extracts the ReturnType from the given Function type */
      ReturnType(type, options) {
        return (0, index_15.ReturnType)(type, options);
      }
      /** `[JavaScript]` Creates a Symbol type */
      Symbol(options) {
        return (0, index_16.Symbol)(options);
      }
      /** `[JavaScript]` Creates a Undefined type */
      Undefined(options) {
        return (0, index_18.Undefined)(options);
      }
      /** `[JavaScript]` Creates a Uint8Array type */
      Uint8Array(options) {
        return (0, index_17.Uint8Array)(options);
      }
      /** `[JavaScript]` Creates a Void type */
      Void(options) {
        return (0, index_19.Void)(options);
      }
    };
    exports.JavaScriptTypeBuilder = JavaScriptTypeBuilder;
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/type/index.js
var require_type6 = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/type/type/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Type = exports.JavaScriptTypeBuilder = exports.JsonTypeBuilder = void 0;
    var json_1 = require_json();
    Object.defineProperty(exports, "JsonTypeBuilder", { enumerable: true, get: function() {
      return json_1.JsonTypeBuilder;
    } });
    var TypeBuilder = __importStar(require_type5());
    var javascript_1 = require_javascript();
    Object.defineProperty(exports, "JavaScriptTypeBuilder", { enumerable: true, get: function() {
      return javascript_1.JavaScriptTypeBuilder;
    } });
    var Type8 = TypeBuilder;
    exports.Type = Type8;
  }
});

// ../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/index.js
var require_cjs = __commonJS({
  "../indus-rebuild/node_modules/@sinclair/typebox/build/cjs/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_clone(), exports);
    __exportStar(require_create(), exports);
    __exportStar(require_error2(), exports);
    __exportStar(require_guard3(), exports);
    __exportStar(require_helpers2(), exports);
    __exportStar(require_patterns2(), exports);
    __exportStar(require_registry(), exports);
    __exportStar(require_sets(), exports);
    __exportStar(require_symbols2(), exports);
    __exportStar(require_any2(), exports);
    __exportStar(require_array2(), exports);
    __exportStar(require_argument2(), exports);
    __exportStar(require_async_iterator2(), exports);
    __exportStar(require_awaited2(), exports);
    __exportStar(require_bigint2(), exports);
    __exportStar(require_boolean2(), exports);
    __exportStar(require_composite2(), exports);
    __exportStar(require_const2(), exports);
    __exportStar(require_constructor2(), exports);
    __exportStar(require_constructor_parameters2(), exports);
    __exportStar(require_date2(), exports);
    __exportStar(require_enum2(), exports);
    __exportStar(require_exclude2(), exports);
    __exportStar(require_extends2(), exports);
    __exportStar(require_extract2(), exports);
    __exportStar(require_function2(), exports);
    __exportStar(require_indexed2(), exports);
    __exportStar(require_instance_type2(), exports);
    __exportStar(require_instantiate2(), exports);
    __exportStar(require_integer2(), exports);
    __exportStar(require_intersect2(), exports);
    __exportStar(require_iterator2(), exports);
    __exportStar(require_intrinsic2(), exports);
    __exportStar(require_keyof2(), exports);
    __exportStar(require_literal2(), exports);
    __exportStar(require_module2(), exports);
    __exportStar(require_mapped2(), exports);
    __exportStar(require_never2(), exports);
    __exportStar(require_not2(), exports);
    __exportStar(require_null2(), exports);
    __exportStar(require_number2(), exports);
    __exportStar(require_object2(), exports);
    __exportStar(require_omit2(), exports);
    __exportStar(require_optional2(), exports);
    __exportStar(require_parameters2(), exports);
    __exportStar(require_partial2(), exports);
    __exportStar(require_pick2(), exports);
    __exportStar(require_promise2(), exports);
    __exportStar(require_readonly2(), exports);
    __exportStar(require_readonly_optional2(), exports);
    __exportStar(require_record2(), exports);
    __exportStar(require_recursive2(), exports);
    __exportStar(require_ref2(), exports);
    __exportStar(require_regexp2(), exports);
    __exportStar(require_required2(), exports);
    __exportStar(require_rest2(), exports);
    __exportStar(require_return_type2(), exports);
    __exportStar(require_schema2(), exports);
    __exportStar(require_static2(), exports);
    __exportStar(require_string2(), exports);
    __exportStar(require_symbol2(), exports);
    __exportStar(require_template_literal2(), exports);
    __exportStar(require_transform2(), exports);
    __exportStar(require_tuple2(), exports);
    __exportStar(require_uint8array2(), exports);
    __exportStar(require_undefined2(), exports);
    __exportStar(require_union2(), exports);
    __exportStar(require_unknown2(), exports);
    __exportStar(require_unsafe2(), exports);
    __exportStar(require_void2(), exports);
    __exportStar(require_type6(), exports);
  }
});

// src/conductor/bash-guard.ts
var OPERATORS = ["&&", "||", ";", "|", "&", "\n"];
function splitTopLevel(command) {
  const slices = [];
  let current = "";
  let quote;
  let i = 0;
  const flush = () => {
    const trimmed = current.trim();
    if (trimmed.length > 0) slices.push(trimmed);
    current = "";
  };
  while (i < command.length) {
    const ch = command[i];
    if (ch === "\\" && quote !== "'") {
      current += ch;
      if (i + 1 < command.length) {
        current += command[i + 1];
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (quote !== void 0) {
      current += ch;
      if (ch === quote) quote = void 0;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      i += 1;
      continue;
    }
    let matched;
    for (const op of OPERATORS) {
      if (command.startsWith(op, i)) {
        matched = op;
        break;
      }
    }
    if (matched !== void 0) {
      flush();
      i += matched.length;
      continue;
    }
    current += ch;
    i += 1;
  }
  flush();
  return slices;
}
function extractSubshells(slice) {
  const inner = [];
  let outer = "";
  let quote;
  let i = 0;
  while (i < slice.length) {
    const ch = slice[i];
    if (ch === "\\" && quote !== "'") {
      outer += ch;
      if (i + 1 < slice.length) {
        outer += slice[i + 1];
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (quote !== void 0) {
      if (quote === '"' && ch === "`") {
        const close = findBacktickClose(slice, i + 1);
        inner.push(slice.slice(i + 1, close));
        i = close + 1;
        continue;
      }
      outer += ch;
      if (ch === quote) quote = void 0;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      outer += ch;
      i += 1;
      continue;
    }
    if (ch === "(" || ch === "$" && slice[i + 1] === "(") {
      const start = ch === "$" ? i + 2 : i + 1;
      const close = findParenClose(slice, start);
      inner.push(slice.slice(start, close));
      i = close + 1;
      continue;
    }
    if (ch === "`") {
      const close = findBacktickClose(slice, i + 1);
      inner.push(slice.slice(i + 1, close));
      i = close + 1;
      continue;
    }
    outer += ch;
    i += 1;
  }
  return { outer: outer.trim(), inner };
}
function findParenClose(s, start) {
  let depth = 1;
  let quote;
  let i = start;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "\\" && quote !== "'") {
      i += 2;
      continue;
    }
    if (quote !== void 0) {
      if (ch === quote) quote = void 0;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      i += 1;
      continue;
    }
    if (ch === "(" || ch === "$" && s[i + 1] === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return s.length;
}
function findBacktickClose(s, start) {
  let i = start;
  while (i < s.length) {
    if (s[i] === "\\") {
      i += 2;
      continue;
    }
    if (s[i] === "`") return i;
    i += 1;
  }
  return s.length;
}
function tokenizeArgv(slice) {
  const tokens = [];
  let current = "";
  let started = false;
  let quote;
  let i = 0;
  const flush = () => {
    if (started) tokens.push(current);
    current = "";
    started = false;
  };
  while (i < slice.length) {
    const ch = slice[i];
    if (ch === "\\" && quote !== "'") {
      if (i + 1 < slice.length) {
        current += slice[i + 1];
        started = true;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (quote !== void 0) {
      if (ch === quote) {
        quote = void 0;
      } else {
        current += ch;
      }
      started = true;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
      i += 1;
      continue;
    }
    if (ch === " " || ch === "	") {
      flush();
      i += 1;
      continue;
    }
    current += ch;
    started = true;
    i += 1;
  }
  flush();
  return tokens;
}
var WRAPPERS = /* @__PURE__ */ new Set([
  "env",
  "nice",
  "nohup",
  "timeout",
  "xargs",
  "command",
  "builtin",
  "time",
  "stdbuf",
  "setsid",
  "ionice"
]);
var ELEVATION = /* @__PURE__ */ new Set(["sudo", "doas"]);
function stripWrappers(argv) {
  const rest = [...argv];
  let elevated = false;
  for (; ; ) {
    const head = rest[0];
    if (head === void 0) break;
    const token = head.toLowerCase();
    if (ELEVATION.has(token)) {
      rest.shift();
      elevated = true;
      consumeWrapperOptions(rest, token);
      continue;
    }
    if (WRAPPERS.has(token)) {
      rest.shift();
      consumeWrapperOptions(rest, token);
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(head)) {
      rest.shift();
      continue;
    }
    break;
  }
  return { rest, elevated };
}
function consumeWrapperOptions(rest, wrapper) {
  for (; ; ) {
    const head = rest[0];
    if (head === void 0) return;
    if (head === "--") {
      rest.shift();
      return;
    }
    if (head.startsWith("-")) {
      rest.shift();
      if (!head.includes("=") && FLAG_TAKES_VALUE.has(head)) {
        const value = rest[0];
        if (value !== void 0 && !value.startsWith("-")) rest.shift();
      }
      continue;
    }
    if ((wrapper === "timeout" || wrapper === "nice") && /^\d+[a-z]?$/i.test(head)) {
      rest.shift();
      continue;
    }
    return;
  }
}
var FLAG_TAKES_VALUE = /* @__PURE__ */ new Set(["-n", "-u", "-g", "-s", "--kill-after", "--signal", "--user"]);
function parseBashCommand(command) {
  if (typeof command !== "string" || command.trim().length === 0) return [];
  const out = [];
  parseInto(command, out);
  return out;
}
function parseInto(command, out) {
  for (const slice of splitTopLevel(command)) {
    const { outer, inner } = extractSubshells(slice);
    if (outer.length > 0) {
      const argv = tokenizeArgv(outer);
      if (argv.length > 0) {
        const { rest, elevated } = stripWrappers(argv);
        const name = rest[0];
        if (name !== void 0 && name.length > 0) {
          out.push({
            name: name.toLowerCase(),
            args: rest.slice(1),
            elevated,
            raw: slice.trim()
          });
        }
      }
    }
    for (const body of inner) {
      if (body.trim().length > 0) parseInto(body, out);
    }
  }
}
function catastrophicMessage(reason) {
  return `This command is blocked: ${reason}. It is on the built-in catastrophic-command blocklist and cannot be run regardless of permission rules.`;
}
function normPath(token) {
  const collapsed = token.replace(/\/+/g, "/");
  if (collapsed.length > 1 && collapsed.endsWith("/")) return collapsed.slice(0, -1);
  return collapsed;
}
var ROOT_TARGETS = /* @__PURE__ */ new Set([
  "/",
  "/*",
  "~",
  "~/",
  "$home",
  "$home/",
  "/bin",
  "/boot",
  "/dev",
  "/etc",
  "/home",
  "/lib",
  "/opt",
  "/proc",
  "/root",
  "/sbin",
  "/srv",
  "/sys",
  "/usr",
  "/var"
]);
function isRootRm(cmd) {
  if (cmd.name !== "rm") return false;
  let recursive = false;
  const targets = [];
  for (const arg of cmd.args) {
    if (arg.startsWith("--")) {
      if (arg === "--recursive") recursive = true;
      continue;
    }
    if (arg.startsWith("-") && arg.length > 1) {
      if (arg.includes("r") || arg.includes("R")) recursive = true;
      continue;
    }
    targets.push(normPath(arg.toLowerCase()));
  }
  if (!recursive) return false;
  return targets.some((t) => ROOT_TARGETS.has(t) || t === "/.." || /^\/[a-z]+\/\*$/.test(t));
}
var FORK_BOMB = /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/;
var CATASTROPHIC_RULES = [
  {
    reason: "recursive force-delete of a root or system directory (rm -rf /)",
    test: isRootRm
  },
  {
    reason: "piping a downloaded remote script straight into a shell (curl | sh)",
    test: isRemoteScriptPipedToShell
  },
  {
    reason: "writing raw bytes to a block device (dd of=/dev/\u2026)",
    test: (cmd) => cmd.name === "dd" && cmd.args.some((a) => /^of=\/dev\/(sd|nvme|disk|hd|mmcblk|vd)/i.test(a))
  },
  {
    reason: "formatting a filesystem (mkfs)",
    test: (cmd) => /^mkfs(\.|$)/.test(cmd.name)
  },
  {
    reason: "redirecting output over a raw disk device (> /dev/sd\u2026)",
    test: (cmd) => /[>]\s*\/dev\/(sd|nvme|disk|hd|mmcblk|vd)/i.test(cmd.raw)
  },
  {
    reason: "world-writable recursive chmod of a root or system directory (chmod -R 777 /)",
    test: isRootChmod
  }
];
var SHELL_SINKS = /* @__PURE__ */ new Set(["sh", "bash", "zsh", "dash", "ksh", "fish", "csh", "tcsh"]);
var FETCHERS = /* @__PURE__ */ new Set(["curl", "wget", "fetch"]);
function isRemoteScriptPipedToShell(cmd) {
  if (!SHELL_SINKS.has(cmd.name)) return false;
  return /\b(curl|wget|fetch)\b/i.test(cmd.raw) && /https?:\/\//i.test(cmd.raw);
}
function isRootChmod(cmd) {
  if (cmd.name !== "chmod") return false;
  let recursive = false;
  let world = false;
  const targets = [];
  for (const arg of cmd.args) {
    if (arg === "-R" || arg === "--recursive" || /^-[a-z]*R/i.test(arg)) recursive = true;
    else if (/^[0-7]?777$/.test(arg) || arg.includes("o+w") || arg.includes("a+w")) world = true;
    else if (!arg.startsWith("-")) targets.push(normPath(arg.toLowerCase()));
  }
  return recursive && world && targets.some((t) => ROOT_TARGETS.has(t));
}
function scanForRemotePipeToShell(cmds) {
  const hasRemoteFetch = cmds.some(
    (c) => FETCHERS.has(c.name) && c.args.some((a) => /^https?:\/\//i.test(a))
  );
  if (!hasRemoteFetch) return void 0;
  const hasShellSink = cmds.some(
    (c) => SHELL_SINKS.has(c.name) && !c.args.some((a) => !a.startsWith("-") && /\.(sh|bash)$/i.test(a))
  );
  if (hasShellSink) {
    return "piping a downloaded remote script straight into a shell (curl | sh)";
  }
  return void 0;
}
function catastrophicReason(cmd) {
  for (const rule of CATASTROPHIC_RULES) {
    if (rule.test(cmd)) return rule.reason;
  }
  return void 0;
}
function evaluateCatastrophic(command) {
  if (FORK_BOMB.test(command)) {
    return catastrophicMessage("fork bomb");
  }
  const cmds = parseBashCommand(command);
  if (cmds.length === 0) return void 0;
  for (const cmd of cmds) {
    const reason = catastrophicReason(cmd);
    if (reason !== void 0) return catastrophicMessage(reason);
  }
  const piped = scanForRemotePipeToShell(cmds);
  if (piped !== void 0) return catastrophicMessage(piped);
  return void 0;
}
function bashSubcommandSubjects(command) {
  const cmds = parseBashCommand(command);
  if (cmds.length === 0) return [command];
  return cmds.map((c) => [c.name, ...c.args].join(" ").trim());
}

// src/conductor/permissions.ts
var READ_ONLY_TOOL_NAMES = /* @__PURE__ */ new Set([
  "read",
  "ls",
  "grep",
  "find",
  "glob",
  "websearch",
  "webfetch",
  "todoread"
]);
var EDIT_TOOL_NAMES = /* @__PURE__ */ new Set(["edit", "write", "multiedit"]);
function canon(toolName) {
  return toolName.toLowerCase();
}
function isReadOnlyToolName(toolName, extra) {
  const name = canon(toolName);
  if (READ_ONLY_TOOL_NAMES.has(name)) return true;
  if (extra) {
    for (const candidate of extra) {
      if (canon(candidate) === name) return true;
    }
  }
  return false;
}
function isEditToolName(toolName) {
  return EDIT_TOOL_NAMES.has(canon(toolName));
}
function normalizeMode(mode) {
  return mode === "bypassPermissions" ? "bypass" : mode;
}
function parseRule(raw) {
  const trimmed = raw.trim();
  const open = trimmed.indexOf("(");
  if (open === -1 || !trimmed.endsWith(")")) {
    return { toolName: trimmed };
  }
  const toolName = trimmed.slice(0, open).trim();
  const ruleContent = trimmed.slice(open + 1, trimmed.length - 1).trim();
  return ruleContent.length > 0 ? { toolName, ruleContent } : { toolName };
}
function makeRule(ruleBehavior, raw) {
  return { ruleBehavior, ruleValue: parseRule(raw) };
}
function ruleSubject(toolName, input) {
  if (input === null || typeof input !== "object") {
    return typeof input === "string" ? input : "";
  }
  const bag = input;
  const name = canon(toolName);
  if ((name === "bash" || name === "shell") && typeof bag.command === "string") {
    return bag.command;
  }
  if (typeof bag.command === "string") return bag.command;
  try {
    return JSON.stringify(bag);
  } catch {
    return "";
  }
}
function specifierMatches(specifier, subject) {
  if (specifier.endsWith(":*")) {
    return subject.startsWith(specifier.slice(0, -2));
  }
  if (specifier.endsWith("*") && !specifier.slice(0, -1).includes("*")) {
    return subject.startsWith(specifier.slice(0, -1));
  }
  if (specifier.includes("*")) {
    const escaped = specifier.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`).test(subject);
  }
  return specifier === subject;
}
function isBashTool(toolName) {
  const name = canon(toolName);
  return name === "bash" || name === "shell";
}
function bashSubjects(toolName, input) {
  const command = ruleSubject(toolName, input);
  if (command.length === 0) return [];
  return bashSubcommandSubjects(command);
}
function toolMatchesRule(toolName, input, rule) {
  const ruleName = canon(rule.ruleValue.toolName);
  const callName = canon(toolName);
  const nameMatches = ruleName === callName || ruleName.startsWith("mcp__") && callName.startsWith(`${ruleName}__`);
  if (!nameMatches) return false;
  const specifier = rule.ruleValue.ruleContent;
  if (specifier === void 0) return true;
  if (isBashTool(toolName)) {
    const subjects = bashSubjects(toolName, input);
    if (subjects.length === 0) return specifierMatches(specifier, ruleSubject(toolName, input));
    return subjects.some((subject) => specifierMatches(specifier, subject));
  }
  return specifierMatches(specifier, ruleSubject(toolName, input));
}
function bashAllowSetCoversAll(toolName, input, allowRules) {
  const callName = canon(toolName);
  const subjects = bashSubjects(toolName, input);
  if (subjects.length === 0) return false;
  return subjects.every(
    (subject) => allowRules.some((rule) => {
      if (canon(rule.ruleValue.toolName) !== callName) return false;
      const specifier = rule.ruleValue.ruleContent;
      if (specifier === void 0) return true;
      return specifierMatches(specifier, subject);
    })
  );
}
function resolveRuleDecision(toolName, input, rules, mode, readOnlyExtra) {
  const m = normalizeMode(mode);
  if (isBashTool(toolName)) {
    const command = ruleSubject(toolName, input);
    if (command.length > 0 && evaluateCatastrophic(command) !== void 0) {
      return "deny";
    }
  }
  for (const rule of rules) {
    if (rule.ruleBehavior === "deny" && toolMatchesRule(toolName, input, rule)) {
      return "deny";
    }
  }
  const readOnly = isReadOnlyToolName(toolName, readOnlyExtra);
  if (m === "plan" && !readOnly) {
    return "deny";
  }
  for (const rule of rules) {
    if (rule.ruleBehavior === "ask" && toolMatchesRule(toolName, input, rule)) {
      return "ask";
    }
  }
  if (m === "bypass") {
    return "allow";
  }
  if (readOnly) {
    return "allow";
  }
  if (m === "acceptEdits" && isEditToolName(toolName)) {
    return "allow";
  }
  if (isBashTool(toolName)) {
    const allowRules = rules.filter((r) => r.ruleBehavior === "allow");
    if (allowRules.length > 0 && bashAllowSetCoversAll(toolName, input, allowRules)) {
      return "allow";
    }
  } else {
    for (const rule of rules) {
      if (rule.ruleBehavior === "allow" && toolMatchesRule(toolName, input, rule)) {
        return "allow";
      }
    }
  }
  return "ask";
}
function allowAlwaysRuleStrings(toolName, input) {
  if (isBashTool(toolName)) {
    const bag = input;
    const command = typeof input === "string" ? input : bag !== null && typeof bag === "object" && typeof bag.command === "string" ? bag.command : "";
    if (command.length > 0) {
      return bashSubcommandSubjects(command).map((subject) => `${toolName}(${subject})`);
    }
  }
  return [toolName];
}
function noResolverMessage(toolName) {
  return `Tool "${toolName}" requires approval, but no interactive approval prompt is available here (a non-interactive run, or a sub-agent). Denying. Add an allow rule under permissions.allow in settings, or run with --permission-mode acceptEdits/bypass, to permit it.`;
}
function declinedMessage(toolName) {
  return `Tool "${toolName}" was denied by the user.`;
}
function blockedMessage(toolName) {
  return `Tool "${toolName}" is blocked by the active permission policy.`;
}
function createPermissionGate(config) {
  return async (toolName, input, opts) => {
    if (isBashTool(toolName)) {
      const command = ruleSubject(toolName, input);
      if (command.length > 0) {
        const reason = evaluateCatastrophic(command);
        if (reason !== void 0) {
          return { behavior: "deny", message: reason };
        }
      }
    }
    const behavior = resolveRuleDecision(
      toolName,
      input,
      config.rules,
      config.mode(),
      config.readOnlyToolNames
    );
    if (behavior === "allow") {
      return { behavior: "allow" };
    }
    if (behavior === "deny") {
      return { behavior: "deny", message: blockedMessage(toolName) };
    }
    const resolver = config.requestApproval;
    if (resolver === void 0) {
      return { behavior: "deny", message: noResolverMessage(toolName) };
    }
    let choice;
    try {
      choice = await resolver(toolName, input, opts);
    } catch {
      choice = "deny";
    }
    if (choice === "allow-once" || choice === "allow-always") {
      if (choice === "allow-always" && config.appendAllowRule) {
        for (const raw of allowAlwaysRuleStrings(toolName, input)) {
          config.appendAllowRule(makeRule("allow", raw));
        }
      }
      return { behavior: "allow" };
    }
    if (choice === "unavailable") {
      return { behavior: "deny", message: noResolverMessage(toolName) };
    }
    return { behavior: "deny", message: declinedMessage(toolName) };
  };
}

// src/briefing/compose.ts
function joinBlocks(parts) {
  return parts.filter((p) => p.trim().length > 0).join("\n\n");
}
function bullets(lines) {
  return lines.map((l) => `- ${l}`).join("\n");
}
function escapeXml(value) {
  let out = "";
  for (const ch of value) {
    switch (ch) {
      case "&":
        out += "&amp;";
        break;
      case "<":
        out += "&lt;";
        break;
      case ">":
        out += "&gt;";
        break;
      case '"':
        out += "&quot;";
        break;
      case "'":
        out += "&#39;";
        break;
      default:
        out += ch;
    }
  }
  return out;
}
function hasTool(ctx, id) {
  return (ctx.tools ?? []).some((t) => t.name === id);
}
function hasToolPrefix(ctx, prefix) {
  return (ctx.tools ?? []).some((t) => t.name.startsWith(prefix));
}
var TOOL_SUMMARIES = {
  read: "Open a file's contents for inspection.",
  write: "Create a new file or overwrite an existing one wholesale.",
  edit: "Apply a precise in-place change by matching exact existing text.",
  bash: "Run a shell command in the workspace.",
  grep: "Search file contents by pattern across the tree.",
  find: "Locate files and directories by name or glob.",
  ls: "List the entries of a directory.",
  task: "Hand a self-contained sub-task to a delegate agent.",
  todoread: "Read back the current task checklist.",
  todowrite: "Record or revise the task checklist.",
  webfetch: "Retrieve and read the contents of a URL.",
  websearch: "Query the web for current information."
};
function describeTool(tool) {
  const summary = TOOL_SUMMARIES[tool.name] ?? tool.description?.trim() ?? "";
  return summary.length > 0 ? `\`${tool.name}\` \u2014 ${summary}` : `\`${tool.name}\``;
}
var ROLE_SECTION = {
  id: "role",
  render() {
    return joinBlocks([
      "You are a terminal-based software engineering assistant. You operate inside a real workspace and make progress by reading code, running commands, and editing files directly \u2014 not by describing what someone else should do.",
      "Work toward the user's actual goal. Take the initiative to gather the context you need, but stay within the scope of what was asked: do not redesign, rename, or refactor beyond the request unless the user invites it."
    ]);
  }
};
var TOOLS_SECTION = {
  id: "tools",
  title: "Tools",
  applies(ctx) {
    return (ctx.tools ?? []).length > 0;
  },
  render(ctx) {
    const lines = (ctx.tools ?? []).map(describeTool);
    return joinBlocks([
      "# Tools",
      "These capabilities are available to you this turn. Reach for the most specific one for the job.",
      bullets(lines)
    ]);
  }
};
var GUIDELINES_SECTION = {
  id: "guidelines",
  title: "Working guidance",
  render(ctx) {
    const items = [];
    if (hasTool(ctx, "read")) {
      items.push(
        "Always inspect a file with the reader before you change it. Do not shell out to `cat`, `head`, or `sed` to view a file when the reader is available."
      );
    }
    if (hasTool(ctx, "edit")) {
      items.push(
        "For a targeted change, prefer the editor: it replaces an exact span of existing text, so the old text you supply must match the file byte-for-byte."
      );
    }
    if (hasTool(ctx, "write")) {
      items.push(
        "Reserve the writer for creating a new file or replacing one in full; for anything smaller, edit in place rather than rewriting the whole file."
      );
    }
    if (hasTool(ctx, "grep") || hasTool(ctx, "find") || hasTool(ctx, "ls")) {
      items.push(
        "Explore the tree with the dedicated search and listing tools rather than shell equivalents \u2014 they are quicker and already skip ignored paths."
      );
    }
    if (hasTool(ctx, "bash")) {
      items.push(
        "Use the shell for builds, tests, and other commands that no purpose-built tool covers. Keep commands scoped and avoid destructive operations unless the user asked for them."
      );
    }
    items.push(
      "Keep your replies short and to the point. Lead with the result; add only the explanation the user needs to act on it."
    );
    items.push(
      "When a change is non-trivial, verify it \u2014 run the build or the relevant tests \u2014 before you report it as done."
    );
    return joinBlocks(["# Working guidance", bullets(items)]);
  }
};
var TASK_SECTION = {
  id: "tasks",
  title: "Task tracking",
  applies(ctx) {
    return hasTool(ctx, "todowrite") || hasTool(ctx, "todoread");
  },
  render() {
    return joinBlocks([
      "# Task tracking",
      "For work that spans several steps, maintain a checklist with the task tools. Break the job into concrete items, mark exactly one in progress at a time, and tick items off as you finish them so the user can follow along."
    ]);
  }
};
var SUBAGENTS_SECTION = {
  id: "subagents",
  title: "Delegates",
  applies(ctx) {
    return (ctx.subagents ?? []).length > 0;
  },
  render(ctx) {
    const lines = (ctx.subagents ?? []).map((s) => {
      const when = s.when ? ` Use it when ${s.when}` : "";
      return `**${s.name}** \u2014 ${s.purpose}.${when}`;
    });
    return joinBlocks([
      "# Delegates",
      "You can offload a focused, self-contained piece of work to one of these delegates with the task tool. Hand off when a sub-problem is well-scoped enough to be solved without your full conversation context.",
      bullets(lines)
    ]);
  }
};
var PLAN_SECTION = {
  id: "plan-mode",
  title: "Plan mode",
  applies(ctx) {
    return hasTool(ctx, "enter_plan_mode") || hasTool(ctx, "exit_plan_mode");
  },
  render() {
    return joinBlocks([
      "# Plan mode",
      bullets([
        "For a task that needs investigation before any change, call `enter_plan_mode` first. That switches you into a read-only research phase: you may read, search, and inspect, but every file-mutating and shell tool is blocked until you leave.",
        "While in plan mode, gather all the context you need and draft a concrete plan. Do not try to edit files or run commands \u2014 those calls are rejected with a steering message.",
        "When the plan is ready, call `exit_plan_mode` with the full plan text. The user reviews it and either approves (you leave plan mode and carry the plan out) or rejects (you stay in plan mode to revise and re-propose). Use it to ask permission to start, not to do the work."
      ])
    ]);
  }
};
var CONNECTORS_SECTION = {
  id: "connectors",
  title: "Connectors",
  applies(ctx) {
    return hasToolPrefix(ctx, "connector_") || hasToolPrefix(ctx, "saas_");
  },
  render() {
    return joinBlocks([
      "# Connectors",
      bullets([
        "When a task needs an external service (issue trackers, calendars, docs, and the like), prefer the connector tools over scraping or guessing.",
        "Confirm the connection is authorized before you rely on it, and surface a clear next step if it is not.",
        "Page through large result sets deliberately rather than assuming the first response is complete."
      ])
    ]);
  }
};
var PROJECT_CONTEXT_SECTION = {
  id: "project-context",
  title: "Project context",
  applies(ctx) {
    return (ctx.contextDocs ?? []).length > 0;
  },
  render(ctx) {
    const docs = (ctx.contextDocs ?? []).map(
      (d) => `## ${d.path}

${d.body.trim()}`
    );
    return joinBlocks([
      "# Project context",
      "The following project documents describe conventions for this repository. Treat them as standing instructions.",
      ...docs
    ]);
  }
};
var SKILLS_SECTION = {
  id: "skills",
  title: "Skills",
  applies(ctx) {
    return (ctx.skills ?? []).length > 0;
  },
  render(ctx) {
    const skills = ctx.skills ?? [];
    const entries = skills.map((card) => {
      return [
        "  <skill>",
        `    <name>${escapeXml(card.name)}</name>`,
        `    <description>${escapeXml(card.description)}</description>`,
        `    <location>${escapeXml(card.location)}</location>`,
        "  </skill>"
      ].join("\n");
    });
    return joinBlocks([
      "# Skills",
      "Each skill below is a set of task-specific instructions stored on disk. When a task lines up with a skill's description, load its file with the reader and follow it. Paths a skill mentions are relative to that skill's own directory.",
      `<available_skills>
${entries.join("\n")}
</available_skills>`
    ]);
  }
};
var FOOTER_SECTION = {
  id: "footer",
  render(ctx) {
    const where = ctx.cwd ?? ctx.workspace;
    const when = (ctx.now ?? /* @__PURE__ */ new Date()).toISOString();
    const lines = [];
    if (where) lines.push(`Working directory: ${where}`);
    lines.push(`Current time: ${when}`);
    return lines.join("\n");
  }
};
var BRIEFING_SECTIONS = [
  ROLE_SECTION,
  TOOLS_SECTION,
  GUIDELINES_SECTION,
  TASK_SECTION,
  SUBAGENTS_SECTION,
  PLAN_SECTION,
  CONNECTORS_SECTION,
  PROJECT_CONTEXT_SECTION,
  SKILLS_SECTION,
  FOOTER_SECTION
];
function composeBriefing(input) {
  const inputs = isInputs(input) ? input : { sections: BRIEFING_SECTIONS, context: input };
  const { sections, context, prelude, append } = inputs;
  const rendered = [];
  if (prelude && prelude.trim().length > 0) rendered.push(prelude.trim());
  for (const section of sections) {
    if (section.applies && !section.applies(context)) continue;
    const fragment = section.render(context);
    if (fragment.trim().length > 0) rendered.push(fragment.trim());
  }
  if (append && append.trim().length > 0) rendered.push(append.trim());
  return joinBlocks(rendered);
}
function isInputs(value) {
  return "sections" in value && "context" in value;
}

// src/briefing/context-docs.ts
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, extname, isAbsolute, join, parse, resolve } from "node:path";
var DEFAULT_MAX_IMPORT_DEPTH = 5;
var DEFAULT_MAX_BYTES_PER_DOC = 4e4;
var CANDIDATE_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "INDUSAGI.md",
  "CLAUDE.local.md",
  "AGENTS.local.md",
  join(".indusagi", "CLAUDE.md"),
  join(".claude", "CLAUDE.md")
];
var TEXT_FILE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".md",
  ".markdown",
  ".txt",
  ".text",
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".csv",
  ".html",
  ".htm",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".sh",
  ".env"
]);
var IMPORT_REGEX = /(?:^|\s)@((?:[^\s\\]|\\ )+)/g;
function shortenPath(path, cwd, home) {
  if (cwd.length > 0 && path.startsWith(cwd)) {
    const rest = path.slice(cwd.length).replace(/^[/\\]+/, "");
    return rest.length > 0 ? `./${rest}` : ".";
  }
  if (home.length > 0 && path.startsWith(home)) {
    return `~${path.slice(home.length)}`;
  }
  return path;
}
function dirChain(cwd) {
  const chain = [];
  let current = cwd;
  for (let i = 0; i < 256; i += 1) {
    chain.push(current);
    const parent = dirname(current);
    if (parent === current || current === parse(current).root) break;
    current = parent;
  }
  return chain.reverse();
}
function safeRealpath(path) {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}
function isTextFile(path) {
  const ext = extname(path).toLowerCase();
  return ext.length === 0 || TEXT_FILE_EXTENSIONS.has(ext);
}
function readFileBody(absPath) {
  if (!existsSync(absPath)) return null;
  let raw;
  try {
    raw = readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
function extractImports(body, baseDir, home) {
  const out = [];
  IMPORT_REGEX.lastIndex = 0;
  let match;
  while ((match = IMPORT_REGEX.exec(body)) !== null) {
    let spec = match[1];
    if (spec === void 0 || spec.length === 0) continue;
    const hash = spec.indexOf("#");
    if (hash >= 0) spec = spec.slice(0, hash);
    spec = spec.replace(/\\ /g, " ").trim();
    if (spec.length === 0) continue;
    let abs;
    if (spec.startsWith("~/")) {
      abs = join(home, spec.slice(2));
    } else if (isAbsolute(spec)) {
      abs = spec;
    } else {
      abs = resolve(baseDir, spec);
    }
    if (!isTextFile(abs)) continue;
    out.push(abs);
  }
  return out;
}
function loadDocTree(absPath, cwd, home, seen, depth, maxDepth, maxBytes, out) {
  const real = safeRealpath(absPath);
  if (seen.has(real)) return;
  seen.add(real);
  const body = readFileBody(absPath);
  if (body === null) return;
  const clipped = body.length > maxBytes ? body.slice(0, maxBytes) : body;
  out.push({ path: shortenPath(absPath, cwd, home), body: clipped });
  if (depth >= maxDepth) return;
  const baseDir = dirname(absPath);
  for (const child of extractImports(body, baseDir, home)) {
    loadDocTree(child, cwd, home, seen, depth + 1, maxDepth, maxBytes, out);
  }
}
function gatherContextDocs(cwd, home, opts) {
  const out = [];
  try {
    const maxDepth = opts?.maxImportDepth ?? DEFAULT_MAX_IMPORT_DEPTH;
    const maxBytes = opts?.maxBytesPerDoc ?? DEFAULT_MAX_BYTES_PER_DOC;
    const seen = /* @__PURE__ */ new Set();
    const roots = [...dirChain(cwd)];
    if (home.length > 0) roots.push(home);
    for (const dir of roots) {
      if (dir.length === 0) continue;
      for (const name of CANDIDATE_FILES) {
        const candidate = join(dir, name);
        loadDocTree(candidate, cwd, home, seen, 0, maxDepth, maxBytes, out);
      }
    }
  } catch {
    return out;
  }
  return out;
}

// src/capability-deck/contract.ts
function capabilityId(raw) {
  return raw;
}
function deckFault(kind, message, cause) {
  return cause === void 0 ? { kind, message } : { kind, message, cause };
}

// src/capability-deck/builtin-bridge.ts
import {
  createReadTool,
  createWriteTool,
  createEditTool,
  createLsTool,
  createGrepTool,
  createFindTool,
  createBashTool,
  createProcessTool,
  createWebSearchTool,
  createWebFetchTool,
  todoReadTool,
  todoWriteTool
} from "indusagi/agent";
var READ_ONLY = ["authoring", "survey"];
var MUTATING = ["authoring"];
var BUILTIN_DESCRIPTORS = [
  {
    id: capabilityId("read"),
    title: "Read file",
    summary: "Return the contents of a file at a path, optionally from an offset and capped to a line limit; renders images inline where supported.",
    profiles: READ_ONLY,
    build: (ctx) => createReadTool(ctx.cwd, {
      readState: ctx.framework?.["readState"]
    })
  },
  {
    id: capabilityId("ls"),
    title: "List directory",
    summary: "Enumerate the entries of a directory, with an optional cap on how many are returned.",
    profiles: READ_ONLY,
    build: (ctx) => createLsTool(ctx.cwd)
  },
  {
    id: capabilityId("grep"),
    title: "Search file contents",
    summary: "Scan files for lines matching a pattern, with optional case-insensitivity, literal matching, surrounding context, and a result cap.",
    profiles: READ_ONLY,
    build: (ctx) => createGrepTool(ctx.cwd)
  },
  {
    id: capabilityId("find"),
    title: "Find files by name",
    summary: "Locate files and directories whose names match a glob-style pattern beneath a root, capped to a result limit.",
    profiles: READ_ONLY,
    build: (ctx) => createFindTool(ctx.cwd)
  },
  {
    id: capabilityId("websearch"),
    title: "Web search",
    summary: "Query the live web for a string and return a ranked set of result snippets, capped to a requested count.",
    profiles: READ_ONLY,
    build: () => createWebSearchTool()
  },
  {
    id: capabilityId("webfetch"),
    title: "Fetch URL",
    summary: "Retrieve a single URL and return its body as text, Markdown, or HTML, with an optional request timeout.",
    profiles: READ_ONLY,
    build: () => createWebFetchTool()
  },
  {
    id: capabilityId("todoread"),
    title: "Read checklist",
    summary: "Read back the session's running task checklist so the agent can review what is pending, active, or done.",
    profiles: READ_ONLY,
    // The framework's default in-memory checklist singleton; a session-aware
    // persistent store is wired by the separate checklist provisioner, not here.
    build: () => todoReadTool
  },
  {
    id: capabilityId("write"),
    title: "Write file",
    summary: "Create or overwrite a file at a path with the given contents, making parent directories as needed.",
    profiles: MUTATING,
    build: (ctx) => createWriteTool(ctx.cwd, {
      readState: ctx.framework?.["readState"],
      checkpoint: ctx.framework?.["checkpoint"]
    })
  },
  {
    id: capabilityId("edit"),
    title: "Edit file",
    summary: "Apply a find-and-replace edit to a file, swapping an exact span of old text for new text and reporting the resulting diff.",
    profiles: MUTATING,
    build: (ctx) => createEditTool(ctx.cwd, {
      readState: ctx.framework?.["readState"],
      checkpoint: ctx.framework?.["checkpoint"]
    })
  },
  {
    id: capabilityId("bash"),
    title: "Run shell command",
    summary: "Execute a shell command in the working directory, streaming its output and honoring an optional timeout.",
    profiles: MUTATING,
    build: (ctx) => createBashTool(ctx.cwd)
  },
  {
    id: capabilityId("process"),
    title: "Manage background processes",
    summary: "Start, list, inspect, feed input to, and stop long-running background commands without blocking the agent on them.",
    profiles: MUTATING,
    build: (ctx) => createProcessTool({ cwd: ctx.cwd })
  },
  {
    id: capabilityId("todowrite"),
    title: "Update checklist",
    summary: "Replace or amend the session's task checklist, setting each item's text, status, and priority.",
    profiles: MUTATING,
    // Paired with the read singleton above; both share the framework default
    // in-memory store. The checklist provisioner swaps in a persistent store.
    build: () => todoWriteTool
  }
];
var BUILTIN_BRIDGE = Object.freeze(
  Object.fromEntries(BUILTIN_DESCRIPTORS.map((d) => [d.id, d]))
);
var BUILTIN_IDS = BUILTIN_DESCRIPTORS.map(
  (d) => d.id
);
var BUILTIN_PROFILES = Object.freeze(
  Object.fromEntries(BUILTIN_DESCRIPTORS.map((d) => [d.id, d.profiles]))
);
function builtinDescriptors() {
  return BUILTIN_DESCRIPTORS;
}

// src/capability-deck/manifest.ts
function cardOf(descriptor) {
  return {
    id: descriptor.id,
    title: descriptor.title,
    summary: descriptor.summary,
    build: descriptor.build
  };
}
var CAPABILITY_CARDS = builtinDescriptors().map(cardOf);
var CAPABILITY_INDEX = new Map(CAPABILITY_CARDS.map((card) => [card.id, card]));
var CARD_PROFILES = new Map(
  builtinDescriptors().map((descriptor) => [descriptor.id, descriptor.profiles])
);
function cardsForProfile(profile) {
  if (profile === "all") return [...CAPABILITY_CARDS];
  return CAPABILITY_CARDS.filter((card) => {
    const profiles = CARD_PROFILES.get(card.id);
    return profiles !== void 0 && profiles.includes(profile);
  });
}

// src/capability-deck/cards/todo-card.ts
var import_typebox = __toESM(require_cjs(), 1);
var TodoLedger = class {
  items = [];
  /** Replace the entire checklist with `next`; returns the stored snapshot. */
  set(next) {
    this.items = Object.freeze([...next]);
    return this.items;
  }
  /** Return the current checklist as a frozen, read-only snapshot. */
  read() {
    return this.items;
  }
};
var TodoItemSchema = import_typebox.Type.Object(
  {
    task: import_typebox.Type.String({ description: "Short imperative description of the work item." }),
    state: import_typebox.Type.Union(
      [
        import_typebox.Type.Literal("pending"),
        import_typebox.Type.Literal("active"),
        import_typebox.Type.Literal("done"),
        import_typebox.Type.Literal("dropped")
      ],
      { description: "Lifecycle state of the item." }
    ),
    weight: import_typebox.Type.Union([import_typebox.Type.Literal("low"), import_typebox.Type.Literal("normal"), import_typebox.Type.Literal("high")], {
      description: "Relative importance of the item."
    })
  },
  { additionalProperties: false }
);
var TodoParams = import_typebox.Type.Object(
  {
    action: import_typebox.Type.Union([import_typebox.Type.Literal("read"), import_typebox.Type.Literal("set")], {
      description: "`read` returns the current checklist; `set` replaces it with the items you provide."
    }),
    items: import_typebox.Type.Optional(
      import_typebox.Type.Array(TodoItemSchema, {
        description: "The complete desired checklist. Required for `set` (send the whole list, not a delta); ignored for `read`."
      })
    )
  },
  { additionalProperties: false }
);
var TODO_DESCRIPTION = 'Maintain a working checklist for the current task. Call with `action:"set"` and a complete `items` list to record or revise your plan \u2014 always send the full intended list, since the previous one is discarded. Call with `action:"read"` to recall the current plan. Mark items `active` while in progress and `done` when finished so the list reflects real status; use `dropped` for work you decided to skip.';
var STATE_GLYPH = {
  pending: "[ ]",
  active: "[~]",
  done: "[x]",
  dropped: "[-]"
};
function renderChecklist(items) {
  if (items.length === 0) return "The checklist is empty.";
  const lines = items.map((it) => {
    const weight = it.weight === "normal" ? "" : ` (${it.weight})`;
    return `${STATE_GLYPH[it.state]} ${it.task}${weight}`;
  });
  return lines.join("\n");
}
function buildTodoCapability(_ctx) {
  const ledger = new TodoLedger();
  return {
    name: "todo",
    label: "Checklist",
    description: TODO_DESCRIPTION,
    parameters: TodoParams,
    async execute(_toolCallId, params) {
      const items = params.action === "set" ? ledger.set(params.items ?? []) : ledger.read();
      const heading = params.action === "set" ? "Checklist updated:" : "Current checklist:";
      const text = `${heading}
${renderChecklist(items)}`;
      return {
        content: [{ type: "text", text }],
        details: { action: params.action, items }
      };
    }
  };
}
var todoCard = {
  id: capabilityId("todo"),
  title: "Checklist",
  summary: "Keep an in-memory checklist of the current task's steps; set or read it.",
  // The card surface is the erased `Capability`; the builder keeps its precise
  // params/details type for direct callers and erases here. The erasure goes
  // through `unknown` because TypeBox tools are invariant in their schema (the
  // framework's own tool arrays are `AgentTool<any>[]` for the same reason).
  build: (ctx) => buildTodoCapability(ctx)
};

// src/capability-deck/cards/bg-process-card.ts
var import_typebox2 = __toESM(require_cjs(), 1);
import { spawn } from "node:child_process";
var MAX_BUFFERED_LINES = 2e3;
function pushLines(buf, chunk) {
  for (const line of chunk.split(/\r?\n/)) {
    if (line.length === 0) continue;
    buf.lines.push(line);
  }
  if (buf.lines.length > MAX_BUFFERED_LINES) {
    const drop = buf.lines.length - MAX_BUFFERED_LINES;
    buf.lines.splice(0, drop);
    buf.cursor = Math.max(0, buf.cursor - drop);
  }
}
var DaemonTable = class {
  handles = /* @__PURE__ */ new Map();
  nextSeq = 1;
  cwd;
  constructor(cwd) {
    this.cwd = cwd;
  }
  start(command) {
    const id = `bg-${this.nextSeq++}`;
    const child = spawn(command, {
      cwd: this.cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false
    });
    const handle = {
      id,
      command,
      child,
      state: "running",
      exitCode: null,
      signal: null,
      startedAt: Date.now(),
      stdout: { lines: [], cursor: 0 },
      stderr: { lines: [], cursor: 0 }
    };
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (d) => pushLines(handle.stdout, d));
    child.stderr?.on("data", (d) => pushLines(handle.stderr, d));
    child.on("exit", (code, sig) => {
      handle.exitCode = code;
      handle.signal = sig;
      handle.state = sig ? "signalled" : "exited";
    });
    child.on("error", (err) => {
      pushLines(handle.stderr, `spawn error: ${String(err)}`);
      handle.state = "exited";
    });
    this.handles.set(id, handle);
    return handle;
  }
  get(id) {
    return this.handles.get(id);
  }
  list() {
    return [...this.handles.values()];
  }
  /**
   * Signal a handle's process to terminate. Sends SIGTERM immediately and a
   * SIGKILL after `graceMs` if the child is still alive. Resolves once the
   * child has exited or the kill has been sent.
   */
  async stop(handle, graceMs = 3e3) {
    if (handle.state !== "running") return;
    const child = handle.child;
    child.kill("SIGTERM");
    await new Promise((resolve2) => {
      const timer = setTimeout(() => {
        if (handle.state === "running") child.kill("SIGKILL");
        resolve2();
      }, graceMs);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve2();
      });
    });
  }
};
var DaemonParams = import_typebox2.Type.Object(
  {
    action: import_typebox2.Type.Union(
      [import_typebox2.Type.Literal("start"), import_typebox2.Type.Literal("poll"), import_typebox2.Type.Literal("stop"), import_typebox2.Type.Literal("list")],
      {
        description: "`start` launches a long-running command; `poll` reads its captured output; `stop` terminates it; `list` shows all tracked processes."
      }
    ),
    command: import_typebox2.Type.Optional(
      import_typebox2.Type.String({
        description: "Shell command to launch. Required for `start`."
      })
    ),
    id: import_typebox2.Type.Optional(
      import_typebox2.Type.String({
        description: "Handle returned by `start`. Required for `poll` and `stop`."
      })
    ),
    sinceLast: import_typebox2.Type.Optional(
      import_typebox2.Type.Boolean({
        description: "On `poll`, return only output appended since the previous poll of this handle. Defaults to false (return the full retained buffer)."
      })
    )
  },
  { additionalProperties: false }
);
var DAEMON_DESCRIPTION = 'Run and manage long-lived background processes that persist across tool calls \u2014 dev servers, file watchers, anything you start once and observe over time. Use `action:"start"` with a `command` to launch one (you get back a handle `id`), `action:"poll"` with that `id` to read its accumulated output, `action:"stop"` to terminate it, and `action:"list"` to see what is running. Do NOT use this for ordinary one-shot commands that finish on their own \u2014 run those with the shell tool.';
function drainBuffer(buf, sinceLast) {
  if (sinceLast) {
    const fresh = buf.lines.slice(buf.cursor);
    buf.cursor = buf.lines.length;
    return fresh;
  }
  return [...buf.lines];
}
function statusLine(h) {
  if (h.state === "running") return "running";
  if (h.state === "signalled") return `signalled (${h.signal ?? "?"})`;
  return `exited (code ${h.exitCode ?? "?"})`;
}
function buildDaemonCapability(ctx) {
  const table = new DaemonTable(ctx.cwd);
  return {
    name: "bg-process",
    label: "Background process",
    description: DAEMON_DESCRIPTION,
    parameters: DaemonParams,
    async execute(_toolCallId, params) {
      switch (params.action) {
        case "start": {
          if (!params.command) {
            return errResult("start", "`command` is required to start a background process.");
          }
          const h = table.start(params.command);
          return {
            content: [
              {
                type: "text",
                text: `Started background process ${h.id}: ${h.command}
Poll it with action:"poll", id:"${h.id}".`
              }
            ],
            details: { action: "start", ok: true, id: h.id, state: h.state }
          };
        }
        case "poll": {
          const h = params.id ? table.get(params.id) : void 0;
          if (!h) return errResult("poll", `No background process with id "${params.id ?? ""}".`);
          const out = drainBuffer(h.stdout, params.sinceLast ?? false);
          const err = drainBuffer(h.stderr, params.sinceLast ?? false);
          const parts = [`Process ${h.id} \u2014 ${statusLine(h)}`];
          if (out.length) parts.push(`--- stdout ---
${out.join("\n")}`);
          if (err.length) parts.push(`--- stderr ---
${err.join("\n")}`);
          if (out.length === 0 && err.length === 0) parts.push("(no new output)");
          return {
            content: [{ type: "text", text: parts.join("\n") }],
            details: { action: "poll", ok: true, id: h.id, state: h.state, exitCode: h.exitCode }
          };
        }
        case "stop": {
          const h = params.id ? table.get(params.id) : void 0;
          if (!h) return errResult("stop", `No background process with id "${params.id ?? ""}".`);
          await table.stop(h);
          return {
            content: [{ type: "text", text: `Stopped background process ${h.id} (${statusLine(h)}).` }],
            details: { action: "stop", ok: true, id: h.id, state: h.state, exitCode: h.exitCode }
          };
        }
        case "list": {
          const all = table.list();
          const text = all.length === 0 ? "No background processes are being tracked." : all.map((h) => `${h.id} [${statusLine(h)}] ${h.command}`).join("\n");
          return {
            content: [{ type: "text", text }],
            details: {
              action: "list",
              ok: true,
              processes: all.map((h) => ({ id: h.id, command: h.command, state: h.state }))
            }
          };
        }
      }
    }
  };
}
function errResult(action, message) {
  return {
    content: [{ type: "text", text: message }],
    details: { action, ok: false },
    isError: true
  };
}
var daemonCard = {
  id: capabilityId("bg-process"),
  title: "Background process",
  summary: "Start, poll, and stop long-lived child processes that span multiple turns.",
  // Erase the precisely-typed builder to the `Capability` card surface (through
  // `unknown`, as TypeBox tools are invariant in their parameter schema).
  build: (ctx) => buildDaemonCapability(ctx)
};

// src/capability-deck/cards/task-card.ts
var import_typebox3 = __toESM(require_cjs(), 1);
var DELEGATE_HANDLE_KEY = "delegate";
function readDelegateRunner(ctx) {
  const handle = ctx.framework?.[DELEGATE_HANDLE_KEY];
  if (handle && typeof handle.run === "function") {
    return handle;
  }
  return void 0;
}
var TaskParams = import_typebox3.Type.Object(
  {
    objective: import_typebox3.Type.String({
      description: "A complete, self-contained statement of what the sub-agent should accomplish. Include everything it needs; it does not share your conversation history."
    }),
    agent: import_typebox3.Type.Optional(
      import_typebox3.Type.String({
        description: "Optional named sub-agent profile to run as. Omit to use the default profile."
      })
    ),
    context: import_typebox3.Type.Optional(
      import_typebox3.Type.String({
        description: "Optional extra background the sub-agent should start with."
      })
    )
  },
  { additionalProperties: false }
);
function baseDescription(agents) {
  const roster = agents.length > 0 ? ` Available sub-agent profiles: ${agents.join(", ")}.` : "";
  return "Delegate a focused, self-contained piece of work to a sub-agent that runs its own tool loop and returns a single report. Use this to keep your own context clean when a task is well-scoped \u2014 searching a large codebase, drafting a file, or investigating a question end-to-end. Give a complete `objective`; the sub-agent does not see your conversation." + roster;
}
var STUB_NOTE = "Sub-agent delegation is not wired in this environment, so the objective was not run. Wire a DelegateRunner into the deck context to enable it, or perform the work inline with the other tools.";
function buildTaskCapability(ctx) {
  const runner = readDelegateRunner(ctx);
  const agents = runner?.listAgents?.() ?? [];
  return {
    name: "task",
    label: "Delegate task",
    description: baseDescription(agents),
    parameters: TaskParams,
    async execute(_toolCallId, params, signal, onUpdate) {
      if (!runner) {
        return {
          content: [{ type: "text", text: STUB_NOTE }],
          details: { delegated: false, ok: false, agent: params.agent },
          isError: true
        };
      }
      const result = await runner.run(
        { objective: params.objective, agent: params.agent, context: params.context },
        signal,
        // Stream live token spend as a tool_update so the background-agents panel
        // can show a running token count next to the elapsed clock. The `details`
        // carries the structured `tokens`; the console reads it off the signal.
        (progress) => {
          onUpdate?.({
            content: [{ type: "text", text: `${progress.tokens} tokens` }],
            details: {
              delegated: true,
              ok: false,
              agent: params.agent,
              tokens: progress.tokens,
              activity: progress.activity
            }
          });
        }
      );
      return {
        content: [{ type: "text", text: result.report }],
        details: { delegated: true, ok: result.ok, agent: params.agent },
        isError: result.ok ? void 0 : true
      };
    }
  };
}
var taskCard = {
  id: capabilityId("task"),
  title: "Delegate task",
  summary: "Hand a self-contained objective to a sub-agent and receive one report back.",
  // Erase the precisely-typed builder to the `Capability` card surface (through
  // `unknown`, as TypeBox tools are invariant in their parameter schema).
  build: (ctx) => buildTaskCapability(ctx)
};

// src/capability-deck/cards/workflow-card.ts
var import_typebox4 = __toESM(require_cjs(), 1);

// src/workflow-engine/parse.ts
import vm from "node:vm";
var NONDETERMINISM_ERROR = "Workflow scripts must be deterministic: Date.now()/Math.random()/new Date() are unavailable";
var NONDETERMINISTIC_PATTERNS = [
  /\bDate\s*\.\s*now\s*\(/,
  /\bMath\s*\.\s*random\s*\(/,
  /\bnew\s+Date\b/
];
function parseWorkflowScript(script) {
  if (typeof script !== "string") {
    throw new TypeError("workflow script must be a string");
  }
  assertDeterministicSource(script);
  const located = locateMetaExport(script);
  const meta = evaluateMetaLiteral(located.literal);
  validateMeta(meta);
  return {
    meta,
    body: script.slice(0, located.start) + script.slice(located.end)
  };
}
function assertDeterministicSource(script) {
  for (const pattern of NONDETERMINISTIC_PATTERNS) {
    if (pattern.test(script)) throw new Error(NONDETERMINISM_ERROR);
  }
}
function locateMetaExport(script) {
  const firstToken = skipTrivia(script, 0);
  const header = /export\s+const\s+meta\s*=\s*/y;
  header.lastIndex = firstToken;
  const match = header.exec(script);
  if (!match || match.index !== firstToken) {
    throw new Error(
      "`export const meta = { name, description }` must be the first statement in the script"
    );
  }
  const braceStart = header.lastIndex;
  if (script[braceStart] !== "{") {
    throw new Error("meta export must be assigned a plain object literal: `export const meta = { \u2026 }`");
  }
  const braceEnd = matchBraces(script, braceStart);
  const literal = script.slice(braceStart, braceEnd);
  let end = braceEnd;
  const afterBrace = skipTrivia(script, braceEnd);
  if (script[afterBrace] === ";") end = afterBrace + 1;
  return { start: firstToken, end, literal };
}
function skipTrivia(source, from) {
  let i = from;
  while (i < source.length) {
    const ch = source[i];
    if (ch === " " || ch === "	" || ch === "\n" || ch === "\r" || ch === "\f" || ch === "\v") {
      i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    break;
  }
  return i;
}
function matchBraces(source, open) {
  let depth = 0;
  let i = open;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipStringLike(source, i, ch);
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  throw new Error("meta object literal is not closed: missing `}`");
}
function skipStringLike(source, start, quote) {
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (quote === "`" && ch === "$" && source[i + 1] === "{") {
      let depth = 1;
      i += 2;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") depth--;
        i++;
      }
      continue;
    }
    if (ch === quote) return i + 1;
    i++;
  }
  throw new Error("unterminated string in meta object literal");
}
function evaluateMetaLiteral(literal) {
  const context = vm.createContext(/* @__PURE__ */ Object.create(null));
  let value;
  try {
    value = new vm.Script(`(${literal})`, { filename: "workflow.meta.js" }).runInContext(context, {
      timeout: 1e3
    });
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`meta export must be a plain object literal${detail}`);
  }
  return value;
}
function validateMeta(meta) {
  if (!meta || typeof meta !== "object") throw new Error("meta must be an object");
  const value = meta;
  if (typeof value.name !== "string" || !value.name.trim()) {
    throw new Error("meta.name must be a non-empty string");
  }
  if (typeof value.description !== "string" || !value.description.trim()) {
    throw new Error("meta.description must be a non-empty string");
  }
  if (value.whenToUse !== void 0 && typeof value.whenToUse !== "string") {
    throw new Error("meta.whenToUse must be a string");
  }
  if (value.phases !== void 0) {
    if (!Array.isArray(value.phases)) throw new Error("meta.phases must be an array");
    for (const phase of value.phases) {
      if (!phase || typeof phase !== "object" || typeof phase.title !== "string") {
        throw new Error("each meta phase must have a title string");
      }
      const detail = phase.detail;
      if (detail !== void 0 && typeof detail !== "string") {
        throw new Error("meta phase detail must be a string");
      }
    }
  }
}

// src/workflow-engine/display.ts
function createWorkflowSnapshot(meta) {
  return {
    name: meta.name,
    description: meta.description,
    phases: [],
    logs: [],
    agents: [],
    agentCount: 0,
    runningCount: 0,
    doneCount: 0,
    errorCount: 0
  };
}
function recomputeWorkflowSnapshot(snapshot) {
  const runningCount = snapshot.agents.filter((agent) => agent.status === "running").length;
  const doneCount = snapshot.agents.filter((agent) => agent.status === "done").length;
  const errorCount = snapshot.agents.filter((agent) => agent.status === "error").length;
  return { ...snapshot, agentCount: snapshot.agents.length, runningCount, doneCount, errorCount };
}
function renderWorkflowLines(snapshot, options = {}, now = Date.now()) {
  const maxAgents = options.maxAgents ?? 8;
  const maxLogs = options.maxLogs ?? 2;
  const maxLines = options.maxLines ?? 9;
  const showResultPreviews = options.showResultPreviews ?? false;
  const state = snapshot.errorCount > 0 ? `, ${snapshot.errorCount} errors` : snapshot.runningCount > 0 ? `, ${snapshot.runningCount} running` : "";
  const header = `\u25C6 Workflow: ${snapshot.name} (${snapshot.doneCount}/${snapshot.agentCount} done${state})`;
  const agentPhaseNames = snapshot.agents.map((agent) => agent.phase).filter((phase) => Boolean(phase));
  const phaseNames = unique([
    ...snapshot.phases,
    ...snapshot.currentPhase ? [snapshot.currentPhase] : [],
    ...agentPhaseNames
  ]);
  const rendered = /* @__PURE__ */ new Set();
  const blocks = [];
  for (const phase of phaseNames) {
    const agents = snapshot.agents.filter((agent) => agent.phase === phase);
    if (agents.length === 0 && snapshot.currentPhase !== phase) continue;
    for (const agent of agents) rendered.add(agent);
    const done = agents.filter((agent) => agent.status === "done").length;
    const running = agents.filter((agent) => agent.status === "running").length;
    const errors = agents.filter((agent) => agent.status === "error").length;
    const skipped = agents.filter((agent) => agent.status === "skipped").length;
    const complete = agents.length > 0 && done + errors + skipped === agents.length;
    const active = running > 0 || errors > 0 || snapshot.currentPhase === phase || !complete;
    const marker = running > 0 || !complete && snapshot.currentPhase === phase ? "\u25B6" : complete ? "\u2713" : " ";
    const counts = `${done}/${agents.length}${running ? ` \xB7 ${running} running` : ""}${errors ? ` \xB7 ${errors} errors` : ""}${skipped ? ` \xB7 ${skipped} skipped` : ""}`;
    const full = [`  ${marker} ${phase} ${counts}`];
    const visibleAgents = agents.slice(-maxAgents);
    for (const agent of visibleAgents) {
      const order = `#${agent.id}`;
      const result = showResultPreviews && agent.resultPreview ? ` \u2014 ${agent.resultPreview}` : "";
      const metrics = renderAgentMetrics(agent, now);
      full.push(`    ${order} ${statusIcon(agent.status)} ${shorten(agent.label, 48)}${metrics}${result}`);
    }
    if (agents.length > visibleAgents.length)
      full.push(`    \u2026 ${agents.length - visibleAgents.length} earlier agents`);
    blocks.push({ full, active, compact: compactPhaseLine(marker, phase, done, agents, now) });
  }
  const unphased = snapshot.agents.filter((agent) => !rendered.has(agent));
  if (unphased.length) {
    const full = ["  Unphased"];
    for (const agent of unphased.slice(-maxAgents)) {
      const result = showResultPreviews && agent.resultPreview ? ` \u2014 ${agent.resultPreview}` : "";
      const metrics = renderAgentMetrics(agent, now);
      full.push(`    #${agent.id} ${statusIcon(agent.status)} ${shorten(agent.label, 48)}${metrics}${result}`);
    }
    blocks.push({ full, active: true, compact: full[0] });
  }
  const visibleLogs = snapshot.logs.slice(-maxLogs);
  const logLines = visibleLogs.length ? ["", ...visibleLogs.map((log) => `  log: ${log}`)] : [];
  return assembleTree(header, blocks, logLines, maxLines);
}
function assembleTree(header, blocks, logLines, maxLines) {
  if (!Number.isFinite(maxLines)) {
    return [header, ...blocks.flatMap((b) => b.full), ...logLines];
  }
  const baseRow = (b) => b.active ? b.full : [b.compact];
  const baseLen = 1 + blocks.reduce((n, b) => n + baseRow(b).length, 0) + logLines.length;
  if (baseLen <= maxLines) {
    return [header, ...blocks.flatMap(baseRow), ...logLines];
  }
  const folded = /* @__PURE__ */ new Set();
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].active) continue;
    const keptLen = blocks.reduce((n, b, j) => folded.has(j) ? n : n + baseRow(b).length, 0);
    const summaryCost = folded.size ? 1 : 0;
    if (1 + keptLen + summaryCost + logLines.length <= maxLines) break;
    folded.add(i);
  }
  const out = [header];
  if (folded.size) out.push(`  \u2026 ${folded.size} earlier phases done`);
  blocks.forEach((b, i) => {
    if (!folded.has(i)) out.push(...baseRow(b));
  });
  out.push(...logLines);
  return out;
}
function compactPhaseLine(marker, phase, done, agents, now) {
  const prefix = `  ${marker} ${phase} ${done}/${agents.length}`;
  const totalTools = agents.reduce((n, a) => n + (a.toolCount ?? 0), 0);
  const toolSeg = totalTools > 0 ? ` \xB7 ${totalTools} ${totalTools === 1 ? "tool" : "tools"}` : "";
  if (agents.length === 1) {
    const agent = agents[0];
    const elapsedMs = Math.max(0, (agent.endedAt ?? now) - (agent.startedAt ?? agent.endedAt ?? now));
    const secs = agent.startedAt !== void 0 ? ` \xB7 #${agent.id} ${Math.floor(elapsedMs / 1e3)}s` : "";
    return `${prefix}${secs}${toolSeg}`;
  }
  const totalIn = agents.reduce((n, a) => n + (a.tokensIn ?? 0), 0);
  const totalOut = agents.reduce((n, a) => n + (a.tokensOut ?? 0), 0);
  const totalTokens = totalIn + totalOut;
  const tokSeg = totalTokens > 0 ? ` \xB7 ${formatTokens(totalTokens)} tok` : "";
  return `${prefix}${tokSeg}${toolSeg}`;
}
function renderWorkflowText(snapshot, completed = false, options = {}, now = Date.now()) {
  const effective = completed && options.maxLines === void 0 ? { ...options, maxLines: Infinity } : options;
  const tree = renderWorkflowLines(snapshot, effective, now);
  return completed ? ["Workflow completed", ...tree].join("\n") : tree.join("\n");
}
function statusIcon(status) {
  switch (status) {
    case "queued":
      return "\u25CB";
    case "running":
      return "\u25CF";
    case "done":
      return "\u2713";
    case "error":
      return "\u2717";
    case "skipped":
      return "-";
  }
}
function renderAgentMetrics(agent, now) {
  if (agent.startedAt === void 0) return "";
  const running = agent.status === "running";
  const elapsedMs = Math.max(0, (agent.endedAt ?? now) - agent.startedAt);
  const segments = [`${Math.floor(elapsedMs / 1e3)}s`];
  const tokensIn = agent.tokensIn ?? 0;
  const tokensOut = agent.tokensOut ?? 0;
  if (tokensIn > 0 || tokensOut > 0) {
    segments.push(`\u2191${formatTokens(tokensIn)} \u2193${formatTokens(tokensOut)}`);
  }
  const toolCount = agent.toolCount ?? 0;
  if (running) {
    if (toolCount > 0 || agent.currentTool) {
      const tail = agent.currentTool ? ` (running ${agent.currentTool})` : "";
      const last = agent.lastTool ?? agent.currentTool;
      segments.push(last ? `${last} \xD7${toolCount}${tail}` : `0 tools${tail}`);
    }
  } else if (toolCount > 0) {
    segments.push(`${toolCount} ${toolCount === 1 ? "tool" : "tools"}`);
  }
  return `   ${segments.join(" \xB7 ")}`;
}
function formatTokens(value) {
  if (value < 1e3) return String(value);
  const thousands = value / 1e3;
  return `${thousands.toFixed(1)}k`;
}
function unique(values) {
  return [...new Set(values)];
}
function shorten(value, max) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
}
function preview(value, max = 80) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
}

// src/workflow-engine/engine.ts
import vm2 from "node:vm";
import os from "node:os";
async function runWorkflow(script, options) {
  const started = Date.now();
  const { meta, body } = parseWorkflowScript(script);
  const state = { logs: [], phases: [], agentCount: 0, spent: 0 };
  const agentRunner = options.agentRunner;
  if (!agentRunner || typeof agentRunner.run !== "function") {
    throw new TypeError("runWorkflow requires an agentRunner with a run() method");
  }
  const concurrency = Math.max(
    1,
    Math.min(options.concurrency ?? Math.max(1, defaultConcurrency() - 2), 16)
  );
  const limiter = createLimiter(concurrency);
  const pendingAgentRuns = /* @__PURE__ */ new Set();
  const log = (message) => {
    const text = String(message);
    state.logs.push(text);
    options.onLog?.(text);
  };
  const phase = (title) => {
    const text = requireString(title, "phase title");
    state.currentPhase = text;
    if (!state.phases.includes(text)) state.phases.push(text);
    options.onPhase?.(text);
  };
  const budget = Object.freeze({
    total: options.tokenBudget ?? null,
    spent: () => state.spent,
    remaining: () => options.tokenBudget == null ? Infinity : Math.max(0, options.tokenBudget - state.spent)
  });
  const throwIfAborted = () => {
    if (options.signal?.aborted) throw new Error("workflow aborted");
  };
  const agent = async (prompt, agentOptions = {}) => {
    throwIfAborted();
    if (budget.total !== null && budget.remaining() <= 0) {
      throw new Error("workflow token budget exhausted");
    }
    const taskPrompt = requireString(prompt, "agent prompt");
    const normalizedOptions = normalizeAgentOptions(agentOptions);
    const assignedPhase = normalizedOptions.phase ?? state.currentPhase;
    const requestedLabel = normalizedOptions.label?.trim();
    const run = limiter(async () => {
      const id = ++state.agentCount;
      const label = requestedLabel || defaultAgentLabel(assignedPhase, id);
      options.onAgentStart?.({ id, label, phase: assignedPhase, prompt: taskPrompt });
      try {
        throwIfAborted();
        const result2 = await agentRunner.run(taskPrompt, {
          label,
          phase: assignedPhase,
          schema: normalizedOptions.schema,
          model: normalizedOptions.model,
          agentType: normalizedOptions.agentType,
          isolation: normalizedOptions.isolation,
          signal: options.signal,
          instructions: buildAgentInstructions(assignedPhase, normalizedOptions),
          onActivity: options.onAgentActivity ? (metrics) => options.onAgentActivity?.(id, metrics) : void 0
        });
        throwIfAborted();
        state.spent += estimateTokens(result2);
        options.onAgentEnd?.({ id, label, phase: assignedPhase, result: result2 });
        return result2;
      } catch (error) {
        if (options.signal?.aborted) throw error;
        log(`agent ${label} failed: ${error instanceof Error ? error.message : String(error)}`);
        options.onAgentEnd?.({ id, label, phase: assignedPhase, result: null });
        return null;
      }
    });
    pendingAgentRuns.add(run);
    run.then(
      () => pendingAgentRuns.delete(run),
      () => pendingAgentRuns.delete(run)
    );
    return run;
  };
  const parallel = async (thunks) => {
    throwIfAborted();
    if (!Array.isArray(thunks)) throw new TypeError("parallel() expects an array of functions");
    if (thunks.some((thunk) => typeof thunk !== "function")) {
      throw new TypeError(
        "parallel() expects an array of functions, not promises. Wrap each call: () => agent(...)"
      );
    }
    return Promise.all(
      thunks.map(async (thunk, index) => {
        try {
          return await thunk();
        } catch (error) {
          if (options.signal?.aborted) throw error;
          log(`parallel[${index}] failed: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        }
      })
    );
  };
  const pipeline = async (items, ...stages) => {
    throwIfAborted();
    if (!Array.isArray(items)) throw new TypeError("pipeline() expects an array as the first argument");
    if (stages.some((stage) => typeof stage !== "function")) {
      throw new TypeError(
        "pipeline() stages must be functions: pipeline(items, item => ..., result => ...)"
      );
    }
    return Promise.all(
      items.map(async (item, index) => {
        let value = item;
        for (const stage of stages) {
          try {
            throwIfAborted();
            value = await stage(value, item, index);
            throwIfAborted();
          } catch (error) {
            if (options.signal?.aborted) throw error;
            log(`pipeline[${index}] failed: ${error instanceof Error ? error.message : String(error)}`);
            return null;
          }
        }
        return value;
      })
    );
  };
  const resolvedCwd = options.cwd ?? process.cwd();
  const context = vm2.createContext({
    agent,
    parallel,
    pipeline,
    log,
    phase,
    args: options.args,
    cwd: resolvedCwd,
    process: Object.freeze({ cwd: () => resolvedCwd }),
    budget,
    console: Object.freeze({
      log,
      info: log,
      warn: (m) => log(`[warn] ${String(m)}`),
      error: (m) => log(`[error] ${String(m)}`)
    }),
    JSON,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Promise
  });
  const wrapped = `(async () => {
${body}
})()`;
  const result = await new vm2.Script(wrapped, {
    filename: `${meta.name || "workflow"}.js`
  }).runInContext(context);
  await Promise.allSettled([...pendingAgentRuns]);
  assertStructuredCloneable(result, "workflow result");
  return {
    meta,
    result,
    logs: state.logs,
    phases: state.phases,
    agentCount: state.agentCount,
    durationMs: Date.now() - started
  };
}
function defaultConcurrency() {
  const count = os.cpus()?.length;
  return typeof count === "number" && count > 0 ? count : 8;
}
function createLimiter(limit) {
  let active = 0;
  const queue = [];
  const next = () => {
    active--;
    queue.shift()?.();
  };
  return async (fn) => {
    if (active >= limit) await new Promise((resolve2) => queue.push(resolve2));
    active++;
    try {
      return await fn();
    } finally {
      next();
    }
  };
}
function requireString(value, name) {
  if (typeof value !== "string") throw new TypeError(`${name} must be a string`);
  return value;
}
function optionalString(value, name) {
  if (value === void 0) return void 0;
  return requireString(value, name);
}
function normalizeAgentOptions(value) {
  if (!value || typeof value !== "object") throw new TypeError("agent options must be an object");
  const options = value;
  return {
    ...options,
    label: optionalString(options.label, "agent label"),
    phase: optionalString(options.phase, "agent phase"),
    model: optionalString(options.model, "agent model"),
    isolation: options.isolation,
    agentType: optionalString(options.agentType, "agent type")
  };
}
function assertStructuredCloneable(value, name) {
  try {
    structuredClone(value);
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(
      `${name} must be structured-cloneable; did you forget to await agent(), parallel(), or pipeline()?${detail}`
    );
  }
}
function defaultAgentLabel(phase, index) {
  return phase ? `${phase} agent ${index}` : `agent ${index}`;
}
function buildAgentInstructions(phase, options) {
  const lines = [];
  if (phase) lines.push(`Workflow phase: ${phase}`);
  if (options.agentType) lines.push(`Act as workflow subagent type: ${options.agentType}`);
  if (options.isolation) lines.push(`Requested isolation: ${options.isolation}`);
  if (options.model) lines.push(`Requested model: ${options.model}`);
  return lines.length ? lines.join("\n") : void 0;
}
function estimateTokens(value) {
  return Math.ceil(JSON.stringify(value ?? "").length / 4);
}

// src/conductor/conductor.ts
import { Agent } from "indusagi/agent";
import { createZeroUsage as createZeroUsage2 } from "indusagi/ai";

// src/conductor/catalog/catalog.ts
import { z } from "zod";
import { getModels, getProviders } from "indusagi/ai";
var rawModelGate = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  reasoning: z.boolean().optional(),
  input: z.array(z.string()).optional(),
  contextWindow: z.number().optional()
});

// src/conductor/signal-hub/translate.ts
import { createZeroUsage } from "indusagi/ai";

// src/conductor/transcript-store/store.ts
import { ulid } from "ulid";

// src/conductor/transcript-store/serialize.ts
import {
  buildSessionContext,
  convertToLlm,
  loadEntriesFromFile,
  parseSessionEntries
} from "indusagi/agent";

// src/window-budget/summarize/prompt.ts
var CONDENSER_BRIEF = [
  "You are a transcript recorder for a long-running coding session.",
  "The text you receive is archival data, not a live chat \u2014 do NOT reply to it,",
  "continue it, run tools, or ask questions. Your sole job is to distill it into",
  "a compact, faithful digest under the exact headings requested below.",
  "",
  "Rules:",
  "- Preserve concrete facts: file paths, identifiers, commands, error text,",
  "  decisions, and anything the session would need to resume without the",
  "  original turns.",
  "- Prefer specifics over paraphrase; never invent details that are not present.",
  "- Keep each heading even if a section is empty (write `none` under it).",
  "- Emit only the digest \u2014 no preamble, no sign-off, no commentary."
].join("\n");
var SECTION_TEMPLATE = [
  "# Objective",
  "# Guardrails",
  "# Status (Shipped / Active / Stuck)",
  "# Rationale",
  "# Plan",
  "# Carryover"
].join("\n");

// src/window-budget/summarize/condense.ts
import { completeSimple } from "indusagi/ai";

// src/capability-deck/bridge-ledger/key.ts
import { ulid as ulid2, monotonicFactory } from "ulid";
import { QUALIFIER } from "indusagi/interop";
var nextUlid = monotonicFactory();

// src/capability-deck/bridge-ledger/network.ts
import {
  mountProtocolBridge,
  isProtocolFault
} from "indusagi/interop";

// src/workflow-engine/agent-runner.ts
import { Agent as Agent2 } from "indusagi/agent";
var STRUCTURED_CONTRACT = [
  "Final output contract:",
  "- Your final action MUST be a structured_output tool call.",
  "- The structured_output arguments are the return value of this subagent.",
  "- Do not emit a prose final answer instead of structured_output.",
  "- If you need to inspect files or run commands first, do so, then call structured_output exactly once."
].join("\n");

// src/capability-deck/cards/workflow-card.ts
var WORKFLOW_HANDLE_KEY = "workflow";
function readWorkflowRunner(ctx) {
  const handle = ctx.framework?.[WORKFLOW_HANDLE_KEY];
  if (handle && typeof handle.run === "function") {
    return handle;
  }
  return void 0;
}
var WorkflowParams = import_typebox4.Type.Object(
  {
    script: import_typebox4.Type.String({
      description: [
        "Required raw JavaScript workflow script, with no Markdown fences.",
        "First statement: export const meta = { name: 'short_snake_case', description: 'non-empty description' }.",
        "Use phase(title), agent(prompt, opts), parallel(arrayOfFunctions), pipeline(items, ...stages), log(message), args, and budget. The workflow must call agent() at least once.",
        "parallel() requires functions, not promises: await parallel(items.map(item => () => agent(...))).",
        "Plain JavaScript only \u2014 no imports, require(), fs, Date.now(), Math.random(), or new Date()."
      ].join(" ")
    }),
    args: import_typebox4.Type.Optional(
      import_typebox4.Type.Any({ description: "Optional JSON value exposed to the workflow script as global `args`." })
    )
  },
  { additionalProperties: false }
);
var DESCRIPTION = [
  "Execute a deterministic JavaScript workflow that orchestrates multiple subagents with agent(), parallel(), and pipeline().",
  "Use it for decomposable work \u2014 repository inspection, independent research/checks, multi-perspective review, or fan-out/fan-in synthesis.",
  "script is required raw JavaScript; it must start with `export const meta = { name, description }` and must call agent() at least once."
].join(" ");
var STUB_NOTE2 = "Workflow orchestration is not wired in this environment, so the script was not run. Wire a WorkflowAgentRunner into the deck context to enable it, or perform the work inline with the other tools.";
function isAbortError(error) {
  if (!(error instanceof Error)) return false;
  return /\babort(?:ed)?\b/i.test(error.message);
}
function buildWorkflowCapability(ctx) {
  const runner = readWorkflowRunner(ctx);
  return {
    name: "workflow",
    label: "Workflow",
    description: DESCRIPTION,
    parameters: WorkflowParams,
    async execute(_toolCallId, params, signal, onUpdate) {
      if (!runner) {
        const stub = createWorkflowSnapshot({ name: "workflow", description: STUB_NOTE2 });
        return {
          content: [{ type: "text", text: STUB_NOTE2 }],
          details: stub,
          isError: true
        };
      }
      let snapshot = createWorkflowSnapshot({
        name: "workflow",
        description: ""
      });
      const emit = (completed = false) => {
        snapshot = recomputeWorkflowSnapshot(snapshot);
        onUpdate?.({
          content: [{ type: "text", text: renderWorkflowText(snapshot, completed) }],
          details: snapshot
        });
      };
      const recordPhase = (title) => {
        if (!title) return;
        if (!snapshot.phases.includes(title)) snapshot.phases.push(title);
      };
      const agentById = (id) => snapshot.agents.find((item) => item.id === id);
      const ticker = setInterval(() => {
        if (snapshot.agents.some((item) => item.status === "running")) emit();
      }, 1e3);
      if (typeof ticker.unref === "function") ticker.unref();
      try {
        let result;
        try {
          result = await runWorkflow(params.script, {
            agentRunner: runner,
            cwd: ctx.cwd,
            args: params.args,
            signal,
            onLog(message) {
              snapshot.logs.push(message);
            },
            onPhase(title) {
              snapshot.currentPhase = title;
              recordPhase(title);
              emit();
            },
            onAgentStart(event) {
              recordPhase(event.phase);
              snapshot.agents.push({
                id: event.id,
                label: event.label,
                phase: event.phase,
                prompt: event.prompt,
                status: "running",
                startedAt: Date.now()
              });
              emit();
            },
            onAgentActivity(id, metrics) {
              const agent = agentById(id);
              if (!agent) return;
              agent.tokensIn = metrics.tokensIn;
              agent.tokensOut = metrics.tokensOut;
              agent.toolCount = metrics.toolCount;
              agent.currentTool = metrics.currentTool;
              agent.lastTool = metrics.lastTool;
            },
            onAgentEnd(event) {
              const agent = agentById(event.id) ?? [...snapshot.agents].reverse().find((item) => item.label === event.label && item.status === "running");
              if (agent) {
                agent.status = event.result === null ? "error" : "done";
                agent.resultPreview = preview(event.result);
                agent.endedAt = Date.now();
                agent.currentTool = void 0;
              }
              emit();
            }
          });
        } catch (error) {
          if (signal?.aborted || isAbortError(error)) {
            for (const agent of snapshot.agents) {
              if (agent.status === "running") {
                agent.status = "skipped";
                agent.error = "aborted";
              }
            }
            snapshot = recomputeWorkflowSnapshot(snapshot);
            emit(true);
            return {
              content: [{ type: "text", text: renderWorkflowText(snapshot, true) }],
              details: snapshot,
              isError: true
            };
          }
          const message = error instanceof Error ? error.message : String(error);
          snapshot = recomputeWorkflowSnapshot(snapshot);
          return {
            content: [{ type: "text", text: `Workflow failed: ${message}` }],
            details: snapshot,
            isError: true
          };
        }
        snapshot.name = result.meta.name;
        snapshot.description = result.meta.description;
        snapshot.result = result.result;
        snapshot.durationMs = result.durationMs;
        snapshot = recomputeWorkflowSnapshot(snapshot);
        emit(true);
        const noAgents = result.agentCount === 0;
        const body = noAgents ? "workflow scripts must call agent() at least once; this workflow declared phases but did not run any subagents" : `Workflow ${result.meta.name} completed with ${result.agentCount} agent(s).

${renderWorkflowText(snapshot, true)}

Result:
${JSON.stringify(result.result, null, 2)}`;
        return {
          content: [{ type: "text", text: body }],
          details: snapshot,
          isError: noAgents ? true : void 0
        };
      } finally {
        clearInterval(ticker);
      }
    }
  };
}
var workflowCard = {
  id: capabilityId("workflow"),
  title: "Workflow",
  summary: "Run a deterministic JavaScript workflow that fans work out across many subagents.",
  // Erase the precisely-typed builder to the `Capability` card surface (through
  // `unknown`, as TypeBox tools are invariant in their parameter schema).
  build: (ctx) => buildWorkflowCapability(ctx)
};

// src/capability-deck/cards/saas-card.ts
var import_typebox5 = __toESM(require_cjs(), 1);
var SAAS_GATEWAY_KEY = "saasGateway";
function readGateway(ctx) {
  const handle = ctx.framework?.[SAAS_GATEWAY_KEY];
  if (handle && typeof handle.discover === "function" && typeof handle.execute === "function") {
    return handle;
  }
  return void 0;
}
var SaasParams = import_typebox5.Type.Object(
  {
    action: import_typebox5.Type.Union([import_typebox5.Type.Literal("discover"), import_typebox5.Type.Literal("execute")], {
      description: "`discover` lists available remote tool slugs; `execute` runs one slug with arguments."
    }),
    slug: import_typebox5.Type.Optional(
      import_typebox5.Type.String({
        description: "Vendor tool slug to run (e.g. GITHUB_CREATE_ISSUE). Required for `execute`."
      })
    ),
    arguments: import_typebox5.Type.Optional(
      import_typebox5.Type.Record(import_typebox5.Type.String(), import_typebox5.Type.Unknown(), {
        description: "Arguments object for the remote tool, as the connector expects."
      })
    ),
    toolkits: import_typebox5.Type.Optional(
      import_typebox5.Type.Array(import_typebox5.Type.String(), {
        description: "On `discover`, restrict results to these toolkit names."
      })
    ),
    query: import_typebox5.Type.Optional(
      import_typebox5.Type.String({
        description: "On `discover`, free-text filter over available tools."
      })
    )
  },
  { additionalProperties: false }
);
var SAAS_DESCRIPTION = 'Discover and run third-party SaaS actions (GitHub, Slack, Gmail, etc.) through the connector gateway. Use `action:"discover"` to find the right tool slug, then `action:"execute"` with that `slug` and an `arguments` object to perform the action. Tool slugs are vendor-defined and case-sensitive; pass them exactly as listed.';
var STUB_NOTE3 = "The SaaS connector gateway is not configured in this environment, so no remote action was performed. Configure a connector (and authenticate the relevant toolkit) to enable these actions.";
function buildSaasCapability(ctx) {
  const gateway = readGateway(ctx);
  return {
    name: "saas-action",
    label: "SaaS action",
    description: SAAS_DESCRIPTION,
    parameters: SaasParams,
    async execute(_toolCallId, params) {
      if (!gateway) {
        return {
          content: [{ type: "text", text: STUB_NOTE3 }],
          details: { action: params.action, ok: false },
          isError: true
        };
      }
      if (params.action === "discover") {
        const tools = await gateway.discover({ toolkits: params.toolkits, query: params.query });
        const text = tools.length === 0 ? "No remote tools matched." : tools.map((t) => `- ${t.slug}${t.description ? ` \u2014 ${t.description}` : ""}`).join("\n");
        return {
          content: [{ type: "text", text }],
          details: { action: "discover", ok: true, count: tools.length }
        };
      }
      if (!params.slug) {
        return {
          content: [{ type: "text", text: "`slug` is required to execute a SaaS action." }],
          details: { action: "execute", ok: false },
          isError: true
        };
      }
      const result = await gateway.execute(params.slug, params.arguments ?? {});
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        details: { action: "execute", ok: result.ok, slug: params.slug },
        isError: result.ok ? void 0 : true
      };
    }
  };
}
var saasCard = {
  id: capabilityId("saas-action"),
  title: "SaaS action",
  summary: "Discover and run third-party SaaS actions through the connector gateway.",
  // Erase the precisely-typed builder to the `Capability` card surface (through
  // `unknown`, as TypeBox tools are invariant in their parameter schema).
  build: (ctx) => buildSaasCapability(ctx)
};

// src/capability-deck/cards/memory-card.ts
var import_typebox6 = __toESM(require_cjs(), 1);
var MEMORY_HANDLE_KEY = "memoryStore";
var InMemoryStore = class {
  buffer = "";
  read() {
    return this.buffer;
  }
  replace(content) {
    this.buffer = content;
  }
  append(line) {
    this.buffer = this.buffer.length === 0 ? line : `${this.buffer}
${line}`;
  }
};
function readStore(ctx) {
  const handle = ctx.framework?.[MEMORY_HANDLE_KEY];
  if (handle && typeof handle.read === "function" && typeof handle.replace === "function" && typeof handle.append === "function") {
    return handle;
  }
  return new InMemoryStore();
}
var MemoryParams = import_typebox6.Type.Object(
  {
    action: import_typebox6.Type.Union(
      [import_typebox6.Type.Literal("read"), import_typebox6.Type.Literal("replace"), import_typebox6.Type.Literal("append")],
      {
        description: "`read` returns the note; `replace` overwrites it; `append` adds a line to the end."
      }
    ),
    content: import_typebox6.Type.Optional(
      import_typebox6.Type.String({
        description: "New note body (for `replace`) or the line to add (for `append`). Ignored for `read`."
      })
    )
  },
  { additionalProperties: false }
);
var MEMORY_DESCRIPTION = 'Keep a small working-memory note that persists across turns \u2014 durable facts, decisions, or reminders you want to retain even after older messages scroll out of context. Use `action:"read"` to recall it, `action:"replace"` to rewrite it from scratch, and `action:"append"` to add a single line. Keep it concise; it is a scratchpad, not a log.';
function buildMemoryCapability(ctx) {
  const store = readStore(ctx);
  return {
    name: "memory",
    label: "Working memory",
    description: MEMORY_DESCRIPTION,
    parameters: MemoryParams,
    async execute(_toolCallId, params) {
      if (params.action === "replace") store.replace(params.content ?? "");
      else if (params.action === "append" && params.content) store.append(params.content);
      const note = store.read();
      const heading = params.action === "read" ? "Working memory:" : params.action === "replace" ? "Working memory replaced:" : "Working memory appended:";
      const body = note.length === 0 ? "(empty)" : note;
      return {
        content: [{ type: "text", text: `${heading}
${body}` }],
        details: { action: params.action, ok: true, length: note.length }
      };
    }
  };
}
var memoryCard = {
  id: capabilityId("memory"),
  title: "Working memory",
  summary: "Read and update a persistent scratch note that survives across turns.",
  // Erase the precisely-typed builder to the `Capability` card surface (through
  // `unknown`, as TypeBox tools are invariant in their parameter schema).
  build: (ctx) => buildMemoryCapability(ctx)
};

// src/capability-deck/cards/plan-tools.ts
var import_typebox7 = __toESM(require_cjs(), 1);
var PLAN_HANDLE_KEY = "planController";
function readPlanController(ctx) {
  const handle = ctx.framework?.[PLAN_HANDLE_KEY];
  if (handle && typeof handle.enterPlanMode === "function") {
    return handle;
  }
  return void 0;
}
var EnterPlanParams = import_typebox7.Type.Object({}, { additionalProperties: false });
var ENTER_PLAN_DESCRIPTION = "Enter plan mode: a read-only research phase in which you may only read, search, and inspect \u2014 every file-mutating and shell tool is blocked until you leave. Use this when a task needs investigation and a plan before any change is made. While in plan mode, gather all the context you need, then call `exit_plan_mode` with the plan you intend to carry out; the user reviews and approves it before you act.";
var ENTER_PLAN_PROSE = "You are now in plan mode (read-only). Investigate freely with the read, search, and listing tools, but do not attempt to edit files or run shell commands \u2014 they are blocked here. When you have a concrete plan, call `exit_plan_mode` with the full plan text so the user can approve it before you make any changes.";
function buildEnterPlanModeCapability(ctx) {
  const controller = readPlanController(ctx);
  return {
    name: "enter_plan_mode",
    label: "Enter plan mode",
    description: ENTER_PLAN_DESCRIPTION,
    readOnly: true,
    parameters: EnterPlanParams,
    async execute() {
      const applied = controller !== void 0;
      if (controller) controller.enterPlanMode();
      return {
        content: [{ type: "text", text: ENTER_PLAN_PROSE }],
        details: { enterPlanMode: true, applied }
      };
    }
  };
}
var ExitPlanParams = import_typebox7.Type.Object(
  {
    plan: import_typebox7.Type.String({
      description: "The plan you intend to carry out, in markdown. The user reviews this before approving the exit from plan mode; on approval you leave plan mode and begin."
    })
  },
  { additionalProperties: false }
);
var EXIT_PLAN_DESCRIPTION = "Leave plan mode and propose the plan you intend to carry out. Provide the full plan as `plan`; the user reviews it and either approves (you exit plan mode and begin the work) or rejects (you stay in plan mode to revise). Only call this once you have a concrete, reviewed plan \u2014 not to do work, but to ask permission to start it.";
function buildExitPlanModeCapability(_ctx) {
  return {
    name: "exit_plan_mode",
    label: "Exit plan mode",
    description: EXIT_PLAN_DESCRIPTION,
    // Marked read-only so the plan-mode gate never blocks the very tool used to
    // request leaving plan mode (it mutates nothing — the conductor owns the flip).
    readOnly: true,
    parameters: ExitPlanParams,
    async execute(_toolCallId, params) {
      const plan = params.plan;
      return {
        content: [
          {
            type: "text",
            text: `Proposed plan (awaiting your approval to leave plan mode):

${plan}`
          }
        ],
        details: { exitPlan: true, plan }
      };
    }
  };
}
var enterPlanModeCard = {
  id: capabilityId("enter_plan_mode"),
  title: "Enter plan mode",
  summary: "Switch into a read-only research phase where mutating tools are blocked.",
  build: (ctx) => buildEnterPlanModeCapability(ctx)
};
var exitPlanModeCard = {
  id: capabilityId("exit_plan_mode"),
  title: "Exit plan mode",
  summary: "Propose a plan and request approval to leave plan mode and begin work.",
  build: (ctx) => buildExitPlanModeCapability(ctx)
};

// src/capability-deck/cards/index.ts
var APP_NOVEL_CARDS = [
  todoCard,
  daemonCard,
  taskCard,
  workflowCard,
  saasCard,
  memoryCard,
  enterPlanModeCard,
  exitPlanModeCard
];

// src/capability-deck/provision.ts
var PROFILE_TABLE = Object.freeze({
  authoring: { builtins: "survey", appCards: false },
  survey: { builtins: "all", appCards: false },
  all: { builtins: "all", appCards: true }
});
function cardsForDeckProfile(profile) {
  const policy = PROFILE_TABLE[profile];
  if (policy === void 0) {
    throw deckFault(
      "unknown_capability",
      `No deck profile is registered under "${String(profile)}".`
    );
  }
  const builtins = cardsForProfile(policy.builtins);
  return policy.appCards ? [...builtins, ...APP_NOVEL_CARDS] : builtins;
}
function buildSelected(cards, ctx) {
  const built = [];
  for (const card of cards) {
    try {
      built.push(card.build(ctx));
    } catch (cause) {
      throw deckFault(
        "build_failed",
        `Capability "${String(card.id)}" failed to build.`,
        cause
      );
    }
  }
  return built;
}
function provisionDeck(profile, ctx) {
  const selected = cardsForDeckProfile(profile);
  const capabilities = buildSelected(selected, ctx);
  return {
    tools() {
      return [...capabilities];
    },
    box() {
      return [...capabilities];
    }
  };
}

// src/boot/runners/read-state.ts
import { normalize } from "node:path";
var READ_STATE_HANDLE_KEY = "readState";
var ReadStateStore = class {
  entries = /* @__PURE__ */ new Map();
  /** Normalize an absolute path into the store's canonical key. */
  key(absPath) {
    return normalize(absPath);
  }
  /** The recorded read fingerprint for a path, or `undefined` if never read. */
  get(absPath) {
    return this.entries.get(this.key(absPath));
  }
  /** Record (or replace) the read fingerprint for a path; returns this store. */
  set(absPath, value) {
    this.entries.set(this.key(absPath), value);
    return this;
  }
  /** Whether a path has a recorded read fingerprint this session. */
  has(absPath) {
    return this.entries.has(this.key(absPath));
  }
  /** Drop a path's recorded read fingerprint; returns whether one existed. */
  delete(absPath) {
    return this.entries.delete(this.key(absPath));
  }
  /** Forget every recorded read for this session. */
  clear() {
    this.entries.clear();
  }
};
function createReadStateStore() {
  return new ReadStateStore();
}

// src/boot/runners/checkpoint.ts
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname as dirname2, normalize as normalize2 } from "node:path";
var CHECKPOINT_HANDLE_KEY = "checkpoint";
var ROOT_NODE_ID = "__root__";
var CheckpointStore = class {
  /** node id → (normalized abs path → first-seen pre-mutation content). */
  byNode = /* @__PURE__ */ new Map();
  /** The transcript node the next {@link record} files its snapshot under. */
  current = null;
  /** Normalize an absolute path into the store's canonical per-node key. */
  key(absPath) {
    return normalize2(absPath);
  }
  /** The node id new snapshots are currently filed under (`null` until pinned). */
  activeNodeId() {
    return this.current;
  }
  /**
   * Pin the transcript node subsequent {@link record} calls file snapshots under.
   *
   * The conductor calls this as its head advances (at turn start), so all of a
   * turn's edits key to the node that was active before the turn ran. Passing the
   * same id again is harmless.
   *
   * @param id the active transcript node id, or `null` to fall back to the root
   */
  setActiveNodeId(id) {
    this.current = id;
  }
  /** The node id snapshots are filed under right now (active id or the root). */
  resolveNodeId() {
    return this.current ?? ROOT_NODE_ID;
  }
  /**
   * Capture the pre-mutation content of `absPath` under the active node.
   *
   * The framework's duck-typed `CheckpointHandle` entry point. Called once per
   * mutated path immediately before the write lands, with the file's OLD on-disk
   * content (or `null` when the file did not exist). First-seen wins: a later
   * `record` of the same path under the same node is ignored so the snapshot
   * reflects the file's state when the node became active, not a mid-turn rewrite.
   *
   * @param absPath  absolute path of the file about to be written
   * @param previous the file's content before this mutation, or `null` if absent
   */
  record(absPath, previous) {
    const nodeId = this.resolveNodeId();
    let paths = this.byNode.get(nodeId);
    if (paths === void 0) {
      paths = /* @__PURE__ */ new Map();
      this.byNode.set(nodeId, paths);
    }
    const k = this.key(absPath);
    if (paths.has(k)) return;
    paths.set(k, previous);
  }
  /**
   * The recorded snapshots for a node, or `[]` when nothing was tracked there.
   *
   * Each entry pairs the normalized absolute path with the content it held before
   * the node's first mutation of it (`null` = the file was absent).
   *
   * @param nodeId the transcript node to read snapshots for
   */
  snapshotFor(nodeId) {
    const paths = this.byNode.get(nodeId);
    if (paths === void 0) return [];
    return [...paths].map(([path, previous]) => ({ path, previous }));
  }
  /** Whether a node has ANY recorded file snapshot (the picker's restore gate). */
  hasSnapshot(nodeId) {
    const paths = this.byNode.get(nodeId);
    return paths !== void 0 && paths.size > 0;
  }
  /**
   * Roll the working tree back to a node's recorded state.
   *
   * For each path the node tracked: when its snapshot is a string, the file is
   * rewritten with that pre-mutation content (creating parent directories as
   * needed); when the snapshot is `null` the file is DELETED (it did not exist at
   * that point). Returns the absolute paths that were restored, in record order.
   *
   * A safe no-op when the node has no snapshot — navigating to a node that never
   * mutated files restores nothing. Per-path failures are swallowed so one
   * unwritable path never aborts the rest of the restore.
   *
   * @param nodeId the transcript node whose file state to restore to
   * @returns the absolute paths that were written or deleted
   */
  restore(nodeId) {
    const snapshots = this.snapshotFor(nodeId);
    const restored = [];
    for (const { path, previous } of snapshots) {
      try {
        if (previous === null) {
          rmSync(path, { force: true });
        } else {
          mkdirSync(dirname2(path), { recursive: true });
          writeFileSync(path, previous, "utf8");
        }
        restored.push(path);
      } catch {
      }
    }
    return restored;
  }
};
function createCheckpointStore() {
  return new CheckpointStore();
}

// src/guardrails.ts
var READ_BEFORE_EDIT_MESSAGE = "File has not been read yet. Read it first before writing to it.";
export {
  CHECKPOINT_HANDLE_KEY,
  CheckpointStore,
  EDIT_TOOL_NAMES,
  READ_BEFORE_EDIT_MESSAGE,
  READ_ONLY_TOOL_NAMES,
  READ_STATE_HANDLE_KEY,
  ReadStateStore,
  bashSubcommandSubjects,
  composeBriefing,
  createCheckpointStore,
  createPermissionGate,
  createReadStateStore,
  evaluateCatastrophic,
  gatherContextDocs,
  makeRule,
  provisionDeck,
  resolveRuleDecision
};
