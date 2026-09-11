<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Graphql_Category_Seo {

	const SEO_TITLE_META_KEY = '_motorock_ai_category_seo_title';
	const SEO_META_DESCRIPTION_KEY = '_motorock_ai_category_seo_meta_description';

	public static function register() {
		add_action( 'graphql_register_types', array( __CLASS__, 'register_fields' ) );
	}

	public static function register_fields() {
		register_graphql_field(
			'ProductCategory',
			'motorockAiSeoTitle',
			array(
				'type'        => 'String',
				'description' => __( 'Motorock AI SEO title for this category term.', 'motorock-commerce-ai' ),
				'resolve'     => function ( $category ) {
					return self::read_term_meta( $category, self::SEO_TITLE_META_KEY );
				},
			)
		);

		register_graphql_field(
			'ProductCategory',
			'motorockAiMetaDescription',
			array(
				'type'        => 'String',
				'description' => __( 'Motorock AI meta description for this category term.', 'motorock-commerce-ai' ),
				'resolve'     => function ( $category ) {
					return self::read_term_meta( $category, self::SEO_META_DESCRIPTION_KEY );
				},
			)
		);
	}

	private static function read_term_meta( $category, $meta_key ) {
		if ( ! $category instanceof WP_Term ) {
			return null;
		}

		$value = get_term_meta( (int) $category->term_id, $meta_key, true );

		return is_string( $value ) && $value !== '' ? $value : null;
	}
}
