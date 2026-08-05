<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Wpml_Helper {

	public static function is_active() {
		return defined( 'ICL_SITECODE' ) || function_exists( 'wpml_get_element_translations' );
	}

	public static function resolve_product_for_locale( $product_id, $locale ) {
		$product_id = (int) $product_id;
		if ( ! $product_id ) {
			return 0;
		}

		if ( ! self::is_active() ) {
			return $product_id;
		}

		$language = self::map_locale_to_wpml_code( $locale );
		if ( ! $language ) {
			return $product_id;
		}

		$translated = apply_filters( 'wpml_object_id', $product_id, 'product', false, $language );
		return $translated ? (int) $translated : $product_id;
	}

	public static function map_locale_to_wpml_code( $locale ) {
		switch ( $locale ) {
			case 'en':
				return 'en';
			case 'et':
				return 'et';
			default:
				return '';
		}
	}
}
