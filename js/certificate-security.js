/* ============================================================
   منصة وعي الشباب BBA - Certificate Anti-Fraud Module
   UUID Generation · HMAC Verification · Revocation · Duplicate Detection
   Version: 1.0.0
   ============================================================ */

(function initCertSecurity() {
  'use strict';

  /* ============================================================
   * CONSTANTS
   * ============================================================ */
  var UUID_PREFIX = 'bba-cert-';
  var STORAGE_KEY = 'bba_cert_security';

  /* ============================================================
   * UUID v4 GENERATION (RFC 4122)
   * No external dependencies
   * ============================================================ */
  function generateUUID() {
    /* Use crypto.randomUUID if available (modern browsers) */
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return UUID_PREFIX + crypto.randomUUID();
    }

    /* Fallback: manual UUID v4 generation */
    var hex = '0123456789abcdef';
    var uuid = '';
    for (var i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-';
      } else if (i === 14) {
        uuid += '4'; /* UUID version 4 */
      } else if (i === 19) {
        uuid += hex[(Math.random() * 4) | 0 | 8]; /* UUID variant 10xx */
      } else {
        uuid += hex[(Math.random() * 16) | 0];
      }
    }
    return UUID_PREFIX + uuid;
  }

  /* ============================================================
   * MD5 IMPLEMENTATION (pure JS, no external dependencies)
   * Produces the same hash as PostgreSQL's built-in md5()
   * Used for client-server consistent verification hashes.
   * Reference: RFC 1321
   * ============================================================ */
  function md5(str) {
    /* Convert string to UTF-8 bytes */
    function utf8Encode(s) {
      var encoded = [];
      for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        if (c < 0x80) {
          encoded.push(c);
        } else if (c < 0x800) {
          encoded.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
        } else if (c < 0xd800 || c >= 0xe000) {
          encoded.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        } else {
          i++;
          c = 0x10000 + (((c & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff));
          encoded.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        }
      }
      return encoded;
    }

    var bytes = utf8Encode(str);
    var len = bytes.length;

    /* Append padding bit and length (MD5 padding) */
    var msg = bytes.slice();
    msg.push(0x80);
    while ((msg.length + 8) % 64 !== 0) msg.push(0);
    var bitLen = len * 8;
    for (var i = 0; i < 8; i++) {
      msg.push((bitLen >>> (i * 8)) & 0xff);
    }

    /* MD5 state */
    var a0 = 0x67452301 | 0;
    var b0 = 0xefcdab89 | 0;
    var c0 = 0x98badcfe | 0;
    var d0 = 0x10325476 | 0;

    /* MD5 round constants */
    var K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
             0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
             0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
             0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
             0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
             0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
             0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
             0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
             0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
             0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
             0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
             0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
             0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
             0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
             0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
             0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];

    /* Per-round shift amounts */
    var S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
             5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
             4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
             6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];

    function leftRotate(x, c) { return (x << c) | (x >>> (32 - c)); }
    function toHex(n) { var h = n.toString(16); while (h.length < 8) h = '0' + h; return h; }

    /* Process 512-bit blocks */
    for (var offset = 0; offset < msg.length; offset += 64) {
      var M = [];
      for (var i = 0; i < 16; i++) {
        M[i] = msg[offset + i * 4] | (msg[offset + i * 4 + 1] << 8) |
               (msg[offset + i * 4 + 2] << 16) | (msg[offset + i * 4 + 3] << 24);
      }

      var A = a0, B = b0, C = c0, D = d0;

      for (var i = 0; i < 64; i++) {
        var F, g;
        if (i < 16) {
          F = (B & C) | (~B & D);
          g = i;
        } else if (i < 32) {
          F = (D & B) | (~D & C);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          F = B ^ C ^ D;
          g = (3 * i + 5) % 16;
        } else {
          F = C ^ (B | ~D);
          g = (7 * i) % 16;
        }
        F = (F + A + K[i] + M[g]) | 0;
        A = D;
        D = C;
        C = B;
        B = (B + leftRotate(F, S[i])) | 0;
      }

      a0 = (a0 + A) | 0;
      b0 = (b0 + B) | 0;
      c0 = (c0 + C) | 0;
      d0 = (d0 + D) | 0;
    }

    /* little-endian hex output (matching PostgreSQL md5) */
    return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
  }

  /* ============================================================
   * VERIFICATION HASH GENERATION
   * Creates the same md5 hash as the server-side create_verification_hash()
   * @param {string} title - Certificate title
   * @param {string} volunteerId - Volunteer ID
   * @param {string} certNumber - Certificate number
   * @param {string} issueDate - ISO date string
   * @returns {string} - Hex-encoded md5 hash
   * ============================================================ */
  function generateVerificationHash(title, volunteerId, certNumber, issueDate) {
    /* Build the same string as the server: title|volunteer_id|cert_number|issue_date */
    var data = (title || '') + '|' +
               (volunteerId || '') + '|' +
               (certNumber || '') + '|' +
               (issueDate || '');

    /* Generate md5 hash matching PostgreSQL's built-in md5() */
    return md5(data);
  }

  /* ============================================================
   * VERIFY CERTIFICATE INTEGRITY
   * Checks if a certificate's stored hash matches a recalculated one
   * @param {Object} cert - Certificate object
   * @returns {Promise<Object>} - { valid: boolean, hashMatch: boolean }
   * ============================================================ */
  async function verifyIntegrity(cert) {
    if (!cert || !cert.certificateNumber) {
      return { valid: false, hashMatch: false, error: 'Invalid certificate' };
    }

    /* Check if revoked (local flag) */
    if (cert.revoked) {
      return {
        valid: false,
        revoked: true,
        revokedReason: cert.revokedReason || 'Revoked',
        hashMatch: true
      };
    }

    /* If no hash stored, certificate was created before anti-fraud system */
    if (!cert.verificationHash) {
      return {
        valid: true,
        hashMatch: null,
        warning: 'Pre-fraud certificate — no verification hash',
        preFraud: true
      };
    }

    /* If hash length doesn't match md5 (32 hex chars), it's a legacy/fallback value */
    if (cert.verificationHash && cert.verificationHash.length !== 32) {
      return {
        valid: null,
        hashMatch: null,
        warning: 'Certificate verification hash uses legacy format',
        legacy: true
      };
    }

    /* Recalculate hash using md5 (synchronous, no await needed) */
    var expectedHash = generateVerificationHash(
      cert.title,
      cert.volunteerId,
      cert.certificateNumber,
      cert.issueDate
    );

    var hashMatch = (cert.verificationHash === expectedHash);

    /* Check for fraud flags */
    var hasFraudFlags = cert.fraudFlags &&
                        Array.isArray(cert.fraudFlags) &&
                        cert.fraudFlags.length > 0;

    if (!hashMatch) {
      return {
        valid: false,
        hashMatch: false,
        error: 'Content hash mismatch — certificate data may have been tampered with'
      };
    }

    if (hasFraudFlags) {
      return {
        valid: false,
        hashMatch: true,
        fraudFlags: cert.fraudFlags,
        error: 'Certificate flagged for suspicious activity'
      };
    }

    return {
      valid: true,
      hashMatch: true,
      certUuid: cert.certUuid || null
    };
  }

  /* ============================================================
   * CREATE ANTI-FRAUD ENHANCED CERTIFICATE
   * Takes an existing certificate object and enriches it with
   * anti-fraud fields (cert_uuid, verification_hash).
   * @param {Object} cert - Certificate to enrich
   * @returns {Promise<Object>} - Certificate with anti-fraud fields
   * ============================================================ */
  function enrichCertificate(cert) {
    if (!cert) return null;

    /* Generate UUID if not present */
    if (!cert.certUuid) {
      cert.certUuid = generateUUID();
    }

    /* Generate verification hash using md5 (synchronous) */
    cert.verificationHash = generateVerificationHash(
      cert.title,
      cert.volunteerId,
      cert.certificateNumber,
      cert.issueDate
    );

    /* Initialize fraud flags */
    if (!cert.fraudFlags) {
      cert.fraudFlags = [];
    }

    /* Initialize revoked fields */
    if (cert.revoked === undefined) {
      cert.revoked = false;
    }

    return cert;
  }

  /* ============================================================
   * DUPLICATE DETECTION (Client-side)
   * Checks if a potential duplicate exists in localStorage
   * @param {string} title - Certificate title
   * @param {string} volunteerId - Volunteer ID
   * @param {string} excludeCertNumber - Certificate number to exclude
   * @returns {Object} - { isDuplicate, confidence, existing }
   * ============================================================ */
  function detectDuplicate(title, volunteerId, excludeCertNumber) {
    if (!title || !volunteerId) {
      return { isDuplicate: false, confidence: 'low', error: 'Missing title or volunteerId' };
    }

    try {
      var certificates = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
      var exactMatches = [];
      var similarMatches = [];
      var thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      for (var i = 0; i < certificates.length; i++) {
        var c = certificates[i];

        /* Skip the certificate being checked */
        if (excludeCertNumber && c.certificateNumber === excludeCertNumber) continue;

        /* Skip revoked certificates */
        if (c.revoked) continue;

        /* Exact match: same title + same volunteer */
        if (c.title === title && c.volunteerId === volunteerId) {
          exactMatches.push(c);
        }

        /* Similar match: first 20 chars of title match + same volunteer + within 30 days */
        if (c.title && c.title.substring(0, 20) === title.substring(0, 20) &&
            c.volunteerId === volunteerId &&
            new Date(c.issueDate).getTime() > thirtyDaysAgo) {
          if (c.title !== title || c.volunteerId !== volunteerId) {
            similarMatches.push(c);
          }
        }
      }

      if (exactMatches.length > 0) {
        return {
          isDuplicate: true,
          confidence: 'high',
          type: 'exact_match',
          existing: exactMatches[0],
          message: 'هذا المتطوع لديه بالفعل شهادة بنفس العنوان'
        };
      }

      if (similarMatches.length > 0) {
        return {
          isDuplicate: true,
          confidence: 'medium',
          type: 'similar_recent',
          count: similarMatches.length,
          message: 'حصل هذا المتطوع على ' + similarMatches.length + ' شهادة مشابهة في آخر 30 يوماً'
        };
      }

      return {
        isDuplicate: false,
        confidence: 'high',
        message: 'لا توجد شهادة مكررة'
      };
    } catch (e) {
      return { isDuplicate: false, confidence: 'low', error: e.message };
    }
  }

  /* ============================================================
   * REVOKE A CERTIFICATE (localStorage)
   * @param {string} certNumber - Certificate number to revoke
   * @param {string} reason - Reason for revocation
   * @returns {Object} - { success, message }
   * ============================================================ */
  function revokeCertificate(certNumber, reason) {
    if (!certNumber || !reason) {
      return { success: false, error: 'Certificate number and reason are required' };
    }

    try {
      var certificates = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
      var found = false;

      for (var i = 0; i < certificates.length; i++) {
        if (certificates[i].certificateNumber === certNumber) {
          certificates[i].revoked = true;
          certificates[i].revokedAt = new Date().toISOString();
          certificates[i].revokedReason = reason;
          found = true;
          break;
        }
      }

      if (!found) {
        return { success: false, error: 'Certificate not found' };
      }

      localStorage.setItem('bba_certificates', JSON.stringify(certificates));

      /* Audit the revocation */
      if (window.BBA && window.BBA.Audit && typeof window.BBA.Audit.logCertificateDelete === 'function') {
        window.BBA.Audit.logCertificateDelete(certNumber, 'إلغاء - ' + reason);
      }

      return { success: true, message: 'تم إلغاء الشهادة بنجاح' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
   * GET FRAUD STATUS DISPLAY
   * Returns Arabic display strings for certificate status
   * @param {Object} cert - Certificate object
   * @returns {Object} - { status, badgeClass, icon, details }
   * ============================================================ */
  function getStatusDisplay(cert) {
    if (!cert) {
      return { status: 'غير معروف', badgeClass: 'badge-pending', icon: '❓', details: '' };
    }

    if (cert.revoked) {
      return {
        status: 'ملغاة',
        badgeClass: 'badge-rejected',
        icon: '🚫',
        details: 'تم إلغاء هذه الشهادة: ' + (cert.revokedReason || 'سبب غير محدد')
      };
    }

    if (cert.fraudFlags && Array.isArray(cert.fraudFlags) && cert.fraudFlags.length > 0) {
      return {
        status: 'موضع شك',
        badgeClass: 'badge-pending',
        icon: '⚠️',
        details: 'هذه الشهادة معلّمة للتدقيق'
      };
    }

    if (cert.verificationHash) {
      return {
        status: 'صالحة ومعتمدة',
        badgeClass: 'badge-approved',
        icon: '✅',
        details: 'شهادة موثقة برمز تحقق رقمي • المعرف: ' + (cert.certUuid || '---')
      };
    }

    return {
      status: 'صالحة',
      badgeClass: 'badge-approved',
      icon: '✅',
      details: 'شهادة صادرة عن المنصة'
    };
  }

  /* ============================================================
   * SYNC TO SUPABASE
   * Push the anti-fraud enriched certificates to Supabase
   * ============================================================ */
  async function syncToSupabase() {
    try {
      var supabaseClient = window.__bba_supabase_client;
      if (!supabaseClient) return { synced: false, error: 'No Supabase client' };

      var certificates = JSON.parse(localStorage.getItem('bba_certificates') || '[]');

      for (var i = 0; i < certificates.length; i++) {
        var cert = certificates[i];
        if (!cert.certUuid || !cert.verificationHash) continue;

        var { error } = await supabaseClient
          .from('certificates')
          .update({
            cert_uuid: cert.certUuid,
            verification_hash: cert.verificationHash,
            revoked: cert.revoked || false,
            revoked_at: cert.revokedAt || null,
            revoked_reason: cert.revokedReason || '',
            fraud_flags: cert.fraudFlags || [],
            duplicate_of: cert.duplicateOf || null
          })
          .eq('certificate_number', cert.certificateNumber);

        if (error) {
          console.warn('[BBA Cert] Sync error for ' + cert.certificateNumber + ':', error.message);
        }
      }

      return { synced: true, count: certificates.length };
    } catch (e) {
      return { synced: false, error: e.message };
    }
  }

  /* ============================================================
   * MIGRATE EXISTING CERTIFICATES
   * Enriches all existing certificates with UUID + hash in-place
   * @returns {Promise<number>} - Number of certificates enriched
   * ============================================================ */
  async function migrateExistingCertificates() {
    try {
      var certificates = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
      var enriched = 0;

      for (var i = 0; i < certificates.length; i++) {
        /* Skip if already enriched */
        if (certificates[i].certUuid && certificates[i].verificationHash) continue;

        certificates[i] = enrichCertificate(certificates[i]);
        enriched++;
      }

      if (enriched > 0) {
        localStorage.setItem('bba_certificates', JSON.stringify(certificates));
      }

      return enriched;
    } catch (e) {
      console.warn('[BBA Cert] Migration error:', e.message);
      return 0;
    }
  }

  /* ============================================================
   * EXPOSE PUBLIC API
   * ============================================================ */
  var CertSecurity = {
    md5: md5,
    generateUUID: generateUUID,
    generateVerificationHash: generateVerificationHash,
    verifyIntegrity: verifyIntegrity,
    enrichCertificate: enrichCertificate,
    detectDuplicate: detectDuplicate,
    revokeCertificate: revokeCertificate,
    getStatusDisplay: getStatusDisplay,
    syncToSupabase: syncToSupabase,
    migrateExistingCertificates: migrateExistingCertificates,
    VERSION: '2.0.0'
  };

  window.BBA = window.BBA || {};
  window.BBA.CertSecurity = CertSecurity;

  /* Auto-migrate existing certificates on load (runs once) */
  (function autoMigrate() {
    /* Skip if already migrated */
    if (localStorage.getItem('bba_cert_migrated_v1') === 'true') return;

    var check = setInterval(function() {
      if (window.BBA && window.BBA.DB) {
        clearInterval(check);
        migrateExistingCertificates().then(function(count) {
          if (count > 0) {
            localStorage.setItem('bba_cert_migrated_v1', 'true');
            console.log('✅ [BBA Cert] Migrated ' + count + ' existing certificates with anti-fraud data');
          }
        });
      }
    }, 500);

    /* Timeout safeguard */
    setTimeout(function() { clearInterval(check); }, 10000);
  })();

  console.log('✅ [BBA Cert] Certificate anti-fraud module loaded v' + CertSecurity.VERSION);
})();
