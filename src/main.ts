import { encode, decode } from "js-base64";

// storage类型
type StorageType = "localStorage" | "sessionStorage" | Storage;

// 超时设置类型
type ExpType = number | string | Date;

// 缓存项类型
interface CacheItemType {
  c: number;
  e: number;
  v: string;
}

// 缓存设置类型
interface WebStorageCacheCryptoOptions {
  /**
   * 超时时间，秒。
   * 默认无限大。
   */
  exp: ExpType;

  /**
   * 为true时：当超过最大容量导致无法继续插入数据操作时，先清空缓存中已超时的内容后再尝试插入数据操作。
   * 默认为true。
   */
  force: boolean;
}

// 设置错误类型
interface DOMExceptionCustomType extends DOMException {
  /**
   * 错误码
   */
  code: number;
  /**
   * 错误信息
   */
  message: string;
  /**
   * ie
   */
  number: number;
}

// 配置
interface WebStorageCacheCryptoConstructorOptions {
  /**
   * 'localStorage', 'sessionStorage', window.localStorage, window.sessionStorage 或者其他实现了 [Storage API] 的storage实例
   * 默认 'localStorage'
   */
  storage: StorageType;
  /**
   * 公共超时事件设置 默认无限大
   */
  exp: ExpType;
  /**
   * 是否开启加密，开启加密时需同时指定有效的encrypt和decrypt方法，否则仍视为不开启加密
   */
  crypt: boolean;
  /**
   * 加密方法 默认使用js-base64的encode
   */
  encrypt: (value: any) => any;
  /**
   * 解密方法 默认使用js-base64的decode
   */
  decrypt: (value: any) => any;
}

interface StrObject {
  [key: string]: any;
}

const _maxExpireDate = new Date("Fri, 31 Dec 9999 23:59:59 UTC");
let _defaultExpire = _maxExpireDate;

// https://github.com/jeromegn/Backbone.localStorage/blob/master/backbone.localStorage.js#L63
const defaultSerializer = {
  serialize: function (item: any) {
    return JSON.stringify(item);
  },
  // fix for "illegal access" error on Android when JSON.parse is
  // passed null
  deserialize: function (data: any) {
    return data && JSON.parse(data);
  },
};

function _extend(obj: StrObject, props?: StrObject) {
  for (const key in props) obj[key] = props[key];
  return obj;
}

/**
 * https://github.com/gsklee/ngStorage/blob/master/ngStorage.js#L52
 *
 * When Safari (OS X or iOS) is in private browsing mode, it appears as
 * though localStorage is available, but trying to call .setItem throws an
 * exception below: "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was
 * made to add something to storage that exceeded the quota."
 */
function _isStorageSupported(storage: Storage) {
  let supported = false;
  if (storage && storage.setItem) {
    supported = true;
    const key = "__" + Math.round(Math.random() * 1e7);
    try {
      storage.setItem(key, key);
      storage.removeItem(key);
    } catch (err) {
      supported = false;
    }
  }
  return supported;
}

// get storage instance
function _getStorageInstance(storage: StorageType): Storage {
  const type = typeof storage;
  if (type === "string" && window[storage as keyof Window] instanceof Storage) {
    return window[storage as keyof Window];
  }
  return storage as Storage;
}

function _isValidDate(date: Date) {
  return Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date.getTime());
}

function _getExpiresDate(expires: ExpType, now?: Date) {
  now = now || new Date();

  if (typeof expires === "number") {
    expires = expires === Infinity ? _maxExpireDate : new Date(now.getTime() + expires * 1000);
  } else if (typeof expires === "string") {
    expires = new Date(expires);
  }

  if (expires && !_isValidDate(expires)) {
    throw new Error("`expires` parameter cannot be converted to a valid Date instance");
  }

  return expires;
}

// http://crocodillon.com/blog/always-catch-localstorage-security-and-quota-exceeded-errors
function _isQuotaExceeded(e: DOMExceptionCustomType) {
  let quotaExceeded = false;
  if (e) {
    if (e.code) {
      switch (e.code) {
        case 22:
          quotaExceeded = true;
          break;
        case 1014:
          // Firefox
          if (e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
            quotaExceeded = true;
          }
          break;
      }
    } else if (e.number === -2147024882) {
      // Internet Explorer 8
      quotaExceeded = true;
    }
  }
  return quotaExceeded;
}

// cache item constructor
function CacheItemConstructor(value: string, exp: ExpType): CacheItemType {
  exp = exp || _defaultExpire;
  const expires = _getExpiresDate(exp);
  return {
    c: new Date().getTime(), // createTime
    e: expires.getTime(), // expiresTime
    v: value,
  };
}

function _isCacheItem(item: CacheItemType | null) {
  if (typeof item !== "object") {
    return false;
  }
  if (item) {
    if ("c" in item && "e" in item && "v" in item) {
      return true;
    }
  }
  return false;
}

// check cacheItem If effective
function _checkCacheItemIfEffective(cacheItem: CacheItemType) {
  const timeNow = new Date().getTime();
  return timeNow < cacheItem.e;
}

function _checkAndWrapKeyAsString(key: string) {
  if (typeof key !== "string") {
    console.warn(key + " used as a key, but it is not a string.");
    key = String(key);
  }
  return key;
}

// cache api
const CacheAPI = {
  // @ts-ignore
  set: function (key: string, val: any, options?: Partial<WebStorageCacheCryptoOptions>): any {},
  // @ts-ignore
  get: function (key: string): any {},
  // @ts-ignore
  delete: function (key: string): string {},
  // @ts-ignore
  deleteAllExpires: function (): (string | null | undefined)[] {},
  // @ts-ignore
  getItem: function (key: string): any {},
  // @ts-ignore
  setItem: function (key: string, val: any): void {},
  // @ts-ignore
  removeItem: function (key: string): void {},
  // @ts-ignore
  getEncryptedRaw: function (key: string): any {},
  // @ts-ignore
  clear: function (): void {},
  // @ts-ignore
  add: function (key: string, value: any, options?: Partial<WebStorageCacheCryptoOptions>): boolean {},
  // @ts-ignore
  replace: function (key: string, exp: number): boolean {},
  // @ts-ignore
  touch: function (key: string, exp?: ExpType): void {},
  // @ts-ignore
  encrypt: function (value: any): any {},
  // @ts-ignore
  decrypt: function (value: any): any {},
};

export default class WebStorageCacheCrypto {
  opt: Partial<WebStorageCacheCryptoConstructorOptions>;
  crypt: boolean;
  storage?: Storage;
  isSupported: () => boolean;
  quotaExceedHandler?: Function;
  constructor(options?: Partial<WebStorageCacheCryptoConstructorOptions>) {
    const defaults = {
      storage: "localStorage",
      exp: Infinity, //An expiration time, in seconds. default never .
      crypt: true,
      encrypt: encode,
      decrypt: decode,
    };
    const opt = _extend(defaults, options);
    this.opt = opt;

    const expires = opt.exp;

    this.crypt = opt.crypt ? (opt.encrypt && opt.decrypt ? opt.crypt : false) : opt.crypt;

    if (expires && typeof expires !== "number" && !_isValidDate(expires)) {
      throw new Error("Constructor `exp` parameter cannot be converted to a valid Date instance");
    } else {
      _defaultExpire = expires;
    }

    const storage = _getStorageInstance(opt.storage);

    const isSupported = _isStorageSupported(storage);

    this.isSupported = function () {
      return isSupported;
    };

    if (isSupported) {
      this.storage = storage;

      this.quotaExceedHandler = function (key: string, val: any, options?: Partial<WebStorageCacheCryptoOptions>, e?: Error): void {
        console.warn("Quota exceeded!", e);
        if (options && options.force === true) {
          const deleteKeys = this.deleteAllExpires();
          console.warn("delete all expires CacheItem : [" + deleteKeys + "] and try execute `set` method again!");
          try {
            options.force = false;
            this.set(key, val, options);
          } catch (err) {
            console.warn(err);
          }
        }
      };
    } else {
      // if not support, rewrite all functions without doing anything
      _extend(this, CacheAPI);
    }
  }

  // 设置缓存
  set(key: string, val: any, options?: Partial<WebStorageCacheCryptoOptions>): any {
    key = _checkAndWrapKeyAsString(key);

    // If the parameter is a number, it is treated as an expiration time.
    if (typeof options === "number") {
      options = {
        exp: options,
      };
    }

    options = _extend({ force: true }, options);

    if (val === undefined) {
      return this.delete(key);
    }

    const value = defaultSerializer.serialize(val);

    const cacheItem = CacheItemConstructor(value, options.exp!);
    try {
      this.storage?.setItem(this.encrypt(key), this.encrypt(defaultSerializer.serialize(cacheItem)));
    } catch (e) {
      if (_isQuotaExceeded(e as DOMExceptionCustomType)) {
        //data wasn't successfully saved due to quota exceed so throw an error
        this.quotaExceedHandler && this.quotaExceedHandler(key, value, options, e);
      } else {
        console.error(e);
      }
    }

    return val;
  }

  // 获取缓存
  get(key: string): any {
    key = _checkAndWrapKeyAsString(key);
    let cacheItem: CacheItemType | null = null;
    try {
      cacheItem = defaultSerializer.deserialize(this.decrypt(this.storage?.getItem(this.encrypt(key))));
    } catch (e) {
      return null;
    }
    if (_isCacheItem(cacheItem)) {
      if (_checkCacheItemIfEffective(cacheItem!)) {
        const value = (cacheItem as CacheItemType).v;
        return defaultSerializer.deserialize(value);
      } else {
        this.delete(key);
      }
    }
    return null;
  }

  // 删除缓存
  delete(key: string): string {
    key = _checkAndWrapKeyAsString(key);
    this.storage?.removeItem(this.encrypt(key));
    return key;
  }

  // 删除所有过期内容
  deleteAllExpires(): (string | null | undefined)[] {
    const length = this.storage?.length || 0;
    const deleteKeys: (string | null | undefined)[] = [];
    const _this = this;
    for (let i = 0; i < length; i++) {
      const key = this.storage?.key(i);
      let cacheItem: CacheItemType | null = null;
      try {
        cacheItem = defaultSerializer.deserialize(this.decrypt(this.storage?.getItem(this.encrypt(key))));
      } catch (e) {}

      if (cacheItem !== null && cacheItem.e !== undefined) {
        const timeNow = new Date().getTime();
        if (timeNow >= cacheItem.e) {
          deleteKeys.push(key);
        }
      }
    }
    deleteKeys.forEach(function (key) {
      _this.delete(key as string);
    });
    return deleteKeys;
  }

  // 实现 Storage.getItem 方法
  getItem(key: string): string | null {
    return this.get(key) || null;
  }

  // 实现 Storage.setItem 方法
  setItem(key: string, value: string): void {
    this.set(key, value);
  }

  // 实现 Storage.removeItem 方法
  removeItem(key: string): void {
    this.delete(key);
  }

  // 获取未解密的缓存 （用于在某些加密场景下直接还原存储信息）
  getEncryptedRaw(key: string): any {
    // 非加密模式 直接调用 get方法
    if (!this.crypt) return this.get(key) || null;
    // 加密模式
    key = _checkAndWrapKeyAsString(key);
    let encryptVal: string | null;
    try {
      encryptVal = this.storage?.getItem(this.encrypt(key)) as string | null;
      return encryptVal;
    } catch (e) {
      return null;
    }
  }

  // 清空缓存
  clear(): void {
    this.storage?.clear();
  }

  // 新增缓存
  add(key: string, value: any, options?: Partial<WebStorageCacheCryptoOptions>): boolean {
    key = _checkAndWrapKeyAsString(key);
    // If the parameter is a number, it is treated as an expiration time.
    if (typeof options === "number") {
      options = {
        exp: options,
      };
    }
    options = _extend({ force: true }, options);
    try {
      const cacheItem = defaultSerializer.deserialize(this.decrypt(this.storage?.getItem(this.encrypt(key))));
      if (!_isCacheItem(cacheItem) || !_checkCacheItemIfEffective(cacheItem)) {
        this.set(key, value, options);
        return true;
      }
    } catch (e) {
      this.set(key, value, options);
      return true;
    }
    return false;
  }

  // 替换缓存
  replace(key: string, value: any, options?: Partial<WebStorageCacheCryptoOptions>): boolean {
    key = _checkAndWrapKeyAsString(key);
    let cacheItem: CacheItemType | null = null;
    try {
      cacheItem = defaultSerializer.deserialize(this.decrypt(this.storage?.getItem(this.encrypt(key))));
    } catch (e) {
      return false;
    }
    if (_isCacheItem(cacheItem)) {
      if (_checkCacheItemIfEffective(cacheItem!)) {
        this.set(key, value, options);
        return true;
      } else {
        this.delete(key);
      }
    }
    return false;
  }

  // 更新缓存
  touch(key: string, exp: ExpType): boolean {
    key = _checkAndWrapKeyAsString(key);
    let cacheItem: CacheItemType | null = null;
    try {
      cacheItem = defaultSerializer.deserialize(this.decrypt(this.storage?.getItem(this.encrypt(key))));
    } catch (e) {
      return false;
    }
    if (_isCacheItem(cacheItem)) {
      if (_checkCacheItemIfEffective(cacheItem!)) {
        this.set(key, this.get(key), { exp: exp });
        return true;
      } else {
        this.delete(key);
      }
    }
    return false;
  }
  // 加密数据
  encrypt(value: any): any {
    return this.crypt ? this.opt.encrypt!(value) : value;
  }
  // 解密数据
  decrypt(value: any): any {
    return this.crypt ? this.opt.decrypt!(value) : value;
  }
}
