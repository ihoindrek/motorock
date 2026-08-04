<?php
/**
 * Plugin Name: Motorock Product Fields
 * Description: Exposes ACF product fields (showroom_available, motorcycle_specs_html, is_new) to REST and WPGraphQL metaData.
 * Version: 1.0.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-product-fields.php
 */

defined( 'ABSPATH' ) || exit;

const MOTOROCK_PRODUCT_GRAPHQL_META_KEYS = array(
	'showroom_available',
	'is_new',
	'motorcycle_specs_html',
	'motorcycle_specs_source_url',
	'_motorock_ai_seo_title',
	'_motorock_ai_seo_meta_description',
	'_motorock_ai_seo_keywords',
	'_motorock_supplier_description',
	'_motorock_motorcycle_specs',
);

/**
 * Register public product meta for REST consumers.
 */
add_action(
	'init',
	function () {
		foreach ( MOTOROCK_PRODUCT_GRAPHQL_META_KEYS as $meta_key ) {
			register_post_meta(
				'product',
				$meta_key,
				array(
					'type'              => 'string',
					'single'            => true,
					'show_in_rest'      => true,
					'auth_callback'     => function () {
						return current_user_can( 'edit_products' );
					},
				)
			);
		}
	}
);

/**
 * WPGraphQL only exposes whitelisted meta keys on product metaData.
 */
add_filter(
	'graphql_post_object_meta_keys',
	function ( $keys, $post ) {
		if ( $post instanceof WP_Post && $post->post_type === 'product' ) {
			return array_values(
				array_unique(
					array_merge( $keys, MOTOROCK_PRODUCT_GRAPHQL_META_KEYS )
				)
			);
		}

		return $keys;
	},
	10,
	2
);

/**
 * Keep the Motorock ACF group in the main product editor column (not the sidebar).
 */
add_filter(
	'acf/load_field_group',
	function ( $field_group ) {
		if ( ! is_array( $field_group ) || ( $field_group['key'] ?? '' ) !== 'group_motorock_product' ) {
			return $field_group;
		}

		$field_group['position']   = 'normal';
		$field_group['menu_order'] = 10;

		return $field_group;
	}
);

add_action(
	'add_meta_boxes',
	function ( $post_type ) {
		if ( $post_type !== 'product' ) {
			return;
		}

		remove_meta_box( 'acf-group_motorock_product', 'product', 'side' );
	},
	99
);
