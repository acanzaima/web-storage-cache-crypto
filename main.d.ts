type StorageType = "localStorage" | "sessionStorage" | Storage;
type ExpType = number | string | Date;
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
export default class WebStorageCacheCrypto {
    opt: Partial<WebStorageCacheCryptoConstructorOptions>;
    crypt: boolean;
    storage?: Storage;
    isSupported: () => boolean;
    quotaExceedHandler?: Function;
    constructor(options?: Partial<WebStorageCacheCryptoConstructorOptions>);
    set(key: string, val: any, options?: Partial<WebStorageCacheCryptoOptions>): any;
    get(key: string): any;
    delete(key: string): string;
    deleteAllExpires(): (string | null | undefined)[];
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
    add(key: string, value: any, options?: Partial<WebStorageCacheCryptoOptions>): boolean;
    replace(key: string, value: any, options?: Partial<WebStorageCacheCryptoOptions>): boolean;
    touch(key: string, exp: ExpType): boolean;
    encrypt(value: any): any;
    decrypt(value: any): any;
}
export {};
