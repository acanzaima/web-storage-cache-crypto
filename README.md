# WebStorageCacheCrypto

在[WebStorageCache](https://github.com/wuchangming/web-storage-cache)的基础上新增了加解密功能

# 用法

npm 下载

```
npm install web-storage-cache-crypto --save-dev
```

# API

## Constructor

```javascript
const wsCache = new WebStorageCacheCrypto({
    // ***以下是原WebStorageCache API***
    // [可选] 'localStorage', 'sessionStorage', window.localStorage, window.sessionStorage
    //        或者其他实现了 [Storage API] 的storage实例.
    //        默认 'localStorage'.
    storage: 'localStorage',
    // [可选]  类型Number，公共超时事件设置。默认无限大
    exp: Infinity,

    // ***以下是新增API***
    // [可选]  是否开启加密（默认开启），开启加密时需同时指定有效的encrypt和decrypt方法，否则仍视为不开启加密
    crypt: boolean;
    // [可选] 加密方法 默认使用js-base64的encode
    encrypt: (value: any) => any;
    // [可选] 解密方法 默认使用js-base64的decode
    decrypt: (value: any) => any;
});
```

其他 api 同[WebStorageCache](https://github.com/wuchangming/web-storage-cache)，`V 0.0.5`增加了对原生`Storage`的`getItem`、`setItem`、`removeItem`API 的兼容
