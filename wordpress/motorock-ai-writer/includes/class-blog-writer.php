<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Blog_Writer {

	public static function write( $payload ) {
		$locale = isset( $payload['locale'] ) ? sanitize_key( (string) $payload['locale'] ) : 'en';
		if ( ! in_array( $locale, array( 'en', 'et' ), true ) ) {
			return new WP_Error( 'motorock_ai_invalid_locale', 'Invalid locale', array( 'status' => 400 ) );
		}

		$title = isset( $payload['title'] ) ? sanitize_text_field( (string) $payload['title'] ) : '';
		$excerpt = isset( $payload['excerpt'] ) ? sanitize_textarea_field( (string) $payload['excerpt'] ) : '';
		$content = isset( $payload['contentHtml'] ) ? wp_kses_post( (string) $payload['contentHtml'] ) : '';
		$slug = isset( $payload['slug'] ) ? sanitize_title( (string) $payload['slug'] ) : '';

		if ( $title === '' || $content === '' || $slug === '' ) {
			return new WP_Error(
				'motorock_ai_invalid_blog_payload',
				'title, contentHtml and slug are required',
				array( 'status' => 400 )
			);
		}

		$publish_status = isset( $payload['publishStatus'] ) ? sanitize_key( (string) $payload['publishStatus'] ) : 'draft';
		if ( ! in_array( $publish_status, array( 'draft', 'published' ), true ) ) {
			$publish_status = 'draft';
		}

		$post_status = $publish_status === 'published' ? 'publish' : 'draft';

		$post_id = wp_insert_post(
			array(
				'post_title'   => $title,
				'post_excerpt' => $excerpt,
				'post_content' => $content,
				'post_name'    => $slug,
				'post_status'  => $post_status,
				'post_type'    => 'post',
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		self::assign_language( (int) $post_id, $locale );
		self::assign_categories( (int) $post_id, $payload['categorySlugs'] ?? array() );
		self::store_meta( (int) $post_id, $payload['meta'] ?? array(), $locale );

		return array(
			'ok'      => true,
			'postId'  => (int) $post_id,
			'slug'    => get_post_field( 'post_name', $post_id ),
			'locale'  => $locale,
			'editUrl' => get_edit_post_link( (int) $post_id, 'raw' ),
		);
	}

	private static function assign_language( $post_id, $locale ) {
		if ( ! Motorock_Ai_Wpml_Helper::is_active() ) {
			return;
		}

		$language = Motorock_Ai_Wpml_Helper::map_locale_to_wpml_code( $locale );
		if ( ! $language ) {
			return;
		}

		$element_type = apply_filters( 'wpml_element_type', 'post_post' );
		$details      = apply_filters(
			'wpml_element_language_details',
			null,
			array(
				'element_id'   => $post_id,
				'element_type' => $element_type,
			)
		);

		do_action(
			'wpml_set_element_language_details',
			array(
				'element_id'           => $post_id,
				'element_type'         => $element_type,
				'trid'                 => is_object( $details ) && ! empty( $details->trid ) ? $details->trid : false,
				'language_code'        => $language,
				'source_language_code' => null,
			)
		);
	}

	private static function assign_categories( $post_id, $category_slugs ) {
		if ( ! is_array( $category_slugs ) || empty( $category_slugs ) ) {
			return;
		}

		$term_ids = array();

		foreach ( $category_slugs as $slug ) {
			$slug = sanitize_title( (string) $slug );
			if ( $slug === '' ) {
				continue;
			}

			$term = get_term_by( 'slug', $slug, 'category' );
			if ( $term && ! is_wp_error( $term ) ) {
				$term_ids[] = (int) $term->term_id;
			}
		}

		if ( ! empty( $term_ids ) ) {
			wp_set_post_terms( $post_id, $term_ids, 'category', false );
		}
	}

	private static function store_meta( $post_id, $meta, $locale ) {
		update_post_meta( $post_id, '_motorock_ai_content_status', 'draft' );
		update_post_meta( $post_id, '_motorock_ai_blog_locale', $locale );
		update_post_meta( $post_id, '_motorock_ai_sections', wp_json_encode( array( 'blog' ) ) );

		if ( is_array( $meta ) ) {
			if ( ! empty( $meta['jobId'] ) ) {
				update_post_meta( $post_id, '_motorock_ai_job_id', sanitize_text_field( (string) $meta['jobId'] ) );
			}
			if ( ! empty( $meta['generatedAt'] ) ) {
				update_post_meta( $post_id, '_motorock_ai_generated_at', sanitize_text_field( (string) $meta['generatedAt'] ) );
			}
			if ( ! empty( $meta['provider'] ) ) {
				update_post_meta( $post_id, '_motorock_ai_provider', sanitize_text_field( (string) $meta['provider'] ) );
			}
		}
	}
}
