<?php
/**
 * Plugin Name: Motorock Headless Backorders
 * Description: Allows checkout when supplier stock is 0 — orders are fulfilled from suppliers.
 * Version: 1.0.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-backorders.php
 */

defined( 'ABSPATH' ) || exit;

/**
 * Motorock does not run warehouse stock — supplier qty is informational only.
 * Keep published products purchasable even at 0 quantity.
 */
add_filter(
	'woocommerce_product_get_backorders',
	function ( $backorders, $product ) {
		unset( $product );

		return 'yes';
	},
	10,
	2
);

add_filter(
	'woocommerce_product_variation_get_backorders',
	function ( $backorders, $product ) {
		unset( $product );

		return 'yes';
	},
	10,
	2
);

add_filter(
	'woocommerce_product_get_stock_status',
	function ( $status, $product ) {
		if ( 'publish' !== $product->get_status() ) {
			return $status;
		}

		if ( 'outofstock' === $status ) {
			return 'instock';
		}

		return $status;
	},
	10,
	2
);

add_filter(
	'woocommerce_product_variation_get_stock_status',
	function ( $status, $product ) {
		if ( 'publish' !== $product->get_status() ) {
			return $status;
		}

		if ( 'outofstock' === $status ) {
			return 'instock';
		}

		return $status;
	},
	10,
	2
);
