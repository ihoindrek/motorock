<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Related_Writer {

	const META_KEY = '_motorock_related_slugs';

	public static function write( $payload ) {
		$product_id = Motorock_Ai_Wpml_Helper::resolve_product_for_locale(
			isset( $payload['productId'] ) ? (int) $payload['productId'] : 0,
			isset( $payload['locale'] ) ? (string) $payload['locale'] : 'en'
		);

		if ( ! $product_id ) {
			return new WP_Error( 'motorock_ai_invalid_product', 'Invalid product ID', array( 'status' => 400 ) );
		}

		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return new WP_Error( 'motorock_ai_product_not_found', 'Product not found', array( 'status' => 404 ) );
		}

		$related_slugs = isset( $payload['relatedSlugs'] ) && is_array( $payload['relatedSlugs'] )
			? $payload['relatedSlugs']
			: array();

		$normalized = array();
		foreach ( $related_slugs as $slug ) {
			if ( ! is_string( $slug ) ) {
				continue;
			}

			$slug = sanitize_title( $slug );
			if ( $slug !== '' ) {
				$normalized[] = $slug;
			}
		}

		$normalized = array_values( array_unique( $normalized ) );
		if ( count( $normalized ) === 0 ) {
			return new WP_Error(
				'motorock_ai_invalid_related_slugs',
				'relatedSlugs must contain at least one slug',
				array( 'status' => 400 )
			);
		}

		update_post_meta(
			$product_id,
			self::META_KEY,
			wp_json_encode(
				$normalized,
				JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
			)
		);

		Motorock_Ai_Logger::info(
			'related products write complete',
			array(
				'productId' => $product_id,
				'count'     => count( $normalized ),
			)
		);

		return array(
			'ok'           => true,
			'productId'    => $product_id,
			'locale'       => isset( $payload['locale'] ) ? (string) $payload['locale'] : 'en',
			'relatedSlugs' => $normalized,
		);
	}
}
