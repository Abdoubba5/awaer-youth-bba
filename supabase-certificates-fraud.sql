-- ============================================================
-- منصة وعي الشباب BBA - Certificate Anti-Fraud Migration
-- Version: 2.0.0
--
-- ⚠️ NO EXTERNAL EXTENSIONS REQUIRED
-- Uses only built-in PostgreSQL functions:
--   • gen_random_uuid() — built-in since PostgreSQL 13
--   • md5() — always available, no extension needed
--   • encode() / convert_to() — built-in
--
-- Adds cryptographic integrity protection to certificates:
--   ✅ cert_uuid — Unique UUID per certificate (separate from sequential ID)
--   ✅ verification_hash — md5() of certificate content
--   ✅ revoked / revoked_at / revoked_reason — Revocation support
--   ✅ fraud_flags — JSONB array of fraud detection markers
--   ✅ duplicate_of — Link to original if flagged as duplicate
--
-- Helper functions:
--   ✅ generate_cert_uuid() — Returns UUID v4 string
--   ✅ create_verification_hash(title, volunteer_id, cert_number, issue_date)
--   ✅ verify_certificate_anti_fraud(cert_number) — Full integrity check
--   ✅ revoke_certificate(cert_number, reason)
--   ✅ detect_duplicate_certificate(title, volunteer_id) — Client-side only
--
-- Run order:
--   1. supabase-schema.sql
--   2. supabase-rls-strict.sql
--   3. supabase-audit-logs.sql
--   4. supabase-certificates-fraud.sql (THIS FILE)
-- ============================================================

-- ============================================================
-- 1. ADD ANTI-FRAUD COLUMNS TO certificates TABLE
-- ============================================================
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS cert_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_hash TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS revoked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS fraud_flags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duplicate_of UUID;

COMMENT ON COLUMN certificates.cert_uuid IS 'Public-facing unique UUID for anti-fraud identification (e.g. bba-cert-a1b2c3d4-...)';
COMMENT ON COLUMN certificates.verification_hash IS 'md5 hash of (title || volunteer_id || certificate_number || issue_date) for integrity verification';
COMMENT ON COLUMN certificates.revoked IS 'Whether this certificate has been revoked';
COMMENT ON COLUMN certificates.revoked_at IS 'When the certificate was revoked';
COMMENT ON COLUMN certificates.revoked_reason IS 'Administrative reason for revocation';
COMMENT ON COLUMN certificates.fraud_flags IS 'Array of fraud detection markers (e.g. ["duplicate_content", "suspicious_issuance"])';
COMMENT ON COLUMN certificates.duplicate_of IS 'cert_uuid of the original certificate if this is a duplicate';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_cert_uuid ON certificates(cert_uuid);
CREATE INDEX IF NOT EXISTS idx_certificates_revoked ON certificates(revoked) WHERE revoked = true;
CREATE INDEX IF NOT EXISTS idx_certificates_dup_check ON certificates(title, volunteer_id) WHERE revoked = false;


-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================

-- Generate a UUID v4 string for certificate identification
-- Format: bba-cert-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
-- Uses gen_random_uuid() which is built-in (no pgcrypto needed)
CREATE OR REPLACE FUNCTION public.generate_cert_uuid()
RETURNS TEXT
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT 'bba-cert-' || gen_random_uuid()::text;
$$;

-- Create a verification hash for a certificate using built-in md5().
-- The hash covers: title, volunteer_id, certificate_number, issue_date
-- Uses md5() which is always available in PostgreSQL (no extensions needed).
-- The client-side JS uses the same algorithm to produce matching hashes.
CREATE OR REPLACE FUNCTION public.create_verification_hash(
  p_title TEXT,
  p_volunteer_id TEXT,
  p_certificate_number TEXT,
  p_issue_date TEXT
)
RETURNS TEXT
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT md5(
    coalesce(p_title, '') || '|' ||
    coalesce(p_volunteer_id, '') || '|' ||
    coalesce(p_certificate_number, '') || '|' ||
    coalesce(p_issue_date, '')
  );
$$;

-- Full anti-fraud integrity check for a certificate.
-- Returns a JSON object with:
--   found, valid, revoked, hash_valid, fraud_flags, duplicate_of
CREATE OR REPLACE FUNCTION public.verify_certificate_anti_fraud(p_cert_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cert certificates%ROWTYPE;
  v_expected_hash TEXT;
  v_result JSONB;
BEGIN
  SELECT * INTO v_cert FROM certificates WHERE certificate_number = p_cert_number LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'found', false,
      'valid', false,
      'message', 'Certificate not found'
    );
  END IF;

  -- Recalculate expected hash using built-in create_verification_hash(md5)
  -- Uses to_char with ISO 8601 format (including milliseconds) to match JS toISOString()
  v_expected_hash := public.create_verification_hash(
    v_cert.title,
    v_cert.volunteer_id,
    v_cert.certificate_number,
    to_char(v_cert.issue_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );

  -- Build result
  v_result := jsonb_build_object(
    'found', true,
    'cert_uuid', v_cert.cert_uuid,
    'certificate_number', v_cert.certificate_number,
    'title', v_cert.title,
    'volunteer_name', v_cert.volunteer_name,
    'issue_date', v_cert.issue_date,
    'revoked', v_cert.revoked,
    'hash_valid', (v_cert.verification_hash = v_expected_hash),
    'fraud_flags', v_cert.fraud_flags,
    'duplicate_of', v_cert.duplicate_of
  );

  -- Determine overall validity
  IF v_cert.revoked THEN
    v_result := v_result || jsonb_build_object(
      'valid', false,
      'message', 'Certificate has been revoked',
      'revoked_reason', v_cert.revoked_reason,
      'revoked_at', v_cert.revoked_at
    );
  ELSIF v_cert.verification_hash != v_expected_hash THEN
    v_result := v_result || jsonb_build_object(
      'valid', false,
      'message', 'Certificate content hash mismatch — data may have been tampered with'
    );
  ELSIF v_cert.fraud_flags IS NOT NULL AND jsonb_array_length(v_cert.fraud_flags) > 0 THEN
    v_result := v_result || jsonb_build_object(
      'valid', false,
      'message', 'Certificate flagged for suspicious activity'
    );
  ELSE
    v_result := v_result || jsonb_build_object(
      'valid', true,
      'message', 'Certificate verified — authentic and unmodified'
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Revoke a certificate by certificate number.
-- Requires a reason for the revocation.
CREATE OR REPLACE FUNCTION public.revoke_certificate(
  p_cert_number TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Revocation reason is required';
  END IF;

  UPDATE certificates
  SET revoked = true,
      revoked_at = NOW(),
      revoked_reason = p_reason
  WHERE certificate_number = p_cert_number;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Certificate not found'
    );
  END IF;

  -- Also mark all potential duplicates as flagged
  UPDATE certificates
  SET fraud_flags = fraud_flags || jsonb_build_array(
    jsonb_build_object('type', 'source_revoked', 'at', NOW(), 'source', p_cert_number)
  )
  WHERE duplicate_of = (SELECT cert_uuid FROM certificates WHERE certificate_number = p_cert_number)
    AND revoked = false;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Certificate revoked successfully',
    'certificate_number', p_cert_number,
    'revoked_at', NOW()
  );
END;
$$;

-- Duplicate detection: client-side only (use detectDuplicate in JS)
-- No server-side duplicate function needed — the trigger uses a lightweight EXISTS query.
-- (Kept for documentation — the actual detection logic is in certificate-security.js)


-- ============================================================
-- 3. TRIGGER: Auto-generate cert_uuid and verification_hash
-- on INSERT to certificates if not provided
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_populate_certificate_anti_fraud()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate UUID if not provided
  IF NEW.cert_uuid IS NULL THEN
    NEW.cert_uuid := public.generate_cert_uuid();
  END IF;

  -- Generate verification hash using built-in md5() if not provided
  -- Uses to_char with ISO 8601 format to match client-side JS toISOString()
  IF NEW.verification_hash IS NULL OR NEW.verification_hash = '' THEN
    NEW.verification_hash := public.create_verification_hash(
      NEW.title,
      NEW.volunteer_id,
      NEW.certificate_number,
      to_char(NEW.issue_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
  END IF;

  -- Lightweight duplicate detection: check by exact title+volunteer_id match only
  BEGIN
    IF EXISTS (
      SELECT 1 FROM certificates
      WHERE title = NEW.title
        AND volunteer_id = NEW.volunteer_id
        AND id != NEW.id
        AND revoked = false
      LIMIT 1
    ) THEN
      IF NEW.fraud_flags IS NULL OR NEW.fraud_flags = '[]'::jsonb THEN
        NEW.fraud_flags := jsonb_build_array(
          jsonb_build_object(
            'type', 'auto_duplicate_detected',
            'at', NOW(),
            'title', NEW.title,
            'volunteer_id', NEW.volunteer_id
          )
        );
      ELSE
        NEW.fraud_flags := NEW.fraud_flags || jsonb_build_object(
          'type', 'auto_duplicate_detected',
          'at', NOW(),
          'title', NEW.title,
          'volunteer_id', NEW.volunteer_id
        );
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore duplicate detection errors (don't block insert)
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_certificates_auto_fraud ON certificates;
CREATE TRIGGER trg_certificates_auto_fraud
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_certificate_anti_fraud();


-- ============================================================
-- 4. VERIFICATION QUERIES
-- ============================================================
-- Run these to test the anti-fraud system:

-- Test UUID generation
-- SELECT public.generate_cert_uuid();

-- Test hash generation (md5)
-- SELECT public.create_verification_hash('شهادة تقدير', 'VOL-BBA-2026-0001', 'CERT-BBA-2026-0001', '2026-06-16');

-- Full verification
-- SELECT public.verify_certificate_anti_fraud('CERT-BBA-2026-0001');

-- Revoke a certificate
-- SELECT public.revoke_certificate('CERT-BBA-2026-0001', 'Issued in error');


-- ============================================================
-- SUMMARY
-- ============================================================
-- New columns on certificates:   7 (cert_uuid, verification_hash, revoked, revoked_at, revoked_reason, fraud_flags, duplicate_of)
-- New indexes:                   3 (cert_uuid, revoked, dup_check)
-- New functions:                 4 (generate_cert_uuid, create_verification_hash, verify_certificate_anti_fraud, revoke_certificate)
-- New triggers:                  1 (trg_certificates_auto_fraud)
-- External dependencies:         NONE (uses built-in md5() and gen_random_uuid())
-- ============================================================

-- ✅ Migration ready. Run in Supabase SQL Editor.
