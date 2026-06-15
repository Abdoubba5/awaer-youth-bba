/* ============================================================
   منصة وعي الشباب BBA - QR Code Utilities Module
   Client-side QR generation using qrcodejs library
   Exposes: BBA.QR.generateDataURL(), BBA.QR.getVerifyUrl()
   ============================================================ */

(function initQRUtils() {
  'use strict';

  var QR_UTILS = {

    /* ============================================================
     * Generate QR code as a data URL (PNG) from text
     * Uses the qrcodejs library (must be loaded via CDN)
     * @param {string} text - The text/URL to encode
     * @param {number} size - QR code size in pixels (default 140)
     * @returns {Promise<string>} - Resolves with data URL
     * ============================================================ */
    generateDataURL: function(text, size) {
      return new Promise(function(resolve, reject) {
        if (!text) {
          reject(new Error('QR text is empty'));
          return;
        }

        size = size || 140;

        /* Try qrcodejs library first for reliable QR generation */
        if (typeof QRCode !== 'undefined') {
          try {
            /* Create a temporary container */
            var container = document.createElement('div');
            container.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + size + 'px;height:' + size + 'px';
            document.body.appendChild(container);

            var qr = new QRCode(container, {
              text: text,
              width: size,
              height: size,
              colorDark: '#D4AF37',
              colorLight: '#0b101b',
              correctLevel: QRCode.CorrectLevel.H
            });

            /* Extract the data URL from the first canvas or img element */
            var canvas = container.querySelector('canvas');
            if (canvas) {
              var dataUrl = canvas.toDataURL('image/png');
              document.body.removeChild(container);
              resolve(dataUrl);
            } else {
              /* Fallback: try img element */
              var img = container.querySelector('img');
              if (img && img.src) {
                document.body.removeChild(container);
                resolve(img.src);
              } else {
                document.body.removeChild(container);
                /* Fallback to external API */
                resolve(getExternalQRUrl(text, size));
              }
            }
          } catch (e) {
            resolve(getExternalQRUrl(text, size));
          }
        } else {
          /* qrcodejs not loaded - use external API as fallback */
          resolve(getExternalQRUrl(text, size));
        }
      });
    },

    /* ============================================================
     * Get the verification URL for a certificate
     * @param {string} certNumber - The certificate number
     * @returns {string} - Full verification URL
     * ============================================================ */
    getVerifyUrl: function(certNumber) {
      var baseUrl = window.location.protocol + '//' + window.location.host +
        window.location.pathname.replace(/[^/]*$/, '');
      return baseUrl + 'verify-certificate.html?id=' + encodeURIComponent(certNumber);
    },

    /* ============================================================
     * Generate QR code and return both data URL and verify URL
     * @param {string} certNumber - The certificate number
     * @param {number} size - QR size in pixels
     * @returns {Promise<{dataUrl: string, verifyUrl: string}>}
     * ============================================================ */
    generateForCertificate: function(certNumber, size) {
      var verifyUrl = this.getVerifyUrl(certNumber);
      var self = this;
      return this.generateDataURL(verifyUrl, size).then(function(dataUrl) {
        return {
          dataUrl: dataUrl,
          verifyUrl: verifyUrl
        };
      });
    }
  };

  /* ============================================================
   * Fallback: external QR API URL builder
   * ============================================================ */
  function getExternalQRUrl(text, size) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text);
  }

  /* ============================================================
   * EXPOSE API
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.QR = QR_UTILS;

  console.log('✅ [BBA QR] QR utilities module loaded');
})();
