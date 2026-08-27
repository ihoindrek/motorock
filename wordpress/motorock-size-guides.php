<?php
/**
 * Plugin Name: Motorock Size Guides
 * Description: Brand/category size charts for equipment PDP (REST + JSON sync from ACF).
 * Version: 1.0.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-size-guides.php
 *
 * Data entry: WP Admin → Products → Size guides (add charts manually).
 * Do not use eval-file seed scripts — ACF repeaters must be saved via admin UI.
 */

defined( 'ABSPATH' ) || exit;

const MOTOROCK_SIZE_GUIDE_POST_TYPE = 'motorock_size_guide';
const MOTOROCK_SIZE_GUIDE_JSON_META = '_motorock_size_guide_json';

const MOTOROCK_SIZE_GUIDE_MEASUREMENT_KEYS = array(
	'chest',
	'waist',
	'hips',
	'length',
	'inseam',
	'sleeve',
);

add_action(
	'init',
	function () {
		register_post_type(
			MOTOROCK_SIZE_GUIDE_POST_TYPE,
			array(
				'labels'              => array(
					'name'          => __( 'Size guides', 'motorock' ),
					'singular_name' => __( 'Size guide', 'motorock' ),
					'add_new_item'  => __( 'Add size guide', 'motorock' ),
					'edit_item'     => __( 'Edit size guide', 'motorock' ),
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_menu'        => 'edit.php?post_type=product',
				'menu_position'       => 58,
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
				'supports'            => array( 'title' ),
				'has_archive'         => false,
				'rewrite'             => false,
				'query_var'           => false,
				'show_in_rest'        => true,
			)
		);
	}
);

add_action(
	'acf/save_post',
	function ( $post_id ) {
		if ( get_post_type( $post_id ) !== MOTOROCK_SIZE_GUIDE_POST_TYPE ) {
			return;
		}

		if ( ! function_exists( 'get_field' ) ) {
			return;
		}

		$payload = motorock_build_size_guide_payload( $post_id );
		if ( ! $payload ) {
			delete_post_meta( $post_id, MOTOROCK_SIZE_GUIDE_JSON_META );
			return;
		}

		update_post_meta(
			$post_id,
			MOTOROCK_SIZE_GUIDE_JSON_META,
			wp_json_encode( $payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )
		);

		motorock_request_storefront_revalidate( 'size-guide-save' );
	},
	20
);

/**
 * @return array<string, mixed>|null
 */
function motorock_build_size_guide_payload( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post || $post->post_type !== MOTOROCK_SIZE_GUIDE_POST_TYPE ) {
		return null;
	}

	$brand_slug = sanitize_title( (string) get_field( 'size_guide_brand_slug', $post_id ) );
	$category   = sanitize_key( (string) get_field( 'size_guide_category', $post_id ) );
	$gender     = sanitize_key( (string) get_field( 'size_guide_gender', $post_id ) );

	if ( $brand_slug === '' || $category === '' || $gender === '' ) {
		return null;
	}

	if ( ! in_array( $gender, array( 'men', 'women', 'unisex' ), true ) ) {
		$gender = 'unisex';
	}

	$columns_raw = get_field( 'size_guide_columns', $post_id );
	$rows_raw    = get_field( 'size_guide_rows', $post_id );

	$columns = array();
	if ( is_array( $columns_raw ) ) {
		foreach ( $columns_raw as $column ) {
			if ( ! is_array( $column ) ) {
				continue;
			}

			$key = sanitize_key( (string) ( $column['key'] ?? '' ) );
			$label = trim( (string) ( $column['label'] ?? '' ) );

			if ( $key === '' || $label === '' || ! in_array( $key, MOTOROCK_SIZE_GUIDE_MEASUREMENT_KEYS, true ) ) {
				continue;
			}

			$columns[] = array(
				'key'   => $key,
				'label' => $label,
			);
		}
	}

	$rows = array();
	if ( is_array( $rows_raw ) ) {
		foreach ( $rows_raw as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			$size = trim( (string) ( $row['size'] ?? '' ) );
			if ( $size === '' ) {
				continue;
			}

			$measurements = array();
			foreach ( MOTOROCK_SIZE_GUIDE_MEASUREMENT_KEYS as $measurement_key ) {
				if ( ! isset( $row[ $measurement_key ] ) || $row[ $measurement_key ] === '' ) {
					continue;
				}

				$value = (float) $row[ $measurement_key ];
				if ( $value > 0 ) {
					$measurements[ $measurement_key ] = $value;
				}
			}

			$rows[] = array(
				'size'         => $size,
				'measurements' => $measurements,
			);
		}
	}

	if ( count( $columns ) === 0 || count( $rows ) === 0 ) {
		return null;
	}

	$fit = sanitize_key( (string) get_field( 'size_guide_fit', $post_id ) );
	if ( ! in_array( $fit, array( 'slim', 'regular', 'relaxed' ), true ) ) {
		$fit = null;
	}

	$note = trim( (string) get_field( 'size_guide_note', $post_id ) );
	$content_html = motorock_size_guide_content_html( $post_id );
	$image_url    = motorock_size_guide_image_url( $post_id );

	$post_slug = $post->post_name !== '' ? $post->post_name : '';
	if ( $post_slug === '' || preg_match( '/^\d+$/', $post_slug ) ) {
		$post_slug = $brand_slug !== '' ? $brand_slug : 'size-guide-' . $post_id;
	}

	return array(
		'id'        => $post_slug,
		'slug'      => $post_slug,
		'title'     => get_the_title( $post_id ),
		'brandSlug' => $brand_slug,
		'category'  => $category,
		'gender'    => $gender,
		'brand'     => motorock_format_brand_label( $brand_slug ),
		'note'        => $note !== '' ? $note : null,
		'contentHtml' => $content_html,
		'imageUrl'    => $image_url,
		'fit'         => $fit,
		'columns'   => $columns,
		'rows'      => $rows,
	);
}

function motorock_format_brand_label( $slug ) {
	$parts = array_filter( explode( '-', $slug ) );
	return implode( ' ', array_map( 'ucfirst', $parts ) );
}

/**
 * Ping headless storefront cache purge after size guide changes.
 */
function motorock_request_storefront_revalidate( $source = 'size-guide-save' ) {
	$base_url = '';

	if ( defined( 'MOTOROCK_STOREFRONT_URL' ) && MOTOROCK_STOREFRONT_URL ) {
		$base_url = rtrim( (string) MOTOROCK_STOREFRONT_URL, '/' );
	} else {
		$env = getenv( 'MOTOROCK_STOREFRONT_URL' );
		if ( is_string( $env ) && $env !== '' ) {
			$base_url = rtrim( $env, '/' );
		}
	}

	if ( $base_url === '' ) {
		return;
	}

	$secret = '';
	if ( defined( 'MOTOROCK_REVALIDATE_SECRET' ) && MOTOROCK_REVALIDATE_SECRET ) {
		$secret = (string) MOTOROCK_REVALIDATE_SECRET;
	} elseif ( defined( 'WOOCOMMERCE_WEBHOOK_SECRET' ) && WOOCOMMERCE_WEBHOOK_SECRET ) {
		$secret = (string) WOOCOMMERCE_WEBHOOK_SECRET;
	} else {
		$env = getenv( 'MOTOROCK_REVALIDATE_SECRET' );
		if ( ! is_string( $env ) || $env === '' ) {
			$env = getenv( 'WOOCOMMERCE_WEBHOOK_SECRET' );
		}
		if ( is_string( $env ) && $env !== '' ) {
			$secret = $env;
		}
	}

	if ( $secret === '' ) {
		return;
	}

	wp_remote_get(
		$base_url . '/api/revalidate/woocommerce',
		array(
			'timeout'   => 5,
			'blocking'  => false,
			'headers'   => array(
				'Authorization' => 'Bearer ' . $secret,
			),
			'body'      => null,
		)
	);
}

/**
 * WP WYSIWYG sometimes stores literal "n" instead of newlines between tags.
 */
function motorock_normalize_size_guide_content_html( $html ) {
	if ( ! is_string( $html ) || $html === '' ) {
		return $html;
	}

	$html = str_replace( array( "\r\n", "\r" ), "\n", $html );
	$html = preg_replace( '/(<\/?(?:p|ol|ul|li|h[34]|blockquote)[^>]*>)\s*n\s*/i', '$1', $html );
	$html = preg_replace( '/(<br\s*\/?>)\s*n(?=\s*[A-Za-z(])/i', '$1', $html );
	$html = preg_replace( '/>\s*n\s*(?=[A-Za-z(])/', '>', $html );
	$html = preg_replace( '/>\s*n\s*</', '><', $html );

	return $html;
}

/**
 * @return string|null
 */
function motorock_size_guide_content_html( $post_id ) {
	if ( ! function_exists( 'get_field' ) ) {
		return null;
	}

	$content = trim( (string) get_field( 'size_guide_content', $post_id ) );
	if ( $content === '' ) {
		return null;
	}

	$content = wpautop( $content );
	$content = wp_kses_post( $content );
	$content = motorock_normalize_size_guide_content_html( $content );

	return $content !== '' ? $content : null;
}

/**
 * @return string|null
 */
function motorock_size_guide_image_url( $post_id ) {
	if ( ! function_exists( 'get_field' ) ) {
		return null;
	}

	$image = get_field( 'size_guide_image', $post_id );

	if ( is_array( $image ) && ! empty( $image['url'] ) ) {
		return esc_url_raw( (string) $image['url'] );
	}

	if ( is_numeric( $image ) ) {
		$url = wp_get_attachment_image_url( (int) $image, 'large' );
		return $url ? esc_url_raw( $url ) : null;
	}

	if ( is_string( $image ) && $image !== '' ) {
		return esc_url_raw( $image );
	}

	return null;
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'motorock/v1',
			'/size-guides',
			array(
				'methods'             => 'GET',
				'callback'            => 'motorock_rest_list_size_guides',
				'permission_callback' => '__return_true',
			)
		);
	}
);

function motorock_rest_list_size_guides() {
	$query = new WP_Query(
		array(
			'post_type'              => MOTOROCK_SIZE_GUIDE_POST_TYPE,
			'post_status'            => 'publish',
			'posts_per_page'         => 100,
			'orderby'                => 'title',
			'order'                  => 'ASC',
			'no_found_rows'          => true,
			'update_post_meta_cache' => true,
		)
	);

	$guides = array();

	foreach ( $query->posts as $post ) {
		$payload = motorock_read_size_guide_payload( $post->ID );
		if ( $payload ) {
			$guides[] = $payload;
		}
	}

	return array(
		'ok'     => true,
		'guides' => $guides,
	);
}

/**
 * @return array<string, mixed>|null
 */
function motorock_read_size_guide_payload( $post_id ) {
	$raw = get_post_meta( $post_id, MOTOROCK_SIZE_GUIDE_JSON_META, true );
	if ( is_string( $raw ) && $raw !== '' ) {
		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) && ! empty( $decoded['rows'] ) ) {
			if ( ! empty( $decoded['contentHtml'] ) ) {
				$decoded['contentHtml'] = motorock_normalize_size_guide_content_html(
					(string) $decoded['contentHtml']
				);
			}

			return $decoded;
		}
	}

	if ( function_exists( 'get_field' ) ) {
		return motorock_build_size_guide_payload( $post_id );
	}

	return null;
}
