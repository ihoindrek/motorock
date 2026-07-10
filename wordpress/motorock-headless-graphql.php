<?php
/**
 * Plugin Name: Motorock Headless GraphQL
 * Description: Fixes WPGraphQL product variations (WPML) and exposes Montonio payment gateways to headless checkout.
 * Version: 1.0.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-graphql.php
 */

defined( 'ABSPATH' ) || exit;

function motorock_is_graphql_request() {
	if ( defined( 'GRAPHQL_REQUEST' ) && GRAPHQL_REQUEST ) {
		return true;
	}

	return function_exists( 'is_graphql_http_request' ) && is_graphql_http_request();
}

function motorock_get_variable_product_children( WC_Product_Variable $product ) {
	$children = $product->get_children();

	if ( ! empty( $children ) ) {
		return array_map( 'intval', $children );
	}

	$parent_id = $product->get_id();
	$query     = new WP_Query(
		array(
			'post_type'              => 'product_variation',
			'post_status'            => array( 'publish', 'private' ),
			'post_parent'            => $parent_id,
			'posts_per_page'         => -1,
			'fields'                 => 'ids',
			'orderby'                => 'menu_order',
			'order'                  => 'ASC',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'suppress_filters'       => true,
		)
	);

	return array_map( 'intval', $query->posts );
}

/**
 * WPML often filters variation queries by language even when child posts
 * share the parent language. Force the parent's variation IDs into GraphQL.
 */
add_filter(
	'graphql_product_variation_connection_query_args',
	function ( $query_args, $source, $args, $context, $info ) {
		unset( $args, $context, $info );

		if ( ! $source instanceof WC_Product_Variable ) {
			return $query_args;
		}

		$children = motorock_get_variable_product_children( $source );
		if ( empty( $children ) ) {
			return $query_args;
		}

		$query_args['post_type']   = 'product_variation';
		$query_args['post_status'] = array( 'publish', 'private' );
		$query_args['post__in']    = $children;
		$query_args['orderby']     = 'post__in';

		unset( $query_args['lang'], $query_args['language'] );

		return $query_args;
	},
	20,
	5
);

/**
 * Keep variation language aligned with the parent product for WPML.
 */
function motorock_sync_variation_wpml_language( WC_Product $product ) {
	if ( ! $product instanceof WC_Product_Variable ) {
		return;
	}

	if ( ! function_exists( 'apply_filters' ) ) {
		return;
	}

	$parent_language = apply_filters( 'wpml_element_language_code', null, array(
		'element_id'   => $product->get_id(),
		'element_type' => 'post_product',
	) );

	if ( ! $parent_language ) {
		return;
	}

	foreach ( motorock_get_variable_product_children( $product ) as $variation_id ) {
		do_action(
			'wpml_set_element_language_details',
			array(
				'element_id'           => $variation_id,
				'element_type'         => 'post_product_variation',
				'trid'                 => apply_filters(
					'wpml_element_trid',
					null,
					$product->get_id(),
					'post_product'
				),
				'language_code'        => $parent_language,
				'source_language_code' => null,
			)
		);
	}
}

add_action(
	'woocommerce_update_product',
	function ( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( $product instanceof WC_Product_Variable ) {
			motorock_sync_variation_wpml_language( $product );
		}
	},
	30
);

function motorock_any_montonio_gateway_enabled() {
	if ( ! function_exists( 'WC' ) || ! WC()->payment_gateways() ) {
		return false;
	}

	foreach ( WC()->payment_gateways()->payment_gateways() as $gateway_id => $gateway ) {
		if ( strpos( $gateway_id, 'montonio' ) === false ) {
			continue;
		}

		if ( 'yes' === $gateway->enabled ) {
			return true;
		}
	}

	return false;
}

/**
 * Headless checkout expects wc_montonio_payments even when only card is enabled
 * in Woo admin. Expose the bank gateway during GraphQL requests only.
 */
add_filter(
	'woocommerce_available_payment_gateways',
	function ( $gateways ) {
		if ( ! motorock_is_graphql_request() || ! function_exists( 'WC' ) ) {
			return $gateways;
		}

		if ( ! motorock_any_montonio_gateway_enabled() ) {
			return $gateways;
		}

		$registered = WC()->payment_gateways()->payment_gateways();

		if (
			isset( $registered['wc_montonio_payments'] )
			&& ! isset( $gateways['wc_montonio_payments'] )
		) {
			$gateways['wc_montonio_payments'] = $registered['wc_montonio_payments'];
		}

		return $gateways;
	},
	100
);

add_filter(
	'woocommerce_gateway_enabled',
	function ( $enabled, $gateway_id ) {
		if (
			! motorock_is_graphql_request()
			|| $gateway_id !== 'wc_montonio_payments'
			|| ! motorock_any_montonio_gateway_enabled()
		) {
			return $enabled;
		}

		return true;
	},
	10,
	2
);

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'motorock/v1',
			'/graphql-variation-audit/(?P<product_id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_graphql_variation_audit',
				'permission_callback' => function () {
					return current_user_can( 'manage_woocommerce' );
				},
			)
		);
	}
);

function motorock_rest_graphql_variation_audit( WP_REST_Request $request ) {
	$product_id = (int) $request->get_param( 'product_id' );
	$product    = wc_get_product( $product_id );

	if ( ! $product instanceof WC_Product_Variable ) {
		return new WP_Error(
			'invalid_product',
			'Product is not a variable product',
			array( 'status' => 400 )
		);
	}

	$children = motorock_get_variable_product_children( $product );

	return array(
		'productId'        => $product_id,
		'variationCount'   => count( $children ),
		'variationIds'     => $children,
		'graphqlReady'     => count( $children ) > 0,
		'recommendation'   => count( $children ) > 0
			? 'Variations exist in WooCommerce. Re-save the product if GraphQL still returns an empty list.'
			: 'Regenerate variations in Woo admin (Attributes → Used for variations → Save → Generate variations).',
	);
}
