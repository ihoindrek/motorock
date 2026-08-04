<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Rest_Write {

	public static function register() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes() {
		register_rest_route(
			'motorock/v1',
			'/ai/write',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_write' ),
				'permission_callback' => array( __CLASS__, 'verify_secret' ),
			)
		);
	}

	public static function verify_secret( WP_REST_Request $request ) {
		$expected = self::get_secret();
		if ( ! $expected ) {
			return new WP_Error(
				'motorock_ai_secret_missing',
				'MOTOROCK_AI_WRITE_SECRET is not configured on WordPress.',
				array( 'status' => 503 )
			);
		}

		$provided = $request->get_header( 'x-motorock-ai-secret' );
		if ( ! is_string( $provided ) || ! hash_equals( $expected, $provided ) ) {
			return new WP_Error( 'motorock_ai_unauthorized', 'Unauthorized', array( 'status' => 401 ) );
		}

		return true;
	}

	public static function handle_write( WP_REST_Request $request ) {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'motorock_ai_invalid_body', 'Invalid JSON body', array( 'status' => 400 ) );
		}

		Motorock_Ai_Logger::info( 'write request received', array( 'productId' => $payload['productId'] ?? null ) );

		$result = Motorock_Ai_Content_Writer::write( $payload );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}

	private static function get_secret() {
		if ( defined( 'MOTOROCK_AI_WRITE_SECRET' ) && MOTOROCK_AI_WRITE_SECRET ) {
			return (string) MOTOROCK_AI_WRITE_SECRET;
		}

		$env = getenv( 'MOTOROCK_AI_WRITE_SECRET' );
		return $env ? (string) $env : '';
	}
}
