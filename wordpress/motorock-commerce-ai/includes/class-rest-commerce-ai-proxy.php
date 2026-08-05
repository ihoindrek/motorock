<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Rest_Proxy {

	public static function register() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes() {
		register_rest_route(
			'motorock/v1',
			'/commerce-ai/run',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_run' ),
				'permission_callback' => array( __CLASS__, 'verify_admin' ),
			)
		);

		register_rest_route(
			'motorock/v1',
			'/commerce-ai/batch',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_batch' ),
				'permission_callback' => array( __CLASS__, 'verify_admin' ),
			)
		);

		register_rest_route(
			'motorock/v1',
			'/commerce-ai/skills',
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'handle_skills' ),
				'permission_callback' => array( __CLASS__, 'verify_admin' ),
			)
		);

		// Legacy aliases used by existing admin JS.
		register_rest_route(
			'motorock/v1',
			'/ai/generate',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_generate_legacy' ),
				'permission_callback' => array( __CLASS__, 'verify_admin' ),
			)
		);

		register_rest_route(
			'motorock/v1',
			'/ai/batch',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_batch_legacy' ),
				'permission_callback' => array( __CLASS__, 'verify_admin' ),
			)
		);
	}

	public static function verify_admin() {
		return current_user_can( 'edit_products' );
	}

	public static function handle_skills() {
		$api_url    = self::get_api_url();
		$api_secret = self::get_api_secret();

		if ( ! $api_url || ! $api_secret ) {
			return new WP_Error(
				'motorock_commerce_ai_api_not_configured',
				'MOTOROCK_AI_API_SECRET or storefront URL is not configured in wp-config.php',
				array( 'status' => 503 )
			);
		}

		$response = wp_remote_get(
			$api_url . '/api/commerce-ai/skills',
			array(
				'timeout' => 30,
				'headers' => array(
					'Authorization' => 'Bearer ' . $api_secret,
				),
			)
		);

		return self::proxy_storefront_response( $response, false );
	}

	public static function handle_run( WP_REST_Request $request ) {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'motorock_commerce_ai_invalid_body', 'Invalid JSON body', array( 'status' => 400 ) );
		}

		return self::proxy_commerce_ai_run( $payload );
	}

	public static function handle_batch( WP_REST_Request $request ) {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'motorock_commerce_ai_invalid_body', 'Invalid JSON body', array( 'status' => 400 ) );
		}

		return self::proxy_commerce_ai_batch( $payload );
	}

	public static function handle_generate_legacy( WP_REST_Request $request ) {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'motorock_commerce_ai_invalid_body', 'Invalid JSON body', array( 'status' => 400 ) );
		}

		$product_id = isset( $payload['productId'] ) ? (int) $payload['productId'] : 0;
		if ( ! $product_id ) {
			return new WP_Error( 'motorock_commerce_ai_invalid_product', 'productId is required', array( 'status' => 400 ) );
		}

		$locales  = self::normalize_locales( $payload['locales'] ?? array( 'en', 'et' ) );
		$sections = self::normalize_sections( $payload['sections'] ?? array( 'description', 'seo' ) );
		$dry_run  = ! empty( $payload['dryRun'] );

		if ( empty( $locales ) || empty( $sections ) ) {
			return new WP_Error( 'motorock_commerce_ai_invalid_body', 'locales and sections are required', array( 'status' => 400 ) );
		}

		$options = self::build_options(
			$dry_run,
			isset( $payload['overwrite'] ) ? (string) $payload['overwrite'] : 'if_empty',
			isset( $payload['publishStatus'] ) ? sanitize_key( (string) $payload['publishStatus'] ) : 'draft',
			self::normalize_provider( $payload['provider'] ?? '' )
		);
		$options['sections'] = $sections;

		if ( count( $locales ) > 1 ) {
			return self::proxy_commerce_ai_batch(
				array(
					'skill'       => 'product.content_writer',
					'productIds'  => array( $product_id ),
					'locales'     => $locales,
					'options'     => $options,
				),
				true
			);
		}

		return self::proxy_commerce_ai_run(
			array(
				'skill'   => 'product.content_writer',
				'locale'  => $locales[0],
				'target'  => array( 'productId' => $product_id ),
				'options' => $options,
			),
			true
		);
	}

	public static function handle_batch_legacy( WP_REST_Request $request ) {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'motorock_commerce_ai_invalid_body', 'Invalid JSON body', array( 'status' => 400 ) );
		}

		$product_ids = self::normalize_product_ids( $payload['productIds'] ?? array() );
		$locales     = self::normalize_locales( $payload['locales'] ?? array( 'en', 'et' ) );
		$sections    = self::normalize_sections( $payload['sections'] ?? array( 'description', 'seo' ) );

		if ( empty( $product_ids ) || empty( $locales ) || empty( $sections ) ) {
			return new WP_Error( 'motorock_commerce_ai_invalid_body', 'productIds, locales and sections are required', array( 'status' => 400 ) );
		}

		if ( count( $product_ids ) * count( $locales ) > 30 ) {
			return new WP_Error(
				'motorock_commerce_ai_batch_too_large',
				'Batch too large (max 30 total jobs). Reduce products, locales, or use smaller chunks.',
				array( 'status' => 400 )
			);
		}

		$options = self::build_options(
			! empty( $payload['dryRun'] ),
			isset( $payload['overwrite'] ) ? (string) $payload['overwrite'] : 'always',
			isset( $payload['publishStatus'] ) ? sanitize_key( (string) $payload['publishStatus'] ) : 'draft',
			self::normalize_provider( $payload['provider'] ?? '' ),
			false
		);
		$options['sections'] = $sections;

		return self::proxy_commerce_ai_batch(
			array(
				'skill'      => 'product.content_writer',
				'productIds' => $product_ids,
				'locales'    => $locales,
				'options'    => $options,
			),
			true
		);
	}

	private static function proxy_commerce_ai_run( array $payload, $legacy = false ) {
		$api_url    = self::get_api_url();
		$api_secret = self::get_api_secret();

		if ( ! $api_url || ! $api_secret ) {
			return new WP_Error(
				'motorock_commerce_ai_api_not_configured',
				'MOTOROCK_AI_API_SECRET or storefront URL is not configured in wp-config.php',
				array( 'status' => 503 )
			);
		}

		Motorock_Ai_Logger::info(
			'commerce-ai run request',
			array(
				'skill'  => $payload['skill'] ?? '',
				'locale' => $payload['locale'] ?? '',
				'target' => $payload['target'] ?? array(),
			)
		);

		$response = wp_remote_post(
			$api_url . '/api/commerce-ai/run',
			array(
				'timeout' => 300,
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $api_secret,
				),
				'body'    => wp_json_encode( $payload ),
			)
		);

		return self::proxy_storefront_response( $response, $legacy );
	}

	private static function proxy_commerce_ai_batch( array $payload, $legacy = false ) {
		$api_url    = self::get_api_url();
		$api_secret = self::get_api_secret();

		if ( ! $api_url || ! $api_secret ) {
			return new WP_Error(
				'motorock_commerce_ai_api_not_configured',
				'MOTOROCK_AI_API_SECRET or storefront URL is not configured in wp-config.php',
				array( 'status' => 503 )
			);
		}

		Motorock_Ai_Logger::info(
			'commerce-ai batch request',
			array(
				'skill'      => $payload['skill'] ?? '',
				'productIds' => $payload['productIds'] ?? array(),
				'locales'    => $payload['locales'] ?? array(),
			)
		);

		$response = wp_remote_post(
			$api_url . '/api/commerce-ai/batch',
			array(
				'timeout' => 300,
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $api_secret,
				),
				'body'    => wp_json_encode( $payload ),
			)
		);

		return self::proxy_storefront_response( $response, $legacy );
	}

	private static function proxy_storefront_response( $response, $legacy ) {
		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'motorock_commerce_ai_api_unreachable',
				$response->get_error_message(),
				array( 'status' => 502 )
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! is_array( $data ) ) {
			return new WP_Error(
				'motorock_commerce_ai_api_invalid_response',
				'Storefront Commerce AI API returned an invalid response',
				array( 'status' => 502 )
			);
		}

		if ( $legacy ) {
			$data = self::unwrap_legacy_admin_response( $data );
		}

		return new WP_REST_Response( $data, $status > 0 ? $status : 502 );
	}

	private static function unwrap_legacy_admin_response( array $data ) {
		if ( isset( $data['result'] ) && is_array( $data['result'] ) && isset( $data['skill'] ) ) {
			return $data['result'];
		}

		if ( isset( $data['jobs'] ) && isset( $data['skill'] ) ) {
			unset( $data['skill'] );
		}

		return $data;
	}

	private static function build_options( $dry_run, $overwrite, $publish_status, $provider, $revalidate = null ) {
		if ( ! in_array( $publish_status, array( 'draft', 'published' ), true ) ) {
			$publish_status = 'draft';
		}

		$options = array(
			'dryRun'        => $dry_run,
			'overwrite'     => $overwrite,
			'publishStatus' => $publish_status,
		);

		if ( $provider ) {
			$options['provider'] = $provider;
		}

		if ( $revalidate !== null ) {
			$options['revalidate'] = $revalidate;
		}

		return $options;
	}

	private static function normalize_provider( $provider ) {
		$allowed  = array( 'openai', 'anthropic', 'gemini' );
		$provider = sanitize_key( (string) $provider );

		return in_array( $provider, $allowed, true ) ? $provider : null;
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

	private static function normalize_locales( $locales ) {
		if ( ! is_array( $locales ) ) {
			return array();
		}

		$allowed    = array( 'en', 'et' );
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

		$allowed    = array( 'description', 'seo', 'faq', 'alt_text' );
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
