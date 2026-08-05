<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Rest_Generate_Proxy {

	public static function register() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes() {
		register_rest_route(
			'motorock/v1',
			'/ai/generate',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_generate' ),
				'permission_callback' => array( __CLASS__, 'verify_admin' ),
			)
		);

		register_rest_route(
			'motorock/v1',
			'/ai/batch',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_batch' ),
				'permission_callback' => array( __CLASS__, 'verify_admin' ),
			)
		);
	}

	public static function verify_admin() {
		return current_user_can( 'edit_products' );
	}

	public static function handle_generate( WP_REST_Request $request ) {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'motorock_ai_invalid_body', 'Invalid JSON body', array( 'status' => 400 ) );
		}

		$product_id = isset( $payload['productId'] ) ? (int) $payload['productId'] : 0;
		if ( ! $product_id ) {
			return new WP_Error( 'motorock_ai_invalid_product', 'productId is required', array( 'status' => 400 ) );
		}

		$locales = self::normalize_locales( $payload['locales'] ?? array( 'en', 'et' ) );
		$sections = self::normalize_sections( $payload['sections'] ?? array( 'description', 'seo' ) );
		$dry_run = ! empty( $payload['dryRun'] );
		$overwrite = isset( $payload['overwrite'] ) ? (string) $payload['overwrite'] : 'if_empty';
		$publish_status = isset( $payload['publishStatus'] ) ? sanitize_key( (string) $payload['publishStatus'] ) : 'draft';
		if ( ! in_array( $publish_status, array( 'draft', 'published' ), true ) ) {
			$publish_status = 'draft';
		}

		if ( empty( $locales ) || empty( $sections ) ) {
			return new WP_Error( 'motorock_ai_invalid_body', 'locales and sections are required', array( 'status' => 400 ) );
		}

		$api_url = self::get_api_url();
		$api_secret = self::get_api_secret();

		if ( ! $api_url || ! $api_secret ) {
			return new WP_Error(
				'motorock_ai_api_not_configured',
				'MOTOROCK_AI_API_SECRET or storefront URL is not configured in wp-config.php',
				array( 'status' => 503 )
			);
		}

		$endpoint = count( $locales ) > 1
			? $api_url . '/api/ai/batch'
			: $api_url . '/api/ai/generate';

		$body = count( $locales ) > 1
			? array(
				'productIds' => array( $product_id ),
				'locales'    => $locales,
				'sections'   => $sections,
				'options'    => array(
					'dryRun'        => $dry_run,
					'overwrite'     => $overwrite,
					'publishStatus' => $publish_status,
				),
			)
			: array(
				'productId' => $product_id,
				'locale'    => $locales[0],
				'sections'  => $sections,
				'options'   => array(
					'dryRun'        => $dry_run,
					'overwrite'     => $overwrite,
					'publishStatus' => $publish_status,
				),
			);

		Motorock_Ai_Logger::info(
			'admin generate request',
			array(
				'productId' => $product_id,
				'locales'   => $locales,
				'dryRun'    => $dry_run,
				'endpoint'  => $endpoint,
			)
		);

		return self::proxy_storefront_request( $endpoint, $api_secret, $body );
	}

	public static function handle_batch( WP_REST_Request $request ) {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'motorock_ai_invalid_body', 'Invalid JSON body', array( 'status' => 400 ) );
		}

		$product_ids = self::normalize_product_ids( $payload['productIds'] ?? array() );
		if ( empty( $product_ids ) ) {
			return new WP_Error( 'motorock_ai_invalid_product', 'productIds is required', array( 'status' => 400 ) );
		}

		$locales = self::normalize_locales( $payload['locales'] ?? array( 'en', 'et' ) );
		$sections = self::normalize_sections( $payload['sections'] ?? array( 'description', 'seo' ) );
		$dry_run = ! empty( $payload['dryRun'] );
		$overwrite = isset( $payload['overwrite'] ) ? (string) $payload['overwrite'] : 'always';
		$publish_status = isset( $payload['publishStatus'] ) ? sanitize_key( (string) $payload['publishStatus'] ) : 'draft';
		if ( ! in_array( $publish_status, array( 'draft', 'published' ), true ) ) {
			$publish_status = 'draft';
		}

		if ( empty( $locales ) || empty( $sections ) ) {
			return new WP_Error( 'motorock_ai_invalid_body', 'locales and sections are required', array( 'status' => 400 ) );
		}

		if ( count( $product_ids ) * count( $locales ) > 30 ) {
			return new WP_Error(
				'motorock_ai_batch_too_large',
				'Batch too large (max 30 total jobs). Reduce products, locales, or use smaller chunks.',
				array( 'status' => 400 )
			);
		}

		$api_url = self::get_api_url();
		$api_secret = self::get_api_secret();

		if ( ! $api_url || ! $api_secret ) {
			return new WP_Error(
				'motorock_ai_api_not_configured',
				'MOTOROCK_AI_API_SECRET or storefront URL is not configured in wp-config.php',
				array( 'status' => 503 )
			);
		}

		$body = array(
			'productIds' => $product_ids,
			'locales'    => $locales,
			'sections'   => $sections,
			'options'    => array(
				'dryRun'        => $dry_run,
				'overwrite'     => $overwrite,
				'publishStatus' => $publish_status,
				'revalidate'    => false,
			),
		);

		Motorock_Ai_Logger::info(
			'admin batch request',
			array(
				'productIds' => $product_ids,
				'locales'    => $locales,
				'dryRun'     => $dry_run,
			)
		);

		return self::proxy_storefront_request( $api_url . '/api/ai/batch', $api_secret, $body );
	}

	private static function normalize_product_ids( $product_ids ) {
		if ( ! is_array( $product_ids ) ) {
			return array();
		}

		$normalized = array();

		foreach ( $product_ids as $product_id ) {
			$product_id = (int) $product_id;
			if ( $product_id > 0 && ! in_array( $product_id, $normalized, true ) ) {
				$normalized[] = $product_id;
			}
		}

		return array_slice( $normalized, 0, 25 );
	}

	private static function proxy_storefront_request( $endpoint, $api_secret, $body ) {
		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => 300,
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $api_secret,
				),
				'body'    => wp_json_encode( $body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'motorock_ai_api_unreachable',
				$response->get_error_message(),
				array( 'status' => 502 )
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! is_array( $data ) ) {
			return new WP_Error(
				'motorock_ai_api_invalid_response',
				'Storefront AI API returned an invalid response',
				array( 'status' => 502 )
			);
		}

		return new WP_REST_Response( $data, $status > 0 ? $status : 502 );
	}

	private static function normalize_locales( $locales ) {
		if ( ! is_array( $locales ) ) {
			return array();
		}

		$allowed = array( 'en', 'et' );
		$normalized = array();

		foreach ( $locales as $locale ) {
			$locale = sanitize_key( (string) $locale );
			if ( in_array( $locale, $allowed, true ) && ! in_array( $locale, $normalized, true ) ) {
				$normalized[] = $locale;
			}
		}

		return $normalized;
	}

	private static function normalize_sections( $sections ) {
		if ( ! is_array( $sections ) ) {
			return array();
		}

		$allowed = array( 'description', 'seo', 'faq', 'alt_text' );
		$normalized = array();

		foreach ( $sections as $section ) {
			$section = sanitize_key( (string) $section );
			if ( in_array( $section, $allowed, true ) && ! in_array( $section, $normalized, true ) ) {
				$normalized[] = $section;
			}
		}

		return $normalized;
	}

	private static function get_api_url() {
		if ( defined( 'MOTOROCK_AI_API_URL' ) && MOTOROCK_AI_API_URL ) {
			return rtrim( (string) MOTOROCK_AI_API_URL, '/' );
		}

		if ( defined( 'MOTOROCK_STOREFRONT_URL' ) && MOTOROCK_STOREFRONT_URL ) {
			return rtrim( (string) MOTOROCK_STOREFRONT_URL, '/' );
		}

		$env = getenv( 'MOTOROCK_STOREFRONT_URL' );
		return $env ? rtrim( (string) $env, '/' ) : 'https://motorock.eu';
	}

	private static function get_api_secret() {
		if ( defined( 'MOTOROCK_AI_API_SECRET' ) && MOTOROCK_AI_API_SECRET ) {
			return (string) MOTOROCK_AI_API_SECRET;
		}

		$env = getenv( 'MOTOROCK_AI_API_SECRET' );
		return $env ? (string) $env : '';
	}
}
