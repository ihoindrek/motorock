<?php
/**
 * Motorock AI Writer — bootstrap (loaded by ../motorock-ai-writer.php in mu-plugins).
 * Version: 0.3.0
 *
 * Requires: WooCommerce. WPML optional but recommended.
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/includes/class-meta-registry.php';
require_once __DIR__ . '/includes/class-logger.php';
require_once __DIR__ . '/includes/class-wpml-helper.php';
require_once __DIR__ . '/includes/class-content-writer.php';
require_once __DIR__ . '/includes/class-rest-write.php';
require_once __DIR__ . '/includes/class-rest-generate-proxy.php';
require_once __DIR__ . '/includes/class-admin-product.php';

Motorock_Ai_Meta_Registry::register();
Motorock_Ai_Rest_Write::register();
Motorock_Ai_Rest_Generate_Proxy::register();
Motorock_Ai_Admin_Product::register();
