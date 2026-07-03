# Instagram SSL Pinning Bypass

Frida script to bypass SSL pinning on Instagram v435.0.0.37.76

## 📥 Download

**Script for v435:** [instagram_v435.js](https://github.com/depreciating/Instagram-SSL-Pinning-Bypass/raw/refs/heads/main/instagram_v435.js)

**APK:** [Instagram 435.0.0.37.76](https://www.apkmirror.com/apk/instagram/instagram-instagram/instagram-435-0-0-37-76-release/)

---

## 🎯 What It Hooks

| # | Class | Method | Purpose |
|---|-------|--------|---------|
| 1 | `CertificateVerifier` | `verify()` | **MAIN** - Bypasses Facebook's custom pinning |
| 2 | `CertificateVerifier` | `verifyWithProofOfPossession()` | Bypasses leaf certificate signature verification |
| 3 | `TigonMNSServiceHolder` | `initHybrid()` | Disables network layer certificate verification |
| 4 | `X509TrustManager` | `checkServerTrusted()` | Bypasses system SSL verification |
| 5 | `TrustManagerImpl` | `checkTrustedRecursive()` | Bypasses Android certificate chain validation |
| 6 | `SSLContext` | `init()` | Injects dummy TrustManager |
| 7 | `SSLContext` | `getSocketFactory()` | Ensures socket factories use modified SSLContext |
| 8 | `X.Nhe` | `check*()` | Bypasses OkHttp CertificatePinner |

---

## 📋 Requirements

- **Frida** 16.0.0+
- **Android** 9.0+ (API 28+)
- **Rooted** device

---

## 🚀 Usage

### Rooted Device
```bash
frida -U -f com.instagram.android -l instagram_v435.js
```
### ⚠️ DISCLAIMER

This script is for **EDUCATIONAL AND RESEARCH PURPOSES ONLY**.  
Use only on your own Instagram account or with explicit permission.  
Bypassing SSL pinning can expose your Instagram data to MITM attacks.  
The author is **NOT** responsible for any account bans, data loss, or misuse.  

**USE AT YOUR OWN RISK.**
