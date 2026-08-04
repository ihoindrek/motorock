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

		$publish_status = isset( $payload['publishStatus'] ) ? sanitize_key( (string) $payload['publishStatus'] ) : 'published';
		if ( ! in_array( $publish_status, array( 'draft', 'published' ), true ) ) {
			$publish_status = 'published';
		}

		$written = array(
			'shortDescription'    => false,
			'description'         => false,
			'seoTitle'            => false,
			'seoMetaDescription'  => false,
			'seoKeywords'         => false,
			'faq'                 => false,
			'altText'             => false,
		);

		$sections = isset( $payload['sections'] ) && is_array( $payload['sections'] ) ? $payload['sections'] : array();

		foreach ( $sections as $section ) {
			if ( ! is_array( $section ) || empty( $section['section'] ) ) {
				continue;
			}

			if ( $section['section'] === 'description' ) {
				$short = ! empty( $section['shortDescription'] ) ? wp_kses_post( (string) $section['shortDescription'] ) : '';
				$long  = ! empty( $section['description'] ) ? wp_kses_post( (string) $section['description'] ) : '';

				if ( $publish_status === 'draft' ) {
					if ( $short !== '' ) {
						update_post_meta( $product_id, '_motorock_ai_draft_short_description', $short );
						$written['shortDescription'] = true;
					}
					if ( $long !== '' ) {
						update_post_meta( $product_id, '_motorock_ai_draft_description', $long );
						$written['description'] = true;
					}
				} else {
					if ( $short !== '' ) {
						$product->set_short_description( $short );
						$written['shortDescription'] = true;
					}
					if ( $long !== '' ) {
						$product->set_description( $long );
						$written['description'] = true;
					}
				}
			}

			if ( $section['section'] === 'seo' ) {
				if ( $publish_status === 'draft' ) {
					if ( ! empty( $section['title'] ) ) {
						update_post_meta( $product_id, '_motorock_ai_draft_seo_title', sanitize_text_field( (string) $section['title'] ) );
						$written['seoTitle'] = true;
					}
					if ( ! empty( $section['metaDescription'] ) ) {
						update_post_meta(
							$product_id,
							'_motorock_ai_draft_seo_meta_description',
							sanitize_text_field( (string) $section['metaDescription'] )
						);
						$written['seoMetaDescription'] = true;
					}
					if ( ! empty( $section['keywords'] ) && is_array( $section['keywords'] ) ) {
						update_post_meta( $product_id, '_motorock_ai_draft_seo_keywords', wp_json_encode( self::sanitize_keywords( $section['keywords'] ) ) );
						$written['seoKeywords'] = true;
					}
				} else {
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
						update_post_meta( $product_id, '_motorock_ai_seo_keywords', wp_json_encode( self::sanitize_keywords( $section['keywords'] ) ) );
						$written['seoKeywords'] = true;
					}
				}
			}

			if ( $section['section'] === 'faq' && ! empty( $section['items'] ) && is_array( $section['items'] ) ) {
				$items = self::sanitize_faq_items( $section['items'] );
				if ( ! empty( $items ) ) {
					$key = $publish_status === 'draft' ? '_motorock_ai_draft_faq' : '_motorock_ai_faq';
					update_post_meta( $product_id, $key, wp_json_encode( $items ) );
					$written['faq'] = true;
				}
			}

			if ( $section['section'] === 'alt_text' && ! empty( $section['items'] ) && is_array( $section['items'] ) ) {
				if ( $publish_status === 'draft' ) {
					$draft_items = self::sanitize_alt_items( $section['items'] );
					if ( ! empty( $draft_items ) ) {
						update_post_meta( $product_id, '_motorock_ai_draft_alt_texts', wp_json_encode( $draft_items ) );
						$written['altText'] = true;
					}
				} else {
					foreach ( self::sanitize_alt_items( $section['items'] ) as $item ) {
						if ( empty( $item['imageId'] ) || empty( $item['altText'] ) ) {
							continue;
						}
						update_post_meta( (int) $item['imageId'], '_wp_attachment_image_alt', sanitize_text_field( (string) $item['altText'] ) );
						$written['altText'] = true;
					}
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

		if ( ! empty( $payload['motorcycle'] ) && is_array( $payload['motorcycle'] ) ) {
			$motorcycle = $payload['motorcycle'];

			if ( ! empty( $motorcycle['supplierDescriptionHtml'] ) ) {
				$existing_supplier = get_post_meta( $product_id, '_motorock_supplier_description', true );
				if ( ! is_string( $existing_supplier ) || $existing_supplier === '' ) {
					update_post_meta(
						$product_id,
						'_motorock_supplier_description',
						wp_kses_post( (string) $motorcycle['supplierDescriptionHtml'] )
					);
				}
			}

			if ( ! empty( $motorcycle['specsSnapshotJson'] ) ) {
				update_post_meta(
					$product_id,
					'_motorock_motorcycle_specs',
					wp_kses_post( (string) $motorcycle['specsSnapshotJson'] )
				);
			}
		}

		update_post_meta( $product_id, '_motorock_ai_content_status', $publish_status );
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
			'ok'            => true,
			'productId'     => (int) $product_id,
			'locale'        => isset( $payload['locale'] ) ? (string) $payload['locale'] : 'en',
			'publishStatus' => $publish_status,
			'written'       => $written,
		);
	}

	public static function publish( $payload ) {
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

		$published = array();

		$draft_short = get_post_meta( $product_id, '_motorock_ai_draft_short_description', true );
		if ( is_string( $draft_short ) && $draft_short !== '' ) {
			$product->set_short_description( wp_kses_post( $draft_short ) );
			$published['shortDescription'] = true;
		}

		$draft_long = get_post_meta( $product_id, '_motorock_ai_draft_description', true );
		if ( is_string( $draft_long ) && $draft_long !== '' ) {
			$product->set_description( wp_kses_post( $draft_long ) );
			$published['description'] = true;
		}

		$draft_seo_title = get_post_meta( $product_id, '_motorock_ai_draft_seo_title', true );
		if ( is_string( $draft_seo_title ) && $draft_seo_title !== '' ) {
			update_post_meta( $product_id, '_motorock_ai_seo_title', sanitize_text_field( $draft_seo_title ) );
			$published['seoTitle'] = true;
		}

		$draft_seo_meta = get_post_meta( $product_id, '_motorock_ai_draft_seo_meta_description', true );
		if ( is_string( $draft_seo_meta ) && $draft_seo_meta !== '' ) {
			update_post_meta( $product_id, '_motorock_ai_seo_meta_description', sanitize_text_field( $draft_seo_meta ) );
			$published['seoMetaDescription'] = true;
		}

		$draft_seo_keywords = get_post_meta( $product_id, '_motorock_ai_draft_seo_keywords', true );
		if ( is_string( $draft_seo_keywords ) && $draft_seo_keywords !== '' ) {
			update_post_meta( $product_id, '_motorock_ai_seo_keywords', $draft_seo_keywords );
			$published['seoKeywords'] = true;
		}

		$draft_faq = get_post_meta( $product_id, '_motorock_ai_draft_faq', true );
		if ( is_string( $draft_faq ) && $draft_faq !== '' ) {
			update_post_meta( $product_id, '_motorock_ai_faq', $draft_faq );
			$published['faq'] = true;
		}

		$draft_alt = get_post_meta( $product_id, '_motorock_ai_draft_alt_texts', true );
		if ( is_string( $draft_alt ) && $draft_alt !== '' ) {
			$items = json_decode( $draft_alt, true );
			if ( is_array( $items ) ) {
				foreach ( self::sanitize_alt_items( $items ) as $item ) {
					if ( empty( $item['imageId'] ) || empty( $item['altText'] ) ) {
						continue;
					}
					update_post_meta( (int) $item['imageId'], '_wp_attachment_image_alt', sanitize_text_field( (string) $item['altText'] ) );
					$published['altText'] = true;
				}
			}
		}

		update_post_meta( $product_id, '_motorock_ai_content_status', 'published' );
		$product->save();

		do_action( 'motorock_ai_content_published', $product_id, $payload );

		return array(
			'ok'        => true,
			'productId' => (int) $product_id,
			'locale'    => isset( $payload['locale'] ) ? (string) $payload['locale'] : 'en',
			'published' => $published,
		);
	}

	private static function sanitize_keywords( $keywords ) {
		return array_values(
			array_unique(
				array_filter(
					array_map(
						static function ( $keyword ) {
							return sanitize_text_field( (string) $keyword );
						},
						$keywords
					)
				)
			)
		);
	}

	private static function sanitize_faq_items( $items ) {
		$sanitized = array();

		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}

			$question = isset( $item['question'] ) ? sanitize_text_field( (string) $item['question'] ) : '';
			$answer   = isset( $item['answer'] ) ? sanitize_textarea_field( (string) $item['answer'] ) : '';

			if ( $question === '' || $answer === '' ) {
				continue;
			}

			$sanitized[] = array(
				'question' => $question,
				'answer'   => $answer,
			);
		}

		return $sanitized;
	}

	private static function sanitize_alt_items( $items ) {
		$sanitized = array();

		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}

			$image_id   = isset( $item['imageId'] ) ? (int) $item['imageId'] : 0;
			$image_index = isset( $item['imageIndex'] ) ? (int) $item['imageIndex'] : 0;
			$alt_text   = isset( $item['altText'] ) ? sanitize_text_field( (string) $item['altText'] ) : '';

			if ( $alt_text === '' ) {
				continue;
			}

			$sanitized[] = array(
				'imageId'    => $image_id > 0 ? $image_id : null,
				'imageIndex' => $image_index,
				'altText'    => $alt_text,
			);
		}

		return $sanitized;
	}
}
