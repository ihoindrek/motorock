<?php
/**
 * Plugin Name: Motorock Headless Product Feed Links
 * Description: Rewrites AdTribes product feed links from shop.motorock.eu to motorock.eu storefront URLs.
 * Version: 1.2.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-headless-product-feed-links.php
 */

defined( 'ABSPATH' ) || exit;

function motorock_feed_storefront_base() {
	if ( function_exists( 'motorock_get_storefront_url' ) ) {
		return motorock_get_storefront_url();
	}

	if ( defined( 'MOTOROCK_STOREFRONT_URL' ) && MOTOROCK_STOREFRONT_URL ) {
		return rtrim( MOTOROCK_STOREFRONT_URL, '/' );
	}

	$env = getenv( 'MOTOROCK_STOREFRONT_URL' );
	if ( $env ) {
		return rtrim( $env, '/' );
	}

	return 'https://motorock.eu';
}

function motorock_feed_locale_for_feed( $feed ) {
	$title = '';

	if ( is_object( $feed ) ) {
		if ( isset( $feed->title ) ) {
			$title = (string) $feed->title;
		} elseif ( method_exists( $feed, 'get_title' ) ) {
			$title = (string) $feed->get_title();
		}
	}

	if ( preg_match( '/\bet\b/i', $title ) ) {
		return 'et';
	}

	return 'en';
}

function motorock_feed_target_product( $product ) {
	if ( ! is_object( $product ) || ! method_exists( $product, 'get_slug' ) ) {
		return null;
	}

	if ( method_exists( $product, 'is_type' ) && $product->is_type( 'variation' ) && method_exists( $product, 'get_parent_id' ) ) {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return $product;
		}

		$parent = wc_get_product( $product->get_parent_id() );
		return is_object( $parent ) ? $parent : $product;
	}

	return $product;
}

function motorock_storefront_product_url( $product, $locale = 'en' ) {
	$target = motorock_feed_target_product( $product );
	if ( ! $target || ! method_exists( $target, 'get_slug' ) ) {
		return '';
	}

	$slug = (string) $target->get_slug();
	if ( $slug === '' ) {
		return '';
	}

	$segment = $locale === 'et' ? 'toode' : 'product';

	return motorock_feed_storefront_base() . '/' . $locale . '/' . $segment . '/' . $slug;
}

function motorock_rewrite_backend_product_url_string( $url, $locale = 'en' ) {
	if ( ! is_string( $url ) || $url === '' ) {
		return $url;
	}

	$replacements = array(
		'https://shop.motorock.eu/product/' => motorock_feed_storefront_base() . '/en/product/',
		'http://shop.motorock.eu/product/'  => motorock_feed_storefront_base() . '/en/product/',
		'https://shop.motorock.eu/toode/'   => motorock_feed_storefront_base() . '/et/toode/',
		'http://shop.motorock.eu/toode/'    => motorock_feed_storefront_base() . '/et/toode/',
	);

	if ( $locale === 'et' ) {
		$replacements = array(
			'https://shop.motorock.eu/toode/'   => motorock_feed_storefront_base() . '/et/toode/',
			'http://shop.motorock.eu/toode/'    => motorock_feed_storefront_base() . '/et/toode/',
			'https://shop.motorock.eu/product/' => motorock_feed_storefront_base() . '/et/toode/',
			'http://shop.motorock.eu/product/'  => motorock_feed_storefront_base() . '/et/toode/',
		);
	}

	return str_replace( array_keys( $replacements ), array_values( $replacements ), $url );
}

function motorock_rewrite_backend_product_url( $url, $product = null, $locale = 'en' ) {
	$storefront_url = $product ? motorock_storefront_product_url( $product, $locale ) : '';
	if ( $storefront_url !== '' ) {
		return $storefront_url;
	}

	return motorock_rewrite_backend_product_url_string( $url, $locale );
}

function motorock_rewrite_product_data_links( $product_data, $feed ) {
	if ( ! is_array( $product_data ) ) {
		return $product_data;
	}

	$locale    = motorock_feed_locale_for_feed( $feed );
	$link_keys = array( 'link', 'product_variable_link', 'link_no_tracking', 'variable_link' );

	foreach ( $link_keys as $key ) {
		if ( empty( $product_data[ $key ] ) || ! is_string( $product_data[ $key ] ) ) {
			continue;
		}

		$product_data[ $key ] = motorock_rewrite_backend_product_url_string(
			$product_data[ $key ],
			$locale
		);
	}

	return $product_data;
}

function motorock_register_product_feed_link_hooks() {
	add_filter(
		'post_type_link',
		function ( $permalink, $post ) {
			if ( ! $post instanceof WP_Post || $post->post_type !== 'product' ) {
				return $permalink;
			}

			if ( ! function_exists( 'wc_get_product' ) ) {
				return motorock_rewrite_backend_product_url_string( $permalink, 'en' );
			}

			$product = wc_get_product( $post->ID );
			return motorock_rewrite_backend_product_url( $permalink, $product, 'en' );
		},
		99,
		2
	);

	add_filter(
		'woocommerce_product_get_permalink',
		function ( $permalink, $product ) {
			return motorock_rewrite_backend_product_url( $permalink, $product, 'en' );
		},
		99,
		2
	);

	add_filter(
		'adt_get_product_data',
		function ( $product_data, $feed, $product ) {
			$product_data = motorock_rewrite_product_data_links( $product_data, $feed );

			if ( is_object( $product ) && method_exists( $product, 'get_slug' ) ) {
				$locale = motorock_feed_locale_for_feed( $feed );
				$url    = motorock_storefront_product_url( $product, $locale );
				if ( $url !== '' ) {
					foreach ( array( 'link', 'product_variable_link', 'link_no_tracking', 'variable_link' ) as $key ) {
						if ( isset( $product_data[ $key ] ) ) {
							$product_data[ $key ] = $url;
						}
					}
				}
			}

			return $product_data;
		},
		99,
		3
	);

	add_filter(
		'adt_pfp_process_rules_action',
		function ( $data, $action, $feed ) {
			return motorock_rewrite_product_data_links( $data, $feed );
		},
		99,
		3
	);

	add_filter(
		'adt_product_feed_xml_attribute_value',
		function ( $value, $attribute_name, $xml_product, $product_data, $feed ) {
			unset( $xml_product, $product_data );

			if ( ! is_string( $value ) || $value === '' ) {
				return $value;
			}

			$link_attributes = array( 'g:link', 'link', 'g:link_template', 'URL', 'Final URL' );
			if ( ! in_array( $attribute_name, $link_attributes, true ) && strpos( $value, 'shop.motorock.eu' ) === false ) {
				return $value;
			}

			return motorock_rewrite_backend_product_url_string(
				$value,
				motorock_feed_locale_for_feed( $feed )
			);
		},
		99,
		5
	);
}

add_action( 'plugins_loaded', 'motorock_register_product_feed_link_hooks', 20 );
