<?php
/**
 * Sincronizador de Sitemap - SantyHogar
 * 
 * Este script descarga el sitemap dinámico de Railway y lo guarda en Hostinger
 * Debe ejecutarse cada 6 horas vía cron job
 * 
 * Ubicación: /home/usuario/public_html/update-sitemap.php
 * 
 * Cron command:
 * php /home/usuario/public_html/update-sitemap.php
 * 
 * Schedule: Cada 6 horas (0 */6 * * *)
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

// URL del sitemap dinámico en Railway
$RAILWAY_URL = 'https://santyhogar-production.up.railway.app/api/sitemap-products.xml';

// Ruta local donde guardar el sitemap
$LOCAL_PATH = __DIR__ . '/sitemap-products.xml';

// Archivo de bloqueo (evita ejecuciones simultáneas)
$LOCK_FILE = __DIR__ . '/.sitemap-lock';

// Archivo de log
$LOG_FILE = __DIR__ . '/.sitemap-sync-log';

// Timeout para la descarga (segundos)
$DOWNLOAD_TIMEOUT = 30;

// ============================================================================
// LÓGICA PRINCIPAL
// ============================================================================

// Registrar inicio
log_message("=== Iniciando sincronización de sitemap ===");

// Evitar ejecución simultánea
if (is_executing()) {
    log_message("⚠️ Sincronización ya en progreso, abortando");
    exit("Sincronización en progreso\n");
}

// Marcar como en ejecución
mark_executing();

try {
    // 1. Descargar sitemap de Railway
    log_message("📥 Descargando sitemap de Railway...");
    $xml = download_sitemap($RAILWAY_URL, $DOWNLOAD_TIMEOUT);
    
    if ($xml === false) {
        throw new Exception("Fallo al descargar sitemap de Railway");
    }
    
    log_message("✅ Descarga completada (" . strlen($xml) . " bytes)");
    
    // 2. Validar XML
    log_message("🔍 Validando XML...");
    if (!is_valid_xml($xml)) {
        throw new Exception("XML descargado es inválido");
    }
    
    $product_count = count_urls_in_xml($xml);
    log_message("✅ XML válido con $product_count productos");
    
    // 3. Guardar localmente
    log_message("💾 Guardando en disco local...");
    if (!save_sitemap($xml, $LOCAL_PATH)) {
        throw new Exception("No se pudo escribir archivo local");
    }
    
    log_message("✅ Archivo guardado: $LOCAL_PATH");
    
    // 4. Verificar que se guardó bien
    if (!file_exists($LOCAL_PATH)) {
        throw new Exception("Archivo no existe después de guardarlo");
    }
    
    $file_size = filesize($LOCAL_PATH);
    log_message("✅ Verificación exitosa ($file_size bytes)");
    
    // 5. Éxito
    log_message("🎉 Sincronización completada exitosamente");
    log_message("   Próxima ejecución: en 6 horas");
    
    echo "✅ Sitemap sincronizado: $product_count productos\n";
    
} catch (Exception $e) {
    $error_msg = $e->getMessage();
    log_message("❌ ERROR: $error_msg");
    echo "❌ Error: $error_msg\n";
    
} finally {
    // Desmarcar ejecución
    unmark_executing();
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Descarga el sitemap de Railway
 */
function download_sitemap($url, $timeout) {
    $context = stream_context_create([
        'http' => [
            'timeout' => $timeout,
            'user_agent' => 'SantyHogar-SEO-Sync/1.0'
        ],
        'https' => [
            'timeout' => $timeout,
            'user_agent' => 'SantyHogar-SEO-Sync/1.0'
        ]
    ]);
    
    $xml = @file_get_contents($url, false, $context);
    
    if ($xml === false) {
        $error = error_get_last();
        throw new Exception("No se pudo conectar a Railway: " . ($error ? $error['message'] : 'Desconocido'));
    }
    
    return $xml;
}

/**
 * Valida que el contenido sea XML válido
 */
function is_valid_xml($xml) {
    if (empty($xml)) {
        return false;
    }
    
    $dom = new DOMDocument();
    $dom->preserveWhiteSpace = false;
    
    $result = @$dom->loadXML($xml);
    
    if (!$result) {
        return false;
    }
    
    // Verificar que tiene estructura básica de sitemap
    $urlset = $dom->getElementsByTagName('urlset');
    if ($urlset->length === 0) {
        return false;
    }
    
    return true;
}

/**
 * Cuenta URLs en el XML
 */
function count_urls_in_xml($xml) {
    return substr_count($xml, '<loc>');
}

/**
 * Guarda el sitemap a disco
 */
function save_sitemap($xml, $path) {
    $bytes = file_put_contents($path, $xml, LOCK_EX);
    return $bytes !== false && $bytes > 0;
}

/**
 * Registra un mensaje en el log
 */
function log_message($message) {
    global $LOG_FILE;
    
    $timestamp = date('Y-m-d H:i:s');
    $log_line = "[$timestamp] $message\n";
    
    // Escribir a archivo
    file_put_contents($LOG_FILE, $log_line, FILE_APPEND | LOCK_EX);
    
    // Mantener log a máximo 1000 líneas
    $lines = file($LOG_FILE);
    if (count($lines) > 1000) {
        $lines = array_slice($lines, -500);
        file_put_contents($LOG_FILE, implode('', $lines));
    }
}

/**
 * Verifica si ya se está ejecutando
 */
function is_executing() {
    global $LOCK_FILE;
    
    if (!file_exists($LOCK_FILE)) {
        return false;
    }
    
    $lock_age = time() - filemtime($LOCK_FILE);
    
    // Si el lock tiene más de 5 minutos, asumir que falló
    if ($lock_age > 300) {
        @unlink($LOCK_FILE);
        return false;
    }
    
    return true;
}

/**
 * Marca que la ejecución está en progreso
 */
function mark_executing() {
    global $LOCK_FILE;
    touch($LOCK_FILE);
}

/**
 * Desmarcar ejecución
 */
function unmark_executing() {
    global $LOCK_FILE;
    @unlink($LOCK_FILE);
}

?>
