<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Term_Writer {

	public static function write( $payload ) {
		$taxonomy = isset( $payload['taxonomy'] ) ? sanitize_key( (string) $payload['taxonomy'] ) : '';
		$term_slug = isset( $payload['termSlug'] ) ? sanitize_title( (string) $payload['termSlug'] ) : '';
		$locale    = isset( $payload['locale'] ) ? sanitize_key( (string) $payload['locale'] ) : 'en';
		$description = isset( $payload['description'] ) ? wp_kses_post( (string) $payload['description'] ) : '';

		if ( $taxonomy === '' || $term_slug === '' || $description === '' ) {
			return new WP_Error(
				'motorock_ai_invalid_term_payload',
				'taxonomy, termSlug and description are required',
				array( 'status' => 400 )
			);
		}

		if ( ! in_array( $locale, array( 'en', 'et' ), true ) ) {
			return new WP_Error( 'motorock_ai_invalid_locale', 'Invalid locale', array( 'status' => 400 ) );
		}

		$term = get_term_by( 'slug', $term_slug, $taxonomy );
		if ( ! $term || is_wp_error( $term ) ) {
			return new WP_Error(
				'motorock_ai_term_not_found',
				'Term not found: ' . $term_slug,
				array( 'status' => 404 )
			);
		}

		$term_id = self::resolve_term_for_locale( (int) $term->term_id, $taxonomy, $locale );

		$result = wp_update_term(
			$term_id,
			$taxonomy,
			array(
				'description' => $description,
			)
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		self::store_meta( $term_id, $payload['meta'] ?? array(), $locale );
		self::store_seo_meta( $term_id, $payload );

		return array(
			'ok'     => true,
			'termId' => (int) $term_id,
			'slug'   => $term_slug,
			'locale' => $locale,
		);
	}

	private static function resolve_term_for_locale( $term_id, $taxonomy, $locale ) {
		if ( ! Motorock_Ai_Wpml_Helper::is_active() ) {
			return $term_id;
		}

		$language = Motorock_Ai_Wpml_Helper::map_locale_to_wpml_code( $locale );
		if ( ! $language ) {
			return $term_id;
		}

		$translated = apply_filters( 'wpml_object_id', $term_id, $taxonomy, false, $language );
		return $translated ? (int) $translated : $term_id;
	}

	private static function store_seo_meta( $term_id, $payload ) {
		if ( ! empty( $payload['seoTitle'] ) ) {
			update_term_meta(
				$term_id,
				'_motorock_ai_category_seo_title',
				sanitize_text_field( (string) $payload['seoTitle'] )
			);
		}

		if ( ! empty( $payload['seoMetaDescription'] ) ) {
			update_term_meta(
				$term_id,
				'_motorock_ai_category_seo_meta_description',
				sanitize_text_field( (string) $payload['seoMetaDescription'] )
			);
		}
	}

	private static function store_meta( $term_id, $meta, $locale ) {
		update_term_meta( $term_id, '_motorock_ai_category_locale', $locale );
		update_term_meta( $term_id, '_motorock_ai_category_generated_at', gmdate( 'c' ) );

		if ( is_array( $meta ) ) {
			if ( ! empty( $meta['provider'] ) ) {
				update_term_meta( $term_id, '_motorock_ai_provider', sanitize_text_field( (string) $meta['provider'] ) );
			}
			if ( ! empty( $meta['model'] ) ) {
				update_term_meta( $term_id, '_motorock_ai_model', sanitize_text_field( (string) $meta['model'] ) );
			}
			if ( ! empty( $meta['promptVersion'] ) ) {
				update_term_meta( $term_id, '_motorock_ai_prompt_version', sanitize_text_field( (string) $meta['promptVersion'] ) );
			}
		}
	}
}
