// SSL certificate inspection module.
//
// We intentionally disable certificate verification here because our goal is to
// *read* certificate metadata (expiry, issuer) — not to validate the cert chain.
// A self-signed or expired cert is exactly what we want to be able to inspect.
// This connection is never used to transmit sensitive data.

use std::net::ToSocketAddrs;
use std::sync::Arc;
use std::time::Duration;

use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::{ClientConfig, ClientConnection, DigitallySignedStruct, SignatureScheme};
use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use serde::Serialize;
use x509_parser::prelude::*;

#[derive(Debug, Serialize)]
pub struct SslCheckResult {
    pub host: String,
    pub expires_at: Option<String>,
    pub days_left: Option<i64>,
    pub issuer: Option<String>,
    pub error: Option<String>,
}

/// A certificate verifier that accepts any certificate. Only metadata is read.
#[derive(Debug)]
struct NoVerifier;

impl ServerCertVerifier for NoVerifier {
    fn verify_server_cert(
        &self,
        _end_entity: &CertificateDer<'_>,
        _intermediates: &[CertificateDer<'_>],
        _server_name: &ServerName<'_>,
        _ocsp_response: &[u8],
        _now: UnixTime,
    ) -> Result<ServerCertVerified, rustls::Error> {
        Ok(ServerCertVerified::assertion())
    }

    fn verify_tls12_signature(
        &self,
        _message: &[u8],
        _cert: &CertificateDer<'_>,
        _dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, rustls::Error> {
        Ok(HandshakeSignatureValid::assertion())
    }

    fn verify_tls13_signature(
        &self,
        _message: &[u8],
        _cert: &CertificateDer<'_>,
        _dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, rustls::Error> {
        Ok(HandshakeSignatureValid::assertion())
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        vec![
            SignatureScheme::RSA_PKCS1_SHA1,
            SignatureScheme::ECDSA_SHA1_Legacy,
            SignatureScheme::RSA_PKCS1_SHA256,
            SignatureScheme::ECDSA_NISTP256_SHA256,
            SignatureScheme::ECDSA_NISTP384_SHA384,
            SignatureScheme::ECDSA_NISTP521_SHA512,
            SignatureScheme::RSA_PKCS1_SHA384,
            SignatureScheme::RSA_PKCS1_SHA512,
            SignatureScheme::RSA_PSS_SHA256,
            SignatureScheme::RSA_PSS_SHA384,
            SignatureScheme::RSA_PSS_SHA512,
            SignatureScheme::ED25519,
            SignatureScheme::ED448,
        ]
    }
}

#[tauri::command]
pub async fn ssl_check(host: String, port: Option<u16>) -> Result<SslCheckResult, String> {
    let host_clone = host.clone();
    let port = port.unwrap_or(443);

    // Run blocking TLS work on a dedicated thread to avoid blocking the async executor.
    let result = tokio::time::timeout(
        Duration::from_secs(10),
        tokio::task::spawn_blocking(move || ssl_check_blocking(&host_clone, port)),
    )
    .await;

    match result {
        Err(_elapsed) => Ok(SslCheckResult {
            host,
            expires_at: None,
            days_left: None,
            issuer: None,
            error: Some("connection timed out".to_string()),
        }),
        Ok(Err(join_err)) => Ok(SslCheckResult {
            host,
            expires_at: None,
            days_left: None,
            issuer: None,
            error: Some(format!("task error: {join_err}")),
        }),
        Ok(Ok(mut result)) => {
            // Ensure host is set correctly regardless of inner result
            result.host = host;
            Ok(result)
        }
    }
}

fn ssl_check_blocking(host: &str, port: u16) -> SslCheckResult {
    let addr_str = format!("{host}:{port}");
    let addrs = match addr_str.to_socket_addrs() {
        Ok(a) => a,
        Err(e) => {
            return SslCheckResult {
                host: host.to_string(),
                expires_at: None,
                days_left: None,
                issuer: None,
                error: Some(format!("DNS resolution failed: {e}")),
            };
        }
    };

    let addr = match addrs.into_iter().next() {
        Some(a) => a,
        None => {
            return SslCheckResult {
                host: host.to_string(),
                expires_at: None,
                days_left: None,
                issuer: None,
                error: Some("no addresses found".to_string()),
            };
        }
    };

    // Build a TLS client config that skips certificate verification (metadata-only read).
    let config = ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(NoVerifier))
        .with_no_client_auth();

    let server_name = match ServerName::try_from(host.to_string()) {
        Ok(n) => n,
        Err(e) => {
            return SslCheckResult {
                host: host.to_string(),
                expires_at: None,
                days_left: None,
                issuer: None,
                error: Some(format!("invalid server name: {e}")),
            };
        }
    };

    let conn = match ClientConnection::new(Arc::new(config), server_name) {
        Ok(c) => c,
        Err(e) => {
            return SslCheckResult {
                host: host.to_string(),
                expires_at: None,
                days_left: None,
                issuer: None,
                error: Some(format!("TLS init failed: {e}")),
            };
        }
    };

    // Use 5s per socket operation so a leaked blocking thread lives at most ~15s
    // (connect 5s + handshake read 5s + handshake write 5s), well within the
    // 60s auto-poll cycle. The outer tokio::time::timeout is a belt-and-suspenders guard.
    let mut tcp = match std::net::TcpStream::connect_timeout(&addr, Duration::from_secs(5)) {
        Ok(s) => s,
        Err(e) => {
            return SslCheckResult {
                host: host.to_string(),
                expires_at: None,
                days_left: None,
                issuer: None,
                error: Some(format!("TCP connect failed: {e}")),
            };
        }
    };

    let _ = tcp.set_read_timeout(Some(Duration::from_secs(5)));
    let _ = tcp.set_write_timeout(Some(Duration::from_secs(5)));

    // Drive the TLS handshake explicitly to completion using complete_io so that
    // peer_certificates() is guaranteed to be populated before we read it.
    // A single write_all + read is not sufficient — on slow sockets or TLS alerts
    // the handshake may not have finished, returning None for a valid host.
    let mut conn = conn;
    while conn.is_handshaking() {
        match conn.complete_io(&mut tcp) {
            Ok(_) => {}
            Err(e) => {
                return SslCheckResult {
                    host: host.to_string(),
                    expires_at: None,
                    days_left: None,
                    issuer: None,
                    error: Some(format!("TLS handshake failed: {e}")),
                };
            }
        }
    }

    let peer_certs = conn.peer_certificates();

    let cert_der = match peer_certs.and_then(|certs| certs.first()) {
        Some(c) => c.clone(),
        None => {
            return SslCheckResult {
                host: host.to_string(),
                expires_at: None,
                days_left: None,
                issuer: None,
                error: Some("no peer certificate received".to_string()),
            };
        }
    };

    parse_certificate(host, &cert_der)
}

fn parse_certificate(host: &str, cert_der: &CertificateDer<'_>) -> SslCheckResult {
    let (_, cert) = match X509Certificate::from_der(cert_der.as_ref()) {
        Ok(c) => c,
        Err(e) => {
            return SslCheckResult {
                host: host.to_string(),
                expires_at: None,
                days_left: None,
                issuer: None,
                error: Some(format!("certificate parse error: {e}")),
            };
        }
    };

    let not_after = cert.validity().not_after;
    // Convert ASN.1 time to Unix timestamp
    let expires_ts = not_after.timestamp();
    let now_ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let days_left = (expires_ts - now_ts) / 86400;

    // Format as ISO 8601 UTC
    let expires_at = format_unix_as_iso8601(expires_ts);

    // Build issuer string from RDN sequence
    let issuer = format_x509_name(cert.issuer());

    SslCheckResult {
        host: host.to_string(),
        expires_at: Some(expires_at),
        days_left: Some(days_left),
        issuer: if issuer.is_empty() { None } else { Some(issuer) },
        error: None,
    }
}

fn format_x509_name(name: &X509Name<'_>) -> String {
    // Collect CN first, then O, then rest
    let mut cn = None;
    let mut org = None;

    for rdn in name.iter() {
        for attr in rdn.iter() {
            let oid = attr.attr_type();
            if *oid == oid_registry::OID_X509_COMMON_NAME {
                cn = attr.as_str().ok().map(|s| s.to_string());
            } else if *oid == oid_registry::OID_X509_ORGANIZATION_NAME {
                org = attr.as_str().ok().map(|s| s.to_string());
            }
        }
    }

    match (cn, org) {
        (Some(c), Some(o)) => format!("{c}, {o}"),
        (Some(c), None) => c,
        (None, Some(o)) => o,
        (None, None) => name.to_string(),
    }
}

fn format_unix_as_iso8601(ts: i64) -> String {
    // Manual UTC formatting without external date crate.
    // Convert seconds since epoch to Y-M-D H:M:S UTC.
    let secs = ts;
    // Gregorian calendar calculation
    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let h = time_of_day / 3600;
    let m = (time_of_day % 3600) / 60;
    let s = time_of_day % 60;

    // Convert days since 1970-01-01 to year/month/day
    let (year, month, day) = days_to_ymd(days);

    format!("{year:04}-{month:02}-{day:02}T{h:02}:{m:02}:{s:02}Z")
}

fn days_to_ymd(days: i64) -> (i32, u32, u32) {
    // Algorithm: convert days since Unix epoch (1970-01-01) to calendar date.
    // Using the algorithm from http://howardhinnant.github.io/date_algorithms.html
    let z = days + 719468;
    let era: i64 = (if z >= 0 { z } else { z - 146096 }) / 146097;
    let doe = (z - era * 146097) as u64; // day of era [0, 146096]
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; // year of era [0, 399]
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100); // day of year [0, 365]
    let mp = (5 * doy + 2) / 153; // month in [0, 11] relative to March
    let d = doy - (153 * mp + 2) / 5 + 1; // day [1, 31]
    let m = if mp < 10 { mp + 3 } else { mp - 9 }; // month [1, 12]
    let y = if m <= 2 { y + 1 } else { y };

    (y as i32, m as u32, d as u32)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Verify that `format_unix_as_iso8601` produces the correct date string for
    /// a set of well-known Unix timestamps.  This exercises both `days_to_ymd`
    /// (calendar arithmetic) and the time-of-day decomposition.
    #[test]
    fn test_format_unix_as_iso8601_known_dates() {
        // 2026-01-01T00:00:00Z  →  Unix 1767225600
        // Confirmed: (2026-1970)*365 + leap-day adjustments = 20454 days
        assert_eq!(format_unix_as_iso8601(1_767_225_600), "2026-01-01T00:00:00Z");

        // 1970-01-01T00:00:00Z  →  Unix 0 (epoch itself)
        assert_eq!(format_unix_as_iso8601(0), "1970-01-01T00:00:00Z");

        // 2000-03-01T12:30:45Z  →  Unix 951913845
        assert_eq!(format_unix_as_iso8601(951_913_845), "2000-03-01T12:30:45Z");

        // 2024-02-29T23:59:59Z  →  Unix 1709251199  (leap day 2024)
        assert_eq!(format_unix_as_iso8601(1_709_251_199), "2024-02-29T23:59:59Z");

        // 2099-12-31T23:59:59Z  →  Unix 4102444799  (far future)
        assert_eq!(format_unix_as_iso8601(4_102_444_799), "2099-12-31T23:59:59Z");
    }

    /// Cross-check `days_to_ymd` directly for a handful of day values.
    #[test]
    fn test_days_to_ymd_known_values() {
        // Day 0 → 1970-01-01
        assert_eq!(days_to_ymd(0), (1970, 1, 1));
        // Day 365 → 1971-01-01 (1970 is not a leap year)
        assert_eq!(days_to_ymd(365), (1971, 1, 1));
        // Day 20454 → 2026-01-01
        assert_eq!(days_to_ymd(20454), (2026, 1, 1));
        // Day 19782 → 2024-02-29  (leap day)
        assert_eq!(days_to_ymd(19782), (2024, 2, 29));
    }
}
