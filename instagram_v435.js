/* 
depreciating
INSTAGRAM v435 SSL PINNING BYPASS
*/

'use strict'

var isTigonMNSServiceHolderHooked = false;

function hookLibLoading(){
    Java.perform(() => {
        var systemClass = Java.use("com.facebook.soloader.MergedSoMapping$Invoke_JNI_OnLoad");
        systemClass.libappstatelogger2_so.implementation = function(){
            if(isTigonMNSServiceHolderHooked == false){
                isTigonMNSServiceHolderHooked = true;
                hookTigonMNSServiceHolder();
                hookCertificateVerifier();
                hookX509TrustManager();
                hookSSLSocketFactory();
                hookOkHttpCertificatePinner();
            }
            var ret = this.libappstatelogger2_so();
            return ret;
        }
    });
}

function hookTigonMNSServiceHolder() {
    Java.perform(() => {
        try {
            const Holder = Java.use("com.facebook.tigon.tigonmns.TigonMNSServiceHolder");
            const providers = [
                "com.facebook.tigon.iface.TigonServiceHolderProvider",
                "com.facebook.tigon.iface.TigonServiceHolder",
            ];
            const hucs = [
                "com.facebook.tigon.tigonhuc.HucClient",
                "com.facebook.tigon.huc.HucClient",
            ];

            let OL = null;

            Holder.initHybrid.overloads.forEach((ol, i) => {
                const sig = ol.argumentTypes.map(t => t.className);

                const matchNew = sig.length === 6 &&
                    sig[0] === "com.facebook.tigon.tigonmns.TigonMNSConfig" &&
                    sig[1] === "java.lang.String" &&
                    hucs.indexOf(sig[2]) !== -1 &&
                    sig[3] === "boolean" &&
                    providers.indexOf(sig[4]) !== -1 &&
                    sig[5] === "java.lang.String";

                const matchOld = sig.length === 6 &&
                    sig[0] === "com.facebook.tigon.tigonmns.TigonMNSConfig" &&
                    sig[1] === "java.lang.String" &&
                    hucs.indexOf(sig[2]) !== -1 &&
                    providers.indexOf(sig[3]) !== -1 &&
                    sig[4] === "java.lang.String" &&
                    sig[5] === "boolean";

                if (matchNew || matchOld) {
                    OL = ol;
                    console.log(`[*][+] Picked initHybrid overload #${i} (${sig.join(", ")})`);
                }
            });

            if (!OL) {
                try {
                    Holder.initHybrid.overloads.forEach((ol, i) =>
                        console.log("[initHybrid OL" + i + "] (" +
                            ol.argumentTypes.map(t => t.className).join(", ") + ")")
                    );
                } catch (e) {}
                throw new Error("Uygun initHybrid overload bulunamadı");
            }

            OL.implementation = function() {
                const cfg = arguments[0];
                try { if (cfg.setEnableCertificateVerificationWithProofOfPossession) cfg.setEnableCertificateVerificationWithProofOfPossession(false); } catch (e) {}
                try { if (cfg.setTrustSandboxCertificates) cfg.setTrustSandboxCertificates(true); } catch (e) {}
                try { if (cfg.setForceHttp2) cfg.setForceHttp2(true); } catch (e) {}

                console.log("[*][+] Hooked TigonMNSServiceHolder.initHybrid");
                return OL.apply(this, arguments);
            };
        } catch (e) {
            console.log("[*][-] Failed to TigonMNSServiceHolder.initHybrid: " + e);
        }
    });
}

function hookCertificateVerifier() {
    Java.perform(() => {
        try {
            const CertVerifier = Java.use("com.facebook.mobilenetwork.internal.certificateverifier.CertificateVerifier");

            const verifyOverloads = CertVerifier.verify.overloads;
            verifyOverloads.forEach((ol, i) => {
                const sig = ol.argumentTypes.map(t => t.className).join(", ");
                console.log(`[*][+] Hooking CertificateVerifier.verify overload #${i} (${sig})`);
                ol.implementation = function() {
                    console.log("[*][+] CertificateVerifier.verify called - bypassing");
                };
            });

            const verify3Overload = CertVerifier.verify.overload("[[B", "java.lang.String", "boolean");
            if (verify3Overload) {
                console.log("[*][+] Hooking CertificateVerifier.verify (3 params)");
                verify3Overload.implementation = function(certs, host, bool) {
                    console.log("[*][+] CertificateVerifier.verify (3 params) called - bypassing");
                };
            }

            const verifyPoP = CertVerifier.verifyWithProofOfPossession.overload(
                "[[B", "java.lang.String", "boolean", "int", "[B", "[B"
            );
            if (verifyPoP) {
                console.log("[*][+] Hooking CertificateVerifier.verifyWithProofOfPossession");
                verifyPoP.implementation = function(certs, host, bool, sigScheme, data, signature) {
                    console.log("[*][+] CertificateVerifier.verifyWithProofOfPossession called - bypassing");
                };
            }

        } catch (e) {
            console.log("[*][-] Failed to hook CertificateVerifier: " + e);
        }
    });
}

function hookX509TrustManager() {
    Java.perform(() => {
        try {
            const X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
            
            // CRITICAL: Hook checkServerTrusted in ALL implementations
            const checkServerTrusted = X509TrustManager.checkServerTrusted;
            if (checkServerTrusted) {
                console.log("[*][+] Hooking X509TrustManager.checkServerTrusted");
                checkServerTrusted.overloads.forEach(function(ol, idx) {
                    ol.implementation = function(chain, authType) {
                        console.log("[*][+] X509TrustManager.checkServerTrusted bypassed for: " + authType);
                        // Do nothing - accept all certificates
                    };
                });
            }

            const checkClientTrusted = X509TrustManager.checkClientTrusted;
            if (checkClientTrusted) {
                checkClientTrusted.overloads.forEach(function(ol, idx) {
                    ol.implementation = function(chain, authType) {
                        console.log("[*][+] X509TrustManager.checkClientTrusted bypassed");
                    };
                });
            }

            const getAcceptedIssuers = X509TrustManager.getAcceptedIssuers;
            if (getAcceptedIssuers) {
                getAcceptedIssuers.implementation = function() {
                    console.log("[*][+] X509TrustManager.getAcceptedIssuers returning empty array");
                    return [];
                };
            }
        } catch (e) {
            console.log("[*][-] Failed to hook X509TrustManager: " + e);
        }
    });
}

function hookSSLSocketFactory() {
    Java.perform(() => {
        try {
            const SSLContext = Java.use("javax.net.ssl.SSLContext");
            const getSocketFactory = SSLContext.getSocketFactory;
            if (getSocketFactory) {
                console.log("[*][+] Hooking SSLContext.getSocketFactory");
                getSocketFactory.implementation = function() {
                    var factory = getSocketFactory.call(this);
                    console.log("[*][+] SSLContext.getSocketFactory called");
                    return factory;
                };
            }
        } catch (e) {
            console.log("[*][-] Failed to hook SSLContext.getSocketFactory: " + e);
        }

        try {
            const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            const setDefaultSSLSocketFactory = HttpsURLConnection.setDefaultSSLSocketFactory;
            if (setDefaultSSLSocketFactory) {
                console.log("[*][+] Hooking HttpsURLConnection.setDefaultSSLSocketFactory");
                setDefaultSSLSocketFactory.implementation = function(factory) {
                    console.log("[*][+] HttpsURLConnection.setDefaultSSLSocketFactory called");
                    setDefaultSSLSocketFactory.call(this, factory);
                };
            }
        } catch (e) {
            console.log("[*][-] Failed to hook HttpsURLConnection: " + e);
        }
    });
}

function hookOkHttpCertificatePinner() {
    Java.perform(() => {
        try {
            const XNhe = Java.use("X.Nhe");
            if (XNhe) {
                console.log("[*][+] Found X.Nhe (CertificatePinner) - hooking check methods");
                const methods = XNhe.class.getDeclaredMethods();
                methods.forEach(function(method) {
                    if (method.getName().indexOf("check") !== -1) {
                        console.log("[*][+] Found method: " + method.getName());
                        try {
                            const methodName = method.getName();
                            if (XNhe[methodName]) {
                                XNhe[methodName].overloads.forEach(function(ol, idx) {
                                    console.log("[*][+] Hooking " + methodName + " overload #" + idx);
                                    ol.implementation = function() {
                                        console.log("[*][+] X.Nhe." + methodName + " bypassed");
                                    };
                                });
                            }
                        } catch (e) {
                            console.log("[*][-] Failed to hook method: " + e);
                        }
                    }
                });
            }
        } catch (e) {
            console.log("[*][-] X.Nhe not found: " + e);
        }
    });
}

function logger(message) {
    console.log(message);
}

hookLibLoading();

Java.perform(function() {
    try {
        var array_list = Java.use("java.util.ArrayList");
        var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        if (ApiClient.checkTrustedRecursive) {
            logger("[*][+] Hooked checkTrustedRecursive")
            ApiClient.checkTrustedRecursive.implementation = function(a1, a2, a3, a4, a5, a6) {
                var k = array_list.$new();
                return k;
            }
        } else {
            logger("[*][-] checkTrustedRecursive not Found")
        }
    } catch (e) {
        logger("[*][-] Failed to hook checkTrustedRecursive")
    }
});

Java.perform(function() {
    try {
        const x509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
        const sSLContext = Java.use("javax.net.ssl.SSLContext");
        const TrustManager = Java.registerClass({
            implements: [x509TrustManager],
            methods: {
                checkClientTrusted(chain, authType) {},
                checkServerTrusted(chain, authType) {},
                getAcceptedIssuers() { return []; },
            },
            name: "com.leftenter.instagram",
        });
        const TrustManagers = [TrustManager.$new()];
        const SSLContextInit = sSLContext.init.overload(
            "[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom");
        SSLContextInit.implementation = function(keyManager, trustManager, secureRandom) {
            console.log("[*][+] SSLContext.init called - replacing with custom TrustManager");
            SSLContextInit.call(this, keyManager, TrustManagers, secureRandom);
        };
        logger("[*][+] Hooked SSLContextInit")
    } catch (e) {
        logger("[*][-] Failed to hook SSLContextInit")
    }
});