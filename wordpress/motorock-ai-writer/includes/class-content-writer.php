<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Content_Writer {

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

		$written = array(
			'shortDescription'    => false,
			'description'         => false,
			'seoTitle'            => false,
			'seoMetaDescription'  => false,
			'seoKeywords'         => false,
		);

		$sections = isset( $payload['sections'] ) && is_array( $payload['sections'] ) ? $payload['sections'] : array();

		foreach ( $sections as $section ) {
			if ( ! is_array( $section ) || empty( $section['section'] ) ) {
				continue;
			}

			if ( $section['section'] === 'description' ) {
				if ( ! empty( $section['shortDescription'] ) ) {
					$product->set_short_description(
						wp_kses_post( (string) $section['shortDescription'] )
					);
					$written['shortDescription'] = true;
				}

				if ( ! empty( $section['description'] ) ) {
					$product->set_description(
						wp_kses_post( (string) $section['description'] )
					);
					$written['description'] = true;
				}
			}

			if ( $section['section'] === 'seo' ) {
				if ( ! empty( $section['title'] ) ) {
					update_post_meta( $product_id, '_motorock_ai_seo_title', sanitize_text_field( (string) $section['title'] ) );
					$written['seoTitle'] = true;
				}

				if ( ! empty( $section['metaDescription'] ) ) {
					update_post_meta(
						$product_id,
						'_motorock_ai_seo_meta_description',
						sanitize_text_field( (string) $section['metaDescription'] )
					);
					$written['seoMetaDescription'] = true;
				}

				if ( ! empty( $section['keywords'] ) && is_array( $section['keywords'] ) ) {
					$keywords = array_values(
						array_unique(
							array_filter(
								array_map(
									static function ( $keyword ) {
										return sanitize_text_field( (string) $keyword );
									},
									$section['keywords']
								)
							)
						)
					);
					update_post_meta( $product_id, '_motorock_ai_seo_keywords', wp_json_encode( $keywords ) );
					$written['seoKeywords'] = true;
				}
			}
		}

		if ( ! empty( $payload['meta'] ) && is_array( $payload['meta'] ) ) {
			$meta = $payload['meta'];
			if ( ! empty( $meta['provider'] ) ) {
				update_post_meta( $product_id, '_motorock_ai_provider', sanitize_text_field( (string) $meta['provider'] ) );
			}
			if ( ! empty( $meta['model'] ) ) {
				update_post_meta( $product_id, '_motorock_ai_model', sanitize_text_field( (string) $meta['model'] ) );
			}
			if ( ! empty( $meta['promptVersion'] ) ) {
				update_post_meta( $product_id, '_motorock_ai_prompt_version', sanitize_text_field( (string) $meta['promptVersion'] ) );
			}
			if ( ! empty( $meta['jobId'] ) ) {
				update_post_meta( $product_id, '_motorock_ai_job_id', sanitize_text_field( (string) $meta['jobId'] ) );
			}
			if ( ! empty( $meta['generatedAt'] ) ) {
				update_post_meta( $product_id, '_motorock_ai_generated_at', sanitize_text_field( (string) $meta['generatedAt'] ) );
			}
		}

		update_post_meta( $product_id, '_motorock_ai_content_status', 'published' );
		update_post_meta(
			$product_id,
			'_motorock_ai_sections',
			wp_json_encode(
				array_values(
					array_map(
						static function ( $section ) {
							return isset( $section['section'] ) ? (string) $section['section'] : '';
						},
						$sections
					)
				)
			)
		);

		$product->save();

		do_action( 'motorock_ai_content_written', $product_id, $payload );

		return array(
			'ok'        => true,
			'productId' => (int) $product_id,
			'locale'    => isset( $payload['locale'] ) ? (string) $payload['locale'] : 'en',
			'written'   => $written,
		);
	}
}
