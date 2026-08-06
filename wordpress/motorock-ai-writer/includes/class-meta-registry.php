<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Meta_Registry {

	const KEYS = array(
		'_motorock_ai_seo_title',
		'_motorock_ai_seo_meta_description',
		'_motorock_ai_seo_keywords',
		'_motorock_ai_faq',
		'_motorock_ai_content_status',
		'_motorock_ai_generated_at',
		'_motorock_ai_provider',
		'_motorock_ai_model',
		'_motorock_ai_prompt_version',
		'_motorock_ai_job_id',
		'_motorock_ai_sections',
		'_motorock_ai_draft_short_description',
		'_motorock_ai_draft_description',
		'_motorock_ai_draft_seo_title',
		'_motorock_ai_draft_seo_meta_description',
		'_motorock_ai_draft_seo_keywords',
		'_motorock_ai_draft_faq',
		'_motorock_ai_draft_alt_texts',
		'_motorock_supplier_description',
		'_motorock_motorcycle_specs',
		'_motorock_related_slugs',
	);

	public static function register() {
		add_action( 'init', array( __CLASS__, 'register_post_meta' ) );
		add_filter( 'graphql_post_object_meta_keys', array( __CLASS__, 'expose_graphql_meta_keys' ), 10, 2 );
	}

	public static function register_post_meta() {
		foreach ( self::KEYS as $meta_key ) {
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

	public static function expose_graphql_meta_keys( $keys, $post ) {
		if ( $post instanceof WP_Post && $post->post_type === 'product' ) {
			return array_values( array_unique( array_merge( $keys, self::KEYS ) ) );
		}

		return $keys;
	}
}
