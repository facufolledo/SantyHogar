<?php
/**
 * Sincronizador de Sitemap - SantyHogar (v2 - Protecciones inteligentes)
 * 
 * Este script descarga el sitemap dinámico de Railway y lo guarda en Hostinger
 * con validaciones robustas para evitar sobrescribir con datos incompletos.
 * 
 * Ubicación: /home/usuario/public_html/update-sitemap.php
 * Cron command: php /home/usuario/public_html/update-sitemap.php
 * Schedule: Cada día a las 6 AM (0 6 * * *)
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

$RAILWAY_URL = 'https://santyhogar-production.up.railway.app/api/sitemap-products.xml';
$LOCAL_PATH = __DIR__ . '/sitemap-products.xml';
$TEMP_PATH = __DIR__ . '/sitemap-products.xml.tmp';
$LOCK_FILE = __DIR__ . '/.sitemap-lock';
$LOG_FILE = __DIR__ . '/.sitemap-sync-log';
$STATS_FILE = __DIR__ . '/.sitemap-stats.json';
$DOWNLOAD_TIMEOUT = 30;

$is_browser = !empty($_SERVER['HTTP_HOST']);

if ($is_browser) {
    header('Content-Type: application/json');
    $response = array();
}

log_message("=== Iniciando sincronización de sitemap ===");

// Evitar ejecución simultánea
if (is_executing()) {
    $msg = "Sincronización ya en progreso, abortando";
    log_message("⚠️ $msg");
    
    if ($is_browser) {
        echo json_encode(['status' => 'warning', 'message' => $msg]);
    }
    exit;
}

mark_executing();

try {
    // 1. Descargar sitemap de Railway
    log_message("📥 Descargando sitemap de Railway...");
    if ($is_browser) $response['step1'] = "Descargando...";
    
    $xml = download_sitemap($RAILWAY_URL, $DOWNLOAD_TIMEOUT);
    
    if ($xml === false || empty($xml)) {
        throw new Exception("Fallo al descargar sitemap de Railway o respuesta vacía");
    }
    
    $download_size = strlen($xml);
    log_message("✅ Descarga completada ($download_size bytes)");
    if ($is_browser) $response['step1_result'] = "Descargado ($download_size bytes)";
    
    // 2. Validar XML
    log_message("🔍 Validando XML...");
    if ($is_browser) $response['step2'] = "Validando XML...";
    
    if (!is_valid_xml($xml)) {
        throw new Exception("XML descargado es inválido o incompleto");
    }
    
    $product_count = count_urls_in_xml($xml);
    log_message("ℹ️ Productos en descarga: $product_count");
    if ($is_browser) $response['step2_result'] = "XML válido con $product_count productos";
    
    // 3. Validaciones inteligentes
    log_message("🛡️ Ejecutando validaciones de integridad...");
    if ($is_browser) $response['step3'] = "Validando integridad...";
    
    // 3.1: Rechazar si no hay productos
    if ($product_count === 0) {
        throw new Exception("Railway devolvió 0 productos. Posible fallo en la base de datos. NO se reemplazará el sitemap.");
    }
    
    // 3.2: Comparar con el último sitemap (detección de caída >50%)
    $last_stats = load_stats();
    if ($last_stats && isset($last_stats['product_count']) && $last_stats['product_count'] > 0) {
        $last_count = $last_stats['product_count'];
        $drop_percent = (($last_count - $product_count) / $last_count) * 100;
        
        log_message("📊 Comparación: $last_count → $product_count (cambio: " . round($drop_percent, 1) . "%)");
        
        // Si cae más del 50%, algo falló
        if ($drop_percent > 50) {
            throw new Exception(
                "Caída de productos detectada: $last_count → $product_count (−" . round($drop_percent, 1) . "%). " .
                "Posible problema en Railway. NO se reemplazará el sitemap."
            );
        }
    }
    
    log_message("✅ Todas las validaciones pasadas");
    if ($is_browser) $response['step3_result'] = "Validaciones OK";
    
    // 4. Escribir a archivo temporal (escritura atómica)
    log_message("💾 Escribiendo a archivo temporal (escritura atómica)...");
    if ($is_browser) $response['step4'] = "Escribiendo...";
    
    if (!write_atomic($xml, $LOCAL_PATH, $TEMP_PATH)) {
        throw new Exception("Fallo al escribir archivo. El sitemap anterior se mantiene intacto.");
    }
    
    log_message("✅ Archivo guardado con éxito");
    
    // 5. Verificar que el archivo existe y es válido
    if (!file_exists($LOCAL_PATH)) {
        throw new Exception("Verificación final falló: archivo no existe");
    }
    
    $final_size = filesize($LOCAL_PATH);
    $verify_content = file_get_contents($LOCAL_PATH);
    $verify_count = count_urls_in_xml($verify_content);
    
    if ($verify_count === 0) {
        throw new Exception("Verificación final falló: archivo se guardó vacío");
    }
    
    log_message("✅ Verificación final: $verify_count productos en disco");
    if ($is_browser) $response['step4_result'] = "Verificado ($final_size bytes)";
    
    // 6. Guardar estadísticas para próximas sincronizaciones
    save_stats([
        'timestamp' => date('Y-m-d H:i:s'),
        'product_count' => $product_count,
        'file_size' => $final_size
    ]);
    
    // 7. Éxito
    log_message("🎉 Sincronización completada exitosamente");
    log_message("   Productos: $product_count | Tamaño: $final_size bytes");
    
    if ($is_browser) {
        $response['status'] = 'success';
        $response['message'] = "Sincronización exitosa";
        $response['products'] = $product_count;
        $response['file_size'] = $final_size;
        echo json_encode($response);
    } else {
        echo "✅ Sitemap sincronizado: $product_count productos\n";
    }
    
} catch (Exception $e) {
    $error_msg = $e->getMessage();
    log_message("❌ ERROR: $error_msg");
    
    // Limpiar archivo temporal si existe
    if (file_exists($TEMP_PATH)) {
        @unlink($TEMP_PATH);
    }
    
    if ($is_browser) {
        $response['status'] = 'error';
        $response['message'] = $error_msg;
        echo json_encode($response);
    } else {
        echo "❌ Error: $error_msg\n";
    }
    
} finally {
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
            'user_agent' => 'SantyHogar-SEO-Sync/2.0'
        ],
        'https' => [
            'timeout' => $timeout,
            'user_agent' => 'SantyHogar-SEO-Sync/2.0'
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
    
    // Verificar estructura de sitemap
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
 * Escritura atómica: escribe a temporal, valida, luego reemplaza
 */
function write_atomic($content, $target_path, $temp_path) {
    // 1. Escribir a archivo temporal
    $bytes = file_put_contents($temp_path, $content, LOCK_EX);
    if ($bytes === false || $bytes === 0) {
        return false;
    }
    
    // 2. Verificar que el temporal se escribió bien
    if (!file_exists($temp_path)) {
        return false;
    }
    
    $temp_size = filesize($temp_path);
    if ($temp_size === 0 || $temp_size !== strlen($content)) {
        @unlink($temp_path);
        return false;
    }
    
    // 3. Reemplazar el archivo original con el temporal
    if (file_exists($target_path)) {
        $backup_path = $target_path . '.backup';
        if (!rename($target_path, $backup_path)) {
            @unlink($temp_path);
            return false;
        }
    }
    
    if (!rename($temp_path, $target_path)) {
        // Si falla, restaurar el backup
        if (file_exists($backup_path)) {
            @rename($backup_path, $target_path);
        }
        return false;
    }
    
    // 4. Limpiar backup
    if (file_exists($backup_path)) {
        @unlink($backup_path);
    }
    
    return true;
}

/**
 * Carga estadísticas del último sitemap
 */
function load_stats() {
    global $STATS_FILE;
    
    if (!file_exists($STATS_FILE)) {
        return null;
    }
    
    $json = @file_get_contents($STATS_FILE);
    if (!$json) {
        return null;
    }
    
    return json_decode($json, true);
}

/**
 * Guarda estadísticas del sitemap actual
 */
function save_stats($stats) {
    global $STATS_FILE;
    
    $json = json_encode($stats, JSON_PRETTY_PRINT);
    @file_put_contents($STATS_FILE, $json, LOCK_EX);
}

/**
 * Registra un mensaje en el log
 */
function log_message($message) {
    global $LOG_FILE;
    
    $timestamp = date('Y-m-d H:i:s');
    $log_line = "[$timestamp] $message\n";
    
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
