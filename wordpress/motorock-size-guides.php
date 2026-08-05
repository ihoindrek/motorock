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

	return array(
		'id'        => $post->post_name !== '' ? $post->post_name : 'size-guide-' . $post_id,
		'slug'      => $post->post_name !== '' ? $post->post_name : 'size-guide-' . $post_id,
		'title'     => get_the_title( $post_id ),
		'brandSlug' => $brand_slug,
		'category'  => $category,
		'gender'    => $gender,
		'brand'     => motorock_format_brand_label( $brand_slug ),
		'note'      => $note !== '' ? $note : null,
		'fit'       => $fit,
		'columns'   => $columns,
		'rows'      => $rows,
	);
}

function motorock_format_brand_label( $slug ) {
	$parts = array_filter( explode( '-', $slug ) );
	return implode( ' ', array_map( 'ucfirst', $parts ) );
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
			return $decoded;
		}
	}

	if ( function_exists( 'get_field' ) ) {
		return motorock_build_size_guide_payload( $post_id );
	}

	return null;
}
