<?php
/**
 * Plugin Name: Motorock AI Writer
 * Description: Receives AI-generated product content from the headless storefront and writes it to WooCommerce + WPML products.
 * Version: 0.2.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-ai-writer.php
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
