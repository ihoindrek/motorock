<?php
/**
 * Plugin Name: Motorock Shipping Dimensions
 * Description: Auto-fills WooCommerce product shipping dimensions for Montonio DPD size-based pricing.
 * Version: 1.0.0
 *
 * Install: copy to wp-content/mu-plugins/ together with motorock-shipping-dimensions-lib.php
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/motorock-shipping-dimensions-lib.php';

add_action(
	'woocommerce_before_product_object_save',
	static function ( WC_Product $product ): void {
		if ( motorock_shipping_dimensions_is_missing( $product ) ) {
			motorock_shipping_dimensions_apply_if_missing( $product );
		}
	},
	20,
	1
);
