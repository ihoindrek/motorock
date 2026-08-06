<?php
/**
 * Motorock Commerce AI Engine — unified bootstrap.
 * Version: 0.5.3
 *
 * Loads product content writer (legacy AI Writer module), write REST,
 * admin UI, and the Commerce AI skills dashboard.
 */

defined( 'ABSPATH' ) || exit;

if ( defined( 'MOTOROCK_COMMERCE_AI_LOADED' ) ) {
	return;
}

define( 'MOTOROCK_COMMERCE_AI_LOADED', true );
define( 'MOTOROCK_COMMERCE_AI_VERSION', '0.5.3' );

$commerce_ai_root = dirname( __DIR__ );
$ai_writer_root   = $commerce_ai_root . '/motorock-ai-writer';

require_once $ai_writer_root . '/includes/class-meta-registry.php';
require_once $ai_writer_root . '/includes/class-logger.php';
require_once $ai_writer_root . '/includes/class-wpml-helper.php';
require_once $ai_writer_root . '/includes/class-content-writer.php';
require_once $ai_writer_root . '/includes/class-blog-writer.php';
require_once $ai_writer_root . '/includes/class-related-writer.php';
require_once $ai_writer_root . '/includes/class-rest-write.php';
require_once $ai_writer_root . '/includes/class-admin-product.php';
require_once __DIR__ . '/includes/class-admin-menu.php';
require_once $ai_writer_root . '/includes/class-admin-bulk.php';
require_once __DIR__ . '/includes/class-admin-dashboard.php';
require_once __DIR__ . '/includes/class-admin-blog.php';
require_once __DIR__ . '/includes/class-admin-seo-audit.php';
require_once __DIR__ . '/includes/class-admin-related-products.php';
require_once __DIR__ . '/includes/class-rest-commerce-ai-proxy.php';

Motorock_Ai_Meta_Registry::register();
Motorock_Commerce_Ai_Admin_Menu::register();
Motorock_Ai_Rest_Write::register();
Motorock_Commerce_Ai_Rest_Proxy::register();
Motorock_Ai_Admin_Product::register();
Motorock_Commerce_Ai_Admin_Dashboard::register();
Motorock_Ai_Admin_Bulk::register();
Motorock_Commerce_Ai_Admin_Blog::register();
Motorock_Commerce_Ai_Admin_Related_Products::register();
Motorock_Commerce_Ai_Admin_Seo_Audit::register();
