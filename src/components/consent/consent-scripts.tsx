import Script from "next/script";
import { buildConsentBootstrapScript } from "@/lib/consent/consent-mode";
import { getGtmId, isConsentEnabled } from "@/lib/consent/config";

export function ConsentScripts() {
  if (!isConsentEnabled()) {
    return null;
  }

  const gtmId = getGtmId();

  return (
    <>
      <Script
        id="motorock-consent-bootstrap"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: buildConsentBootstrapScript() }}
      />
      {gtmId ? (
        <Script
          id="motorock-gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      ) : null}
    </>
  );
}

export function GtmNoScript() {
  const gtmId = getGtmId();

  if (!gtmId || !isConsentEnabled()) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
