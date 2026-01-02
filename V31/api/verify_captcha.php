<?php
/**
 * Cloudflare Turnstile CAPTCHA Verification
 * ใช้ฟังก์ชันนี้เพื่อตรวจสอบ CAPTCHA token จาก frontend
 */

function verifyCaptcha($token)
{
    // ⚠️ แทนที่ด้วย Secret Key จาก Cloudflare Dashboard
    $secret = '0x4AAAAAACGLJnYK2JIwMwiVFESWlFg22zM';
    $ip = $_SERVER['REMOTE_ADDR'];

    // ส่ง request ไปยัง Cloudflare API
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $ip
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Cloudflare Turnstile API error: HTTP $httpCode");
        return false;
    }

    $result = json_decode($response, true);

    // Log สำหรับ debugging (ลบออกใน production)
    if (!($result['success'] ?? false)) {
        error_log("CAPTCHA verification failed: " . json_encode($result));
    }

    return $result['success'] ?? false;
}

/**
 * ตัวอย่างการใช้งาน:
 * 
 * if (isset($_POST['cf-turnstile-response'])) {
 *     $captchaToken = $_POST['cf-turnstile-response'];
 *     
 *     if (!verifyCaptcha($captchaToken)) {
 *         echo json_encode(['success' => false, 'message' => 'การยืนยัน CAPTCHA ล้มเหลว']);
 *         exit;
 *     }
 * }
 */
?>