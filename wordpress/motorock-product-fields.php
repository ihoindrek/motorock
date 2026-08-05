<?php
/**
 * Plugin Name: Motorock Product Fields
 * Description: Exposes ACF product fields (showroom_available, motorcycle_specs_html, lifestyle gallery, product video, is_new) to REST and WPGraphQL metaData.
 * Version: 1.2.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-product-fields.php
 */

defined( 'ABSPATH' ) || exit;

const MOTOROCK_LIFESTYLE_GALLERY_ACF = 'motorcycle_lifestyle_gallery';
const MOTOROCK_LIFESTYLE_GALLERY_META = '_motorock_lifestyle_gallery';

const MOTOROCK_PRODUCT_GRAPHQL_META_KEYS = array(
	'showroom_available',
	'is_new',
	'motorcycle_specs_html',
	'motorcycle_specs_source_url',
	'product_video_url',
	'size_guide_slug',
	MOTOROCK_LIFESTYLE_GALLERY_META,
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

/**
 * Sync ACF lifestyle gallery attachment IDs to a JSON URL list for headless GraphQL.
 */
function motorock_sync_lifestyle_gallery_meta( $post_id ) {
	if ( get_post_type( $post_id ) !== 'product' ) {
		return;
	}

	if ( ! function_exists( 'get_field' ) ) {
		return;
	}

	$attachment_ids = get_field( MOTOROCK_LIFESTYLE_GALLERY_ACF, $post_id );

	if ( ! is_array( $attachment_ids ) || count( $attachment_ids ) === 0 ) {
		delete_post_meta( $post_id, MOTOROCK_LIFESTYLE_GALLERY_META );
		return;
	}

	$urls = array();

	foreach ( $attachment_ids as $attachment_id ) {
		$url = wp_get_attachment_image_url( (int) $attachment_id, 'full' );

		if ( $url ) {
			$urls[] = $url;
		}
	}

	if ( count( $urls ) === 0 ) {
		delete_post_meta( $post_id, MOTOROCK_LIFESTYLE_GALLERY_META );
		return;
	}

	update_post_meta(
		$post_id,
		MOTOROCK_LIFESTYLE_GALLERY_META,
		wp_json_encode(
			array_values( $urls ),
			JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
		)
	);
}

add_action( 'acf/save_post', 'motorock_sync_lifestyle_gallery_meta', 20 );
